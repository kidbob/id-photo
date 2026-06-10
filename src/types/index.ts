export type ExportMode = 'upload' | 'hd'

/** fast=isnet_quint8 较快有瑕疵；quality=isnet_fp16 推荐证件照 */
export type MattingQuality = 'fast' | 'quality'

export interface ProcessResult {
  blob: Blob
  url: string
  width: number
  height: number
  sizeKb: number
  quality: number | null
  mode: ExportMode
}
