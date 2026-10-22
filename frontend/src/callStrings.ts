// Interface text for the Call Planner. Students see English; parents see their own language when available.

export interface CallStrings {
  tab: string
  lead: string
  myWeek: (tz: string) => string
  theirWeek: (name: string, tz: string) => string
  myPlaceholder: string
  theirPlaceholder: string
  readCal: string
  readingCal: string
  calRead: (dates: string) => string
  callLength: string
  nextDays: string
  find: string
  theyAreAhead: (name: string, h: number) => string // other side is h hours ahead of the user
  theyAreBehind: (name: string, h: number) => string // other side is h hours behind the user
  dst: (date: string, where: string, ends: boolean, newHours: number) => string
  you: string
  whereYou: string
  noTimes: string
  noTimesHint: string
  bestTimes: string
  addCal: string
  calTitle: (name: string) => string
  calNotes: string
  invite: (name: string) => string
  whatSays: string
  talk: string
  check: string
  copy: string
  copied: string
}

const EN: CallStrings = {
  tab: 'Call Planner',
  lead: "Describe both weeks in plain words once (they're saved here). The planner finds times that work on both sides, handles time zones and daylight saving for you, and gets you ready for a good conversation.",
  myWeek: (tz) => `Your usual week (${tz})`,
  theirWeek: (n, tz) => `${n}'s usual week (${tz}, any language)`,
  myPlaceholder: 'e.g. classes MWF 9-12, TTh 1-4pm, gym weekdays 6-7pm, volunteer Sat 1-5pm. Sleep ~1am-8:30am.',
  theirPlaceholder: 'e.g. 爸爸工作日9点到6点上班，妈妈退休在家，晚上10点半睡，早上6点半起，周日上午去爷爷奶奶家。',
  readCal: '📷 Read from calendar screenshot',
  readingCal: 'Reading calendar…',
  calRead: (d) => `Read from the calendar${d ? ` (${d})` : ''}. Please check the times.`,
  callLength: 'Call length',
  nextDays: 'next 7 days',
  find: 'Find call times',
  theyAreAhead: (n, h) => `${n} ${n.includes(' and ') ? 'are' : 'is'} ${h} hours ahead of you.`,
  theyAreBehind: (n, h) => `${n} ${n.includes(' and ') ? 'are' : 'is'} ${h} hours behind you.`,
  dst: (d, w, ends, h) =>
    `From ${d}, daylight saving time ${ends ? 'ends' : 'starts'} where ${w} (clocks go ${ends ? 'back' : 'forward'} 1 hour): the difference becomes ${h} hours. Times below already account for it.`,
  you: 'You',
  whereYou: 'you live',
  noTimes: 'No common free time found',
  noTimesHint: 'Try a shorter call, or loosen one of the routines.',
  bestTimes: 'Best times',
  addCal: '📅 Add to calendar (.ics)',
  calTitle: (n) => `Video call with ${n}`,
  calNotes: 'Things to talk about:',
  invite: (n) => `Invite ${n}`,
  whatSays: 'What this says in the language you read best',
  talk: 'Things to talk about',
  check: 'Please check',
  copy: 'Copy',
  copied: 'Copied ✓',
}

const EN_PARENT: CallStrings = {
  ...EN,
  myPlaceholder: 'e.g. I work weekdays 9am-6pm, sleep 10:30pm-6:30am, visit grandparents Sunday mornings.',
  theirPlaceholder: 'e.g. classes MWF 9-12, TTh 1-4pm, gym weekdays 6-7pm. Sleeps ~1am-8:30am.',
  whatSays: 'What this says in your language',
}

const PARENT: Record<string, CallStrings> = {
  'Simplified Chinese': {
    tab: '约视频',
    lead: '用大白话写下双方平时的一周安排（会保存在这里）。系统会找出两边都方便的时间，自动处理时差和夏令时，并帮您准备好聊天话题。',
    myWeek: (tz) => `您平时的一周（${tz}）`,
    theirWeek: (n, tz) => `${n}平时的一周（${tz}，任何语言都可以）`,
    myPlaceholder: '例如：我工作日9点到6点上班，晚上10点半睡，早上6点半起，周日上午去爷爷奶奶家。',
    theirPlaceholder: '例如：周一三五上午9点到12点上课，周二四下午1点到4点上课，工作日晚上6点到7点健身，凌晨1点睡，早上8点半起。',
    readCal: '📷 从日历截图读取',
    readingCal: '正在读取日历……',
    calRead: (d) => `已从日历读取${d ? `（${d}）` : ''}，请核对时间。`,
    callLength: '通话时长',
    nextDays: '未来7天',
    find: '帮我找时间',
    theyAreAhead: (n, h) => `${n}那边比您早 ${h} 小时。`,
    theyAreBehind: (n, h) => `${n}那边比您晚 ${h} 小时。`,
    dst: (d, w, ends, h) =>
      `从 ${d} 起，${w}${ends ? '结束夏令时（时钟调回 1 小时）' : '开始夏令时（时钟调快 1 小时）'}，时差变为 ${h} 小时。下面的时间已经算好了。`,
    you: '您',
    whereYou: '您这边',
    noTimes: '没有找到双方都有空的时间',
    noTimesHint: '可以缩短通话时长，或放宽一方的安排再试试。',
    bestTimes: '推荐时间',
    addCal: '📅 加入日历（.ics）',
    calTitle: (n) => `和${n}视频`,
    calNotes: '可以聊的话题：',
    invite: (n) => `邀请${n}`,
    whatSays: '这段话的中文意思',
    talk: '可以聊的话题',
    check: '请核对',
    copy: '复制',
    copied: '已复制 ✓',
  },
  'Traditional Chinese': {
    tab: '約視訊',
    lead: '用白話寫下雙方平時的一週安排（會保存在這裡）。系統會找出兩邊都方便的時間，自動處理時差和夏令時間，並幫您準備好聊天話題。',
    myWeek: (tz) => `您平時的一週（${tz}）`,
    theirWeek: (n, tz) => `${n}平時的一週（${tz}，任何語言都可以）`,
    myPlaceholder: '例如：我平日9點到6點上班，晚上10點半睡，早上6點半起，週日上午去爺爺奶奶家。',
    theirPlaceholder: '例如：週一三五上午9點到12點上課，週二四下午1點到4點上課，平日晚上6點到7點健身，凌晨1點睡，早上8點半起。',
    readCal: '📷 從行事曆截圖讀取',
    readingCal: '正在讀取行事曆……',
    calRead: (d) => `已從行事曆讀取${d ? `（${d}）` : ''}，請核對時間。`,
    callLength: '通話時長',
    nextDays: '未來7天',
    find: '幫我找時間',
    theyAreAhead: (n, h) => `${n}那邊比您早 ${h} 小時。`,
    theyAreBehind: (n, h) => `${n}那邊比您晚 ${h} 小時。`,
    dst: (d, w, ends, h) =>
      `從 ${d} 起，${w}${ends ? '結束夏令時間（時鐘調回 1 小時）' : '開始夏令時間（時鐘調快 1 小時）'}，時差變為 ${h} 小時。下面的時間已經算好了。`,
    you: '您',
    whereYou: '您這邊',
    noTimes: '沒有找到雙方都有空的時間',
    noTimesHint: '可以縮短通話時長，或放寬一方的安排再試試。',
    bestTimes: '推薦時間',
    addCal: '📅 加入行事曆（.ics）',
    calTitle: (n) => `和${n}視訊`,
    calNotes: '可以聊的話題：',
    invite: (n) => `邀請${n}`,
    whatSays: '這段話的中文意思',
    talk: '可以聊的話題',
    check: '請核對',
    copy: '複製',
    copied: '已複製 ✓',
  },
  Hindi: {
    tab: 'वीडियो कॉल तय करें',
    lead: 'दोनों तरफ़ का आम हफ़्ता आसान शब्दों में एक बार लिखें (यहीं सेव रहेगा)। ऐप दोनों के लिए सही समय ढूँढेगा, टाइम ज़ोन और डेलाइट सेविंग का हिसाब खुद करेगा, और बातचीत के विषय भी सुझाएगा।',
    myWeek: (tz) => `आपका आम हफ़्ता (${tz})`,
    theirWeek: (n, tz) => `${n} का आम हफ़्ता (${tz}, किसी भी भाषा में)`,
    myPlaceholder: 'जैसे: सोमवार से शुक्रवार सुबह 9 से शाम 6 बजे तक ऑफ़िस, रात 10:30 बजे सोना, सुबह 6:30 बजे उठना।',
    theirPlaceholder: 'जैसे: सोम, बुध, शुक्र सुबह 9 से 12 क्लास; मंगल, गुरु दोपहर 1 से 4 क्लास; रात 1 बजे सोना, सुबह 8:30 उठना।',
    readCal: '📷 कैलेंडर स्क्रीनशॉट से पढ़ें',
    readingCal: 'कैलेंडर पढ़ा जा रहा है…',
    calRead: (d) => `कैलेंडर से पढ़ा गया${d ? ` (${d})` : ''}। कृपया समय जाँच लें।`,
    callLength: 'कॉल की अवधि',
    nextDays: 'अगले 7 दिन',
    find: 'समय ढूँढें',
    theyAreAhead: (n, h) => `${n} का समय आपसे ${h} घंटे आगे है।`,
    theyAreBehind: (n, h) => `${n} का समय आपसे ${h} घंटे पीछे है।`,
    dst: (d, w, ends, h) =>
      `${d} से ${w} डेलाइट सेविंग टाइम ${ends ? 'खत्म होगा (घड़ी 1 घंटा पीछे)' : 'शुरू होगा (घड़ी 1 घंटा आगे)'}; समय का अंतर ${h} घंटे हो जाएगा। नीचे के समय में यह पहले से जोड़ा गया है।`,
    you: 'आप',
    whereYou: 'आपकी तरफ़',
    noTimes: 'दोनों के लिए खाली समय नहीं मिला',
    noTimesHint: 'कॉल छोटी करें या किसी एक का शेड्यूल थोड़ा ढीला करें।',
    bestTimes: 'सबसे अच्छे समय',
    addCal: '📅 कैलेंडर में जोड़ें (.ics)',
    calTitle: (n) => `${n} के साथ वीडियो कॉल`,
    calNotes: 'बातचीत के विषय:',
    invite: (n) => `${n} को बुलाएँ`,
    whatSays: 'हिंदी में इसका मतलब',
    talk: 'बातचीत के विषय',
    check: 'कृपया जाँच लें',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया ✓',
  },
  Korean: {
    tab: '영상통화 잡기',
    lead: '양쪽의 평소 일주일을 편하게 한 번 적어 주세요(여기에 저장돼요). 두 사람 모두 편한 시간을 찾고, 시차와 서머타임은 자동으로 계산하며, 대화 주제도 준비해 드려요.',
    myWeek: (tz) => `나의 평소 일주일 (${tz})`,
    theirWeek: (n, tz) => `${n}의 평소 일주일 (${tz}, 어떤 언어든 괜찮아요)`,
    myPlaceholder: '예: 평일 9시~6시 근무, 밤 10시 반에 자고 아침 6시 반에 일어나요. 일요일 오전엔 부모님 댁에 가요.',
    theirPlaceholder: '예: 월수금 9시~12시 수업, 화목 1시~4시 수업, 평일 저녁 6~7시 운동, 새벽 1시에 자고 8시 반에 일어나요.',
    readCal: '📷 캘린더 스크린샷으로 읽기',
    readingCal: '캘린더를 읽는 중…',
    calRead: (d) => `캘린더에서 읽었어요${d ? ` (${d})` : ''}. 시간을 확인해 주세요.`,
    callLength: '통화 시간',
    nextDays: '앞으로 7일',
    find: '시간 찾기',
    theyAreAhead: (n, h) => `${n} 쪽이 ${h}시간 빨라요.`,
    theyAreBehind: (n, h) => `${n} 쪽이 ${h}시간 느려요.`,
    dst: (d, w, ends, h) =>
      `${d}부터 ${w} 서머타임이 ${ends ? '끝나요 (시계를 1시간 뒤로)' : '시작돼요 (시계를 1시간 앞으로)'}. 시차가 ${h}시간이 돼요. 아래 시간에는 이미 반영되어 있어요.`,
    you: '나',
    whereYou: '내 쪽은',
    noTimes: '양쪽 모두 비는 시간이 없어요',
    noTimesHint: '통화 시간을 줄이거나 한쪽 일정을 조금 조정해 보세요.',
    bestTimes: '추천 시간',
    addCal: '📅 캘린더에 추가 (.ics)',
    calTitle: (n) => `${n}와(과) 영상통화`,
    calNotes: '대화 주제:',
    invite: (n) => `${n}에게 제안하기`,
    whatSays: '한국어 뜻',
    talk: '이야기해 볼 만한 것',
    check: '확인해 주세요',
    copy: '복사',
    copied: '복사됨 ✓',
  },
  Vietnamese: {
    tab: 'Hẹn gọi video',
    lead: 'Viết lịch sinh hoạt thường ngày của hai bên một lần (được lưu tại đây). Ứng dụng sẽ tìm giờ phù hợp cho cả hai, tự tính múi giờ và giờ mùa hè, và gợi ý chủ đề trò chuyện.',
    myWeek: (tz) => `Tuần thường ngày của bạn (${tz})`,
    theirWeek: (n, tz) => `Tuần thường ngày của ${n} (${tz}, ngôn ngữ nào cũng được)`,
    myPlaceholder: 'Ví dụ: tôi làm việc 9h-18h các ngày trong tuần, ngủ 22h30, dậy 6h30, sáng Chủ nhật về thăm ông bà.',
    theirPlaceholder: 'Ví dụ: học thứ 2-4-6 từ 9h-12h, thứ 3-5 từ 13h-16h, tập gym 18h-19h, ngủ khoảng 1h sáng, dậy 8h30.',
    readCal: '📷 Đọc từ ảnh chụp lịch',
    readingCal: 'Đang đọc lịch…',
    calRead: (d) => `Đã đọc từ lịch${d ? ` (${d})` : ''}. Vui lòng kiểm tra lại giờ.`,
    callLength: 'Thời lượng',
    nextDays: '7 ngày tới',
    find: 'Tìm giờ gọi',
    theyAreAhead: (n, h) => `Giờ bên ${n} sớm hơn bạn ${h} tiếng.`,
    theyAreBehind: (n, h) => `Giờ bên ${n} muộn hơn bạn ${h} tiếng.`,
    dst: (d, w, ends, h) =>
      `Từ ${d}, ${w} ${ends ? 'kết thúc giờ mùa hè (lùi đồng hồ 1 tiếng)' : 'bắt đầu giờ mùa hè (tăng đồng hồ 1 tiếng)'}; chênh lệch thành ${h} tiếng. Giờ bên dưới đã tính sẵn.`,
    you: 'Bạn',
    whereYou: 'bên bạn',
    noTimes: 'Không tìm được giờ rảnh chung',
    noTimesHint: 'Thử gọi ngắn hơn, hoặc nới lịch của một bên.',
    bestTimes: 'Giờ phù hợp nhất',
    addCal: '📅 Thêm vào lịch (.ics)',
    calTitle: (n) => `Gọi video với ${n}`,
    calNotes: 'Chủ đề trò chuyện:',
    invite: (n) => `Mời ${n}`,
    whatSays: 'Nghĩa bằng tiếng Việt',
    talk: 'Có thể trò chuyện về',
    check: 'Vui lòng kiểm tra',
    copy: 'Sao chép',
    copied: 'Đã chép ✓',
  },
  Spanish: {
    tab: 'Planear videollamada',
    lead: 'Describe una vez la semana habitual de cada lado (se guarda aquí). El planificador encuentra horas que funcionan para ambos, calcula husos horarios y horario de verano por ti, y te prepara temas para conversar.',
    myWeek: (tz) => `Tu semana habitual (${tz})`,
    theirWeek: (n, tz) => `Semana habitual de ${n} (${tz}, en cualquier idioma)`,
    myPlaceholder: 'Ej.: trabajo de lunes a viernes de 9 a 18, duermo de 22:30 a 6:30, los domingos por la mañana visito a los abuelos.',
    theirPlaceholder: 'Ej.: clases lun-mié-vie de 9 a 12, mar-jue de 13 a 16, gimnasio de 18 a 19, duerme de 1:00 a 8:30.',
    readCal: '📷 Leer de una captura del calendario',
    readingCal: 'Leyendo el calendario…',
    calRead: (d) => `Leído del calendario${d ? ` (${d})` : ''}. Revisa las horas, por favor.`,
    callLength: 'Duración',
    nextDays: 'próximos 7 días',
    find: 'Buscar horas',
    theyAreAhead: (n, h) => `${n} va ${h} horas por delante de ti.`,
    theyAreBehind: (n, h) => `${n} va ${h} horas por detrás de ti.`,
    dst: (d, w, ends, h) =>
      `Desde el ${d}, ${w} ${ends ? 'termina el horario de verano (los relojes se atrasan 1 hora)' : 'empieza el horario de verano (los relojes se adelantan 1 hora)'}; la diferencia pasa a ${h} horas. Las horas de abajo ya lo tienen en cuenta.`,
    you: 'Tú',
    whereYou: 'donde vives',
    noTimes: 'No hay tiempo libre en común',
    noTimesHint: 'Prueba una llamada más corta o flexibiliza uno de los horarios.',
    bestTimes: 'Mejores horas',
    addCal: '📅 Añadir al calendario (.ics)',
    calTitle: (n) => `Videollamada con ${n}`,
    calNotes: 'Temas para conversar:',
    invite: (n) => `Invitar a ${n}`,
    whatSays: 'Qué dice en español',
    talk: 'Temas para conversar',
    check: 'Revisa, por favor',
    copy: 'Copiar',
    copied: 'Copiado ✓',
  },
}

export function callStrings(role: 'student' | 'parent', parentLanguage: string): CallStrings {
  return role === 'student' ? EN : (PARENT[parentLanguage] ?? EN_PARENT)
}
