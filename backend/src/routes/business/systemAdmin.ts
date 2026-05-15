import { Router, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { authMiddleware, AuthRequest } from '../../middleware/auth'
import bcrypt from 'bcryptjs'
import { logOperation, prisma } from './shared'

const router = Router()

router.get('/users', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/users', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, email, name, role },
    })
    await logOperation(req.user, 'CREATE', 'user', user.id, null, { username, email, role })
    res.json({ success: true, data: { id: user.id, username, email, name, role } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/users/:id/password', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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

router.delete('/users/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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

router.get('/logs', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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
        take: Number(pageSize),
      }),
      prisma.operationLog.count({ where }),
    ])

    res.json({ success: true, data: { list: logs, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/stats/dashboard', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [pendingCount, volunteerCount, plaqueCount, ritualCount, recentRegistrations] = await Promise.all([
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.volunteer.count({ where: { status: 'ACTIVE' } }),
      prisma.memorialPlaque.count({ where: { status: 'ACTIVE' } }),
      prisma.ritual.count({ where: { status: { in: ['PUBLISHED', 'UPCOMING'] } } }),
      prisma.registrationRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { task: true },
      }),
    ])

    res.json({
      success: true,
      data: { pendingCount, volunteerCount, plaqueCount, ritualCount, recentRegistrations },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
