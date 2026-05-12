import bcrypt from 'bcryptjs'
import multer from 'multer'
import * as XLSX from 'xlsx'
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

export { bcrypt, multer, XLSX, prisma }
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
