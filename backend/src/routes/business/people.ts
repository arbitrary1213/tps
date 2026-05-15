import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { authMiddleware, AuthRequest } from '../../middleware/auth'
import { logOperation, normalizeDateFields, prisma } from './shared'

const router = Router()

router.get('/monks', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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

router.post('/monks', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    normalizeDateFields(data, ['birthDate', 'ordinationDate'])

    const monk = await prisma.monk.create({ data })
    await logOperation(req.user, 'CREATE', 'monk', monk.id, null, monk)
    res.json({ success: true, data: monk })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/monks/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const before = await prisma.monk.findUnique({ where: { id: req.params.id } })
    const monk = await prisma.monk.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'monk', monk.id, before, monk)
    res.json({ success: true, data: monk })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/monks/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await prisma.monk.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'monk', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/volunteers', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { status, rank, keyword } = req.query
    const where: any = {}
    if (status) where.status = status
    if (rank) where.rank = rank
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ]
    }

    const volunteers = await prisma.volunteer.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: volunteers })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/volunteers', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.create({ data: req.body })
    await logOperation(req.user, 'CREATE', 'volunteer', volunteer.id, null, volunteer)
    res.json({ success: true, data: volunteer })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/volunteers/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const before = await prisma.volunteer.findUnique({ where: { id: req.params.id } })
    const volunteer = await prisma.volunteer.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'volunteer', volunteer.id, before, volunteer)
    res.json({ success: true, data: volunteer })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/volunteers/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await prisma.volunteer.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } })
    await logOperation(req.user, 'DELETE', 'volunteer', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/volunteer-tasks', async (req: Request, res: Response) => {
  try {
    const { status, taskDate } = req.query
    const where: any = {}
    if (status) where.status = status
    if (taskDate) where.taskDate = new Date(taskDate as string)

    const tasks = await prisma.volunteerTask.findMany({
      where,
      include: { _count: { select: { signups: true } } },
      orderBy: { taskDate: 'desc' },
    })
    res.json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/volunteer-tasks', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, createdBy: req.user!.userId }
    normalizeDateFields(data, ['taskDate'])
    const task = await prisma.volunteerTask.create({ data })
    await logOperation(req.user, 'CREATE', 'volunteer_task', task.id, null, task)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/volunteer-tasks/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.volunteerTask.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'volunteer_task', task.id, null, task)
    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/volunteer-tasks/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await prisma.volunteerTask.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'volunteer_task', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

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
        data: { taskId, volunteerName, volunteerPhone, status: 'CHECKED_IN', checkInTime: new Date() },
      })

      await tx.volunteerTask.update({
        where: { id: taskId },
        data: { currentCount: { increment: 1 } },
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
      orderBy: { checkInTime: 'desc' },
    })
    if (signup) {
      const checkOutTime = new Date()
      const serviceHours = (checkOutTime.getTime() - (signup.checkInTime?.getTime() || 0)) / (1000 * 60 * 60)
      await prisma.volunteerSignup.update({
        where: { id: signup.id },
        data: { status: 'CHECKED_OUT', checkOutTime, serviceHours },
      })
      await prisma.volunteer.updateMany({
        where: { phone: volunteerPhone },
        data: { totalHours: { increment: serviceHours } },
      })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/devotees', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { keyword, tag, updatedSince } = req.query
    const where: any = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { phone: { contains: keyword as string } },
      ]
    }
    if (tag) where.tags = { has: tag as string }
    if (updatedSince) where.updatedAt = { gte: new Date(updatedSince as string) }

    const devotees = await prisma.devotee.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: devotees })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/devotees', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, createdBy: req.user!.username }
    normalizeDateFields(data, ['birthday', 'firstVisitDate', 'lastVisitDate'])
    const devotee = await prisma.devotee.create({ data })
    await logOperation(req.user, 'CREATE', 'devotee', devotee.id, null, devotee)
    res.json({ success: true, data: devotee })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/devotees/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const devotee = await prisma.devotee.update({ where: { id: req.params.id }, data: req.body })
    await logOperation(req.user, 'UPDATE', 'devotee', devotee.id, null, devotee)
    res.json({ success: true, data: devotee })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/devotees/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await prisma.devotee.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'devotee', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
