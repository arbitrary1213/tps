export type PlaqueType = 'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE'

export type FieldType = PlaqueType | 'COMMON'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: boolean
  italic: boolean
  color: string
  align: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  vertical: boolean
  underline: boolean
}

export interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'field' | 'line' | 'rect'
  x: number
  y: number
  width: number
  height: number
  style: TextStyle
  staticText?: string
  fieldKey?: string
  fieldType?: FieldType
  fieldLabel?: string
  lineWidth?: number
  fillColor?: string
  borderColor?: string
  src?: string
}

export interface PlaqueTemplate {
  id: string
  name: string
  type: PlaqueType | 'ALL'
  backgroundImage?: string
  elements: TemplateElement[]
  createdAt: string
  updatedAt: string
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: '宋体',
  fontSize: 24,
  fontWeight: false,
  italic: false,
  color: '#000000',
  align: 'center',
  lineHeight: 1.5,
  letterSpacing: 0,
  vertical: false,
  underline: false,
}

export const FIELD_DEFINITIONS: Record<string, { key: string; label: string; type: FieldType }[]> = {
  LONGEVITY: [
    { label: '姓名', key: 'holderName', type: 'LONGEVITY' },
    { label: '禄位类型', key: 'longevitySubtype', type: 'LONGEVITY' },
    { label: '性别', key: 'gender', type: 'LONGEVITY' },
    { label: '出生日期', key: 'birthDate', type: 'LONGEVITY' },
    { label: '祈福祝福语', key: 'blessingText', type: 'LONGEVITY' },
  ],
  REBIRTH: [
    { label: '亡者姓名', key: 'deceasedName', type: 'REBIRTH' },
    { label: '性别', key: 'gender', type: 'REBIRTH' },
    { label: '出生日期', key: 'birthDate', type: 'REBIRTH' },
    { label: '忌日', key: 'deathDate', type: 'REBIRTH' },
    { label: '第二亡者', key: 'deceasedName2', type: 'REBIRTH' },
    { label: '阳上', key: 'yangShang', type: 'REBIRTH' },
  ],
  DELIVERANCE: [
    { label: '超度类型', key: 'dedicationType', type: 'DELIVERANCE' },
    { label: '阳上', key: 'yangShang', type: 'DELIVERANCE' },
  ],
  COMMON: [
    { label: '寺院名称', key: 'templeName', type: 'COMMON' },
    { label: '类型标签', key: 'plaqueTypeLabel', type: 'COMMON' },
    { label: '开始日期', key: 'startDate', type: 'COMMON' },
    { label: '结束日期', key: 'endDate', type: 'COMMON' },
    { label: '编号', key: 'serialNo', type: 'COMMON' },
  ],
}

export const ALL_FIELDS = [
  ...FIELD_DEFINITIONS.LONGEVITY,
  ...FIELD_DEFINITIONS.REBIRTH,
  ...FIELD_DEFINITIONS.DELIVERANCE,
  ...FIELD_DEFINITIONS.COMMON,
]

export const FONT_OPTIONS = [
  { value: '宋体', label: '宋体' },
  { value: '黑体', label: '黑体' },
  { value: '楷体', label: '楷体' },
  { value: '隶书', label: '隶书' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: 'Times New Roman', label: 'Times New Roman' },
]

export const ALIGN_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
]

export const PLAQUE_TYPE_OPTIONS = [
  { value: 'LONGEVITY', label: '延生禄位' },
  { value: 'REBIRTH', label: '往生莲位' },
  { value: 'DELIVERANCE', label: '超度牌位' },
  { value: 'ALL', label: '通用' },
]

export function createElement(type: TemplateElement['type']): TemplateElement {
  const id = `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    type,
    x: 50,
    y: 50,
    width: type === 'text' || type === 'field' ? 150 : 100,
    height: type === 'text' || type === 'field' ? 40 : 40,
    style: { ...DEFAULT_TEXT_STYLE },
    ...(type === 'text' && { staticText: '文本' }),
    ...(type === 'field' && { fieldKey: '', fieldLabel: '', fieldType: 'COMMON' }),
    ...(type === 'image' && { src: '' }),
    ...(type === 'line' && { lineWidth: 1 }),
    ...(type === 'rect' && { fillColor: 'transparent', borderColor: '#000000' }),
  }
}