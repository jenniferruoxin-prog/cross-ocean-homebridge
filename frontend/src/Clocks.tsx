import { useEffect, useState } from 'react'
import type { FamilyProfile } from './types'

function timeIn(zone: string, now: Date): string {
  try {
    return now.toLocaleString('en-US', { timeZone: zone, weekday: 'short', hour: 'numeric', minute: '2-digit' })
  } catch {
    return '—'
  }
}

interface Props {
  profile: FamilyProfile
  mine: 'student' | 'parent' // whose clock is "you"
  youLabel: string
  otherLabel: string
}

export default function Clocks({ profile, mine, youLabel, otherLabel }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const [myZone, otherZone] =
    mine === 'student'
      ? [profile.student_timezone, profile.parent_timezone]
      : [profile.parent_timezone, profile.student_timezone]

  return (
    <div className="clocks">
      <div className="clock">
        <span className="clock-label">{youLabel}</span>
        <span className="clock-time">{timeIn(myZone, now)}</span>
      </div>
      <span className="clock-sep">⇄</span>
      <div className="clock">
        <span className="clock-label">{otherLabel}</span>
        <span className="clock-time">{timeIn(otherZone, now)}</span>
      </div>
    </div>
  )
}
