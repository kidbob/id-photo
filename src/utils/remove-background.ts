import type { MattingQuality } from '../types'

type BgRemovalModule = typeof import('@imgly/background-removal')
type BgModel = 'isnet_quint8' | 'isnet_fp16'

let bgModule: BgRemovalModule | null = null
let preloadPromise: Promise<void> | null = null
let loadedModel: BgModel | null = null

function resolveModel(quality: MattingQuality): BgModel {
  return quality === 'fast' ? 'isnet_quint8' : 'isnet_fp16'
}

async function ensureRemover(
  quality: MattingQuality,
  onProgress?: (message: string) => void,
): Promise<BgRemovalModule> {
  const model = resolveModel(quality)

  if (bgModule && loadedModel !== model) {
    bgModule = null
    preloadPromise = null
    loadedModel = null
  }

  if (!bgModule) {
    onProgress?.('加载抠图组件…')
    bgModule = await import('@imgly/background-removal')
    preloadPromise = bgModule.preload({ model }).catch(() => undefined)
    loadedModel = model
  }

  if (preloadPromise) {
    onProgress?.(quality === 'quality' ? '加载精细模型…' : '加载 AI 模型…')
    await preloadPromise
    preloadPromise = null
  }

  if (!bgModule) throw new Error('抠图组件加载失败')
  return bgModule
}

/** 浏览器本机抠图（方案 A），照片不上传 */
export async function removeBgFromFile(
  file: File,
  quality: MattingQuality = 'quality',
  onProgress?: (message: string) => void,
): Promise<Blob> {
  const model = resolveModel(quality)
  const { removeBackground } = await ensureRemover(quality, onProgress)
  onProgress?.('正在抠图，请稍候…')

  const blob = await removeBackground(file, {
    model,
    output: { format: 'image/png', quality: 1 },
    progress: (_key, current, total) => {
      if (total > 0) {
        onProgress?.(`抠图 ${Math.round((current / total) * 100)}%`)
      }
    },
  })

  return blob
}
