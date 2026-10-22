import { useState } from 'react'
import { readPhotos, writeDigest } from './api'
import { useHistory } from './history'
import { saveLetterImage } from './letterImage'
import { openPrintableLetter, type LetterContent } from './letterPrint'
import type { DigestResponse, FamilyProfile, PhotoFacts, UsageInfo } from './types'

const MAX_PHOTOS = 8
const MAX_SIDE = 1024 // px; enough for the model, far fewer tokens than a full phone photo

// Redraws the photo on a canvas: smaller upload, fewer image tokens, and no EXIF data (GPS location, device).
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name} could not be opened. Try a JPG or PNG (iPhone HEIC photos: export as JPG).`))
    }
    img.src = url
  })
}

function Usage({ usage, label }: { usage: UsageInfo; label: string }) {
  return (
    <p className="usage">
      {label}: {usage.input_tokens} input ({usage.cached_input_tokens} cached) · {usage.output_tokens} output tokens ·{' '}
      {usage.requests} request{usage.requests === 1 ? '' : 's'}
    </p>
  )
}

export default function DigestView({ profile }: { profile: FamilyProfile }) {
  const [photos, setPhotos] = useState<string[]>([])
  const [facts, setFacts] = useState<PhotoFacts[] | null>(null)
  const [include, setInclude] = useState<boolean[]>([])
  const [readUsage, setReadUsage] = useState<UsageInfo | null>(null)
  const [notes, setNotes] = useState('')
  const [style, setStyle] = useState<'short' | 'rich'>('rich')
  const [busy, setBusy] = useState<'' | 'reading' | 'writing'>('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<DigestResponse | null>(null)
  const [added, setAdded] = useState<number[]>([])
  const [copied, setCopied] = useState('')
  const [runId, setRunId] = useState('')
  const history = useHistory()
  const parents = profile.parent_names || 'your parents'

  function resetAnalysis() {
    setFacts(null)
    setInclude([])
    setReadUsage(null)
    setResult(null)
  }

  async function addFiles(files: FileList | null) {
    if (!files) return
    setError('')
    const room = MAX_PHOTOS - photos.length
    const picked = Array.from(files).slice(0, room)
    if (files.length > room) setError(`Up to ${MAX_PHOTOS} photos per week.`)
    try {
      const shrunk = await Promise.all(picked.map(shrink))
      setPhotos([...photos, ...shrunk])
      resetAnalysis()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function removePhoto(i: number) {
    setPhotos(photos.filter((_, j) => j !== i))
    resetAnalysis()
  }

  async function analyse() {
    setBusy('reading')
    setError('')
    setResult(null)
    try {
      const res = await readPhotos(profile, photos)
      setFacts(res.photos)
      setInclude(res.photos.map((f) => f.share_recommendation === 'share'))
      setReadUsage(res.usage)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  async function write() {
    setBusy('writing')
    setError('')
    setResult(null)
    setAdded([])
    try {
      const chosen = (facts ?? []).map((f, i) => ({ number: i + 1, facts: f })).filter((_, i) => include[i])
      setResult(await writeDigest(profile, notes, chosen, style))
      setRunId(crypto.randomUUID())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  const d = result?.digest
  const extras = d ? added.map((i) => d.optional_additions[i]) : []
  const letter = d ? [d.letter, ...extras.map((a) => a.text)].join('\n') : ''
  const meaning = d ? [d.letter_meaning, ...extras.map((a) => a.meaning)].join('\n') : ''
  // Sending the letter (copied or downloaded) makes it part of the family conversation history.
  function saveToHistory() {
    history.upsert({ id: `${runId}-digest`, time: new Date().toISOString(), writer: 'student', text: letter })
  }

  function letterContent(): LetterContent | null {
    if (!d) return null
    const date = new Date().toISOString().slice(0, 10)
    return {
      title: d.title,
      letter,
      photos: d.photo_captions
        .filter((c) => photos[c.number - 1])
        .map((c) => ({ src: photos[c.number - 1], caption: c.caption })),
      signature: profile.student_name,
      language: profile.parent_language,
      fileName: `HomeBridge letter ${date}`,
    }
  }

  function downloadLetter() {
    const content = letterContent()
    if (!content) return
    openPrintableLetter(content)
    saveToHistory()
  }

  async function downloadImage() {
    const content = letterContent()
    if (!content) return
    try {
      await saveLetterImage(content)
      saveToHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const needsPhotoRead =photos.length > 0 && !facts
  const canWrite = !busy && !needsPhotoRead && (notes.trim().length > 0 || include.some(Boolean))

  return (
    <div className="digest">
      <p className="lead">
        Turn your week into a short update for {parents}: add a few photos and quick notes, check what gets shared,
        and get a warm message in {profile.parent_language} to send with the photos.
      </p>

      <section className="card">
        <div className="card-head">
          <h3>1 · Photos from this week</h3>
          <span className="muted">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>
        <div className="thumbs">
          {photos.map((src, i) => (
            <figure key={i} className={`thumb ${facts && !include[i] ? 'excluded' : ''}`}>
              <img src={src} alt={`Photo ${i + 1}`} />
              <span className="num">{i + 1}</span>
              <button className="remove" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}>
                ×
              </button>
            </figure>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="thumb add">
              <input type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} hidden />
              <span>+ Add photos</span>
            </label>
          )}
        </div>
        <p className="hint">Photos are resized in your browser and their location data is removed before upload.</p>
      </section>

      <section className="card">
        <h3>2 · Quick notes (any language, messy is fine)</h3>
        <textarea
          className="composer"
          rows={4}
          value={notes}
          maxLength={2000}
          onChange={(e) => {
            setNotes(e.target.value)
            setResult(null)
          }}
          placeholder={'mon: stats midterm, got 88\nwed: cooked tomato egg noodles with roommate\nsat: hackathon, team got 3rd!! tired but happy'}
        />
      </section>

      {photos.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>3 · Check what gets shared</h3>
            <button className="copy" onClick={analyse} disabled={!!busy}>
              {busy === 'reading' ? 'Reading photos…' : facts ? 'Read again' : 'Read my photos'}
            </button>
          </div>
          {!facts && <p className="hint">The Photo Reader describes each photo and flags anything you may not want to share.</p>}
          {facts && (
            <ul className="facts">
              {facts.map((f, i) => (
                <li key={i} className={f.share_recommendation === 'check' ? 'flagged' : ''}>
                  <img src={photos[i]} alt="" />
                  <div>
                    <div className="facts-head">
                      <strong>Photo {i + 1}</strong>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={include[i]}
                          onChange={(e) => {
                            setInclude(include.map((v, j) => (j === i ? e.target.checked : v)))
                            setResult(null)
                          }}
                        />
                        Share with {parents}
                      </label>
                    </div>
                    <p className="body">{f.description}</p>
                    {f.possible_place && <p className="muted">📍 {f.possible_place}</p>}
                    {f.privacy_flags.map((flag, k) => (
                      <p key={k} className="flag">
                        ⚠ {flag}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {readUsage && <Usage usage={readUsage} label="Photo Reader" />}
        </section>
      )}

      <div className="actions">
        <span className="hint lang-hint">
          {needsPhotoRead ? 'Read your photos first, so you can choose what to share.' : `Written in ${profile.parent_language}`}
          <span className="segmented mini" role="tablist" aria-label="Length">
            <button
              className={style === 'short' ? 'on' : ''}
              onClick={() => {
                setStyle('short')
                setResult(null)
              }}
            >
              Short
            </button>
            <button
              className={style === 'rich' ? 'on' : ''}
              onClick={() => {
                setStyle('rich')
                setResult(null)
              }}
            >
              Rich & vivid
            </button>
          </span>
        </span>
        <button className="primary" onClick={write} disabled={!canWrite}>
          {busy === 'writing' ? (
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
          ) : (
            "Write this week's update"
          )}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {d && result && (
        <div className="results">
          <section className="card highlight">
            <div className="card-head">
              <h3>{d.title}</h3>
              <span className="btn-row">
                <button className="copy" onClick={downloadImage}>
                  Save as long image
                </button>
                <button className="copy" onClick={downloadLetter}>
                  Download as letter (PDF)
                </button>
                <button
                  className="copy"
                  onClick={async () => {
                    await copy(letter, 'letter')
                    saveToHistory()
                  }}
                >
                  {copied === 'letter' ? 'Copied ✓' : 'Copy'}
                </button>
              </span>
            </div>
            <p className="body big">{letter}</p>
            <details>
              <summary>What this says in {profile.student_language}</summary>
              <p className="body">{meaning}</p>
            </details>
          </section>

          {d.photo_captions.length > 0 && (
            <section className="card">
              <h3>Photos to send, with captions</h3>
              <ul className="captions">
                {d.photo_captions.map((c) => (
                  <li key={c.number}>
                    <img src={photos[c.number - 1]} alt={`Photo ${c.number}`} />
                    <span>{c.caption}</span>
                    <button className="copy" onClick={() => copy(c.caption, `cap${c.number}`)}>
                      {copied === `cap${c.number}` ? 'Copied ✓' : 'Copy'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h3>Where every fact came from</h3>
            <ul className="sources">
              {d.highlights.map((h, i) => (
                <li key={i}>
                  <span
                    className={`badge ${h.source.toLowerCase().startsWith('background') ? 'bg' : ''}`}
                    title={h.source.toLowerCase().startsWith('background') ? 'General knowledge about this place. Please double-check before sending.' : ''}
                  >
                    {h.source}
                  </span>
                  {h.text}
                </li>
              ))}
            </ul>
          </section>

          {d.optional_additions.length > 0 && (
            <section className="card">
              <h3>Want to add more? Only if it's true</h3>
              <ul className="additions">
                {d.optional_additions.map((a, i) => {
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
                        {on ? 'Added ✓' : '+ Add'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="card">
            <h3>How I wrote it</h3>
            <ul>
              {d.how_i_wrote_it.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>

          {d.watch_outs.length > 0 && (
            <section className="card warn">
              <h3>Before you send</h3>
              <ul>
                {d.watch_outs.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <Usage usage={result.usage} label="Digest Writer" />
        </div>
      )}
    </div>
  )
}
