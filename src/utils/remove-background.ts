type BgRemovalModule = typeof import('@imgly/background-removal')

let bgModule: BgRemovalModule | null = null
let preloadPromise: Promise<void> | null = null

async function ensureRemover(onProgress?: (message: string) => void): Promise<BgRemovalModule> {
  if (!bgModule) {
    onProgress?.('加载抠图组件…')
    bgModule = await import('@imgly/background-removal')
    preloadPromise = bgModule.preload({ model: 'isnet_quint8' }).catch(() => undefined)
  }
  if (preloadPromise) {
    onProgress?.('加载 AI 模型…')
    await preloadPromise
    preloadPromise = null
  }
  if (!bgModule) throw new Error('抠图组件加载失败')
  return bgModule
}

/** 浏览器本机抠图（方案 A），照片不上传 */
export async function removeBgFromFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  const { removeBackground } = await ensureRemover(onProgress)
  onProgress?.('正在抠图，请稍候…')

  const blob = await removeBackground(file, {
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 1 },
    progress: (_key, current, total) => {
      if (total > 0) {
        onProgress?.(`抠图 ${Math.round((current / total) * 100)}%`)
      }
    },
  })

  return blob
}
