const SHORTCUT_FILE = '/shortcuts/zhengjianzhao-koutu.shortcut'
export const SHORTCUT_NAME = '证件照抠图'

export function getShortcutFileUrl(): string {
  return `${location.origin}${SHORTCUT_FILE}`
}

export function getShortcutImportUrl(): string {
  const fileUrl = encodeURIComponent(getShortcutFileUrl())
  const name = encodeURIComponent(SHORTCUT_NAME)
  return `shortcuts://import-shortcut?url=${fileUrl}&name=${name}`
}

/** 抠图完成后跳回当前应用（尽量用短 URL，兼容主屏幕 PWA） */
export function getAppReturnUrl(extra?: Record<string, string>): string {
  const url = new URL(`${location.origin}${location.pathname || '/'}`)
  url.searchParams.set('fromShortcut', '1')
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

/**
 * 从应用内启动快捷指令，完成后通过 x-success 自动回到本页。
 * 若快捷指令内部某步失败，会走 x-error（同样回到本页并提示）。
 */
export function getShortcutRunUrl(): string {
  const returnUrl = encodeURIComponent(getAppReturnUrl())
  const errorUrl = encodeURIComponent(getAppReturnUrl({ shortcutError: '1' }))
  const name = encodeURIComponent(SHORTCUT_NAME)
  return `shortcuts://x-callback-url/run-shortcut?name=${name}&x-success=${returnUrl}&x-error=${errorUrl}`
}

export function runShortcutFromApp(): void {
  window.location.href = getShortcutRunUrl()
}

export function isLikelyIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const INSTALLED_KEY = 'shortcutInstalledHint'

export function markShortcutInstalled(): void {
  localStorage.setItem(INSTALLED_KEY, '1')
}

export function hasShortcutInstallHint(): boolean {
  return localStorage.getItem(INSTALLED_KEY) === '1'
}
