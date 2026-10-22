export interface FamilyProfile {
  student_name: string
  parent_names: string
  parent_language: string
  student_language: string
  home_country: string
  school: string
  student_timezone: string
  parent_timezone: string
  family_notes: string
}

export type Direction = 'to_parents' | 'from_parents' | 'to_child' | 'from_child'

export interface BridgeReply {
  message_to_send: string
  message_to_send_meaning: string
  their_message_translated: string
  reading_between_lines: string[]
  optional_additions: { text: string; meaning: string }[]
  watch_outs: string[]
}

export interface UsageInfo {
  input_tokens: number
  cached_input_tokens: number
  output_tokens: number
  requests: number
}

export interface BridgeResponse {
  reply: BridgeReply
  usage: UsageInfo
}

export const DEFAULT_PROFILE: FamilyProfile = {
  student_name: '',
  parent_names: 'Mom and Dad',
  parent_language: 'Simplified Chinese',
  student_language: 'English',
  home_country: 'China',
  school: '',
  student_timezone: 'America/New_York',
  parent_timezone: 'Asia/Shanghai',
  family_notes: '',
}

// Value sent to the agent, label shown in the menu.
export const LANGUAGES: [string, string][] = [
  ['Simplified Chinese', '简体中文 (Simplified Chinese)'],
  ['Traditional Chinese', '繁體中文 (Traditional Chinese)'],
  ['Hindi', 'हिन्दी (Hindi)'],
  ['Korean', '한국어 (Korean)'],
  ['Vietnamese', 'Tiếng Việt (Vietnamese)'],
  ['Japanese', '日本語 (Japanese)'],
  ['Spanish', 'Español (Spanish)'],
  ['Portuguese', 'Português (Portuguese)'],
  ['Arabic', 'العربية (Arabic)'],
  ['Bengali', 'বাংলা (Bengali)'],
  ['Telugu', 'తెలుగు (Telugu)'],
  ['Nepali', 'नेपाली (Nepali)'],
  ['Urdu', 'اردو (Urdu)'],
  ['Turkish', 'Türkçe (Turkish)'],
  ['Persian', 'فارسی (Persian)'],
  ['Indonesian', 'Bahasa Indonesia'],
  ['Thai', 'ไทย (Thai)'],
  ['French', 'Français (French)'],
  ['German', 'Deutsch (German)'],
]

// The child's language list also offers English, the usual choice.
export const CHILD_LANGUAGES: [string, string][] = [['English', 'English'], ...LANGUAGES]

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Karachi',
  'Asia/Tehran',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Europe/Istanbul',
  'Europe/Berlin',
  'Europe/Paris',
  'Africa/Lagos',
  'America/Sao_Paulo',
  'America/Mexico_City',
]

// ---------- Weekly Digest ----------

export interface PhotoFacts {
  description: string
  activity: string
  setting: string
  mood: string
  visual_details: string[]
  possible_place: string
  visible_text: string
  privacy_flags: string[]
  share_recommendation: 'share' | 'check'
}

export interface PhotoReadResponse {
  photos: PhotoFacts[]
  usage: UsageInfo
}

export interface DigestReply {
  title: string
  letter: string
  letter_meaning: string
  highlights: { text: string; source: string }[]
  photo_captions: { number: number; caption: string }[]
  how_i_wrote_it: string[]
  optional_additions: { text: string; meaning: string }[]
  watch_outs: string[]
}

export interface DigestResponse {
  digest: DigestReply
  usage: UsageInfo
}

// ---------- Parent side: explore the child's letter ----------

export interface ExploreReply {
  transcript: string
  summary: string
  places: { name: string; english_name: string; what_it_is: string; evidence: string }[]
  search_ideas: {
    kind: 'place' | 'food' | 'culture' | 'care' | 'study' | 'daily_life'
    topic: string
    query: string
    query_english: string
    why: string
    evidence: string
  }[]
  conversation_starters: string[]
  watch_outs: string[]
}

export interface ExploreResponse {
  explore: ExploreReply
  usage: UsageInfo
}

// ---------- Call Planner ----------

export interface CallOption {
  start_utc: string
  end_utc: string
  student_time: string
  parent_time: string
  why: string
}

export interface CallPlanResponse {
  options: CallOption[]
  invitation: string
  invitation_meaning: string
  talking_points: string[]
  assumptions: string[]
  watch_outs: string[]
  parents_ahead_by_hours: number
  upcoming_change: { from_date: string; parents_ahead_by_hours: number; what_happens: string } | null
  usage: UsageInfo
}

export interface CalendarReadResponse {
  schedule_text: string
  blocks: { days: string[]; start: string; end: string; label: string }[]
  dates_seen: string
  unclear: string[]
  usage: UsageInfo
}
