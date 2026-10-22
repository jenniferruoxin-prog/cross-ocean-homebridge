import { useState } from 'react'
import { exploreLetter } from './api'
import { englishEngine, enginesFor, exploreStrings, mapUrl } from './exploreStrings'
import { imageToPieces, MAX_PIECES, pdfToPieces } from './letterInput'
import type { ExploreResponse, FamilyProfile } from './types'

interface Loaded {
  name: string
  pieces: string[]
  text: string
}

export default function ExploreView({ profile }: { profile: FamilyProfile }) {
  const s = exploreStrings(profile.parent_language)
  const engines = enginesFor(profile.parent_language)
  const en = englishEngine(profile.parent_language)
  const [file, setFile] = useState<Loaded | null>(null)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<ExploreResponse | null>(null)
  const [copied, setCopied] = useState(-1)

  async function addFile(f: File | undefined) {
    if (!f) return
    setError('')
    setNotice('')
    setResult(null)
    try {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      const loaded = isPdf ? await pdfToPieces(f) : { pieces: await imageToPieces(f), text: '' }
      if (loaded.pieces.length > MAX_PIECES) setNotice(s.tooMany)
      setFile({ name: f.name, pieces: loaded.pieces.slice(0, MAX_PIECES), text: loaded.text })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg === 'PDF_UNREADABLE' || msg.includes('PDF') ? s.pdfFailed : msg)
    }
  }

  async function run() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const text = [file?.text ?? '', pasted.trim()].filter(Boolean).join('\n\n')
      setResult(await exploreLetter(profile, text, file?.pieces ?? []))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function copy(text: string, i: number) {
    await navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(-1), 1500)
  }

  const x = result?.explore
  const canRun = !busy && (!!file || pasted.trim().length > 0)

  return (
    <div className="digest">
      <p className="lead">{s.lead}</p>

      <section className="card">
        <div className="thumbs">
          {file ? (
            <figure className="thumb letter-thumb">
              {file.pieces[0] ? <img src={file.pieces[0]} alt={file.name} /> : <span className="pdf-icon">PDF</span>}
              {file.pieces.length > 0 && <span className="num">{file.pieces.length}</span>}
              <button
                className="remove"
                onClick={() => {
                  setFile(null)
                  setResult(null)
                }}
                aria-label={s.remove}
              >
                ×
              </button>
            </figure>
          ) : (
            <label className="thumb add wide">
              <input
                type="file"
                accept="image/*,application/pdf,.pdf"
                onChange={(e) => addFile(e.target.files?.[0])}
                hidden
              />
              <span>{s.upload}</span>
            </label>
          )}
        </div>
        {file && <p className="hint">{file.name}</p>}
        {notice && <p className="hint">{notice}</p>}
        <h3 className="sub">{s.orPaste}</h3>
        <textarea
          className="composer"
          rows={3}
          value={pasted}
          maxLength={6000}
          onChange={(e) => {
            setPasted(e.target.value)
            setResult(null)
          }}
          placeholder={s.pastePlaceholder}
        />
      </section>

      <div className="actions">
        <span />
        <button className="primary" onClick={run} disabled={!canRun}>
          {busy ? (
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          ) : (
            s.explore
          )}
        </button>
      </div>
      {busy && <p className="hint">{s.reading}</p>}
      {error && <div className="error">{error}</div>}

      {x && result && (
        <div className="results">
          <section className="card highlight">
            <h3>{s.summary}</h3>
            <p className="body big">{x.summary}</p>
          </section>

          {x.places.length > 0 && (
            <section className="card">
              <h3>{s.places}</h3>
              <ul className="ideas">
                {x.places.map((p, i) => (
                  <li key={i}>
                    <div className="idea-head">
                      <strong>{p.name}</strong>
                      <span className="muted">{p.english_name}</span>
                    </div>
                    <p className="body">{p.what_it_is}</p>
                    <div className="links">
                      <a href={mapUrl(p.english_name, profile.parent_language)} target="_blank" rel="noreferrer">
                        📍 {s.map}
                      </a>
                      {engines.map((e) => (
                        <a key={e.name} href={e.url(p.name)} target="_blank" rel="noreferrer">
                          {e.name}
                        </a>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {x.search_ideas.length > 0 && (
            <section className="card">
              <h3>{s.ideas}</h3>
              <ul className="ideas">
                {x.search_ideas.map((idea, i) => (
                  <li key={i}>
                    <div className="idea-head">
                      <span className={`badge kind-${idea.kind}`}>{s.kinds[idea.kind] ?? idea.kind}</span>
                      <strong>{idea.topic}</strong>
                    </div>
                    <p className="body">{idea.why}</p>
                    <p className="muted quote">
                      {s.because} “{idea.evidence}”
                    </p>
                    <div className="links">
                      {engines.map((e) => (
                        <a key={e.name} href={e.url(idea.query)} target="_blank" rel="noreferrer">
                          🔍 {e.name}: {idea.query}
                        </a>
                      ))}
                      <a href={en.url(idea.query_english)} target="_blank" rel="noreferrer">
                        🔍 {s.english}: {idea.query_english}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {x.conversation_starters.length > 0 && (
            <section className="card">
              <h3>{s.ask}</h3>
              <ul className="additions">
                {x.conversation_starters.map((q, i) => (
                  <li key={i}>
                    <span>{q}</span>
                    <button className="copy" onClick={() => copy(q, i)}>
                      {copied === i ? s.copied : s.copy}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {x.watch_outs.length > 0 && (
            <section className="card warn">
              <ul>
                {x.watch_outs.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="usage">
            {result.usage.input_tokens} input ({result.usage.cached_input_tokens} cached) · {result.usage.output_tokens}{' '}
            output tokens
          </p>
        </div>
      )}
    </div>
  )
}
