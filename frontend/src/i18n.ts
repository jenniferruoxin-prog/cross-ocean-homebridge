// Interface text. Students always see English; parents see their own language when we have it,
// otherwise English. The AI output itself is generated in any language (see prompts/bridge.md).

export interface Strings {
  roleLabel: string
  tabBridge: string
  tell: (other: string) => string
  received: (other: string) => string
  placeholderTell: string
  placeholderReceived: (other: string) => string
  rewrittenIn: string
  explainedReplyIn: string
  ctrlEnter: string
  bridgeIt: string
  helpMeUnderstand: string
  whatTheyWrote: string
  whatTheyMean: string
  readyToSend: (other: string) => string
  replyYouCouldSend: string
  whatThisSays: string
  wantToAdd: string
  add: string
  added: string
  copy: string
  copied: string
  whatIChanged: string
  beforeYouSend: string
  you: string
  childDefault: string
  yourChild: string
  childLanguage: string
  summaryHint: string
  history: string
  historyHint: string
  useHistory: string
  clearHistory: string
  noHistory: string
}

const EN: Strings = {
  roleLabel: 'Student',
  tabBridge: 'Message Bridge',
  tell: (o) => `I want to tell ${o}…`,
  received: (o) => `${o} sent me…`,
  placeholderTell:
    'Write it the way you would say it, in English or any language. e.g. "midterms are killing me, can\'t call this week. also I\'m kinda low on money, could you send some for books?"',
  placeholderReceived: (o) => `Paste the message ${o} sent you, in any language.`,
  rewrittenIn: 'Rewritten in',
  explainedReplyIn: 'Explained in the language you read best · reply drafted in',
  ctrlEnter: 'Ctrl + Enter to send',
  bridgeIt: 'Bridge it',
  helpMeUnderstand: 'Help me understand',
  whatTheyWrote: 'What they wrote (in the language you read best)',
  whatTheyMean: 'What they may really mean',
  readyToSend: (o) => `Ready to send to ${o}`,
  replyYouCouldSend: 'A reply you could send',
  whatThisSays: 'What this says in the language you read best',
  wantToAdd: "Want to add more? Only if it's true",
  add: '+ Add',
  added: 'Added ✓',
  copy: 'Copy',
  copied: 'Copied ✓',
  whatIChanged: 'What I changed and why',
  beforeYouSend: 'Before you send',
  you: 'You',
  childDefault: 'my child',
  yourChild: 'Your child',
  childLanguage: "Your child's language",
  summaryHint: 'Your child saved the family profile on this device. Every message is adapted to it.',
  history: 'History',
  historyHint: 'Saved in this browser only. The last 8 messages are used as context.',
  useHistory: 'Use as context',
  clearHistory: 'Clear',
  noHistory: 'No messages yet. Messages you copy and messages you paste in are saved here.',
}

// English for parents whose language has no translated interface yet. The AI still answers in their language.
const EN_PARENT: Strings = {
  ...EN,
  roleLabel: 'Parent',
  placeholderTell: 'Write it the way you would say it, e.g. "Stop staying up so late and eat properly! Did you hear me?"',
  explainedReplyIn: 'Explained in your language · reply drafted in',
  whatTheyWrote: 'What they wrote (translated)',
  whatThisSays: 'What this says in your language',
}

const PARENT_STRINGS: Record<string, Strings> = {
  'Simplified Chinese': {
    roleLabel: '家长',
    tabBridge: '消息桥',
    tell: (o) => `我想跟${o}说…`,
    received: (o) => `${o}发来…`,
    placeholderTell: '想说什么就怎么写，比如："天冷了，记得多穿点衣服，别总熬夜，听到没有？"',
    placeholderReceived: (o) => `把${o}发来的消息粘贴到这里，任何语言都可以。`,
    rewrittenIn: '改写成',
    explainedReplyIn: '用中文为您解释 · 建议回复用',
    ctrlEnter: 'Ctrl + Enter 发送',
    bridgeIt: '帮我改写',
    helpMeUnderstand: '帮我理解',
    whatTheyWrote: '原话翻译',
    whatTheyMean: '背后可能的意思',
    readyToSend: (o) => `可以发给${o}了`,
    replyYouCouldSend: '建议的回复',
    whatThisSays: '这段话的中文意思',
    wantToAdd: '想再补充几句吗？（请确认属实）',
    add: '+ 添加',
    added: '已添加 ✓',
    copy: '复制',
    copied: '已复制 ✓',
    whatIChanged: '改了哪些地方，为什么',
    beforeYouSend: '发送前请注意',
    you: '您',
    childDefault: '孩子',
    yourChild: '您的孩子',
    childLanguage: '孩子常用的语言',
    summaryHint: '孩子在这台设备上填好了家庭信息，所有改写都会参考这些信息。',
    history: '聊天记录',
    historyHint: '只保存在这台设备的浏览器里，最近 8 条会作为背景参考。',
    useHistory: '作为背景参考',
    clearHistory: '清空',
    noHistory: '还没有记录。您复制发出的消息和粘贴进来的消息会保存在这里。',
  },
  'Traditional Chinese': {
    roleLabel: '家長',
    tabBridge: '訊息橋',
    tell: (o) => `我想跟${o}說…`,
    received: (o) => `${o}傳來…`,
    placeholderTell: '想說什麼就怎麼寫，例如：「天冷了，記得多穿點衣服，別總熬夜，聽到沒有？」',
    placeholderReceived: (o) => `把${o}傳來的訊息貼到這裡，任何語言都可以。`,
    rewrittenIn: '改寫成',
    explainedReplyIn: '用中文為您解釋 · 建議回覆使用',
    ctrlEnter: 'Ctrl + Enter 送出',
    bridgeIt: '幫我改寫',
    helpMeUnderstand: '幫我理解',
    whatTheyWrote: '原話翻譯',
    whatTheyMean: '背後可能的意思',
    readyToSend: (o) => `可以傳給${o}了`,
    replyYouCouldSend: '建議的回覆',
    whatThisSays: '這段話的中文意思',
    wantToAdd: '想再補充幾句嗎？（請確認屬實）',
    add: '+ 加入',
    added: '已加入 ✓',
    copy: '複製',
    copied: '已複製 ✓',
    whatIChanged: '改了哪些地方，為什麼',
    beforeYouSend: '傳送前請注意',
    you: '您',
    childDefault: '孩子',
    yourChild: '您的孩子',
    childLanguage: '孩子常用的語言',
    summaryHint: '孩子在這台裝置上填好了家庭資訊，所有改寫都會參考這些資訊。',
    history: '聊天紀錄',
    historyHint: '只保存在這台裝置的瀏覽器裡，最近 8 則會作為背景參考。',
    useHistory: '作為背景參考',
    clearHistory: '清除',
    noHistory: '還沒有紀錄。您複製傳出的訊息和貼上的訊息會保存在這裡。',
  },
  Hindi: {
    roleLabel: 'माता/पिता',
    tabBridge: 'संदेश सेतु',
    tell: (o) => `मैं ${o} से कुछ कहना चाहता/चाहती हूँ…`,
    received: (o) => `${o} ने भेजा…`,
    placeholderTell: 'जैसे बोलते हैं वैसे ही लिखिए, जैसे: "इतनी देर तक मत जागा करो, खाना टाइम पर खाओ, समझे?"',
    placeholderReceived: (o) => `${o} का संदेश यहाँ पेस्ट करें, किसी भी भाषा में।`,
    rewrittenIn: 'इस भाषा में दोबारा लिखा जाएगा:',
    explainedReplyIn: 'हिंदी में समझाया जाएगा · जवाब की भाषा:',
    ctrlEnter: 'भेजने के लिए Ctrl + Enter',
    bridgeIt: 'बेहतर तरीके से लिखें',
    helpMeUnderstand: 'समझने में मदद करें',
    whatTheyWrote: 'संदेश का अनुवाद',
    whatTheyMean: 'इसका असली मतलब क्या हो सकता है',
    readyToSend: (o) => `${o} को भेजने के लिए तैयार`,
    replyYouCouldSend: 'सुझाया गया जवाब',
    whatThisSays: 'हिंदी में इसका मतलब',
    wantToAdd: 'कुछ और जोड़ना चाहेंगे? (सिर्फ़ अगर सच हो)',
    add: '+ जोड़ें',
    added: 'जोड़ा गया ✓',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया ✓',
    whatIChanged: 'क्या बदला और क्यों',
    beforeYouSend: 'भेजने से पहले ध्यान दें',
    you: 'आप',
    childDefault: 'बच्चे',
    yourChild: 'आपका बच्चा',
    childLanguage: 'बच्चे की भाषा',
    summaryHint: 'आपके बच्चे ने इस डिवाइस पर परिवार की जानकारी भरी है। हर संदेश इसी के हिसाब से लिखा जाता है।',
    history: 'बातचीत का इतिहास',
    historyHint: 'सिर्फ़ इसी ब्राउज़र में सेव होता है। पिछले 8 संदेश संदर्भ के लिए इस्तेमाल होते हैं।',
    useHistory: 'संदर्भ के लिए इस्तेमाल करें',
    clearHistory: 'मिटाएँ',
    noHistory: 'अभी कोई संदेश नहीं है। आप जो संदेश कॉपी करते हैं और जो पेस्ट करते हैं, वे यहाँ सेव होते हैं।',
  },
  Korean: {
    roleLabel: '부모',
    tabBridge: '메시지 다리',
    tell: (o) => `${o}에게 하고 싶은 말…`,
    received: (o) => `${o}에게서 온 메시지…`,
    placeholderTell: '말하듯이 편하게 쓰세요. 예: "밤늦게까지 안 자고 그러지 말고 밥 꼭 챙겨 먹어, 알았지?"',
    placeholderReceived: (o) => `${o}에게서 받은 메시지를 여기에 붙여 넣으세요. 어떤 언어든 괜찮아요.`,
    rewrittenIn: '다음 언어로 다시 써 드려요:',
    explainedReplyIn: '한국어로 설명 · 답장 언어:',
    ctrlEnter: 'Ctrl + Enter로 보내기',
    bridgeIt: '다듬어 주세요',
    helpMeUnderstand: '이해하도록 도와주세요',
    whatTheyWrote: '메시지 번역',
    whatTheyMean: '이런 마음일 수 있어요',
    readyToSend: (o) => `${o}에게 보낼 준비 완료`,
    replyYouCouldSend: '이렇게 답해 보세요',
    whatThisSays: '한국어 뜻',
    wantToAdd: '더 덧붙일까요? (사실인 경우에만)',
    add: '+ 추가',
    added: '추가됨 ✓',
    copy: '복사',
    copied: '복사됨 ✓',
    whatIChanged: '무엇을, 왜 바꿨는지',
    beforeYouSend: '보내기 전에 확인하세요',
    you: '나',
    childDefault: '아이',
    yourChild: '자녀',
    childLanguage: '자녀의 언어',
    summaryHint: '자녀가 이 기기에 가족 정보를 입력해 두었어요. 모든 메시지는 이 정보를 바탕으로 다듬어져요.',
    history: '대화 기록',
    historyHint: '이 브라우저에만 저장돼요. 최근 메시지 8개를 참고해요.',
    useHistory: '참고 자료로 사용',
    clearHistory: '지우기',
    noHistory: '아직 기록이 없어요. 복사해서 보낸 메시지와 붙여 넣은 메시지가 여기에 저장돼요.',
  },
  Vietnamese: {
    roleLabel: 'Bố/Mẹ',
    tabBridge: 'Cầu nối tin nhắn',
    tell: (o) => `Tôi muốn nói với ${o}…`,
    received: (o) => `${o} gửi cho tôi…`,
    placeholderTell: 'Cứ viết như khi nói chuyện, ví dụ: "Đừng thức khuya nữa, nhớ ăn uống đầy đủ, nghe chưa?"',
    placeholderReceived: (o) => `Dán tin nhắn ${o} gửi vào đây, bằng bất kỳ ngôn ngữ nào.`,
    rewrittenIn: 'Viết lại bằng:',
    explainedReplyIn: 'Giải thích bằng tiếng Việt · Trả lời bằng:',
    ctrlEnter: 'Ctrl + Enter để gửi',
    bridgeIt: 'Viết lại giúp tôi',
    helpMeUnderstand: 'Giúp tôi hiểu',
    whatTheyWrote: 'Bản dịch tin nhắn',
    whatTheyMean: 'Có thể ý thật sự là',
    readyToSend: (o) => `Sẵn sàng gửi cho ${o}`,
    replyYouCouldSend: 'Gợi ý trả lời',
    whatThisSays: 'Nghĩa bằng tiếng Việt',
    wantToAdd: 'Muốn thêm vài câu? (chỉ khi đúng sự thật)',
    add: '+ Thêm',
    added: 'Đã thêm ✓',
    copy: 'Sao chép',
    copied: 'Đã chép ✓',
    whatIChanged: 'Đã sửa gì và vì sao',
    beforeYouSend: 'Trước khi gửi',
    you: 'Bạn',
    childDefault: 'con',
    yourChild: 'Con của bạn',
    childLanguage: 'Ngôn ngữ của con',
    summaryHint: 'Con bạn đã nhập thông tin gia đình trên thiết bị này. Mọi tin nhắn đều được viết lại dựa trên đó.',
    history: 'Lịch sử trò chuyện',
    historyHint: 'Chỉ lưu trong trình duyệt này. 8 tin nhắn gần nhất được dùng làm ngữ cảnh.',
    useHistory: 'Dùng làm ngữ cảnh',
    clearHistory: 'Xóa',
    noHistory: 'Chưa có tin nhắn. Tin nhắn bạn sao chép và tin nhắn bạn dán vào sẽ được lưu ở đây.',
  },
  Spanish: {
    roleLabel: 'Madre/Padre',
    tabBridge: 'Puente de mensajes',
    tell: (o) => `Quiero decirle a ${o}…`,
    received: (o) => `${o} me envió…`,
    placeholderTell: 'Escríbelo como lo dirías, por ejemplo: "¡No te desveles tanto y come bien! ¿Me oíste?"',
    placeholderReceived: (o) => `Pega aquí el mensaje que te envió ${o}, en cualquier idioma.`,
    rewrittenIn: 'Reescrito en:',
    explainedReplyIn: 'Explicado en español · respuesta en:',
    ctrlEnter: 'Ctrl + Enter para enviar',
    bridgeIt: 'Reescríbelo',
    helpMeUnderstand: 'Ayúdame a entender',
    whatTheyWrote: 'Traducción del mensaje',
    whatTheyMean: 'Lo que quizá quiere decir',
    readyToSend: (o) => `Listo para enviar a ${o}`,
    replyYouCouldSend: 'Una respuesta que podrías enviar',
    whatThisSays: 'Qué dice en español',
    wantToAdd: '¿Quieres añadir algo? (solo si es verdad)',
    add: '+ Añadir',
    added: 'Añadido ✓',
    copy: 'Copiar',
    copied: 'Copiado ✓',
    whatIChanged: 'Qué cambié y por qué',
    beforeYouSend: 'Antes de enviar',
    you: 'Tú',
    childDefault: 'mi hijo/a',
    yourChild: 'Tu hijo/a',
    childLanguage: 'Idioma de tu hijo/a',
    summaryHint: 'Tu hijo/a guardó la información familiar en este dispositivo. Cada mensaje se adapta a ella.',
    history: 'Historial de mensajes',
    historyHint: 'Se guarda solo en este navegador. Los últimos 8 mensajes se usan como contexto.',
    useHistory: 'Usar como contexto',
    clearHistory: 'Borrar',
    noHistory: 'Aún no hay mensajes. Aquí se guardan los mensajes que copias y los que pegas.',
  },
}

export type Role = 'student' | 'parent'

export function stringsFor(role: Role, parentLanguage: string): Strings {
  return role === 'student' ? EN : (PARENT_STRINGS[parentLanguage] ?? EN_PARENT)
}
