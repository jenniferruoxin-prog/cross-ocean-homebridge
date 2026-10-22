"""Call Planner: finds video-call times that work across time zones.

The agent turns free-text routines into busy blocks, then calls the find_free_windows tool, which does
all time-zone and daylight-saving math in code (timetools.py). The agent picks the best times and writes
the invitation. An output validator checks every picked time is inside a window the tool returned,
and the displayed times are computed by code, never typed by the model.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from functools import cache

from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.usage import UsageLimits

import usage_log
from agents.bridge import history_block, profile_block
from agents.checks import clean, neutral_zh, not_english
from config import PROMPTS, build_model
from agents.digest import decode_photo
from models import (
    BusyBlock,
    CalendarReadReply,
    CalendarReadRequest,
    CalendarReadResponse,
    CallOption,
    CallPlanReply,
    CallPlanResponse,
    CallRequest,
)
from timetools import free_windows, labels, offset_facts, within

LIMITS = UsageLimits(request_limit=6, tool_calls_limit=3, total_tokens_limit=60_000)


@dataclass
class CallDeps:
    req: CallRequest
    windows: list[dict] = field(default_factory=list)  # what the tool last returned, for the validator


def _parse_utc(s: str) -> datetime:
    d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)


@cache
def call_planner() -> Agent[CallDeps, CallPlanReply]:
    agent = Agent(
        build_model(),
        deps_type=CallDeps,
        output_type=CallPlanReply,
        instructions=(PROMPTS / "call_planner.md").read_text(encoding="utf-8"),
        retries=3,
    )

    @agent.tool
    def find_free_windows(
        ctx: RunContext[CallDeps], student_busy: list[BusyBlock], parent_busy: list[BusyBlock]
    ) -> dict:
        """Common free windows for a call in the next 7 days, plus the current time difference.

        Args:
            student_busy: the student's weekly busy blocks, in the STUDENT's local time (include sleep).
            parent_busy: the parents' weekly busy blocks, in the PARENTS' local time (include sleep).
        """
        r, p = ctx.deps.req, ctx.deps.req.profile
        windows = free_windows(
            [b.model_dump() for b in student_busy],
            [b.model_dump() for b in parent_busy],
            p.student_timezone,
            p.parent_timezone,
            r.call_minutes,
            date.fromisoformat(r.start_date),
        )
        ctx.deps.windows = windows
        return {
            "windows": windows,
            "call_minutes": r.call_minutes,
            **offset_facts(p.student_timezone, p.parent_timezone, date.fromisoformat(r.start_date)),
            "note": "If windows is empty, tell the student in watch_outs and suggest which routine to loosen.",
        }

    @agent.output_validator
    def times_are_real(ctx: RunContext[CallDeps], out: CallPlanReply) -> CallPlanReply:
        # Time guard: every option must come from the tool's free windows, with the whole call fitting.
        if not ctx.deps.windows and out.options:
            usage_log.guard("call_planner", "options without calling the tool")
            raise ModelRetry("Call find_free_windows first and pick times only from its windows.")
        bad = []
        for o in out.options:
            try:
                if not within(_parse_utc(o.start_utc), ctx.deps.req.call_minutes, ctx.deps.windows):
                    bad.append(o.start_utc)
            except ValueError:
                bad.append(o.start_utc)
        if bad:
            usage_log.guard("call_planner", f"times outside windows: {bad}")
            raise ModelRetry(
                f"These start times are not inside any free window (or the {ctx.deps.req.call_minutes}-minute call "
                f"does not fit before the window ends): {bad}. Pick start_utc values from the tool's windows."
            )
        if languages(ctx.deps.req)[0] == "English":
            wrong = not_english([out.invitation_meaning, *out.talking_points, *out.assumptions, *out.watch_outs])
            if wrong:
                usage_log.guard("call_planner", "language")
                raise ModelRetry(f"These must be in English: {wrong}")
        return out

    return agent


def languages(req: CallRequest) -> tuple[str, str]:
    """(user's language, other side's language)."""
    p = req.profile
    return (p.student_language, p.parent_language) if req.user == "student" else (p.parent_language, p.student_language)


def other_name(req: CallRequest) -> str:
    p = req.profile
    if req.user == "student":
        return p.parent_names or "your parents"
    return p.student_name or "your child"


def build_prompt(req: CallRequest) -> str:
    user_lang, other_lang = languages(req)
    return (
        f"{profile_block(req.profile)}\n\n"
        f"{history_block(req.history)}"
        f"USER: {req.user.upper()} (the person planning the call)\n"
        f"In why and talking_points, call the user \"you\" and call the other side "
        f"\"{other_name(req)}\". Never refer to the user in the third person.\n"
        f"First day to plan (student's date): {req.start_date}. Call length: {req.call_minutes} minutes.\n\n"
        f"<student_week>\n{req.student_week}\n</student_week>\n\n"
        f"<parent_week>\n{req.parent_week}\n</parent_week>\n\n"
        f"LANGUAGE CHECK: invitation in {other_lang}; every other text field in {user_lang}."
    )


async def plan_call(req: CallRequest) -> CallPlanResponse:
    deps = CallDeps(req=req)
    result = await call_planner().run(build_prompt(req), deps=deps, usage_limits=LIMITS)
    out = clean(result.output)
    p = req.profile
    if req.user == "parent" and p.parent_language in ("Simplified Chinese", "Traditional Chinese"):
        out = out.model_copy(
            update={
                "options": [o.model_copy(update={"why": neutral_zh(o.why)}) for o in out.options],
                "invitation_meaning": neutral_zh(out.invitation_meaning),
                "talking_points": [neutral_zh(t) for t in out.talking_points],
                "assumptions": [neutral_zh(t) for t in out.assumptions],
                "watch_outs": [neutral_zh(t) for t in out.watch_outs],
            }
        )
    options = []
    for o in out.options:
        start = _parse_utc(o.start_utc)
        student_time, parent_time = labels(start, req.call_minutes, p.student_timezone, p.parent_timezone)
        options.append(
            CallOption(
                start_utc=start.isoformat(),
                end_utc=(start + timedelta(minutes=req.call_minutes)).isoformat(),
                student_time=student_time,
                parent_time=parent_time,
                why=o.why,
            )
        )
    facts = offset_facts(p.student_timezone, p.parent_timezone, date.fromisoformat(req.start_date))
    return CallPlanResponse(
        options=options,
        invitation=out.invitation,
        invitation_meaning=out.invitation_meaning,
        talking_points=out.talking_points,
        assumptions=out.assumptions,
        watch_outs=out.watch_outs,
        parents_ahead_by_hours=facts["parents_ahead_by_hours_now"],
        upcoming_change=facts["upcoming_change"],
        usage=usage_log.record("call_planner", result.usage),
    )


# ---------- Calendar screenshots → busy blocks ----------

CALENDAR_LIMITS = UsageLimits(request_limit=3, total_tokens_limit=40_000)
DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@cache
def calendar_reader() -> Agent[None, CalendarReadReply]:
    return Agent(
        build_model(),
        output_type=CalendarReadReply,
        instructions=(PROMPTS / "calendar_reader.md").read_text(encoding="utf-8"),
        retries=2,
    )


def schedule_text(blocks: list[BusyBlock]) -> str:
    """Writes the blocks as plain lines for the routine box (by code, so it shows exactly what was read)."""
    lines = []
    for b in sorted(blocks, key=lambda b: (DAY_ORDER.index(b.days[0]), b.start)):
        days = ", ".join(sorted(set(b.days), key=DAY_ORDER.index))
        lines.append(f"{days}: {b.start}-{b.end} {b.label}")
    return "\n".join(lines)


async def read_calendar(req: CalendarReadRequest) -> CalendarReadResponse:
    images = [decode_photo(i.data_url) for i in req.images]
    owner = "the student" if req.whose == "student" else "the parents"
    result = await calendar_reader().run(
        [f"These are calendar screenshots of {owner}. List their busy times.", *images],
        usage_limits=CALENDAR_LIMITS,
    )
    out = clean(result.output)
    return CalendarReadResponse(
        schedule_text=schedule_text(out.blocks),
        blocks=out.blocks,
        dates_seen=out.dates_seen,
        unclear=out.unclear,
        usage=usage_log.record("calendar_reader", result.usage),
    )
