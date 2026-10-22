// Family conversation history, kept only in this browser (localStorage), shared by student and parent mode.
// It stores what the other side actually saw: messages the user copied to send, and messages pasted in.

import { useState } from 'react'

export interface HistoryEntry {
  id: string
  time: string // ISO timestamp
  writer: 'student' | 'parent'
  text: string
}

const KEY = 'homebridge.history'
const KEEP = 50 // entries kept in the browser
export const CONTEXT_SIZE = 8 // entries sent to the agent (matches MAX_HISTORY in backend/models.py)

function load(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(load)

  function save(next: HistoryEntry[]) {
    const kept = next.slice(-KEEP)
    localStorage.setItem(KEY, JSON.stringify(kept))
    setEntries(kept)
  }

  // Adds an entry, or replaces the one with the same id (copying the same result twice updates it).
  // Running the same received message again does not add a duplicate.
  function upsert(entry: HistoryEntry) {
    const current = load()
    const i = current.findIndex((e) => e.id === entry.id)
    if (i >= 0) return save(current.map((e, j) => (j === i ? entry : e)))
    const last = current[current.length - 1]
    if (last && last.writer === entry.writer && last.text === entry.text) return
    save([...current, entry])
  }

  return { entries, upsert, clear: () => save([]) }
}

export function forAgent(entries: HistoryEntry[]) {
  return entries.slice(-CONTEXT_SIZE).map((e) => ({
    time: formatTime(e.time),
    writer: e.writer,
    text: e.text,
  }))
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
