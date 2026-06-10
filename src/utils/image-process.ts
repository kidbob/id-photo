import type { ExportMode, MattingQuality } from '../types'
import { removeBgFromFile } from './remove-background'

export interface CompressResult {
  blob: Blob
  quality: number
  sizeKb: number
}

interface Rgb {
  r: number
  g: number
  b: number
}

function loadImageFromUrl(url: string, revoke = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (revoke) URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      if (revoke) URL.revokeObjectURL(url)
      reject(new Error('无法读取图片'))
    }
    img.src = url
  })
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return loadImageFromUrl(URL.createObjectURL(file), true)
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return loadImageFromUrl(URL.createObjectURL(blob), true)
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('JPEG 导出失败'))),
      'image/jpeg',
      quality,
    )
  })
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG 导出失败'))),
      'image/png',
    )
  })
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(img, 0, 0)
  return canvas
}

/** 居中裁剪缩放，一次到位到目标像素 */
export function resizeCover(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const offsetX = (targetWidth - drawWidth) / 2
  const offsetY = (targetHeight - drawHeight) / 2

  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight)
  return canvas
}

function parseHex(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function colorDistSq(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

/** 已铺底色图像中，接近背景色的像素 */
function isBackgroundLike(r: number, g: number, b: number, bg: Rgb): boolean {
  if (colorDistSq({ r, g, b }, bg) < 42 * 42) return true
  const lum = luminance(r, g, b)
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return lum > 165 && sat < 70
}

function isSkinLike(r: number, g: number, b: number): boolean {
  const lum = luminance(r, g, b)
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return lum >= 88 && lum <= 245 && sat >= 8 && sat <= 95 && r >= g - 18 && r >= b - 12
}

/** 发丝：深色、低饱和，且不像皮肤 */
function isHairLike(r: number, g: number, b: number): boolean {
  if (isSkinLike(r, g, b)) return false
  const lum = luminance(r, g, b)
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  return lum < 92 && sat < 95
}

const NEIGHBORS_4 = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

const NEIGHBORS_8 = [
  ...NEIGHBORS_4,
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

function readRgb(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): Rgb | null {
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  const i = (y * width + x) * 4
  return { r: src[i], g: src[i + 1], b: src[i + 2] }
}

interface SubjectBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function measureSubjectBounds(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  bg: Rgb,
): SubjectBounds | null {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (isBackgroundLike(src[i], src[i + 1], src[i + 2], bg)) continue
      found = true
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (!found) return null
  return { minX, minY, maxX, maxY }
}

/** 背景侧像素且紧贴人像外轮廓 */
function isContourFringe(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  bg: Rgb,
): boolean {
  const self = readRgb(src, width, height, x, y)
  if (!self || !isBackgroundLike(self.r, self.g, self.b, bg)) return false

  for (const [dx, dy] of NEIGHBORS_4) {
    const n = readRgb(src, width, height, x + dx, y + dy)
    if (n && !isBackgroundLike(n.r, n.g, n.b, bg)) return true
  }

  return false
}

function hasSkinNearby(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  radius = 2,
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const n = readRgb(src, width, height, x + dx, y + dy)
      if (n && isSkinLike(n.r, n.g, n.b)) return true
    }
  }
  return false
}

function sampleHairAround(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): { count: number; sumR: number; sumG: number; sumB: number; gapLike: boolean } {
  let count = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0
  let hairLeft = false
  let hairRight = false
  let hairUp = false
  let hairDown = false

  for (const [dx, dy] of NEIGHBORS_8) {
    const n = readRgb(src, width, height, x + dx, y + dy)
    if (!n || !isHairLike(n.r, n.g, n.b)) continue
    count++
    sumR += n.r
    sumG += n.g
    sumB += n.b
    if (dx < 0) hairLeft = true
    if (dx > 0) hairRight = true
    if (dy < 0) hairUp = true
    if (dy > 0) hairDown = true
  }

  return {
    count,
    sumR,
    sumG,
    sumB,
    gapLike: (hairLeft && hairRight) || (hairUp && hairDown),
  }
}

/**
 * 仅修补抠图外轮廓上的毛刺/小空隙，不处理人脸内部。
 */
export function refineDarkHairEdges(
  source: HTMLCanvasElement,
  bgColor: string,
): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) throw new Error('无法读取图像')

  const { width, height } = source
  const bg = parseHex(bgColor)
  const imageData = ctx.getImageData(0, 0, width, height)
  const src = imageData.data
  const out = new Uint8ClampedArray(src)
  const bounds = measureSubjectBounds(src, width, height, bg)
  const hairZoneBottom = bounds
    ? bounds.minY + (bounds.maxY - bounds.minY) * 0.58
    : height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = src[i]
      const g = src[i + 1]
      const b = src[i + 2]

      if (!isBackgroundLike(r, g, b, bg)) continue
      if (hasSkinNearby(src, width, height, x, y)) continue

      const onContour = isContourFringe(src, width, height, x, y, bg)
      const hair = sampleHairAround(src, width, height, x, y)
      const inHairZone = y <= hairZoneBottom

      const isHairGap = inHairZone && hair.gapLike && hair.count >= 2
      const isOuterHalo = onContour && hair.count >= 1

      if (!isHairGap && !isOuterHalo) continue
      if (hair.count < 1) continue

      const avgR = hair.sumR / hair.count
      const avgG = hair.sumG / hair.count
      const avgB = hair.sumB / hair.count
      const blend = isHairGap ? 0.78 : 0.88

      out[i] = clampByte(Math.min(avgR * blend, 58))
      out[i + 1] = clampByte(Math.min(avgG * blend, 58))
      out[i + 2] = clampByte(Math.min(avgB * blend, 58))
      out[i + 3] = 255
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const outCtx = canvas.getContext('2d')
  if (!outCtx) throw new Error('无法创建画布')
  outCtx.putImageData(new ImageData(out, width, height), 0, 0)
  return canvas
}

function despillForeground(r: number, g: number, b: number, a: number, bg: Rgb): Rgb {
  let nr = r
  let ng = g
  let nb = b
  const fringe = 1 - a

  if (fringe <= 0) return { r: nr, g: ng, b: nb }

  if (bg.r >= bg.g && bg.r >= bg.b) {
    const spill = Math.max(0, nr - Math.max(ng, nb))
    nr -= spill * fringe * 0.85
  }
  if (bg.g >= bg.r && bg.g >= bg.b) {
    const spill = Math.max(0, ng - Math.max(nr, nb))
    ng -= spill * fringe * 0.85
  }
  if (bg.b >= bg.r && bg.b >= bg.g) {
    const spill = Math.max(0, nb - Math.max(nr, ng))
    nb -= spill * fringe * 0.85
  }

  return { r: nr, g: ng, b: nb }
}

function refineAlpha(r: number, g: number, b: number, a: number): number {
  if (a >= 0.92) return 1
  if (a <= 0.06) return 0

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  const saturation = Math.max(r, g, b) - Math.min(r, g, b)

  // 白衣、皮肤等高光区域：提高不透明度，避免底色渗入
  if (luminance > 175 && saturation < 90 && a > 0.2) {
    return Math.min(1, a + 0.45)
  }

  // 头发等深色区域：略提高不透明度，减少色溢
  if (luminance < 85 && a > 0.15 && a < 0.9) {
    return Math.min(1, a + 0.12)
  }

  return a
}

/**
 * 先在高分辨率下铺底色，并做边缘去色溢。
 * 避免半透明蒙版直接把红/蓝底叠到头发和白衣上。
 */
export function compositeOnBackground(
  source: HTMLCanvasElement,
  bgColor: string,
): HTMLCanvasElement {
  const srcCtx = source.getContext('2d')
  if (!srcCtx) throw new Error('无法读取图像')

  const { width, height } = source
  const src = srcCtx.getImageData(0, 0, width, height)
  const out = srcCtx.createImageData(width, height)
  const bg = parseHex(bgColor)

  for (let i = 0; i < src.data.length; i += 4) {
    let r = src.data[i]
    let g = src.data[i + 1]
    let b = src.data[i + 2]
    let a = src.data[i + 3] / 255

    a = refineAlpha(r, g, b, a)
    const despilled = despillForeground(r, g, b, a, bg)
    r = despilled.r
    g = despilled.g
    b = despilled.b

    out.data[i] = clampByte(r * a + bg.r * (1 - a))
    out.data[i + 1] = clampByte(g * a + bg.g * (1 - a))
    out.data[i + 2] = clampByte(b * a + bg.b * (1 - a))
    out.data[i + 3] = 255
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.putImageData(out, 0, 0)
  return canvas
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true
  }
  return false
}

/** 在不超过 maxKb 的前提下取最高 JPEG quality */
export async function compressToMaxKb(
  canvas: HTMLCanvasElement,
  maxKb: number,
): Promise<CompressResult> {
  const maxBytes = maxKb * 1024
  let low = 0.25
  let high = 0.95
  let best: CompressResult | null = null

  for (let i = 0; i < 14; i++) {
    const quality = (low + high) / 2
    const blob = await canvasToJpegBlob(canvas, quality)
    if (blob.size <= maxBytes) {
      best = { blob, quality, sizeKb: blob.size / 1024 }
      low = quality
    } else {
      high = quality
    }
  }

  if (best) return best

  const fallback = await canvasToJpegBlob(canvas, 0.25)
  return {
    blob: fallback,
    quality: 0.25,
    sizeKb: fallback.size / 1024,
  }
}

function applyCompositeAndRefine(
  source: HTMLCanvasElement,
  bgColor: string,
  refineHair: boolean,
): HTMLCanvasElement {
  let canvas = compositeOnBackground(source, bgColor)
  if (refineHair) {
    canvas = refineDarkHairEdges(canvas, bgColor)
  }
  return canvas
}

export async function processIdPhoto(options: {
  file: File
  width: number
  height: number
  bgColor: string
  maxKb: number
  mode: ExportMode
  removeBackground?: boolean
  mattingQuality?: MattingQuality
  refineHairEdges?: boolean
  forceBgComposite?: boolean
  onProgress?: (message: string) => void
}): Promise<{ canvas: HTMLCanvasElement; blob: Blob; quality: number | null; sizeKb: number }> {
  const refineHair = options.refineHairEdges !== false
  let canvas: HTMLCanvasElement

  if (options.removeBackground) {
    const cutout = await removeBgFromFile(
      options.file,
      options.mattingQuality ?? 'quality',
      options.onProgress,
    )
    options.onProgress?.('优化边缘并铺底色…')
    const cutoutImg = await loadImageFromBlob(cutout)
    const fullCanvas = imageToCanvas(cutoutImg)
    canvas = applyCompositeAndRefine(fullCanvas, options.bgColor, refineHair)
    canvas = resizeCover(
      canvas,
      canvas.width,
      canvas.height,
      options.width,
      options.height,
    )
  } else {
    const img = await loadImageFromFile(options.file)
    const fullCanvas = imageToCanvas(img)
    if (options.forceBgComposite || hasTransparency(fullCanvas)) {
      canvas = applyCompositeAndRefine(fullCanvas, options.bgColor, refineHair)
      canvas = resizeCover(
        canvas,
        canvas.width,
        canvas.height,
        options.width,
        options.height,
      )
    } else {
      canvas = resizeCover(img, img.naturalWidth, img.naturalHeight, options.width, options.height)
    }
  }

  if (options.mode === 'hd') {
    const blob = await canvasToPngBlob(canvas)
    return {
      canvas,
      blob,
      quality: null,
      sizeKb: blob.size / 1024,
    }
  }

  const compressed = await compressToMaxKb(canvas, options.maxKb)
  return {
    canvas,
    blob: compressed.blob,
    quality: compressed.quality,
    sizeKb: compressed.sizeKb,
  }
}

export function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`
  return `${kb.toFixed(1)} KB`
}
