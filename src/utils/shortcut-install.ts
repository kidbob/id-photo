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

/** 抠图完成后跳回当前应用的地址 */
export function getAppReturnUrl(): string {
  const url = new URL(location.href)
  url.searchParams.set('fromShortcut', '1')
  url.hash = ''
  return url.toString()
}

/**
 * 从应用内启动快捷指令，完成后通过 x-success 自动回到本页。
 * iOS 不允许把快捷指令界面嵌进网页，这是官方支持的折中方案。
 */
export function getShortcutRunUrl(): string {
  const success = encodeURIComponent(getAppReturnUrl())
  const name = encodeURIComponent(SHORTCUT_NAME)
  return `shortcuts://x-callback-url/run-shortcut?name=${name}&x-success=${success}`
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
