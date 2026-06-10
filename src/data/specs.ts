export interface BgColor {
  id: string
  name: string
  hex: string
  /** 标准 RGB 标注，便于对照报名系统要求 */
  rgb: string
  note?: string
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

/**
 * 证件照底色（行业常用 RGB，无全国唯一强制标准）
 *
 * - 蓝色 #438EDB = RGB(67,142,219)：毕业证、简历、工作证、出入境常用
 * - 浅蓝 #00BFF3 = RGB(0,191,243)：部分在线工具/表格默认浅蓝
 * - 红色 #FF0000 = RGB(255,0,0)：通用大红
 * - 深红 #B80202 = RGB(184,2,2)：保险、IC 卡、结婚照等偏深红
 */
export const BG_COLORS: BgColor[] = [
  {
    id: 'white',
    name: '白色',
    hex: '#FFFFFF',
    rgb: '255,255,255',
    note: '身份证、护照、驾驶证、资格考试',
  },
  {
    id: 'blue',
    name: '蓝色（标准）',
    hex: '#438EDB',
    rgb: '67,142,219',
    note: '毕业证、简历、工作证；出入境照片常用此蓝',
  },
  {
    id: 'light_blue',
    name: '浅蓝',
    hex: '#00BFF3',
    rgb: '0,191,243',
    note: '部分报名系统/证件照工具默认浅蓝，比标准蓝更亮',
  },
  {
    id: 'red',
    name: '红色（标准）',
    hex: '#FF0000',
    rgb: '255,0,0',
    note: '通用红底证件',
  },
  {
    id: 'red_dark',
    name: '深红',
    hex: '#B80202',
    rgb: '184,2,2',
    note: '保险、IC 卡、结婚照等，比纯红略暗',
  },
]

export function findSpec(id: string): PhotoSpec {
  return PHOTO_SPECS.find((s) => s.id === id) ?? PHOTO_SPECS[0]
}

export function findBgColor(id: string): BgColor {
  return BG_COLORS.find((c) => c.id === id) ?? BG_COLORS[0]
}
