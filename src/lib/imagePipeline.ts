/**
 * 아무 이미지 파일이나 받아서 WebP 로 압축 + 리사이즈.
 * HEIC/HEIF 는 브라우저에서 디코딩 불가 → 명시적 에러 반환.
 */

export interface PipelineOptions {
  maxEdge?: number
  quality?: number
  maxBytes?: number
}

const DEFAULTS: Required<PipelineOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  maxBytes: 1_200_000, // 1.2MB — 버킷 상한 2MB 대비 여유
}

export class ImagePipelineError extends Error {
  code: 'HEIC_UNSUPPORTED' | 'DECODE_FAILED' | 'TOO_LARGE' | 'UNKNOWN'
  constructor(message: string, code: ImagePipelineError['code']) {
    super(message)
    this.code = code
  }
}

function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export async function compressToWebp(
  file: File,
  opts: PipelineOptions = {}
): Promise<Blob> {
  const o = { ...DEFAULTS, ...opts }

  if (isHeic(file)) {
    throw new ImagePipelineError(
      '아이폰 HEIC 포맷은 브라우저가 못 읽어요. 설정 > 카메라 > 포맷에서 "가장 호환성 높게"로 바꾸거나 스크린샷을 쓰세요.',
      'HEIC_UNSUPPORTED'
    )
  }

  // 매우 큰 파일(50MB+)은 메모리 위험 → 그래도 시도는 해봄
  let bitmap: ImageBitmap
  try {
    bitmap = await loadBitmap(file)
  } catch (e) {
    throw new ImagePipelineError(
      `이미지 디코딩 실패 (${file.type || '알 수 없는 포맷'}): ${e instanceof Error ? e.message : String(e)}`,
      'DECODE_FAILED'
    )
  }

  const { canvas } = drawScaled(bitmap, o.maxEdge)
  bitmap.close?.()

  let quality = o.quality
  let blob = await toWebpBlob(canvas, quality)
  // 크기 초과 시 품질 단계 하락
  while (blob.size > o.maxBytes && quality > 0.4) {
    quality -= 0.1
    blob = await toWebpBlob(canvas, quality)
  }
  // 품질 최저까지 내렸는데도 너무 크면 해상도 추가 감소
  if (blob.size > o.maxBytes) {
    const halfEdge = Math.max(800, Math.floor(o.maxEdge * 0.7))
    const secondBitmap = await loadBitmap(file)
    const { canvas: smaller } = drawScaled(secondBitmap, halfEdge)
    secondBitmap.close?.()
    blob = await toWebpBlob(smaller, 0.75)
  }

  if (blob.size > 2_000_000) {
    throw new ImagePipelineError(
      '압축 후에도 2MB를 넘습니다. 더 작은 사진을 사용해주세요.',
      'TOO_LARGE'
    )
  }

  return blob
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to HTMLImageElement
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image load failed'))
      el.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    return await createImageBitmap(canvas)
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
