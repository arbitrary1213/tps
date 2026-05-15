import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { authMiddleware, AuthRequest } from '../../middleware/auth'
import { logOperation, normalizeDateFields, prisma } from './shared'

const router = Router()

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

router.post('/rituals', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    for (const field of ['ritualDate', 'registrationDeadline']) {
      const value = data[field]
      if (typeof value === 'string') {
        if (['', 'undefined', 'null'].includes(value)) delete data[field]
        else {
          const parsed = new Date(value)
          data[field] = Number.isNaN(parsed.getTime()) ? undefined : parsed
        }
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
}))

router.put('/rituals/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    normalizeDateFields(data, ['ritualDate', 'registrationDeadline'])
    const ritual = await prisma.ritual.update({ where: { id: req.params.id }, data })
    await logOperation(req.user, 'UPDATE', 'ritual', ritual.id, null, ritual)
    res.json({ success: true, data: ritual })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.delete('/rituals/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await prisma.ritual.delete({ where: { id: req.params.id } })
    await logOperation(req.user, 'DELETE', 'ritual', req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/rituals/:id/participants', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const participants = await prisma.ritualParticipant.findMany({
      where: { ritualId: req.params.id },
    })
    res.json({ success: true, data: participants })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.post('/rituals/:id/participants', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const participant = await prisma.ritualParticipant.create({
      data: { ...req.body, ritualId: req.params.id },
    })
    await prisma.ritual.update({
      where: { id: req.params.id },
      data: { currentParticipants: { increment: 1 } },
    })
    res.json({ success: true, data: participant })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.put('/participants/:id/check-in', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const participant = await prisma.ritualParticipant.update({
      where: { id: req.params.id },
      data: { checkedIn: true, checkInTime: new Date() },
    })
    res.json({ success: true, data: participant })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/halls', async (req: Request, res: Response) => {
  try {
    const halls = await prisma.hall.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: halls })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/halls', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const hall = await prisma.hall.create({ data: req.body })
    await logOperation(req.user, 'CREATE', 'hall', hall.id, null, hall)
    res.json({ success: true, data: hall })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.put('/halls/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const hall = await prisma.hall.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: hall })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

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

export default router
