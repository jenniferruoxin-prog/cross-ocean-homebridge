// Interface text for the parent-side "Explore my child's letter" tab, plus which search engines and maps
// to offer for each parents' language (e.g. Google is not reachable from mainland China).

export interface ExploreStrings {
  tab: string
  lead: string
  upload: string
  orPaste: string
  pastePlaceholder: string
  explore: string
  reading: string
  summary: string
  places: string
  ideas: string
  because: string
  map: string
  english: string
  ask: string
  copy: string
  copied: string
  remove: string
  tooMany: string
  pdfFailed: string
  kinds: Record<string, string>
}

const EN: ExploreStrings = {
  tab: "My child's letter",
  lead: "Add the long image, PDF, or text your child sent. You'll get a short summary, the places mentioned, and searches to picture their week and care for them from afar.",
  upload: '+ Add long image or PDF',
  orPaste: 'Or paste the text of the letter',
  pastePlaceholder: 'Paste the letter here…',
  explore: 'Explore this letter',
  reading: 'Reading the letter…',
  summary: 'This week in short',
  places: 'Places in the letter',
  ideas: 'Things you could look up',
  because: 'From the letter:',
  map: 'Map',
  english: 'In English',
  ask: 'You could ask',
  copy: 'Copy',
  copied: 'Copied ✓',
  remove: 'Remove',
  tooMany: 'The letter is very long; only the first part was added.',
  pdfFailed: 'This PDF could not be read. Please ask your child to send the long image instead.',
  kinds: { place: 'Place', food: 'Food', culture: 'Culture', care: 'Care', study: 'Study', daily_life: 'Daily life' },
}

const STRINGS: Record<string, ExploreStrings> = {
  'Simplified Chinese': {
    tab: '孩子的家书',
    lead: '放入孩子发来的长图、PDF 或文字，帮您总结孩子这一周，找出信里提到的地方，并准备好可以直接搜索的内容，让您更了解孩子的生活，也知道怎么关心孩子。',
    upload: '+ 放入长图或 PDF',
    orPaste: '或者粘贴信的文字',
    pastePlaceholder: '把孩子的信粘贴到这里……',
    explore: '帮我看看这封信',
    reading: '正在读信……',
    summary: '这一周的概要',
    places: '信里提到的地方',
    ideas: '可以搜一搜',
    because: '信里提到：',
    map: '地图',
    english: '英文搜索',
    ask: '可以这样问问孩子',
    copy: '复制',
    copied: '已复制 ✓',
    remove: '移除',
    tooMany: '信太长了，只放入了前面的部分。',
    pdfFailed: '这个 PDF 读不出来，请让孩子改发长图。',
    kinds: { place: '地点', food: '美食', culture: '文化', care: '关心', study: '学习', daily_life: '生活' },
  },
  'Traditional Chinese': {
    tab: '孩子的家書',
    lead: '放入孩子傳來的長圖、PDF 或文字，幫您總結孩子這一週，找出信裡提到的地方，並準備好可以直接搜尋的內容，讓您更了解孩子的生活，也知道怎麼關心孩子。',
    upload: '+ 放入長圖或 PDF',
    orPaste: '或者貼上信的文字',
    pastePlaceholder: '把孩子的信貼到這裡……',
    explore: '幫我看看這封信',
    reading: '正在讀信……',
    summary: '這一週的概要',
    places: '信裡提到的地方',
    ideas: '可以搜一搜',
    because: '信裡提到：',
    map: '地圖',
    english: '英文搜尋',
    ask: '可以這樣問問孩子',
    copy: '複製',
    copied: '已複製 ✓',
    remove: '移除',
    tooMany: '信太長了，只放入了前面的部分。',
    pdfFailed: '這個 PDF 讀不出來，請讓孩子改傳長圖。',
    kinds: { place: '地點', food: '美食', culture: '文化', care: '關心', study: '學習', daily_life: '生活' },
  },
  Hindi: {
    tab: 'बच्चे का पत्र',
    lead: 'बच्चे की भेजी लंबी तस्वीर, PDF या टेक्स्ट यहाँ डालें। आपको हफ़्ते का छोटा सार, पत्र में बताई जगहें, और खोजने के लिए तैयार विषय मिलेंगे, ताकि आप बच्चे की ज़िंदगी को बेहतर समझ सकें और दूर से भी ध्यान रख सकें।',
    upload: '+ लंबी तस्वीर या PDF जोड़ें',
    orPaste: 'या पत्र का टेक्स्ट पेस्ट करें',
    pastePlaceholder: 'बच्चे का पत्र यहाँ पेस्ट करें…',
    explore: 'यह पत्र समझाइए',
    reading: 'पत्र पढ़ा जा रहा है…',
    summary: 'इस हफ़्ते का सार',
    places: 'पत्र में बताई जगहें',
    ideas: 'आप ये खोज सकते हैं',
    because: 'पत्र में लिखा है:',
    map: 'नक्शा',
    english: 'अंग्रेज़ी में खोजें',
    ask: 'आप बच्चे से पूछ सकते हैं',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया ✓',
    remove: 'हटाएँ',
    tooMany: 'पत्र बहुत लंबा है; सिर्फ़ पहला हिस्सा जोड़ा गया।',
    pdfFailed: 'यह PDF पढ़ा नहीं जा सका। कृपया बच्चे से लंबी तस्वीर भेजने को कहें।',
    kinds: { place: 'जगह', food: 'खाना', culture: 'संस्कृति', care: 'देखभाल', study: 'पढ़ाई', daily_life: 'रोज़मर्रा' },
  },
  Korean: {
    tab: '자녀의 편지',
    lead: '자녀가 보낸 긴 이미지, PDF 또는 글을 넣어 주세요. 한 주 요약, 편지에 나온 장소, 바로 검색할 수 있는 주제를 정리해 드려요. 자녀의 생활을 더 잘 알고 멀리서도 챙길 수 있어요.',
    upload: '+ 긴 이미지 또는 PDF 넣기',
    orPaste: '또는 편지 내용을 붙여 넣기',
    pastePlaceholder: '자녀의 편지를 여기에 붙여 넣으세요…',
    explore: '이 편지 살펴보기',
    reading: '편지를 읽는 중…',
    summary: '이번 주 요약',
    places: '편지에 나온 장소',
    ideas: '찾아볼 만한 것',
    because: '편지 내용:',
    map: '지도',
    english: '영어로 검색',
    ask: '이렇게 물어보세요',
    copy: '복사',
    copied: '복사됨 ✓',
    remove: '삭제',
    tooMany: '편지가 너무 길어서 앞부분만 넣었어요.',
    pdfFailed: '이 PDF는 읽을 수 없어요. 자녀에게 긴 이미지로 보내 달라고 해 주세요.',
    kinds: { place: '장소', food: '음식', culture: '문화', care: '돌봄', study: '공부', daily_life: '생활' },
  },
  Vietnamese: {
    tab: 'Thư của con',
    lead: 'Thêm ảnh dài, PDF hoặc chữ con gửi. Bạn sẽ có bản tóm tắt tuần của con, những nơi được nhắc đến và các gợi ý tìm kiếm sẵn, để hiểu cuộc sống của con hơn và chăm sóc con từ xa.',
    upload: '+ Thêm ảnh dài hoặc PDF',
    orPaste: 'Hoặc dán nội dung thư',
    pastePlaceholder: 'Dán thư của con vào đây…',
    explore: 'Xem thư này',
    reading: 'Đang đọc thư…',
    summary: 'Tóm tắt tuần này',
    places: 'Những nơi trong thư',
    ideas: 'Bạn có thể tìm hiểu',
    because: 'Trong thư:',
    map: 'Bản đồ',
    english: 'Tìm bằng tiếng Anh',
    ask: 'Bạn có thể hỏi con',
    copy: 'Sao chép',
    copied: 'Đã chép ✓',
    remove: 'Xóa',
    tooMany: 'Thư quá dài; chỉ phần đầu được thêm vào.',
    pdfFailed: 'Không đọc được PDF này. Hãy nhờ con gửi ảnh dài thay thế.',
    kinds: { place: 'Địa điểm', food: 'Món ăn', culture: 'Văn hóa', care: 'Chăm sóc', study: 'Học tập', daily_life: 'Đời sống' },
  },
  Spanish: {
    tab: 'La carta de mi hijo/a',
    lead: 'Añade la imagen larga, el PDF o el texto que te envió tu hijo/a. Recibirás un resumen de su semana, los lugares que menciona y búsquedas listas para conocer mejor su vida y cuidarle a distancia.',
    upload: '+ Añadir imagen larga o PDF',
    orPaste: 'O pega el texto de la carta',
    pastePlaceholder: 'Pega aquí la carta…',
    explore: 'Explorar esta carta',
    reading: 'Leyendo la carta…',
    summary: 'La semana en resumen',
    places: 'Lugares de la carta',
    ideas: 'Cosas que puedes buscar',
    because: 'En la carta:',
    map: 'Mapa',
    english: 'En inglés',
    ask: 'Podrías preguntarle',
    copy: 'Copiar',
    copied: 'Copiado ✓',
    remove: 'Quitar',
    tooMany: 'La carta es muy larga; solo se añadió la primera parte.',
    pdfFailed: 'No se pudo leer este PDF. Pide a tu hijo/a que envíe la imagen larga.',
    kinds: { place: 'Lugar', food: 'Comida', culture: 'Cultura', care: 'Cuidado', study: 'Estudios', daily_life: 'Vida diaria' },
  },
}

export function exploreStrings(parentLanguage: string): ExploreStrings {
  return STRINGS[parentLanguage] ?? EN
}

export interface Engine {
  name: string
  url: (q: string) => string
}

const q = encodeURIComponent
const GOOGLE: Engine = { name: 'Google', url: (s) => `https://www.google.com/search?q=${q(s)}` }
const BING_CN: Engine = { name: '必应', url: (s) => `https://cn.bing.com/search?q=${q(s)}` }
const BAIDU: Engine = { name: '百度', url: (s) => `https://www.baidu.com/s?wd=${q(s)}` }
const XHS: Engine = { name: '小红书', url: (s) => `https://www.xiaohongshu.com/search_result?keyword=${q(s)}` }
const NAVER: Engine = { name: 'Naver', url: (s) => `https://search.naver.com/search.naver?query=${q(s)}` }
const YOUTUBE: Engine = { name: 'YouTube', url: (s) => `https://www.youtube.com/results?search_query=${q(s)}` }

// Search engines for queries in the parents' language.
export function enginesFor(parentLanguage: string): Engine[] {
  if (parentLanguage === 'Simplified Chinese') return [BAIDU, XHS, BING_CN]
  if (parentLanguage === 'Korean') return [NAVER, GOOGLE]
  return [GOOGLE, YOUTUBE]
}

// English searches and maps: Bing works from mainland China, Google elsewhere.
export function englishEngine(parentLanguage: string): Engine {
  return parentLanguage === 'Simplified Chinese' ? { ...BING_CN, name: 'Bing' } : GOOGLE
}

export function mapUrl(place: string, parentLanguage: string): string {
  return parentLanguage === 'Simplified Chinese'
    ? `https://cn.bing.com/maps?q=${q(place)}`
    : `https://www.google.com/maps/search/?api=1&query=${q(place)}`
}
