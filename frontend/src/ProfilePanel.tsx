import type { Strings } from './i18n'
import { CHILD_LANGUAGES, LANGUAGES, TIMEZONES, type FamilyProfile } from './types'

interface Props {
  profile: FamilyProfile
  onChange: (p: FamilyProfile) => void
}

export default function ProfilePanel({ profile, onChange }: Props) {
  const set = (field: keyof FamilyProfile) => (e: { target: { value: string } }) =>
    onChange({ ...profile, [field]: e.target.value })

  return (
    <aside className="panel">
      <h2>Family profile</h2>
      <p className="hint">Saved in this browser only. Every agent uses it to sound like your family.</p>

      <label>
        Your name
        <input value={profile.student_name} onChange={set('student_name')} placeholder="e.g. Jenny" maxLength={60} />
      </label>
      <label>
        Your school
        <input value={profile.school} onChange={set('school')} placeholder="e.g. Yale University" maxLength={100} />
      </label>
      <label>
        You call your parents
        <input value={profile.parent_names} onChange={set('parent_names')} placeholder="e.g. Mom and Dad, 爸妈" maxLength={60} />
      </label>
      <label>
        Parents' language
        <select value={profile.parent_language} onChange={set('parent_language')}>
          {LANGUAGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Language you read best
        <select value={profile.student_language} onChange={set('student_language')}>
          {CHILD_LANGUAGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Parents' home country
        <input value={profile.home_country} onChange={set('home_country')} maxLength={60} />
      </label>
      <div className="row">
        <label>
          Your time zone
          <select value={profile.student_timezone} onChange={set('student_timezone')}>
            {TIMEZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <label>
          Their time zone
          <select value={profile.parent_timezone} onChange={set('parent_timezone')}>
            {TIMEZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Family notes
        <textarea
          rows={5}
          value={profile.family_notes}
          onChange={set('family_notes')}
          maxLength={1000}
          placeholder="e.g. Mom worries when I skip meals. Dad gets stressed about money talk. Don't mention my part-time job."
        />
      </label>
    </aside>
  )
}

// What a parent sees instead of the editable profile: the student sets it up, the parent just uses it.
export function ParentSummary({ profile, t }: { profile: FamilyProfile; t: Strings }) {
  const childLang = CHILD_LANGUAGES.find(([v]) => v === profile.student_language)?.[1] ?? profile.student_language
  return (
    <aside className="panel">
      <h2>{t.yourChild}</h2>
      <p className="hint">{t.summaryHint}</p>
      <dl className="summary">
        <dt>{t.yourChild}</dt>
        <dd>{profile.student_name || '—'}</dd>
        <dt>{t.childLanguage}</dt>
        <dd>{childLang}</dd>
      </dl>
    </aside>
  )
}
