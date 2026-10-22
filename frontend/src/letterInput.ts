// Turns a letter file into what the Letter Explorer reads best: images of readable size, plus text when
// a PDF has a text layer. A long image is cut into overlapping pieces, because the model shrinks very
// tall images until the writing is too small to read. PDFs are rendered to images in the browser
// (the model misread image-only PDFs in testing but read the same page as an image correctly).

const WIDTH = 1080
const PIECE_H = 1400
const OVERLAP = 80
export const MAX_PIECES = 10

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened. Try a JPG or PNG.'))
    img.src = src
  })
}

function cut(source: CanvasImageSource, w: number, h: number): string[] {
  const scale = Math.min(1, WIDTH / w)
  const outW = Math.round(w * scale)
  const totalH = Math.round(h * scale)
  const pieces: string[] = []
  for (let top = 0; top < totalH; top += PIECE_H - OVERLAP) {
    const pieceH = Math.min(PIECE_H, totalH - top)
    if (pieceH < OVERLAP * 2 && pieces.length) break // only overlap left
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = pieceH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outW, pieceH)
    ctx.drawImage(source, 0, top / scale, w, pieceH / scale, 0, 0, outW, pieceH)
    pieces.push(canvas.toDataURL('image/jpeg', 0.88))
  }
  return pieces
}

export async function imageToPieces(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return cut(img, img.naturalWidth, img.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function pdfToPieces(file: File): Promise<{ pieces: string[]; text: string }> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pieces: string[] = []
  const texts: string[] = []
  let canRender = true
  for (let n = 1; n <= doc.numPages && n <= MAX_PIECES; n++) {
    const page = await doc.getPage(n)
    // 1. Text layer (PDFs saved from HomeBridge have one): exact and cheap.
    const content = await page.getTextContent()
    texts.push(
      content.items
        .map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : ''))
        .join('')
        .trim(),
    )
    // 2. Page image, so the photos (and scanned letters) can be seen too. Rendering can stall in some
    //    browsers, so it gets a time limit; after one failure we continue with text only.
    if (!canRender || pieces.length >= MAX_PIECES) continue
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: WIDTH / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const task = page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport })
    const rendered = await Promise.race([
      task.promise.then(() => true),
      new Promise<boolean>((r) => setTimeout(() => r(false), RENDER_TIMEOUT_MS)),
    ]).catch(() => false)
    if (rendered) {
      pieces.push(...cut(canvas, canvas.width, canvas.height))
    } else {
      task.cancel()
      canRender = false
    }
  }
  const text = texts.filter(Boolean).join('\n\n')
  if (!text && !pieces.length) throw new Error('PDF_UNREADABLE')
  return { pieces, text }
}

const RENDER_TIMEOUT_MS = 12_000
