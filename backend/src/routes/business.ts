import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import * as XLSX from 'xlsx'

const router = Router()
const prisma = new PrismaClient()

const upload = multer({ storage: multer.memoryStorage() })

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
    const signup = await prisma.volunteerSignup.create({
      data: { taskId, volunteerName, volunteerPhone, status: 'CHECKED_IN', checkInTime: new Date() }
    })
    const task = await prisma.volunteerTask.findUnique({ where: { id: taskId } })
    if (task) {
      await prisma.volunteerTask.update({
        where: { id: taskId },
        data: { currentCount: task.currentCount + 1 }
      })
    }
    res.json({ success: true, data: signup })
  } catch (error) {
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
    const data = { ...req.body, createdBy: req.user!.username }
    // Clean invalid date values
    for (const _fk of ['startDate', 'endDate', 'deceasedDate', 'enlightenmentDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv)) delete data[_fk]
        else { const _fd = new Date(_fv); data[_fk] = isNaN(_fd.getTime()) ? undefined : _fd }
      }
    }
    // 转换日期字符串为 DateTime
    if (data.startDate && typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate)
    }
    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate)
    }
    const plaque = await prisma.memorialPlaque.create({ data })
    await logOperation(req.user, 'CREATE', 'memorial_plaque', plaque.id, null, plaque)
    res.json({ success: true, data: plaque })
  } catch (error: any) {
    console.error('Plaque error:', error.message, error.code)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/plaques/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    // Clean invalid date values (handles empty, '0/0/0', invalid strings)
    for (const _fk of ['startDate', 'endDate', 'deceasedDate', 'enlightenmentDate']) {
      const _fv = data[_fk]
      if (typeof _fv === 'string') {
        if (['', 'undefined', 'null'].includes(_fv) || _fv === '0/0/0' || _fv.match(/^0[\/-]0[\/-]0/)) {
          delete data[_fk]
        } else {
          try {
            const _fd = new Date(_fv)
            if (isNaN(_fd.getTime())) delete data[_fk]
            else data[_fk] = _fd
          } catch { delete data[_fk] }
        }
      } else if (_fv === undefined || _fv === null) {
        delete data[_fk]
      }
    }
    const before = await prisma.memorialPlaque.findUnique({ where: { id: req.params.id } })
    const plaque = await prisma.memorialPlaque.update({ where: { id: req.params.id }, data })
    await logOperation(req.user, 'UPDATE', 'memorial_plaque', plaque.id, before, plaque)
    res.json({ success: true, data: plaque })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/plaques/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.memorialPlaque.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
    await logOperation(req.user, 'DELETE', 'memorial_plaque', req.params.id)
    res.json({ success: true })
  } catch (error) {
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
    const ritual = await prisma.ritual.update({ where: { id: req.params.id }, data: req.body })
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
    headers.forEach((h, i) => {
      columnMap[h] = i
    })

    const requiredHeaders = ['牌位类型']
    for (const h of requiredHeaders) {
      if (!(h in columnMap)) {
        return res.status(400).json({ success: false, error: `缺少必需列: ${h}` })
      }
    }

    const getValue = (row: any[], colName: string): string => {
      const idx = columnMap[colName]
      if (idx === undefined) return ''
      const val = row[idx]
      return val !== null && val !== undefined ? String(val).trim() : ''
    }

    const getOptionalValue = (row: any[], colName: string): string | undefined => {
      const val = getValue(row, colName)
      return val || undefined
    }

    const successCount = { current: 0 }
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      try {
        const plaqueType = getValue(row, '牌位类型')
        const validTypes = ['延生禄位', '往生莲位', '超度牌位']
        const typeMap: Record<string, string> = {
          '延生禄位': 'LONGEVITY',
          '往生莲位': 'REBIRTH',
          '超度牌位': 'DELIVERANCE'
        }

        if (!validTypes.includes(plaqueType)) {
          errors.push(`第 ${rowNum} 行: 无效的牌位类型 "${plaqueType}"`)
          continue
        }

        const plaqueData: any = {
          plaqueType: typeMap[plaqueType],
          status: 'ACTIVE',
        }

        if (plaqueData.plaqueType === 'LONGEVITY') {
          const holderName = getValue(row, '姓名')
          if (!holderName) {
            errors.push(`第 ${rowNum} 行: 延生禄位缺少姓名`)
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
            errors.push(`第 ${rowNum} 行: 往生莲位缺少亡者姓名`)
            continue
          }
          plaqueData.deceasedName = deceasedName
          plaqueData.size = getOptionalValue(row, '规格')
          plaqueData.gender = getOptionalValue(row, '性别')
          plaqueData.birthDate = getOptionalValue(row, '出生日期')
          plaqueData.birthLunar = getValue(row, '农历') === '是'
          plaqueData.deathDate = getOptionalValue(row, '忌日')
          plaqueData.deathLunar = getValue(row, '忌日农历') === '是'
          plaqueData.deceasedName2 = getOptionalValue(row, '第二亡者')
          plaqueData.birthDate2 = getOptionalValue(row, '第二亡者生日')
          plaqueData.deathDate2 = getOptionalValue(row, '第二亡者忌日')
        } else if (plaqueData.plaqueType === 'DELIVERANCE') {
          const dedicationType = getValue(row, '超度类型')
          if (!dedicationType) {
            errors.push(`第 ${rowNum} 行: 超度牌位缺少超度类型`)
            continue
          }
          plaqueData.dedicationType = dedicationType
          plaqueData.size = getOptionalValue(row, '规格')
        }

        plaqueData.yangShang = getOptionalValue(row, '阳上')
        plaqueData.phone = getOptionalValue(row, '电话')
        plaqueData.address = getOptionalValue(row, '地址')

        const startDate = getValue(row, '开始日期')
        const endDate = getValue(row, '结束日期')
        if (startDate) {
          const parsed = new Date(startDate)
          if (!isNaN(parsed.getTime())) plaqueData.startDate = parsed
        }
        if (endDate) {
          const parsed = new Date(endDate)
          if (!isNaN(parsed.getTime())) plaqueData.endDate = parsed
        }

        plaqueData.remarks = getOptionalValue(row, '备注')

        await prisma.memorialPlaque.create({ data: plaqueData })
        await logOperation(req.user, 'CREATE', 'plaque', `import_${i}`, null, plaqueData)
        successCount.current++
      } catch (rowError: any) {
        errors.push(`第 ${rowNum} 行: ${rowError.message || '未知错误'}`)
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
  } catch (error: any) {
    console.error('Import plaques error:', error)
    res.status(500).json({ success: false, error: '导入失败: ' + (error.message || '未知错误') })
  }
})

export default router
