import type {
  BridgeResponse,
  CalendarReadResponse,
  CallPlanResponse,
  DigestResponse,
  Direction,
  ExploreResponse,
  FamilyProfile,
  PhotoFacts,
  PhotoReadResponse,
} from './types'

export interface AgentHistoryItem {
  time: string
  writer: 'student' | 'parent'
  text: string
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const detail = typeof data?.detail === 'string' ? data.detail : 'Something went wrong. Please try again.'
    throw new Error(detail)
  }
  return res.json()
}

export function readPhotos(profile: FamilyProfile, dataUrls: string[]): Promise<PhotoReadResponse> {
  return post('/api/digest/photos', { profile, photos: dataUrls.map((data_url) => ({ data_url })) })
}

export function writeDigest(
  profile: FamilyProfile,
  notes: string,
  photos: { number: number; facts: PhotoFacts }[],
  style: 'short' | 'rich',
): Promise<DigestResponse> {
  return post('/api/digest/write', { profile, notes, photos, style })
}

export function exploreLetter(profile: FamilyProfile, text: string, images: string[]): Promise<ExploreResponse> {
  return post('/api/explore', { profile, text, images: images.map((data_url) => ({ data_url })) })
}

export function planCall(
  profile: FamilyProfile,
  studentWeek: string,
  parentWeek: string,
  callMinutes: number,
  startDate: string,
  history: AgentHistoryItem[],
  user: 'student' | 'parent' = 'student',
): Promise<CallPlanResponse> {
  return post('/api/calls', {
    user,
    profile,
    student_week: studentWeek,
    parent_week: parentWeek,
    call_minutes: callMinutes,
    start_date: startDate,
    history,
  })
}

export function readCalendar(
  profile: FamilyProfile,
  whose: 'student' | 'parent',
  images: string[],
): Promise<CalendarReadResponse> {
  return post('/api/calls/read-calendar', { profile, whose, images: images.map((data_url) => ({ data_url })) })
}

export function bridge(
  direction: Direction,
  text: string,
  profile: FamilyProfile,
  history: AgentHistoryItem[],
): Promise<BridgeResponse> {
  return post('/api/bridge', { direction, text, profile, history })
}
