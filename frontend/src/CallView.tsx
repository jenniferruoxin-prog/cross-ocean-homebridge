import { useEffect, useState } from 'react'
import { planCall, readCalendar } from './api'
import { callStrings, type CallStrings } from './callStrings'
import { forAgent, useHistory } from './history'
import { stringsFor, type Role } from './i18n'
import type { CallPlanResponse, FamilyProfile } from './types'

const SAVED_KEY = 'homebridge.calls'
const CAL_MAX_SIDE = 1600 // calendar text is small, so screenshots keep more detail than photos

// Shrinks a screenshot in the browser (fewer tokens, smaller upload) and returns a JPEG data URL.
function shrinkScreenshot(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, CAL_MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name}: PNG / JPG?`))
    }
    img.src = url
  })
}

// "Read from calendar screenshot": the Calendar Reader lists busy times, which are added to the routine box.
function CalendarButton({
  profile,
  whose,
  s,
  onRead,
}: {
  profile: FamilyProfile
  whose: 'student' | 'parent'
  s: CallStrings
  onRead: (text: string, notes: string[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <span className="cal-btn">
      <label className={`copy ${busy ? 'disabled' : ''}`}>
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 3)
            e.target.value = ''
            if (!files.length) return
            setBusy(true)
            setError('')
            try {
              const res = await readCalendar(profile, whose, await Promise.all(files.map(shrinkScreenshot)))
              onRead(res.schedule_text, [s.calRead(res.dates_seen), ...res.unclear])
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err))
            } finally {
              setBusy(false)
            }
          }}
        />
        {busy ? s.readingCal : s.readCal}
      </label>
      {error && <span className="cal-error">{error}</span>}
    </span>
  )
}

interface Saved {
  studentWeek: string
  parentWeek: string
  minutes: number
}

function loadSaved(): Saved {
  try {
    return { studentWeek: '', parentWeek: '', minutes: 30, ...JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') }
  } catch {
    return { studentWeek: '', parentWeek: '', minutes: 30 }
  }
}

// Tomorrow's date (YYYY-MM-DD) in the student's time zone: the first day to plan.
function tomorrowIn(zone: string): string {
  return new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', { timeZone: zone })
}

// A calendar file for the chosen time; times are UTC, so every calendar app shows each person's local time.
function downloadIcs(startUtc: string, endUtc: string, title: string, notes: string) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cross-Ocean HomeBridge//Call Planner//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@homebridge`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(startUtc)}`,
    `DTEND:${stamp(endUtc)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(notes)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'HomeBridge call.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export default function CallView({ profile, role }: { profile: FamilyProfile; role: Role }) {
  const s = callStrings(role, profile.parent_language)
  const isStudent = role === 'student'
  const other = isStudent
    ? profile.parent_names || 'your parents'
    : profile.student_name || stringsFor('parent', profile.parent_language).childDefault
  const [myTz, theirTz] = isStudent
    ? [profile.student_timezone, profile.parent_timezone]
    : [profile.parent_timezone, profile.student_timezone]
  // Both roles share the saved routines on this device; each sees its own week first.
  const myKey = isStudent ? 'studentWeek' : 'parentWeek'
  const theirKey = isStudent ? 'parentWeek' : 'studentWeek'

  const [saved, setSaved] = useState<Saved>(loadSaved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<CallPlanResponse | null>(null)
  const [chosen, setChosen] = useState(0)
  const [copied, setCopied] = useState(false)
  const [calNotes, setCalNotes] = useState<string[]>([])
  const history = useHistory()

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
  }, [saved])

  function addRead(key: 'studentWeek' | 'parentWeek', text: string, notes: string[]) {
    setSaved((cur) => ({ ...cur, [key]: cur[key].trim() ? `${cur[key].trim()}\n${text}` : text }))
    setCalNotes(notes)
  }

  async function run() {
    setBusy(true)
    setError('')
    setPlan(null)
    setChosen(0)
    try {
      setPlan(
        await planCall(
          profile,
          saved.studentWeek,
          saved.parentWeek,
          saved.minutes,
          tomorrowIn(profile.student_timezone),
          forAgent(history.entries),
          role,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  // Time difference from the user's point of view (the API reports how far ahead the parents are).
  function difference(parentsAhead: number): string {
    const theirsAhead = isStudent ? parentsAhead : -parentsAhead
    return theirsAhead >= 0 ? s.theyAreAhead(other, theirsAhead) : s.theyAreBehind(other, -theirsAhead)
  }

  function dstText(c: NonNullable<CallPlanResponse['upcoming_change']>): string {
    const studentSide = c.what_happens.includes('student')
    const mine = studentSide === isStudent
    const where = mine ? s.whereYou : other
    return s.dst(c.from_date, where, c.what_happens.includes('ENDS'), Math.abs(c.parents_ahead_by_hours))
  }

  const option = plan?.options[chosen]
  const myTime = (o: CallPlanResponse['options'][number]) => (isStudent ? o.student_time : o.parent_time)
  const theirTime = (o: CallPlanResponse['options'][number]) => (isStudent ? o.parent_time : o.student_time)

  return (
    <div className="digest">
      <p className="lead">{s.lead}</p>

      <section className="card">
        <div className="card-head">
          <h3>{s.myWeek(myTz)}</h3>
          <CalendarButton
            profile={profile}
            whose={role}
            s={s}
            onRead={(text, notes) => addRead(myKey, text, notes)}
          />
        </div>
        <textarea
          className="composer"
          rows={3}
          maxLength={2000}
          value={saved[myKey]}
          onChange={(e) => setSaved({ ...saved, [myKey]: e.target.value })}
          placeholder={s.myPlaceholder}
        />
        <div className="card-head sub">
          <h3>{s.theirWeek(other, theirTz)}</h3>
          <CalendarButton
            profile={profile}
            whose={isStudent ? 'parent' : 'student'}
            s={s}
            onRead={(text, notes) => addRead(theirKey, text, notes)}
          />
        </div>
        <textarea
          className="composer"
          rows={3}
          maxLength={2000}
          value={saved[theirKey]}
          onChange={(e) => setSaved({ ...saved, [theirKey]: e.target.value })}
          placeholder={s.theirPlaceholder}
        />
        {calNotes.length > 0 && (
          <ul className="cal-notes">
            {calNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="actions">
        <span className="hint lang-hint">
          {s.callLength}
          <select value={saved.minutes} onChange={(e) => setSaved({ ...saved, minutes: Number(e.target.value) })}>
            {[15, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
          · {s.nextDays}
        </span>
        <button
          className="primary"
          onClick={run}
          disabled={busy || !saved.studentWeek.trim() || !saved.parentWeek.trim()}
        >
          {busy ? (
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          ) : (
            s.find
          )}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {plan && (
        <div className="results">
          <section className="card tz-banner">
            <strong>{difference(plan.parents_ahead_by_hours)}</strong>
            {plan.upcoming_change && <span> {dstText(plan.upcoming_change)}</span>}
          </section>

          {plan.options.length === 0 ? (
            <section className="card warn">
              <h3>{s.noTimes}</h3>
              <p className="body">{s.noTimesHint}</p>
            </section>
          ) : (
            <section className="card">
              <h3>{s.bestTimes}</h3>
              <ul className="options">
                {plan.options.map((o, i) => (
                  <li key={o.start_utc} className={i === chosen ? 'on' : ''} onClick={() => setChosen(i)}>
                    <div className="times">
                      <div>
                        <span className="muted">{s.you}</span>
                        <strong>{myTime(o)}</strong>
                      </div>
                      <span className="arrow">⇄</span>
                      <div>
                        <span className="muted">{other}</span>
                        <strong>{theirTime(o)}</strong>
                      </div>
                    </div>
                    <p className="body">{o.why}</p>
                  </li>
                ))}
              </ul>
              {option && (
                <div className="btn-row">
                  <button
                    className="copy"
                    onClick={() =>
                      downloadIcs(
                        option.start_utc,
                        option.end_utc,
                        s.calTitle(other),
                        [s.calNotes, ...plan.talking_points.map((t) => `- ${t}`)].join('\n'),
                      )
                    }
                  >
                    {s.addCal}
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="card highlight">
            <div className="card-head">
              <h3>{s.invite(other)}</h3>
              <button
                className="copy"
                onClick={async () => {
                  await navigator.clipboard.writeText(plan.invitation)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                  history.upsert({
                    id: `call-${role}-${plan.options[0]?.start_utc ?? Date.now()}`,
                    time: new Date().toISOString(),
                    writer: role,
                    text: plan.invitation,
                  })
                }}
              >
                {copied ? s.copied : s.copy}
              </button>
            </div>
            <p className="body big">{plan.invitation}</p>
            <details>
              <summary>{s.whatSays}</summary>
              <p className="body">{plan.invitation_meaning}</p>
            </details>
          </section>

          {plan.talking_points.length > 0 && (
            <section className="card">
              <h3>{s.talk}</h3>
              <ul>
                {plan.talking_points.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {(plan.assumptions.length > 0 || plan.watch_outs.length > 0) && (
            <section className="card warn">
              <h3>{s.check}</h3>
              <ul>
                {[...plan.assumptions, ...plan.watch_outs].map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="usage">
            {plan.usage.input_tokens} input ({plan.usage.cached_input_tokens} cached) · {plan.usage.output_tokens} output
            tokens · {plan.usage.requests} requests
          </p>
        </div>
      )}
    </div>
  )
}
