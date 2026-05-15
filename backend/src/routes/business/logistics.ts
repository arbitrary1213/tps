import { Router, Response } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import { authMiddleware, AuthRequest } from '../../middleware/auth'
import { logOperation, prisma } from './shared'

const router = Router()

router.get('/donations', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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
      orderBy: { donationDate: 'desc' },
    })
    res.json({ success: true, data: donations })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.post('/donations', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    if (data.donationDate && typeof data.donationDate === 'string') {
      data.donationDate = new Date(data.donationDate)
    }
    const donation = await prisma.donation.create({ data })
    await logOperation(req.user, 'CREATE', 'donation', donation.id, null, donation)
    res.json({ success: true, data: donation })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/warehouse/items', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query
    const where: any = {}
    if (category) where.category = category

    const items = await prisma.warehouseItem.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: items })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.post('/warehouse/items', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.warehouseItem.create({ data: req.body })
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.put('/warehouse/items/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.warehouseItem.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.post('/warehouse/in', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, quantity, price, supplier } = req.body
    const record = await prisma.warehouseIn.create({
      data: { itemId, quantity, price, supplier, operator: req.user!.username },
    })
    await prisma.warehouseItem.update({
      where: { id: itemId },
      data: { stock: { increment: quantity } },
    })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.post('/warehouse/out', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, quantity, purpose } = req.body
    const record = await prisma.warehouseOut.create({
      data: { itemId, quantity, purpose, operator: req.user!.username },
    })
    await prisma.warehouseItem.update({
      where: { id: itemId },
      data: { stock: { decrement: quantity } },
    })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/rooms/available', async (_req, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { roomNumber: 'asc' },
    })
    res.json({ success: true, data: rooms })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/rooms', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { roomNumber: 'asc' } })
    res.json({ success: true, data: rooms })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/rooms', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const room = await prisma.room.create({ data: req.body })
    res.json({ success: true, data: room })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.put('/rooms/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: room })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/accommodations', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.accommodationRecord.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/accommodations', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    for (const field of ['checkInDate', 'checkOutDate']) {
      const value = data[field]
      if (typeof value === 'string') {
        if (['', 'undefined', 'null'].includes(value)) delete data[field]
        else {
          const parsed = new Date(value)
          data[field] = Number.isNaN(parsed.getTime()) ? undefined : parsed
        }
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
}))

router.put('/accommodations/:id/checkout', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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
      data: { status: 'CHECKED_OUT', checkOutDate: new Date() },
    })
    if (record.roomId) {
      await prisma.room.update({ where: { id: record.roomId }, data: { status: 'AVAILABLE' } })
    }
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
}))

router.get('/dining', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.diningReservation.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/dining', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body, operator: req.user!.username }
    for (const field of ['mealDate']) {
      const value = data[field]
      if (typeof value === 'string') {
        if (['', 'undefined', 'null'].includes(value)) delete data[field]
        else {
          const parsed = new Date(value)
          data[field] = Number.isNaN(parsed.getTime()) ? undefined : parsed
        }
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
}))

router.get('/visits', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
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
}))

router.post('/visits', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = { ...req.body }
    for (const field of ['visitDate']) {
      const value = data[field]
      if (typeof value === 'string') {
        if (['', 'undefined', 'null'].includes(value)) delete data[field]
        else {
          const parsed = new Date(value)
          data[field] = Number.isNaN(parsed.getTime()) ? undefined : parsed
        }
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
}))

export default router
