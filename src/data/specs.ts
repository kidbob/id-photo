export interface BgColor {
  id: string
  name: string
  hex: string
}

export interface PhotoSpec {
  id: string
  name: string
  width: number
  height: number
  /** 常见报名系统文件大小上限（KB） */
  maxKb: number
  note?: string
}

/** 常用证件照规格（300 DPI 像素参考，可按报名系统微调） */
export const PHOTO_SPECS: PhotoSpec[] = [
  {
    id: '1inch',
    name: '一寸',
    width: 295,
    height: 413,
    maxKb: 50,
    note: '25×35mm，多数考试报名',
  },
  {
    id: '1inch_resume',
    name: '一寸（简历）',
    width: 358,
    height: 441,
    maxKb: 100,
    note: '部分招聘网站',
  },
  {
    id: '2inch',
    name: '二寸',
    width: 413,
    height: 579,
    maxKb: 100,
    note: '35×49mm',
  },
  {
    id: '2inch_passport',
    name: '二寸（护照）',
    width: 413,
    height: 626,
    maxKb: 100,
    note: '部分护照/签证表格',
  },
  {
    id: '2inch_large',
    name: '大二寸',
    width: 413,
    height: 626,
    maxKb: 200,
    note: '与部分二寸宽表相同',
  },
  {
    id: 'visa_us',
    name: '美国签证 2×2 英寸',
    width: 600,
    height: 600,
    maxKb: 240,
    note: '正方形，约 51×51mm',
  },
  {
    id: 'custom',
    name: '自定义',
    width: 295,
    height: 413,
    maxKb: 50,
    note: '手动输入宽高',
  },
]

export const BG_COLORS: BgColor[] = [
  { id: 'white', name: '白色', hex: '#FFFFFF' },
  { id: 'blue', name: '蓝色', hex: '#438EDB' },
  { id: 'red', name: '红色', hex: '#FF0000' },
  { id: 'light_blue', name: '浅蓝', hex: '#00BFF3' },
  { id: 'gray', name: '灰色', hex: '#DCDCDC' },
]

export function findSpec(id: string): PhotoSpec {
  return PHOTO_SPECS.find((s) => s.id === id) ?? PHOTO_SPECS[0]
}
