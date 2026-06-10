const SHORTCUT_FILE = '/shortcuts/zhengjianzhao-koutu.shortcut'
const SHORTCUT_NAME = '证件照抠图'

export function getShortcutFileUrl(): string {
  return `${location.origin}${SHORTCUT_FILE}`
}

export function getShortcutImportUrl(): string {
  const fileUrl = encodeURIComponent(getShortcutFileUrl())
  const name = encodeURIComponent(SHORTCUT_NAME)
  return `shortcuts://import-shortcut?url=${fileUrl}&name=${name}`
}

export function isLikelyIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}
