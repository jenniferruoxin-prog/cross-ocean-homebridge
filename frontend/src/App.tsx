import { useEffect, useState } from 'react'
import BridgeView from './BridgeView'
import Clocks from './Clocks'
import CallView from './CallView'
import { callStrings } from './callStrings'
import DigestView from './DigestView'
import ExploreView from './ExploreView'
import { exploreStrings } from './exploreStrings'
import { stringsFor, type Role } from './i18n'
import ProfilePanel, { ParentSummary } from './ProfilePanel'
import { DEFAULT_PROFILE, type FamilyProfile } from './types'

const PROFILE_KEY = 'homebridge.profile'
const ROLE_KEY = 'homebridge.role'

const TABS = [
  { id: 'bridge', label: 'Message Bridge', ready: true },
  { id: 'digest', label: 'Weekly Digest', ready: true },
  { id: 'calls', label: 'Call Planner', ready: true },
  { id: 'shopping', label: 'Shopping List', ready: false },
]

function loadProfile(): FamilyProfile {
  try {
    const saved = localStorage.getItem(PROFILE_KEY)
    return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

export default function App() {
  const [profile, setProfile] = useState<FamilyProfile>(loadProfile)
  const [role, setRole] = useState<Role>(() => (localStorage.getItem(ROLE_KEY) === 'parent' ? 'parent' : 'student'))
  const [tab, setTab] = useState('bridge')
  const [parentTab, setParentTab] = useState<'bridge' | 'letter' | 'calls'>('bridge')
  const t = stringsFor(role, profile.parent_language)
  const parentT = stringsFor('parent', profile.parent_language)
  const isStudent = role === 'student'

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role)
  }, [role])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            <svg viewBox="0 0 32 32" width="28" height="28">
              <path d="M3 22 Q16 6 29 22" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M3 22 H29" stroke="currentColor" strokeWidth="2.5" />
              <path d="M9 22 V16 M16 22 V13 M23 22 V16" stroke="currentColor" strokeWidth="2" />
              <path d="M2 27 q3 -2 6 0 t6 0 t6 0 t6 0 t6 0" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
            </svg>
          </span>
          <div>
            <div className="brand-name">HomeBridge</div>
            <div className="brand-sub">Cross-Ocean · for international students and their families</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="segmented role-switch" role="tablist" aria-label="Who is using the app">
            <button className={isStudent ? 'on' : ''} onClick={() => setRole('student')}>
              Student
            </button>
            <button className={!isStudent ? 'on' : ''} onClick={() => setRole('parent')}>
              {parentT.roleLabel === 'Parent' ? 'Parent' : `${parentT.roleLabel} · Parent`}
            </button>
          </div>
          <Clocks
            profile={profile}
            mine={isStudent ? 'student' : 'parent'}
            youLabel={t.you}
            otherLabel={isStudent ? profile.parent_names || 'Parents' : profile.student_name || t.childDefault}
          />
        </div>
      </header>

      <div className="layout">
        {isStudent ? (
          <ProfilePanel profile={profile} onChange={setProfile} />
        ) : (
          <ParentSummary profile={profile} t={t} />
        )}

        <main className="main">
          <nav className="tabs">
            {isStudent ? (
              TABS.map((tb) => (
                <button
                  key={tb.id}
                  className={`tab ${tab === tb.id ? 'active' : ''}`}
                  disabled={!tb.ready}
                  onClick={() => setTab(tb.id)}
                  title={tb.ready ? '' : 'Coming soon'}
                >
                  {tb.label}
                  {!tb.ready && <span className="soon">soon</span>}
                </button>
              ))
            ) : (
              <>
                <button className={`tab ${parentTab === 'bridge' ? 'active' : ''}`} onClick={() => setParentTab('bridge')}>
                  {t.tabBridge}
                </button>
                <button className={`tab ${parentTab === 'letter' ? 'active' : ''}`} onClick={() => setParentTab('letter')}>
                  {exploreStrings(profile.parent_language).tab}
                </button>
                <button className={`tab ${parentTab === 'calls' ? 'active' : ''}`} onClick={() => setParentTab('calls')}>
                  {callStrings('parent', profile.parent_language).tab}
                </button>
              </>
            )}
          </nav>
          {isStudent && tab === 'digest' && <DigestView profile={profile} />}
          {isStudent && tab === 'calls' && <CallView profile={profile} role="student" />}
          {!isStudent && parentTab === 'letter' && <ExploreView profile={profile} />}
          {!isStudent && parentTab === 'calls' && <CallView profile={profile} role="parent" />}
          {((isStudent && tab === 'bridge') || (!isStudent && parentTab === 'bridge')) && (
            // key={role} resets the composer and results when switching between student and parent.
            <BridgeView key={role} role={role} t={t} profile={profile} onProfileChange={setProfile} />
          )}
        </main>
      </div>
    </div>
  )
}
