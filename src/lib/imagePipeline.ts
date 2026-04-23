/**
 * 브라우저에서 이미지 파일을 받아 리사이즈 + WebP 압축 후 Blob 반환.
 * 최대 긴 변: 1600px, 품질: 0.82.
 */
export interface PipelineOptions {
  maxEdge?: number
  quality?: number
  maxBytes?: number
}

const DEFAULTS: Required<PipelineOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  maxBytes: 700 * 1024, // 700KB
}

export async function compressToWebp(
  file: File,
  opts: PipelineOptions = {}
): Promise<Blob> {
  const o = { ...DEFAULTS, ...opts }
  const bitmap = await loadBitmap(file)
  const { canvas } = drawScaled(bitmap, o.maxEdge)
  bitmap.close?.()

  let quality = o.quality
  let blob = await toWebpBlob(canvas, quality)
  // 크기 초과 시 품질을 단계적으로 낮춤
  while (blob.size > o.maxBytes && quality > 0.5) {
    quality -= 0.08
    blob = await toWebpBlob(canvas, quality)
  }
  return blob
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  // Fallback: HTMLImageElement → canvas
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    return (await createImageBitmap(canvas)) as ImageBitmap
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawScaled(bitmap: ImageBitmap, maxEdge: number) {
  const { width, height } = bitmap
  const longest = Math.max(width, height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context 없음')
  ctx.drawImage(bitmap, 0, 0, w, h)
  return { canvas, width: w, height: h }
}

function toWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('toBlob 실패'))),
      'image/webp',
      quality
    )
  })
}
