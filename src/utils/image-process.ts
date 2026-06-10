import type { ExportMode } from '../types'
import { removeBgFromFile } from './remove-background'

export interface CompressResult {
  blob: Blob
  quality: number
  sizeKb: number
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

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const offsetX = (targetWidth - drawWidth) / 2
  const offsetY = (targetHeight - drawHeight) / 2

  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight)
  return canvas
}

/** 透明底 PNG 铺底色（快捷指令抠图输出常用） */
export function compositeOnBackground(
  source: HTMLCanvasElement,
  bgColor: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0)
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

export async function processIdPhoto(options: {
  file: File
  width: number
  height: number
  bgColor: string
  maxKb: number
  mode: ExportMode
  removeBackground?: boolean
  forceBgComposite?: boolean
  onProgress?: (message: string) => void
}): Promise<{ canvas: HTMLCanvasElement; blob: Blob; quality: number | null; sizeKb: number }> {
  let img: HTMLImageElement

  if (options.removeBackground) {
    const cutout = await removeBgFromFile(options.file, options.onProgress)
    options.onProgress?.('抠图完成，正在合成…')
    img = await loadImageFromBlob(cutout)
  } else {
    img = await loadImageFromFile(options.file)
  }

  let canvas = resizeCover(img, img.naturalWidth, img.naturalHeight, options.width, options.height)

  if (options.removeBackground || options.forceBgComposite || hasTransparency(canvas)) {
    canvas = compositeOnBackground(canvas, options.bgColor)
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
