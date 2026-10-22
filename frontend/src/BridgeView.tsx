import { useState } from 'react'
import { bridge } from './api'
import { forAgent, formatTime, useHistory } from './history'
import type { Role, Strings } from './i18n'
import { CHILD_LANGUAGES, LANGUAGES, type BridgeResponse, type FamilyProfile } from './types'

function CopyButton({ text, t, onCopy }: { text: string; t: Strings; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        onCopy?.()
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? t.copied : t.copy}
    </button>
  )
}

function Bullets({ title, items, tone }: { title: string; items: string[]; tone?: 'warn' }) {
  if (!items.length) return null
  return (
    <section className={`card ${tone ?? ''}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </section>
  )
}

interface Props {
  role: Role
  t: Strings
  profile: FamilyProfile
  onProfileChange: (p: FamilyProfile) => void
}

export default function BridgeView({ role, t, profile, onProfileChange }: Props) {
  const [sending, setSending] = useState(true) // true = to_*, false = from_*
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BridgeResponse | null>(null)
  const [added, setAdded] = useState<number[]>([])
  const [runId, setRunId] = useState('')
  const [useContext, setUseContext] = useState(true)
  const history = useHistory()

  const isStudent = role === 'student'
  const me = isStudent ? 'student' : 'parent'
  const them = isStudent ? 'parent' : 'student'
  const other = isStudent ? profile.parent_names || 'your parents' : profile.student_name || t.childDefault
  const direction = isStudent ? (sending ? 'to_parents' : 'from_parents') : sending ? 'to_child' : 'from_child'
  // The language picker always sets the OTHER side's language.
  const langField = isStudent ? 'parent_language' : 'student_language'
  const langOptions = isStudent ? LANGUAGES : CHILD_LANGUAGES

  function switchTo(next: boolean) {
    setSending(next)
    setResult(null)
  }

  async function submit() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    setAdded([])
    try {
      const context = useContext ? forAgent(history.entries) : []
      const res = await bridge(direction, text.trim(), profile, context)
      const id = crypto.randomUUID()
      setRunId(id)
      setResult(res)
      // A received message is part of the conversation as soon as it is explained.
      if (!sending) history.upsert({ id: `${id}-in`, time: new Date().toISOString(), writer: them, text: text.trim() })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const r = result?.reply
  // Optional sentences the user chose to add, appended in the order they were picked.
  const extras = r ? added.map((i) => r.optional_additions[i]) : []
  const finalMessage = r ? [r.message_to_send, ...extras.map((a) => a.text)].join('\n') : ''
  const finalMeaning = r ? [r.message_to_send_meaning, ...extras.map((a) => a.meaning)].join('\n') : ''

  return (
    <div className="bridge">
      <div className="segmented" role="tablist">
        <button className={sending ? 'on' : ''} onClick={() => switchTo(true)}>
          {t.tell(other)}
        </button>
        <button className={!sending ? 'on' : ''} onClick={() => switchTo(false)}>
          {t.received(other)}
        </button>
      </div>

      <textarea
        className="composer"
        rows={5}
        value={text}
        maxLength={3000}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
        }}
        placeholder={sending ? t.placeholderTell : t.placeholderReceived(other)}
      />
      <div className="actions">
        <span className="hint lang-hint">
          {sending ? t.rewrittenIn : t.explainedReplyIn}
          <select
            value={profile[langField]}
            onChange={(e) => onProfileChange({ ...profile, [langField]: e.target.value })}
            aria-label="Language of the other side"
          >
            {langOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          · {t.ctrlEnter}
        </span>
        <button className="primary" onClick={submit} disabled={loading || !text.trim()}>
          {loading ? (
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          ) : sending ? (
            t.bridgeIt
          ) : (
            t.helpMeUnderstand
          )}
        </button>
      </div>

      <details className="history">
        <summary>
          {t.history} ({history.entries.length})
        </summary>
        <div className="history-bar">
          <span className="hint">{t.historyHint}</span>
          <label className="check">
            <input type="checkbox" checked={useContext} onChange={(e) => setUseContext(e.target.checked)} />
            {t.useHistory}
          </label>
          <button className="copy" onClick={history.clear} disabled={!history.entries.length}>
            {t.clearHistory}
          </button>
        </div>
        {history.entries.length === 0 ? (
          <p className="hint">{t.noHistory}</p>
        ) : (
          <ul className="history-list">
            {history.entries
              .slice()
              .reverse()
              .map((e) => (
                <li key={e.id} className={e.writer === me ? 'mine' : 'theirs'}>
                  <span className="who">
                    {e.writer === me ? t.you : other} · {formatTime(e.time)}
                  </span>
                  <span>{e.text}</span>
                </li>
              ))}
          </ul>
        )}
      </details>

      {error && <div className="error">{error}</div>}

      {r && (
        <div className="results">
          {!sending && (
            <section className="card">
              <h3>{t.whatTheyWrote}</h3>
              <p className="body">{r.their_message_translated}</p>
            </section>
          )}
          {!sending && <Bullets title={t.whatTheyMean} items={r.reading_between_lines} />}

          <section className="card highlight">
            <div className="card-head">
              <h3>{sending ? t.readyToSend(other) : t.replyYouCouldSend}</h3>
              <CopyButton
                text={finalMessage}
                t={t}
                // Copying = about to send it, so it joins the history (same id, so re-copying updates it).
                onCopy={() => history.upsert({ id: `${runId}-out`, time: new Date().toISOString(), writer: me, text: finalMessage })}
              />
            </div>
            <p className="body big">{finalMessage}</p>
            <details>
              <summary>{t.whatThisSays}</summary>
              <p className="body">{finalMeaning}</p>
            </details>
          </section>

          {r.optional_additions.length > 0 && (
            <section className="card">
              <h3>{t.wantToAdd}</h3>
              <ul className="additions">
                {r.optional_additions.map((a, i) => {
                  const on = added.includes(i)
                  return (
                    <li key={i}>
                      <div>
                        <div>{a.text}</div>
                        <div className="muted">{a.meaning}</div>
                      </div>
                      <button
                        className={`copy ${on ? 'on' : ''}`}
                        onClick={() => setAdded(on ? added.filter((x) => x !== i) : [...added, i])}
                      >
                        {on ? t.added : t.add}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {sending && <Bullets title={t.whatIChanged} items={r.reading_between_lines} />}
          <Bullets title={t.beforeYouSend} items={r.watch_outs} tone="warn" />

          <p className="usage">
            {result.usage.input_tokens} input ({result.usage.cached_input_tokens} cached) · {result.usage.output_tokens}{' '}
            output tokens
          </p>
        </div>
      )}
    </div>
  )
}
