// Draws the weekly letter as one tall image (1080 px wide, phone-friendly) and downloads it as a JPG,
// so parents can read it right inside WeChat or WhatsApp. Uses the browser's canvas and system fonts,
// so Chinese, Hindi, Korean, Arabic, etc. all render without extra libraries.

import { localeFor, RTL_LANGUAGES, type LetterContent } from './letterPrint'

const W = 1080
const PAD = 84
const TEXT_W = W - PAD * 2
const SERIF = '"Noto Serif SC", "Songti SC", "STSong", "SimSun", "Noto Serif", "Nirmala UI", "Malgun Gothic", Georgia, serif'
const SANS = 'system-ui, "Segoe UI", sans-serif'
const INK = '#1c2333'
const BLUE = '#1d4ed8'
const PAPER = '#fdfbf6'
const CJK = /[぀-ヿ㐀-鿿가-힯]/
// Punctuation that must not start a line in Chinese/Japanese typesetting.
const NO_LINE_START = /^[，。！？；：、）》」』”’…,.!?;:)]/

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Splits text into pieces that may not be broken. Chinese/Japanese/Korean lines may break between any
// two characters (so lines fill evenly), keeping Latin words and numbers whole; other scripts break by word.
function segments(text: string, locale: string): string[] {
  if (CJK.test(text)) return text.match(/[A-Za-z0-9][A-Za-z0-9.,'%:/-]*|\s+|./gsu) ?? []
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  if (Seg) return Array.from(new Seg(locale, { granularity: 'word' }).segment(text), (s) => s.segment)
  return text.split(/(\s+)/)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, locale: string, indent = 0): string[] {
  const lines: string[] = []
  let line = ''
  let limit = width - indent
  for (const seg of segments(text, locale)) {
    const candidate = line + seg
    if (ctx.measureText(candidate).width <= limit || line === '' || NO_LINE_START.test(seg)) {
      // A segment wider than the whole line (very long word) is broken by character.
      if (line === '' && ctx.measureText(seg).width > limit) {
        for (const ch of seg) {
          if (ctx.measureText(line + ch).width > limit && line) {
            lines.push(line)
            line = ''
            limit = width
          }
          line += ch
        }
      } else {
        line = candidate
      }
    } else {
      lines.push(line.trimEnd())
      line = seg.trimStart()
      limit = width
    }
  }
  if (line.trim()) lines.push(line.trimEnd())
  return lines
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s / 32, s / 32)
  ctx.strokeStyle = BLUE
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(3, 22)
  ctx.quadraticCurveTo(16, 6, 29, 22)
  ctx.moveTo(3, 22)
  ctx.lineTo(29, 22)
  ctx.moveTo(9, 22)
  ctx.lineTo(9, 16)
  ctx.moveTo(16, 22)
  ctx.lineTo(16, 13)
  ctx.moveTo(23, 22)
  ctx.lineTo(23, 16)
  ctx.stroke()
  ctx.restore()
}

export async function saveLetterImage(c: LetterContent): Promise<void> {
  await document.fonts?.ready
  const locale = localeFor(c.language)
  const rtl = RTL_LANGUAGES.has(c.language)
  const date = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  const images = await Promise.all(c.photos.map((p) => loadImage(p.src)))

  // Measuring pass (a scratch canvas), then the real drawing pass with the exact height.
  const scratch = document.createElement('canvas').getContext('2d')!
  const bodyFont = `38px ${SERIF}`
  const bodyLH = 72
  const titleFont = `600 54px ${SERIF}`
  const capFont = `30px ${SERIF}`
  const isCjk = CJK.test(c.letter)

  scratch.font = titleFont
  const titleLines = wrap(scratch, c.title, TEXT_W, locale)
  scratch.font = bodyFont
  const paras = c.letter
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => wrap(scratch, p, TEXT_W, locale, isCjk && i > 0 ? 76 : 0))
  scratch.font = capFont
  const captions = c.photos.map((p) => wrap(scratch, p.caption, TEXT_W - 40, locale))
  const photoH = images.map((img) => Math.min(Math.round((img.height / img.width) * (TEXT_W - 32)), 1100))

  let height = 64 + 70 + 40 // top padding, header, gap
  height += titleLines.length * 72 + 30
  height += paras.reduce((sum, lines) => sum + lines.length * bodyLH + 26, 0)
  height += images.reduce((sum, _, i) => sum + 40 + 16 + photoH[i] + 20 + captions[i].length * 44 + 16, 0)
  height += 60 + 50 + 50 + 90 + 64 // signature, date, footer, bottom padding

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, height)
  ctx.textBaseline = 'alphabetic'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  const startX = rtl ? W - PAD : PAD
  ctx.textAlign = rtl ? 'right' : 'left'

  // Header: logo, brand, date, blue rule.
  let y = 64
  drawLogo(ctx, PAD, y + 4, 40)
  ctx.save()
  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.fillStyle = BLUE
  ctx.font = `600 26px ${SANS}`
  ctx.fillText('HOMEBRIDGE', PAD + 52, y + 34)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#5b6477'
  ctx.font = `28px ${SERIF}`
  ctx.fillText(date, W - PAD, y + 34)
  ctx.restore()
  y += 70
  ctx.fillStyle = BLUE
  ctx.fillRect(PAD, y, TEXT_W, 4)
  y += 40

  // Title and letter.
  ctx.fillStyle = '#0f2a5c'
  ctx.font = titleFont
  for (const line of titleLines) {
    y += 64
    ctx.fillText(line, startX, y)
    y += 8
  }
  y += 30
  ctx.fillStyle = INK
  ctx.font = bodyFont
  paras.forEach((lines, pi) => {
    lines.forEach((line, li) => {
      y += bodyLH
      const indent = isCjk && pi > 0 && li === 0 ? 76 : 0
      ctx.fillText(line, rtl ? startX - indent : startX + indent, y - 20)
    })
    y += 26
  })

  // Photos as white-framed prints with captions.
  images.forEach((img, i) => {
    y += 40
    const frameH = 16 + photoH[i] + 20 + captions[i].length * 44 + 16
    ctx.save()
    ctx.shadowColor = '#0000001f'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 3
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(PAD, y, TEXT_W, frameH)
    ctx.restore()
    ctx.strokeStyle = '#e3ddd0'
    ctx.strokeRect(PAD + 0.5, y + 0.5, TEXT_W - 1, frameH - 1)
    // Cover-crop very tall photos to the 1100 px cap.
    const targetW = TEXT_W - 32
    const scale = targetW / img.width
    const srcH = Math.min(img.height, photoH[i] / scale)
    ctx.drawImage(img, 0, (img.height - srcH) / 2, img.width, srcH, PAD + 16, y + 16, targetW, photoH[i])
    let cy = y + 16 + photoH[i] + 20
    ctx.save()
    ctx.fillStyle = '#3d4659'
    ctx.font = capFont
    ctx.textAlign = 'center'
    for (const line of captions[i]) {
      cy += 36
      ctx.fillText(line, W / 2, cy)
      cy += 8
    }
    ctx.restore()
    y += frameH
  })

  // Signature and footer.
  ctx.save()
  ctx.textAlign = rtl ? 'left' : 'right'
  const endX = rtl ? PAD : W - PAD
  y += 60
  ctx.fillStyle = INK
  ctx.font = `40px ${SERIF}`
  ctx.fillText(c.signature, endX, y)
  y += 50
  ctx.fillStyle = '#5b6477'
  ctx.font = `28px ${SERIF}`
  ctx.fillText(date, endX, y)
  ctx.restore()
  y += 50
  ctx.fillStyle = '#e3ddd0'
  ctx.fillRect(PAD, y, TEXT_W, 2)
  ctx.save()
  ctx.direction = 'ltr'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#8a93a6'
  ctx.font = `22px ${SANS}`
  ctx.fillText('Cross-Ocean HomeBridge', W / 2, y + 44)
  ctx.restore()

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
  if (!blob) throw new Error('The image could not be created.')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.fileName}.jpg`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
