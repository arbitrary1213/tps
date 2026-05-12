import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { prisma } from '../lib/prisma'
import {
  buildPlaqueImportDuplicateKey,
  normalizeDateFields,
  normalizeNullableForeignKeys,
  parseSpreadsheetDateValue
} from './business.normalize'
import {
  calculatePrintJobProgress,
  normalizeReportedItemStatus
} from '../services/localPrint'

const router = Router()

const upload = multer({ storage: multer.memoryStorage() })
const templateAssetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

function buildPrintJobNo() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `PJ${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${String(now.getMilliseconds()).padStart(3, '0')}`
}

function buildPrintClientCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return `PC-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`
}

function buildMachineToken() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`
}

// 通用日志记录函数
const logOperation = async (user: any, action: string, targetType: string, targetId: string, beforeValue?: any, afterValue?: any) => {
  await prisma.operationLog.create({
    data: {
      userId: user.userId,
      username: user.username,
      action,
      targetType,
      targetId,
      beforeValue,
      afterValue
    }
  })
}

// ============ 僧众管理 ============
router.get('/monks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, position } = req.query
    const where: any = {}
    if (status) where.status = status
    if (position) where.position = position

    const monks = await prisma.monk.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: monks })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/monks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    // Clean invalid date values
    for (const _fk of ['birthDate', 'ordinationDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.birthDate && typeof data.birthDate === 'string') {
      data.birthDate = new Date(data.birthDate)
    }
    if (data.ordinationDate && typeof data.ordinationDate === 'string') {
      data.ordinationDate = new Date(data.ordinationDate)
    }
    const monk = await prisma.monk.create({ data })
    await logOperation(req.user, 'CREATE', 'monk', monk.id, null, monk)
    res.json({ success: true, data: monk })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/monks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const before = await prisma.monk.findUnique({ where: { id: req.params.id } })
    const monk = await prisma.monk.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'monk', monk.id, before, monk)
    res.json({ success: true, data: monk })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/monks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.monk.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'monk', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 义工管理 ============
router.get('/volunteers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, rank, keyword } = req.query
    const where: any = {}
    if (status) where.status = status
    if (rank) where.rank = rank
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } }
      ]
    }

    const volunteers = await prisma.volunteer.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: volunteers })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/volunteers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.create({ data: req.body })
    await logOperation(req.user, 'CREATE', 'volunteer', volunteer.id, null, volunteer)
    res.json({ success: true, data: volunteer })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/volunteers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const before = await prisma.volunteer.findUnique({ where: { id: req.params.id } })
    const volunteer = await prisma.volunteer.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'volunteer', volunteer.id, before, volunteer)
    res.json({ success: true, data: volunteer })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/volunteers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.volunteer.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } })
    await logOperation(req.user, 'DELETE', 'volunteer', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 义工任务 ============
router.get('/volunteer-tasks', async (req: Request, res: Response) => {
  try {
    const { status, taskDate } = req.query
    const where: any = {}
    if (status) where.status = status
    if (taskDate) where.taskDate = new Date(taskDate as string)

    const tasks = await prisma.volunteerTask.findMany({
      where,
      include: { _count: { select: { signups: true } } },
      orderBy: { taskDate: 'desc' }
    })
    res.json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/volunteer-tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, createdBy: req.user!.userId }
    // Clean invalid date values
    for (const _fk of ['taskDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.taskDate && typeof data.taskDate === 'string') {
      data.taskDate = new Date(data.taskDate)
    }
    const task = await prisma.volunteerTask.create({ data })
    await logOperation(req.user, 'CREATE', 'volunteer_task', task.id, null, task)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/volunteer-tasks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.volunteerTask.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'volunteer_task', task.id, null, task)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/volunteer-tasks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.volunteerTask.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'volunteer_task', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 义工考勤 ============
router.post('/volunteer-attendance/sign-in', async (req: Request, res: Response) => {
  try {
    const { taskId, volunteerName, volunteerPhone } = req.body

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.volunteerTask.findUnique({ where: { id: taskId } })
      if (!task) {
        throw new Error('义工任务不存在')
      }
      if (task.requiredCount && task.currentCount >= task.requiredCount) {
        throw new Error('义工任务已满员')
      }

      const signup = await tx.volunteerSignup.create({
        data: { taskId, volunteerName, volunteerPhone, status: 'CHECKED_IN', checkInTime: new Date() }
      })

      await tx.volunteerTask.update({
        where: { id: taskId },
        data: { currentCount: { increment: 1 } }
      })

      return signup
    })

    res.json({ success: true, data: result })
  } catch (error: any) {
    if (error.message === '义工任务不存在' || error.message === '义工任务已满员') {
      return res.status(400).json({ success: false, error: error.message })
    }
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/volunteer-attendance/sign-out', async (req: Request, res: Response) => {
  try {
    const { taskId, volunteerPhone } = req.body
    const signup = await prisma.volunteerSignup.findFirst({
      where: { taskId, volunteerPhone, status: 'CHECKED_IN' },
      orderBy: { checkInTime: 'desc' }
    })
    if (signup) {
      const checkOutTime = new Date()
      const serviceHours = (checkOutTime.getTime() - (signup.checkInTime?.getTime() || 0)) / (1000 * 60 * 60)
      await prisma.volunteerSignup.update({
        where: { id: signup.id },
        data: { status: 'CHECKED_OUT', checkOutTime, serviceHours }
      })
      // 更新义工累计时长
      await prisma.volunteer.updateMany({
        where: { phone: volunteerPhone },
        data: { totalHours: { increment: serviceHours } }
      })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 信众管理 ============
router.get('/devotees', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, tag } = req.query
    const where: any = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } }
      ]
    }
    if (tag) where.tags = { has: tag as string }

    const devotees = await prisma.devotee.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: devotees })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/devotees', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, createdBy: req.user!.username }
    // Clean invalid date values
    for (const _fk of ['birthday', 'firstVisitDate', 'lastVisitDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.birthday && typeof data.birthday === 'string') {
      data.birthday = new Date(data.birthday)
    }
    if (data.firstVisitDate && typeof data.firstVisitDate === 'string') {
      data.firstVisitDate = new Date(data.firstVisitDate)
    }
    if (data.lastVisitDate && typeof data.lastVisitDate === 'string') {
      data.lastVisitDate = new Date(data.lastVisitDate)
    }
    const devotee = await prisma.devotee.create({ data })
    await logOperation(req.user, 'CREATE', 'devotee', devotee.id, null, devotee)
    res.json({ success: true, data: devotee })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/devotees/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const devotee = await prisma.devotee.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'devotee', devotee.id, null, devotee)
    res.json({ success: true, data: devotee })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/devotees/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.devotee.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'devotee', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 牌位管理 ============
router.get('/plaques', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plaqueType, status, keyword, devoteeId, ritualId } = req.query
    const where: any = {}
    if (plaqueType) where.plaqueType = plaqueType
    if (status) where.status = status
    if (devoteeId) where.devoteeId = devoteeId
    if (ritualId) where.ritualId = ritualId
    if (keyword) {
      where.OR = [
        { holderName: { contains: keyword as string } },
        { yangShang: { contains: keyword as string } }
      ]
    }

    const plaques = await prisma.memorialPlaque.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: plaques })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/plaques', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validFields = ['id', 'plaqueType', 'holderName', 'deceasedName', 'deceasedName2', 'birthDate2', 'deathDate2', 'zodiac2', 'gender2', 'gender', 'zodiac', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'dedicationType', 'longevitySubtype', 'size', 'startDate', 'endDate', 'blessingText', 'status', 'remarks', 'templateId', 'devoteeId', 'ritualId', 'createdBy', 'createdAt', 'updatedAt']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    for (const key of validFields) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.customDedicationType && (!data.dedicationType || data.dedicationType === 'custom')) {
      data.dedicationType = req.body.customDedicationType
    }
    data.createdBy = req.user!.username
    normalizeNullableForeignKeys(data, ['templateId', 'devoteeId', 'ritualId'])
    normalizeDateFields(data, ['startDate', 'endDate', 'deceasedDate', 'enlightenmentDate'])

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      return res.status(400).json({ success: false, error: '结束日期不能早于开始日期' })
    }

    const plaque = await prisma.memorialPlaque.create({ data })
    await logOperation(req.user, 'CREATE', 'memorial_plaque', plaque.id, null, plaque)
    res.json({ success: true, data: plaque })
  } catch (error: any) {
    console.error('Plaque error:', error.message, error.code)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/plaques/batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, action, ritualId, endDate } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要操作的牌位' })
    }

    if (!['associate', 'clear', 'archive', 'extend', 'delete'].includes(action)) {
      return res.status(400).json({ success: false, error: '不支持的批量操作' })
    }

    if (action === 'associate' && !ritualId) {
      return res.status(400).json({ success: false, error: '请选择要关联的法会' })
    }

    if (action === 'extend' && !endDate) {
      return res.status(400).json({ success: false, error: '请输入延期后的结束日期' })
    }

    const parsedEndDate = typeof endDate === 'string' && endDate
      ? new Date(endDate)
      : null

    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ success: false, error: '结束日期格式无效' })
    }

    const plaques = await prisma.memorialPlaque.findMany({
      where: { id: { in: ids } },
      select: { id: true, ritualId: true, endDate: true }
    })

    if (plaques.length === 0) {
      return res.json({ success: true, data: { count: 0 } })
    }

    const batchTargetId = `batch:${action}:${ids.length}:${ids[0] || 'none'}`

    const result = await prisma.$transaction(async (tx) => {
      if (action === 'delete') {
        const deleted = await tx.memorialPlaque.deleteMany({ where: { id: { in: ids } } })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_DELETE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, count: deleted.count }
          }
        })
        return { count: deleted.count }
      }

      if (action === 'associate') {
        const updated = await tx.memorialPlaque.updateMany({
          where: { id: { in: ids } },
          data: { ritualId }
        })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, ritualId, count: updated.count }
          }
        })
        return { count: updated.count }
      }

      if (action === 'clear') {
        const updated = await tx.memorialPlaque.updateMany({
          where: { id: { in: ids } },
          data: { ritualId: null }
        })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, count: updated.count }
          }
        })
        return { count: updated.count }
      }

      if (action === 'extend') {
        const updated = await tx.memorialPlaque.updateMany({
          where: { id: { in: ids } },
          data: { endDate: parsedEndDate!, status: 'ACTIVE' }
        })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, endDate, count: updated.count }
          }
        })
        return { count: updated.count }
      }

      const ritualIds = Array.from(new Set([
        ...(ritualId ? [ritualId] : []),
        ...plaques.map(plaque => plaque.ritualId).filter(Boolean)
      ])) as string[]
      const rituals = ritualIds.length > 0
        ? await tx.ritual.findMany({ where: { id: { in: ritualIds } }, select: { id: true, ritualDate: true } })
        : []
      const ritualDateMap = new Map(rituals.filter(ritual => ritual.ritualDate).map(ritual => [ritual.id, ritual.ritualDate]))

      for (const plaque of plaques) {
        const archiveDate = parsedEndDate
          || (ritualId ? ritualDateMap.get(ritualId) : undefined)
          || (plaque.ritualId ? ritualDateMap.get(plaque.ritualId) : undefined)
          || plaque.endDate
          || new Date()

        await tx.memorialPlaque.update({
          where: { id: plaque.id },
          data: {
            status: 'EXPIRED',
            endDate: archiveDate,
          }
        })
      }

      await tx.operationLog.create({
        data: {
          userId: req.user!.userId,
          username: req.user!.username,
          action: 'BATCH_UPDATE',
          targetType: 'memorial_plaque',
          targetId: ids.join(','),
          beforeValue: plaques,
          afterValue: { action, ritualId: ritualId || null, endDate: endDate || null, count: plaques.length }
        }
      })

      return { count: plaques.length }
    })

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Plaque batch update error:', error.message, error.code)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/plaques/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validFields = ['id', 'plaqueType', 'holderName', 'deceasedName', 'deceasedName2', 'birthDate2', 'deathDate2', 'zodiac2', 'gender2', 'gender', 'zodiac', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'dedicationType', 'longevitySubtype', 'size', 'startDate', 'endDate', 'blessingText', 'status', 'remarks', 'templateId', 'devoteeId', 'ritualId', 'createdBy', 'createdAt', 'updatedAt']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    for (const key of validFields) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }
    if (req.body.customDedicationType && (!data.dedicationType || data.dedicationType === 'custom')) {
      data.dedicationType = req.body.customDedicationType
    }
    normalizeNullableForeignKeys(data, ['templateId', 'devoteeId', 'ritualId'])
    normalizeDateFields(data, ['startDate', 'endDate', 'deceasedDate', 'enlightenmentDate'])

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      return res.status(400).json({ success: false, error: '结束日期不能早于开始日期' })
    }

    const before = await prisma.memorialPlaque.findUnique({ where: { id: req.params.id } })
    const plaque = await prisma.memorialPlaque.update({ where: { id: req.params.id }, data })
    await logOperation(req.user, 'UPDATE', 'memorial_plaque', plaque.id, before, plaque)
    res.json({ success: true, data: plaque })
  } catch (error: any) {
    console.error('Plaque update error:', error.message, error.code)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/plaques/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.memorialPlaque.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'memorial_plaque', req.params.id)
    res.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025' || error?.message?.includes('Record to delete does not exist')) {
      return res.json({ success: true })
    }
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/print-jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, sourceType } = req.query
    const where: any = {}
    if (status) where.status = status
    if (sourceType) where.sourceType = sourceType
    const jobs = await prisma.printJob.findMany({
      where,
      include: {
        printClient: { select: { id: true, name: true, clientCode: true, status: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ success: true, data: jobs })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/print-jobs/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.printJob.findUnique({
      where: { id: req.params.id },
      include: {
        printClient: { select: { id: true, name: true, clientCode: true, status: true, defaultPrinter: true } },
        items: { orderBy: { seqNo: 'asc' } },
      },
    })
    if (!job) {
      return res.status(404).json({ success: false, error: '打印任务不存在' })
    }
    res.json({ success: true, data: job })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/print-jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      sourceType = 'PLAQUE',
      plaqueIds,
      templateId,
      templateName,
      templateSnapshot,
      plaqueType,
      paperWidthMm,
      paperHeightMm,
      printClientId,
      remarks,
    } = req.body || {}

    if (!Array.isArray(plaqueIds) || plaqueIds.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要打印的牌位' })
    }

    const plaques = await prisma.memorialPlaque.findMany({
      where: { id: { in: plaqueIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        plaqueType: true,
        holderName: true,
        deceasedName: true,
        deceasedName2: true,
        birthDate: true,
        birthDate2: true,
        deathDate: true,
        deathDate2: true,
        yangShang: true,
        address: true,
        phone: true,
        dedicationType: true,
        longevitySubtype: true,
        size: true,
        blessingText: true,
        ritualId: true,
        templateId: true,
      }
    })

    if (!plaques.length) {
      return res.status(400).json({ success: false, error: '未找到可打印的牌位数据' })
    }

    const missingIds = plaqueIds.filter((id: string) => !plaques.some((plaque) => plaque.id === id))
    const orderedPlaques = plaqueIds
      .map((id: string) => plaques.find((plaque) => plaque.id === id))
      .filter(Boolean)

    const job = await prisma.$transaction(async (tx) => {
      const created = await tx.printJob.create({
        data: {
          jobNo: buildPrintJobNo(),
          sourceType,
          status: 'PENDING',
          templateId: templateId || null,
          templateName: templateName || null,
          templateSnapshot: templateSnapshot || null,
          plaqueType: plaqueType || null,
          paperWidthMm: typeof paperWidthMm === 'number' ? paperWidthMm : null,
          paperHeightMm: typeof paperHeightMm === 'number' ? paperHeightMm : null,
          totalCount: orderedPlaques.length,
          printedCount: 0,
          failedCount: 0,
          createdById: req.user!.userId,
          createdByName: req.user!.username,
          printClientId: printClientId || null,
          remarks: remarks || null,
        }
      })

      if (orderedPlaques.length) {
        await tx.printJobItem.createMany({
          data: orderedPlaques.map((plaque: any, index: number) => ({
            jobId: created.id,
            seqNo: index + 1,
            plaqueId: plaque.id,
            subject: plaque.holderName || plaque.deceasedName || plaque.dedicationType || `牌位${index + 1}`,
            payload: plaque,
            status: 'PENDING',
          }))
        })
      }

      await tx.operationLog.create({
        data: {
          userId: req.user!.userId,
          username: req.user!.username,
          action: 'CREATE',
          targetType: 'print_job',
          targetId: created.id,
          beforeValue: null,
          afterValue: {
            totalCount: orderedPlaques.length,
            plaqueIds,
            missingIds,
            templateId: templateId || null,
            printClientId: printClientId || null,
          }
        }
      })

      return created
    })

    res.json({
      success: true,
      data: {
        id: job.id,
        jobNo: job.jobNo,
        totalCount: orderedPlaques.length,
        missingIds,
      }
    })
  } catch (error) {
    console.error('Create print job error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/print-clients', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clients = await prisma.printClient.findMany({
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      include: {
        _count: { select: { jobs: true } }
      }
    })
    res.json({ success: true, data: clients })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/local-print/clients/register', async (req: Request, res: Response) => {
  try {
    const { name, machineName, defaultPrinter } = req.body || {}
    if (!name) {
      return res.status(400).json({ success: false, error: '客户端名称不能为空' })
    }
    const client = await prisma.printClient.create({
      data: {
        clientCode: buildPrintClientCode(),
        name,
        machineName: machineName || null,
        machineToken: buildMachineToken(),
        status: 'ONLINE',
        defaultPrinter: defaultPrinter || null,
        lastSeenAt: new Date(),
        lastIp: req.ip || '',
      }
    })
    res.json({ success: true, data: client })
  } catch (error) {
    console.error('Register print client error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/local-print/clients/:id/heartbeat', async (req: Request, res: Response) => {
  try {
    const { machineToken, status, defaultPrinter } = req.body || {}
    const client = await prisma.printClient.findUnique({ where: { id: req.params.id } })
    if (!client || client.machineToken !== machineToken) {
      return res.status(401).json({ success: false, error: '客户端认证失败' })
    }
    const updated = await prisma.printClient.update({
      where: { id: client.id },
      data: {
        status: status || 'ONLINE',
        defaultPrinter: defaultPrinter === undefined ? client.defaultPrinter : (defaultPrinter || null),
        lastSeenAt: new Date(),
        lastIp: req.ip || client.lastIp || '',
      }
    })
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Print client heartbeat error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/local-print/clients/:id/jobs/next', async (req: Request, res: Response) => {
  try {
    const machineToken = String(req.query.machineToken || '')
    const client = await prisma.printClient.findUnique({ where: { id: req.params.id } })
    if (!client || client.machineToken !== machineToken) {
      return res.status(401).json({ success: false, error: '客户端认证失败' })
    }

    await prisma.printClient.update({
      where: { id: client.id },
      data: {
        status: 'ONLINE',
        lastSeenAt: new Date(),
        lastIp: req.ip || client.lastIp || '',
      }
    })

    const job = await prisma.printJob.findFirst({
      where: {
        OR: [
          { printClientId: client.id, status: { in: ['PENDING', 'DISPATCHED', 'PRINTING', 'FAILED'] } },
          { printClientId: null, status: 'PENDING' },
        ],
      },
      include: {
        items: {
          where: { status: { in: ['PENDING', 'PRINTING', 'FAILED'] } },
          orderBy: { seqNo: 'asc' },
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (!job) {
      return res.json({ success: true, data: null })
    }

    const assignedJob = job.printClientId === client.id
      ? job
      : await prisma.printJob.update({
          where: { id: job.id },
          data: {
            printClientId: client.id,
            status: 'DISPATCHED',
          },
          include: {
            items: {
              where: { status: { in: ['PENDING', 'PRINTING', 'FAILED'] } },
              orderBy: { seqNo: 'asc' },
            }
          }
        })

    res.json({ success: true, data: assignedJob })
  } catch (error) {
    console.error('Fetch next print job error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/local-print/jobs/:jobId/items/:itemId/report', async (req: Request, res: Response) => {
  try {
    const { machineToken, status, errorMessage } = req.body || {}
    let nextStatus: 'COMPLETED' | 'FAILED'
    try {
      nextStatus = normalizeReportedItemStatus(status)
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid print item status' })
    }

    const job = await prisma.printJob.findUnique({
      where: { id: req.params.jobId },
      include: { items: true, printClient: true }
    })
    if (!job || !job.printClient || job.printClient.machineToken !== machineToken) {
      return res.status(401).json({ success: false, error: '客户端认证失败' })
    }

    await prisma.printJobItem.update({
      where: { id: req.params.itemId },
      data: {
        status: nextStatus,
        printedAt: nextStatus === 'COMPLETED' ? new Date() : null,
        errorMessage: nextStatus === 'FAILED' ? (errorMessage || '打印失败') : null,
      }
    })

    const items = await prisma.printJobItem.findMany({ where: { jobId: job.id } })
    const progress = calculatePrintJobProgress(items)

    const updatedJob = await prisma.printJob.update({
      where: { id: job.id },
      data: {
        printedCount: progress.printedCount,
        failedCount: progress.failedCount,
        status: progress.status,
      }
    })

    res.json({ success: true, data: updatedJob })
  } catch (error) {
    console.error('Report print item error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 法会管理 ============
router.get('/rituals', async (req: Request, res: Response) => {
  try {
    const { status, ritualType } = req.query
    const where: any = {}
    if (status) where.status = status
    if (ritualType) where.ritualType = ritualType

    const rituals = await prisma.ritual.findMany({ where, orderBy: { ritualDate: 'desc' } })
    res.json({ success: true, data: rituals })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/rituals', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    // Clean invalid date values
    for (const _fk of ['ritualDate', 'registrationDeadline']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.ritualDate && typeof data.ritualDate === 'string') {
      data.ritualDate = new Date(data.ritualDate)
    }
    const ritual = await prisma.ritual.create({ data })
    await logOperation(req.user, 'CREATE', 'ritual', ritual.id, null, ritual)
    res.json({ success: true, data: ritual })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/rituals/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    normalizeDateFields(data, ['ritualDate', 'registrationDeadline'])
    const ritual = await prisma.ritual.update({ where: { id: req.params.id }, data })
    await logOperation(req.user, 'UPDATE', 'ritual', ritual.id, null, ritual)
    res.json({ success: true, data: ritual })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/rituals/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.ritual.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'ritual', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 法会参与者 ============
router.get('/rituals/:id/participants', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const participants = await prisma.ritualParticipant.findMany({
      where: { ritualId: req.params.id }
    })
    res.json({ success: true, data: participants })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/rituals/:id/participants', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const participant = await prisma.ritualParticipant.create({
      data: { ...req.body, ritualId: req.params.id }
    })
    await prisma.ritual.update({
      where: { id: req.params.id },
      data: { currentParticipants: { increment: 1 } }
    })
    res.json({ success: true, data: participant })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/participants/:id/check-in', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const participant = await prisma.ritualParticipant.update({
      where: { id: req.params.id },
      data: { checkedIn: true, checkInTime: new Date() }
    })
    res.json({ success: true, data: participant })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 殿堂管理 ============
router.get('/halls', async (req: Request, res: Response) => {
  try {
    const halls = await prisma.hall.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: halls })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/halls', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const hall = await prisma.hall.create({ data: req.body })
    await logOperation(req.user, 'CREATE', 'hall', hall.id, null, hall)
    res.json({ success: true, data: hall })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/halls/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const hall = await prisma.hall.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: hall })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 供灯祈福 ============
router.get('/lamp-offerings', async (req: Request, res: Response) => {
  try {
    const { status } = req.query
    const where: any = {}
    if (status) where.status = status

    const lamps = await prisma.lampOffering.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: lamps })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/lamp-offerings', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body }
    if (data.startDate && typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate)
    }
    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate)
    }
    const lamp = await prisma.lampOffering.create({ data })
    res.json({ success: true, data: lamp })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 功德管理 ============
router.get('/donations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query
    const where: any = {}
    if (type) where.type = type
    if (startDate || endDate) {
      where.donationDate = {}
      if (startDate) where.donationDate.gte = new Date(startDate as string)
      if (endDate) where.donationDate.lte = new Date(endDate as string)
    }

    const donations = await prisma.donation.findMany({
      where,
      include: { devotee: true },
      orderBy: { donationDate: 'desc' }
    })
    res.json({ success: true, data: donations })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/donations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    // 转换日期字符串为 DateTime
    if (data.donationDate && typeof data.donationDate === 'string') {
      data.donationDate = new Date(data.donationDate)
    }
    const donation = await prisma.donation.create({ data })
    await logOperation(req.user, 'CREATE', 'donation', donation.id, null, donation)
    res.json({ success: true, data: donation })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 库房管理 ============
router.get('/warehouse/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query
    const where: any = {}
    if (category) where.category = category

    const items = await prisma.warehouseItem.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: items })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/warehouse/items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.warehouseItem.create({ data: req.body })
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/warehouse/items/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.warehouseItem.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/warehouse/in', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, quantity, price, supplier } = req.body
    const record = await prisma.warehouseIn.create({
      data: { itemId, quantity, price, supplier, operator: req.user!.username }
    })
    await prisma.warehouseItem.update({
      where: { id: itemId },
      data: { stock: { increment: quantity } }
    })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/warehouse/out', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, quantity, purpose } = req.body
    const record = await prisma.warehouseOut.create({
      data: { itemId, quantity, purpose, operator: req.user!.username }
    })
    await prisma.warehouseItem.update({
      where: { id: itemId },
      data: { stock: { decrement: quantity } }
    })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 住宿管理 ============
// 公开可用房间列表（供登记表单使用）
router.get('/rooms/available', async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { roomNumber: 'asc' }
    })
    res.json({ success: true, data: rooms })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/rooms', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { roomNumber: 'asc' } })
    res.json({ success: true, data: rooms })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/rooms', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const room = await prisma.room.create({ data: req.body })
    res.json({ success: true, data: room })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/rooms/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: room })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/accommodations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.accommodationRecord.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/accommodations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    // Clean invalid date values
    for (const _fk of ['checkInDate', 'checkOutDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    // Clean invalid date values
    for (const _fk of ['checkInDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.checkInDate && typeof data.checkInDate === 'string') {
      data.checkInDate = new Date(data.checkInDate)
    }
    if (data.checkOutDate && typeof data.checkOutDate === 'string') {
      data.checkOutDate = new Date(data.checkOutDate)
    }
    const record = await prisma.accommodationRecord.create({ data })
    if (req.body.roomId) {
      await prisma.room.update({ where: { id: req.body.roomId }, data: { status: 'OCCUPIED' } })
    }
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/accommodations/:id/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.accommodationRecord.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: '住宿记录不存在' })
    }
    if (existing.status === 'CHECKED_OUT') {
      return res.status(400).json({ success: false, error: '该住宿记录已退房' })
    }

    const record = await prisma.accommodationRecord.update({
      where: { id: req.params.id },
      data: { status: 'CHECKED_OUT', checkOutDate: new Date() }
    })
    if (record.roomId) {
      await prisma.room.update({ where: { id: record.roomId }, data: { status: 'AVAILABLE' } })
    }
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 斋堂管理 ============
router.get('/dining', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.diningReservation.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/dining', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    // Clean invalid date values
    for (const _fk of ['mealDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.date && typeof data.date === 'string') {
      data.date = new Date(data.date)
    }
    const record = await prisma.diningReservation.create({ data })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 来访管理 ============
router.get('/visits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { visitorType, startDate, endDate } = req.query
    const where: any = {}
    if (visitorType) where.visitorType = visitorType
    if (startDate || endDate) {
      where.visitDate = {}
      if (startDate) where.visitDate.gte = new Date(startDate as string)
      if (endDate) where.visitDate.lte = new Date(endDate as string)
    }

    const visits = await prisma.visitRecord.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: visits })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/visits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    // Clean invalid date values
    for (const _fk of ['visitDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    if (data.visitDate && typeof data.visitDate === 'string') {
      data.visitDate = new Date(data.visitDate)
    }
    const visit = await prisma.visitRecord.create({ data })
    res.json({ success: true, data: visit })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 用户管理 ============
router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, email, name, role }
    })
    await logOperation(req.user, 'CREATE', 'user', user.id, null, { username, email, role })
    res.json({ success: true, data: { id: user.id, username, email, name, role } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/users/:id/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { newPassword } = req.body
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } })
    await logOperation(req.user, 'UPDATE', 'user', req.params.id, null, { action: 'password_changed' })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/users/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ success: false, error: '不能删除自己' })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!targetUser) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, error: '不能删除最后一个管理员' })
      }
    }

    await prisma.user.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'user', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 操作日志 ============
router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { action, targetType, startDate, endDate, page = 1, pageSize = 50 } = req.query
    const where: any = {}
    if (action) where.action = action
    if (targetType) where.targetType = targetType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize)
      }),
      prisma.operationLog.count({ where })
    ])

    res.json({ success: true, data: { list: logs, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 统计数据 ============
router.get('/stats/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [
      pendingCount,
      volunteerCount,
      plaqueCount,
      ritualCount,
      recentRegistrations
    ] = await Promise.all([
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.volunteer.count({ where: { status: 'ACTIVE' } }),
      prisma.memorialPlaque.count({ where: { status: 'ACTIVE' } }),
      prisma.ritual.count({ where: { status: { in: ['PUBLISHED', 'UPCOMING'] } } }),
      prisma.registrationRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { task: true }
      })
    ])

    res.json({
      success: true,
      data: {
        pendingCount,
        volunteerCount,
        plaqueCount,
        ritualCount,
        recentRegistrations
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 牌位模板管理 ============
router.get('/plaque-templates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.plaqueTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: templates })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/plaque-templates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.plaqueTemplate.findUnique({
      where: { id: req.params.id }
    })
    if (!template) {
      return res.status(404).json({ success: false, error: '模板不存在' })
    }
    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/plaque-templates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.plaqueTemplate.create({ data: req.body })
    await logOperation(req.user, 'CREATE', 'plaque_template', template.id, null, template)
    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/plaque-templates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const before = await prisma.plaqueTemplate.findUnique({ where: { id: req.params.id } })
    const template = await prisma.plaqueTemplate.update({
      where: { id: req.params.id },
      data: req.body
    })
    await logOperation(req.user, 'UPDATE', 'plaque_template', template.id, before, template)
    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/plaque-templates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.plaqueTemplate.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'plaque_template', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// ============ 牌位批量导入 ============
router.post('/plaque-templates/upload-asset', authMiddleware, templateAssetUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a template file' })
    }

    const originalName = req.file.originalname || 'template'
    const extension = (originalName.split('.').pop() || '').toLowerCase()
    const allowed = new Set(['pdf'])
    if (!allowed.has(extension)) {
      return res.status(400).json({ success: false, error: 'Only PDF files are supported' })
    }

    const fs = await import('node:fs/promises')
    const pathMod = await import('node:path')
    const crypto = await import('node:crypto')
    const assetId = crypto.randomUUID()
    const uploadDir = pathMod.join('/opt/temple-os/storage/plaque-template-assets')
    await fs.mkdir(uploadDir, { recursive: true })
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const filename = `${assetId}_${safeName}`
    const absolutePath = pathMod.join(uploadDir, filename)
    await fs.writeFile(absolutePath, req.file.buffer)

    res.json({
      success: true,
      data: {
        assetId,
        kind: 'pdf',
        originalName,
        extension,
        mimeType: req.file.mimetype || '',
        size: req.file.size,
        path: absolutePath,
        url: `/api/plaque-template-assets/${filename}`,
        uploadedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Template asset upload failed:', error)
    res.status(500).json({ success: false, error: 'Template asset upload failed' })
  }
})

router.post('/import/plaques', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传 Excel 文件' })
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' })
    }

    const headers = data[0].map(h => String(h).trim())
    const rows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))

    const columnMap: Record<string, number> = {}
    headers.forEach((h, i) => { columnMap[h] = i })

    const requiredHeaders = ['牌位类型']
    for (const h of requiredHeaders) {
      if (!(h in columnMap)) {
        return res.status(400).json({ success: false, error: `缺少必需列: ${h}` })
      }
    }

    const getRawValue = (row: any[], colName: string) => {
      const idx = columnMap[colName]
      if (idx === undefined) return undefined
      return row[idx]
    }

    const getValue = (row: any[], colName: string) => {
      const val = getRawValue(row, colName)
      return val !== null && val !== undefined ? String(val).trim() : ''
    }

    const getOptionalValue = (row: any[], colName: string) => {
      const val = getValue(row, colName)
      return val || undefined
    }

    const typeMap = {
      '延生禄位': 'LONGEVITY',
      '往生莲位': 'REBIRTH',
      '超度牌位': 'DELIVERANCE'
    }

    const createImportIdentity = (mappedType: 'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE', row: any[]) => ({
      plaqueType: mappedType,
      holderName: getValue(row, '牌位主体'),
      longevitySubtype: getValue(row, '禄位类型'),
      size: getValue(row, '规格'),
      gender: getValue(row, '性别'),
      birthDate: getValue(row, '出生日期'),
      birthLunar: getValue(row, '农历') === '是' || getValue(row, '亡者农历') === '是',
      deceasedName: getValue(row, '亡者姓名'),
      deceasedName2: getValue(row, '第二亡者'),
      deathDate: getValue(row, '忌日'),
      deathLunar: getValue(row, '忌日农历') === '是',
      birthDate2: getValue(row, '第二亡者生日'),
      deathDate2: getValue(row, '第二亡者忌日'),
      dedicationType: getValue(row, '牌位主体'),
      yangShang: getValue(row, '阳上'),
      phone: getValue(row, '电话'),
      address: getValue(row, '地址'),
      blessingText: getValue(row, '祝福语'),
      startDate: getRawValue(row, '开始日期'),
      endDate: getRawValue(row, '结束日期')
    })

    const importKeys = rows
      .map(row => {
        const mapped = typeMap[getValue(row, '牌位类型')]
        return mapped ? buildPlaqueImportDuplicateKey(createImportIdentity(mapped, row)) : ''
      })
      .filter(Boolean)

    const [existingLongevity, existingRebirth, existingDeliverance] = await Promise.all([
      importKeys.some(k => k.startsWith('LONGEVITY|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'LONGEVITY', status: 'ACTIVE' },
        select: {
          holderName: true,
          longevitySubtype: true,
          size: true,
          gender: true,
          birthDate: true,
          birthLunar: true,
          yangShang: true,
          phone: true,
          address: true,
          blessingText: true,
          startDate: true,
          endDate: true
        }
      }) : [],
      importKeys.some(k => k.startsWith('REBIRTH|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'REBIRTH', status: 'ACTIVE' },
        select: {
          deceasedName: true,
          deceasedName2: true,
          size: true,
          gender: true,
          birthDate: true,
          birthLunar: true,
          deathDate: true,
          deathLunar: true,
          birthDate2: true,
          deathDate2: true,
          yangShang: true,
          phone: true,
          address: true,
          startDate: true,
          endDate: true
        }
      }) : [],
      importKeys.some(k => k.startsWith('DELIVERANCE|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'DELIVERANCE', status: 'ACTIVE' },
        select: {
          dedicationType: true,
          size: true,
          yangShang: true,
          phone: true,
          address: true,
          startDate: true,
          endDate: true
        }
      }) : []
    ])

    const existingKeySet = new Set<string>()
    existingLongevity.forEach(p => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({
        plaqueType: 'LONGEVITY',
        holderName: p.holderName,
        longevitySubtype: p.longevitySubtype,
        size: p.size,
        gender: p.gender,
        birthDate: p.birthDate,
        birthLunar: p.birthLunar,
        yangShang: p.yangShang,
        phone: p.phone,
        address: p.address,
        blessingText: p.blessingText,
        startDate: p.startDate,
        endDate: p.endDate
      }))
    })
    existingRebirth.forEach(p => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({
        plaqueType: 'REBIRTH',
        deceasedName: p.deceasedName,
        deceasedName2: p.deceasedName2,
        size: p.size,
        gender: p.gender,
        birthDate: p.birthDate,
        birthLunar: p.birthLunar,
        deathDate: p.deathDate,
        deathLunar: p.deathLunar,
        birthDate2: p.birthDate2,
        deathDate2: p.deathDate2,
        yangShang: p.yangShang,
        phone: p.phone,
        address: p.address,
        startDate: p.startDate,
        endDate: p.endDate
      }))
    })
    existingDeliverance.forEach(p => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({
        plaqueType: 'DELIVERANCE',
        dedicationType: p.dedicationType,
        size: p.size,
        yangShang: p.yangShang,
        phone: p.phone,
        address: p.address,
        startDate: p.startDate,
        endDate: p.endDate
      }))
    })

    const successCount = { current: 0 }
    const errors: string[] = []
    const seenKeys = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      try {
        const plaqueType = getValue(row, '牌位类型')
        const validTypes = ['延生禄位', '往生莲位', '超度牌位']

        if (!validTypes.includes(plaqueType)) {
          errors.push('第 ' + rowNum + ' 行: 无效的牌位类型 "' + plaqueType + '"')
          continue
        }

        const plaqueData: any = {
          plaqueType: typeMap[plaqueType],
          status: 'ACTIVE',
        }

        if (plaqueData.plaqueType === 'LONGEVITY') {
          const holderName = getValue(row, '牌位主体')
          if (!holderName) {
            errors.push('第 ' + rowNum + ' 行: 延生禄位缺少牌位主体')
            continue
          }
          plaqueData.holderName = holderName
          plaqueData.longevitySubtype = getOptionalValue(row, '禄位类型')
          plaqueData.size = getOptionalValue(row, '规格')
          plaqueData.gender = getOptionalValue(row, '性别')
          plaqueData.birthDate = getOptionalValue(row, '出生日期')
          plaqueData.birthLunar = getValue(row, '农历') === '是'
          plaqueData.blessingText = getOptionalValue(row, '祝福语')
        } else if (plaqueData.plaqueType === 'REBIRTH') {
          const deceasedName = getValue(row, '亡者姓名')
          if (!deceasedName) {
            errors.push('第 ' + rowNum + ' 行: 往生莲位缺少亡者姓名')
            continue
          }
          plaqueData.deceasedName = deceasedName
          plaqueData.size = getOptionalValue(row, '规格')
          plaqueData.gender = getOptionalValue(row, '性别')
          plaqueData.birthDate = getOptionalValue(row, '出生日期')
          plaqueData.birthLunar = getValue(row, '亡者农历') === '是'
          plaqueData.deathDate = getOptionalValue(row, '忌日')
          plaqueData.deathLunar = getValue(row, '忌日农历') === '是'
          plaqueData.deceasedName2 = getOptionalValue(row, '第二亡者')
          plaqueData.birthDate2 = getOptionalValue(row, '第二亡者生日')
          plaqueData.deathDate2 = getOptionalValue(row, '第二亡者忌日')
        } else if (plaqueData.plaqueType === 'DELIVERANCE') {
          const dedicationType = getValue(row, '牌位主体')
          if (!dedicationType) {
            errors.push('第 ' + rowNum + ' 行: 超度牌位缺少牌位主体')
            continue
          }
          plaqueData.dedicationType = dedicationType
          plaqueData.size = getOptionalValue(row, '规格')
        }

        const key = buildPlaqueImportDuplicateKey(createImportIdentity(plaqueData.plaqueType, row))
        const label = getValue(row, '牌位主体') || getValue(row, '亡者姓名') || key

        if (seenKeys.has(key)) {
          errors.push('第 ' + rowNum + ' 行: 文件内重复 ("' + label + '")')
          continue
        }
        if (existingKeySet.has(key)) {
          errors.push('第 ' + rowNum + ' 行: 数据库已存在 ("' + label + '")')
          continue
        }
        seenKeys.add(key)

        plaqueData.yangShang = getOptionalValue(row, '阳上')
        plaqueData.phone = getOptionalValue(row, '电话')
        plaqueData.address = getOptionalValue(row, '地址')

        const parsedStartDate = parseSpreadsheetDateValue(getRawValue(row, '开始日期'))
        const parsedEndDate = parseSpreadsheetDateValue(getRawValue(row, '结束日期'))
        if (parsedStartDate) plaqueData.startDate = parsedStartDate
        if (parsedEndDate) plaqueData.endDate = parsedEndDate
        if (plaqueData.startDate && plaqueData.endDate && plaqueData.endDate < plaqueData.startDate) {
          errors.push('第 ' + rowNum + ' 行: 结束日期不能早于开始日期')
          continue
        }

        plaqueData.remarks = getOptionalValue(row, '备注')

        await prisma.memorialPlaque.create({ data: plaqueData })
        await logOperation(req.user, 'CREATE', 'plaque', 'import_' + i, null, plaqueData)
        successCount.current++
      } catch (rowError) {
        const msg = rowError instanceof Error ? rowError.message : '未知错误'
        errors.push('第 ' + rowNum + ' 行: ' + msg)
      }
    }

    res.json({
      success: true,
      data: {
        success: successCount.current,
        failed: errors.length,
        errors: errors.slice(0, 50)
      }
    })
  } catch (error) {
    console.error('Import plaques error:', error)
    const msg = error instanceof Error ? error.message : '未知错误'
    res.status(500).json({ success: false, error: '导入失败: ' + msg })
  }
})


export default router
