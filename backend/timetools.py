"""Time-zone math for the Call Planner, done in code instead of by the model (models often get it wrong).

Weekly routines are given as busy blocks in each person's own local time. They are expanded onto real
dates, converted to UTC (zoneinfo handles daylight saving), and the common free windows are returned
with labels in both local times.
"""

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MAX_WINDOWS = 25
# Nobody should be asked to call at these local hours, whatever the routines say.
NIGHT = ("00:30", "06:30")

Interval = tuple[datetime, datetime]  # UTC, start < end


def _hm(s: str) -> time:
    h, m = s.strip().split(":")
    return time(int(h) % 24, int(m))


def busy_intervals(blocks: list[dict], tz: ZoneInfo, first: date, last: date) -> list[Interval]:
    """Expands weekly blocks ({days, start, end}) onto every date in [first, last], as UTC intervals."""
    out: list[Interval] = []
    for b in [*blocks, {"days": DAYS, "start": NIGHT[0], "end": NIGHT[1]}]:
        start_t, end_t = _hm(b["start"]), _hm(b["end"])
        d = first
        while d <= last:
            if DAYS[d.weekday()] in b["days"]:
                start = datetime.combine(d, start_t, tz)
                # An end at or before the start means the block runs past midnight (e.g. sleep 23:00-07:00).
                end_day = d if end_t > start_t else d + timedelta(days=1)
                end = datetime.combine(end_day, end_t, tz)
                out.append((start.astimezone(timezone.utc), end.astimezone(timezone.utc)))
            d += timedelta(days=1)
    return out


def _merge(intervals: list[Interval]) -> list[Interval]:
    merged: list[Interval] = []
    for s, e in sorted(intervals):
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def _label(start: datetime, end: datetime, tz: ZoneInfo) -> str:
    a, b = start.astimezone(tz), end.astimezone(tz)
    text = f"{a:%a %b} {a.day}, {a:%H:%M}–{b:%H:%M}"
    return text + (" (+1 day)" if b.date() != a.date() else "")


def free_windows(
    student_blocks: list[dict],
    parent_blocks: list[dict],
    student_tz: str,
    parent_tz: str,
    call_minutes: int,
    start_day: date,
    days: int = 7,
) -> list[dict]:
    """Common free windows (at least call_minutes long) in the `days` days starting at start_day (student's date)."""
    stz, ptz = ZoneInfo(student_tz), ZoneInfo(parent_tz)
    horizon = (
        datetime.combine(start_day, time(0), stz).astimezone(timezone.utc),
        datetime.combine(start_day + timedelta(days=days), time(0), stz).astimezone(timezone.utc),
    )
    first, last = start_day - timedelta(days=2), start_day + timedelta(days=days + 2)
    busy = _merge(busy_intervals(student_blocks, stz, first, last) + busy_intervals(parent_blocks, ptz, first, last))

    windows: list[dict] = []
    cursor = horizon[0]
    for s, e in busy + [(horizon[1], horizon[1])]:
        # Clamp each busy block to the planning horizon.
        s = min(max(s, horizon[0]), horizon[1])
        e = max(min(e, horizon[1]), horizon[0])
        if s > cursor and (s - cursor) >= timedelta(minutes=call_minutes):
            windows.append(
                {
                    "start_utc": cursor.isoformat(),
                    "end_utc": s.isoformat(),
                    "minutes": int((s - cursor).total_seconds() // 60),
                    "student_local": _label(cursor, s, stz),
                    "parent_local": _label(cursor, s, ptz),
                }
            )
        cursor = max(cursor, e)
        if len(windows) >= MAX_WINDOWS:
            break
    return windows


def offset_facts(student_tz: str, parent_tz: str, today: date, look_ahead_days: int = 45) -> dict:
    """Current time difference, and any change (daylight saving) coming up soon."""
    stz, ptz = ZoneInfo(student_tz), ZoneInfo(parent_tz)

    def diff(d: date) -> float:
        noon = datetime.combine(d, time(12), timezone.utc)
        return (noon.astimezone(ptz).utcoffset() - noon.astimezone(stz).utcoffset()).total_seconds() / 3600

    def offset(tz: ZoneInfo, d: date) -> timedelta:
        return datetime.combine(d, time(12), timezone.utc).astimezone(tz).utcoffset()

    now = diff(today)
    facts = {"parents_ahead_by_hours_now": now, "upcoming_change": None}
    for i in range(1, look_ahead_days + 1):
        d = today + timedelta(days=i)
        if diff(d) != now:
            # Say exactly which side changes and how, so the model does not have to guess.
            events = []
            for who, tz in (("the student lives", stz), ("the parents live", ptz)):
                before, after = offset(tz, d - timedelta(days=1)), offset(tz, d)
                if after < before:
                    events.append(f"daylight saving time ENDS where {who} (clocks go back 1 hour)")
                elif after > before:
                    events.append(f"daylight saving time STARTS where {who} (clocks go forward 1 hour)")
            facts["upcoming_change"] = {
                "from_date": d.isoformat(),
                "parents_ahead_by_hours": diff(d),
                "what_happens": "; ".join(events),
            }
            break
    return facts


def within(start_utc: datetime, minutes: int, windows: list[dict]) -> bool:
    end = start_utc + timedelta(minutes=minutes)
    return any(
        datetime.fromisoformat(w["start_utc"]) <= start_utc and end <= datetime.fromisoformat(w["end_utc"])
        for w in windows
    )


def labels(start_utc: datetime, minutes: int, student_tz: str, parent_tz: str) -> tuple[str, str]:
    end = start_utc + timedelta(minutes=minutes)
    return _label(start_utc, end, ZoneInfo(student_tz)), _label(start_utc, end, ZoneInfo(parent_tz))
