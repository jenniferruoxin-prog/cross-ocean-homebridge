// Opens the weekly digest as a printable family letter (stationery layout with photos and captions).
// The browser's print dialog saves it as a PDF ("Save as PDF"), which renders every language correctly
// with the system's fonts, unlike PDF libraries that need a font file per script.

export interface LetterPhoto {
  src: string // data URL, already resized in the browser
  caption: string
}

export interface LetterContent {
  title: string
  letter: string
  photos: LetterPhoto[]
  signature: string
  language: string // parents' language, used for the date format and fonts
  fileName: string
}

const LOCALES: Record<string, string> = {
  'Simplified Chinese': 'zh-CN',
  'Traditional Chinese': 'zh-TW',
  Hindi: 'hi-IN',
  Korean: 'ko-KR',
  Vietnamese: 'vi-VN',
  Japanese: 'ja-JP',
  Spanish: 'es-ES',
  Portuguese: 'pt-BR',
  Arabic: 'ar',
  Bengali: 'bn-BD',
  Telugu: 'te-IN',
  Nepali: 'ne-NP',
  Urdu: 'ur-PK',
  Turkish: 'tr-TR',
  Persian: 'fa-IR',
  Indonesian: 'id-ID',
  Thai: 'th-TH',
  French: 'fr-FR',
  German: 'de-DE',
}
export const RTL_LANGUAGES = new Set(['Arabic', 'Urdu', 'Persian'])

export function localeFor(language: string): string {
  return LOCALES[language] ?? 'en-US'
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('')
}

export function openPrintableLetter(c: LetterContent): void {
  const locale = localeFor(c.language)
  const date = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  const dir = RTL_LANGUAGES.has(c.language) ? 'rtl' : 'ltr'
  const photos = c.photos
    .map(
      (p) => `<figure><img src="${p.src}" alt=""><figcaption>${esc(p.caption)}</figcaption></figure>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${esc(c.fileName)}</title>
<style>
  @page { size: A4; margin: 16mm 16mm 18mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #1c2333;
    background: #fdfbf6;
    font-family: "Noto Serif SC", "Songti SC", "STSong", "SimSun", "Noto Serif", "Noto Serif Devanagari",
      "Nirmala UI", "Malgun Gothic", Georgia, serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 720px; margin: 0 auto; padding: 36px 44px 40px; background: #fdfbf6;
    border: 1px solid #d9d2c3; box-shadow: 0 2px 16px #0001; }
  header { display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 26px; }
  .brand { display: flex; align-items: center; gap: 8px; color: #1d4ed8; font-family: system-ui, sans-serif;
    font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  .date { color: #5b6477; font-size: 14px; }
  h1 { font-size: 26px; font-weight: 600; margin: 0 0 22px; color: #0f2a5c; }
  .letter p { font-size: 16.5px; line-height: 2; margin: 0 0 14px; text-indent: 2em; }
  .letter p:first-child { text-indent: 0; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 26px; }
  .photos figure:only-child { grid-column: 1 / -1; }
  figure { margin: 0; break-inside: avoid; background: #fff; padding: 8px 8px 10px;
    border: 1px solid #e3ddd0; box-shadow: 0 1px 4px #0001; }
  figure img { width: 100%; height: 220px; object-fit: cover; display: block; }
  figure:only-child img { height: 320px; }
  figcaption { font-size: 13.5px; color: #3d4659; margin-top: 8px; text-align: center; line-height: 1.5; }
  .sign { margin-top: 30px; text-align: end; font-size: 17px; }
  .sign .date { display: block; margin-top: 4px; }
  footer { margin-top: 26px; padding-top: 8px; border-top: 1px solid #e3ddd0; color: #8a93a6;
    font-family: system-ui, sans-serif; font-size: 10px; text-align: center; }
  .tip { font-family: system-ui, sans-serif; max-width: 720px; margin: 16px auto; color: #1d4ed8; font-size: 14px; }
  @media print {
    body { background: #fdfbf6; }
    .sheet { border: 0; box-shadow: none; padding: 0; max-width: none; }
    .tip { display: none; }
  }
</style>
</head>
<body>
  <p class="tip">In the print window, choose <b>Save as PDF</b> as the destination, then send the PDF to your parents.</p>
  <div class="sheet">
    <header>
      <span class="brand">
        <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
          <path d="M3 22 Q16 6 29 22" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <path d="M3 22 H29" stroke="currentColor" stroke-width="2.5"/>
          <path d="M9 22 V16 M16 22 V13 M23 22 V16" stroke="currentColor" stroke-width="2"/>
        </svg>
        HomeBridge
      </span>
      <span class="date">${esc(date)}</span>
    </header>
    <h1>${esc(c.title)}</h1>
    <div class="letter">${paragraphs(c.letter)}</div>
    ${photos ? `<div class="photos">${photos}</div>` : ''}
    <div class="sign">${esc(c.signature)}<span class="date">${esc(date)}</span></div>
    <footer>Cross-Ocean HomeBridge</footer>
  </div>
  <script>
    // Print once every photo has loaded, so none are missing from the PDF.
    Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r })))
      .then(() => setTimeout(() => window.print(), 300));
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups for this page to download the letter.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
