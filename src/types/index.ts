export type ExportMode = 'upload' | 'hd'

export interface ProcessResult {
  blob: Blob
  url: string
  width: number
  height: number
  sizeKb: number
  quality: number | null
  mode: ExportMode
}
