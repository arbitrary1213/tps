import multer from 'multer'
import { prisma } from '../../lib/prisma'
import {
  buildPlaqueImportDuplicateKey,
  normalizeDateFields,
  normalizeNullableForeignKeys,
  parseSpreadsheetDateValue,
} from '../business.normalize'
import {
  calculatePrintJobProgress,
  normalizeReportedItemStatus,
} from '../../services/localPrint'

export { multer, prisma }
export {
  buildPlaqueImportDuplicateKey,
  normalizeDateFields,
  normalizeNullableForeignKeys,
  parseSpreadsheetDateValue,
  calculatePrintJobProgress,
  normalizeReportedItemStatus,
}

export const upload = multer({ storage: multer.memoryStorage() })
export const templateAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

export function buildPrintJobNo() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `PJ${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(now.getMilliseconds()).padStart(3, '0')}`
}

export function buildPrintClientCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `PC-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`
}

export function buildMachineToken() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`
}

export const logOperation = async (
  user: any,
  action: string,
  targetType: string,
  targetId: string,
  beforeValue?: any,
  afterValue?: any
) => {
  await prisma.operationLog.create({
    data: {
      userId: user.userId,
      username: user.username,
      action,
      targetType,
      targetId,
      beforeValue,
      afterValue,
    },
  })
}

export const PLAQUE_VALID_FIELDS = [
  'code', 'id', 'plaqueType', 'holderName', 'deceasedName', 'deceasedName2',
  'yinGeng', 'birthDate2', 'deathDate2', 'yinGeng2', 'zodiac2', 'gender2',
  'gender', 'zodiac', 'age', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar',
  'yangShang', 'phone', 'address', 'dedicationType', 'longevitySubtype', 'size',
  'startDate', 'endDate', 'message', 'blessingText', 'status', 'remarks',
  'templateId', 'devoteeId', 'ritualId', 'createdBy', 'createdAt', 'updatedAt',
]

export function sanitizePlaqueBody(body: Record<string, any>): Record<string, any> {
  const data: any = {}
  for (const key of PLAQUE_VALID_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (body.customDedicationType && (!data.dedicationType || data.dedicationType === 'custom')) {
    data.dedicationType = body.customDedicationType
  }
  normalizeNullableForeignKeys(data, ['templateId', 'devoteeId', 'ritualId'])
  normalizeDateFields(data, ['startDate', 'endDate', 'deceasedDate', 'enlightenmentDate'])
  return data
}

export function validatePlaqueDates(data: Record<string, any>): string | null {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return '结束日期不能早于开始日期'
  }
  return null
}

async function generatePlaqueCode(tx?: any): Promise<string> {
  const db = tx || prisma
  const latest = await db.memorialPlaque.findFirst({
    where: { code: { not: null } },
    orderBy: { code: 'desc' },
    select: { code: true },
  })
  const next = latest?.code ? parseInt(latest.code, 10) + 1 : 1
  return String(next).padStart(6, '0')
}

export async function createPlaqueWithCode(data: Record<string, any>, user: any): Promise<any> {
  const MAX_RETRIES = 5
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        if (!data.code) {
          data.code = await generatePlaqueCode(tx)
        }
        const plaque = await tx.memorialPlaque.create({ data: data as any })
        await tx.operationLog.create({
          data: {
            userId: user.userId,
            username: user.username,
            action: 'CREATE',
            targetType: 'memorial_plaque',
            targetId: plaque.id,
            beforeValue: null,
            afterValue: plaque,
          },
        })
        return plaque
      })
    } catch (error: any) {
      if (error?.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue
      }
      throw error
    }
  }
  throw new Error('Failed to create plaque after retries')
}
