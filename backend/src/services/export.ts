import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { prisma } from '../lib/prisma'

export type ExportFormat = 'xlsx' | 'csv'

interface ExportOptions {
  startDate?: string
  endDate?: string
  format?: ExportFormat
}

const getDateFilter = (startDate?: string, endDate?: string) => {
  const filter: any = {}
  if (startDate) {
    filter.gte = new Date(startDate)
  }
  if (endDate) {
    filter.lte = new Date(endDate + 'T23:59:59.999Z')
  }
  return Object.keys(filter).length > 0 ? filter : undefined
}

const formatTimestamp = () => dayjs().format('YYYYMMDD_HHmmss')

const autoSizeColumns = (ws: XLSX.WorkSheet) => {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  const colWidths: { [key: string]: number } = {}

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell && cell.v) {
        const colIdx = XLSX.utils.encode_col(C)
        const cellLen = String(cell.v).length
        colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, Math.min(cellLen + 2, 50))
      }
    }
  }

  ws['!cols'] = Object.entries(colWidths).map(([, width]) => ({ wch: width }))
}

const createWorkbook = (data: any[], headers: { key: string; label: string }[], filename: string, format: ExportFormat) => {
  const headerLabels = headers.map(h => h.label)
  const rows = data.map(item =>
    headers.map(h => {
      let value = item[h.key]
      if (value instanceof Date) {
        value = dayjs(value).format('YYYY-MM-DD HH:mm:ss')
      } else if (Array.isArray(value)) {
        value = value.join(', ')
      } else if (value === null || value === undefined) {
        value = ''
      }
      return value
    })
  )

  const wsData = [headerLabels, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  autoSizeColumns(ws)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const timestamp = formatTimestamp()
  const ext = format === 'csv' ? 'csv' : 'xlsx'
  const outputFilename = `${filename}_${timestamp}.${ext}`

  const buffer = XLSX.write(wb, { bookType: format === 'csv' ? 'csv' : 'xlsx', type: 'buffer' })

  return { buffer, filename: outputFilename }
}

const VOLUNTEER_HEADERS = [
  { key: 'name', label: '姓名' },
  { key: 'dharmaName', label: '法号' },
  { key: 'gender', label: '性别' },
  { key: 'birthDate', label: '出生日期' },
  { key: 'phone', label: '电话' },
  { key: 'ethnicity', label: '民族' },
  { key: 'education', label: '学历' },
  { key: 'address', label: '地址' },
  { key: 'emergencyContact', label: '紧急联系人' },
  { key: 'emergencyPhone', label: '紧急联系电话' },
  { key: 'currentOccupation', label: '当前职业' },
  { key: 'previousOccupation', label: '以前职业' },
  { key: 'healthStatus', label: '健康状况' },
  { key: 'diseaseHistory', label: '病史' },
  { key: 'allergyHistory', label: '过敏史' },
  { key: 'specialNeedsDetail', label: '特殊需求' },
  { key: 'firstContactBuddhism', label: '初次接触佛教' },
  { key: 'hasTakenRefuge', label: '是否皈依' },
  { key: 'refugeTime', label: '皈依时间' },
  { key: 'preceptsHeld', label: '持有戒律' },
  { key: 'willingToLearn', label: '愿意学习' },
  { key: 'guidanceHope', label: '指导期望' },
  { key: 'hasVolunteerExperience', label: '有志愿者经验' },
  { key: 'volunteerTimes', label: '志愿次数' },
  { key: 'lastVolunteerDate', label: '最后志愿日期' },
  { key: 'lastVolunteerLocation', label: '最后志愿地点' },
  { key: 'lastVolunteerContent', label: '最后志愿内容' },
  { key: 'skills', label: '技能' },
  { key: 'volunteerProjects', label: '志愿项目' },
  { key: 'serviceStartDate', label: '服务开始日期' },
  { key: 'serviceEndDate', label: '服务结束日期' },
  { key: 'serviceDuration', label: '服务时长' },
  { key: 'commitment', label: '承诺' },
  { key: 'totalHours', label: '总小时数' },
  { key: 'rank', label: '等级' },
  { key: 'status', label: '状态' },
  { key: 'remarks', label: '备注' },
  { key: 'createdAt', label: '创建时间' }
]

const DONATION_HEADERS = [
  { key: 'donorName', label: '捐赠者姓名' },
  { key: 'donorPhone', label: '捐赠者电话' },
  { key: 'type', label: '类型' },
  { key: 'amount', label: '金额' },
  { key: 'paymentMethod', label: '支付方式' },
  { key: 'donationDate', label: '捐赠日期' },
  { key: 'receiptNumber', label: '收据编号' },
  { key: 'operator', label: '操作员' },
  { key: 'remarks', label: '备注' },
  { key: 'createdAt', label: '创建时间' }
]

const PLAQUE_HEADERS = [
  { key: 'plaqueType', label: '牌位类型' },
  { key: 'holderName', label: '持名者' },
  { key: 'deceasedName', label: '亡者姓名' },
  { key: 'deceasedName2', label: '第二亡者' },
  { key: 'gender', label: '性别' },
  { key: 'gender2', label: '第二亡者性别' },
  { key: 'birthDate', label: '生日' },
  { key: 'birthDate2', label: '第二亡者生日' },
  { key: 'deathDate', label: '忌日' },
  { key: 'deathDate2', label: '第二亡者忌日' },
  { key: 'zodiac', label: '生肖' },
  { key: 'zodiac2', label: '第二亡者生肖' },
  { key: 'yangShang', label: '阳上' },
  { key: 'phone', label: '电话' },
  { key: 'address', label: '地址' },
  { key: 'dedicationType', label: '超度类型' },
  { key: 'longevitySubtype', label: '延生禄位子类型' },
  { key: 'size', label: '规格' },
  { key: 'startDate', label: '开始日期' },
  { key: 'endDate', label: '结束日期' },
  { key: 'blessingText', label: '祝福语' },
  { key: 'status', label: '状态' },
  { key: 'remarks', label: '备注' },
  { key: 'createdAt', label: '创建时间' }
]

const LAMP_OFFERING_HEADERS = [
  { key: 'name', label: '供灯者姓名' },
  { key: 'phone', label: '供灯者电话' },
  { key: 'lampType', label: '灯类型' },
  { key: 'location', label: '殿堂位置' },
  { key: 'duration', label: '天数' },
  { key: 'blessingName', label: '祈福对象' },
  { key: 'blessingType', label: '祈福类型' },
  { key: 'blessingContent', label: '祈福语' },
  { key: 'amount', label: '金额' },
  { key: 'startDate', label: '开始日期' },
  { key: 'endDate', label: '结束日期' },
  { key: 'status', label: '状态' },
  { key: 'createdAt', label: '创建时间' }
]

const REGISTRATION_REQUEST_HEADERS = [
  { key: 'submitterName', label: '提交者姓名' },
  { key: 'submitterPhone', label: '提交者电话' },
  { key: 'taskType', label: '任务类型' },
  { key: 'status', label: '状态' },
  { key: 'formData', label: '表单数据' },
  { key: 'rejectReason', label: '拒绝原因' },
  { key: 'approvedAt', label: '审批时间' },
  { key: 'createdAt', label: '创建时间' }
]

export async function exportVolunteers(options: ExportOptions = {}) {
  const { startDate, endDate, format = 'xlsx' } = options

  const where: any = {}
  const dateFilter = getDateFilter(startDate, endDate)
  if (dateFilter) {
    where.createdAt = dateFilter
  }

  const data = await prisma.volunteer.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return createWorkbook(data, VOLUNTEER_HEADERS, 'volunteers', format)
}

export async function exportDonations(options: ExportOptions = {}) {
  const { startDate, endDate, format = 'xlsx' } = options

  const where: any = {}
  const dateFilter = getDateFilter(startDate, endDate)
  if (dateFilter) {
    where.donationDate = dateFilter
  }

  const data = await prisma.donation.findMany({
    where,
    orderBy: { donationDate: 'desc' }
  })

  return createWorkbook(data, DONATION_HEADERS, 'donations', format)
}

export async function exportPlaques(options: ExportOptions = {}) {
  const { startDate, endDate, format = 'xlsx' } = options

  const where: any = {}
  const dateFilter = getDateFilter(startDate, endDate)
  if (dateFilter) {
    where.createdAt = dateFilter
  }

  const data = await prisma.memorialPlaque.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return createWorkbook(data, PLAQUE_HEADERS, 'plaques', format)
}

export async function exportLampOfferings(options: ExportOptions = {}) {
  const { startDate, endDate, format = 'xlsx' } = options

  const where: any = {}
  const dateFilter = getDateFilter(startDate, endDate)
  if (dateFilter) {
    where.createdAt = dateFilter
  }

  const data = await prisma.lampOffering.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return createWorkbook(data, LAMP_OFFERING_HEADERS, 'lamp_offerings', format)
}

export async function exportRegistrationRequests(options: ExportOptions = {}) {
  const { startDate, endDate, format = 'xlsx' } = options

  const where: any = {}
  const dateFilter = getDateFilter(startDate, endDate)
  if (dateFilter) {
    where.createdAt = dateFilter
  }

  const data = await prisma.registrationRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })

  return createWorkbook(data, REGISTRATION_REQUEST_HEADERS, 'registration_requests', format)
}
