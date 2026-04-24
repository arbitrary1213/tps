import { Router, Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { submitRequestSchema } from './validation'

const router = Router()
const prisma = new PrismaClient()

// 获取登记任务列表（公开，获取已启用的）
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.registrationTask.findMany({
      where: { enabled: true },
      orderBy: { sort: 'asc' }
    })
    res.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 获取所有登记任务（需认证，含禁用的）
router.get('/tasks/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.registrationTask.findMany({
      orderBy: { sort: 'asc' }
    })
    res.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Get all tasks error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 创建登记任务（需认证）
router.post('/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, taskType, description, enabled, formConfig, sort } = req.body

    const task = await prisma.registrationTask.create({
      data: {
        name,
        taskType,
        description,
        enabled: enabled ?? false,
        formConfig,
        sort: sort ?? 0
      }
    })

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'CREATE',
        targetType: 'registration_task',
        targetId: task.id,
        afterValue: task
      }
    })

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 更新登记任务（需认证）
router.put('/tasks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, taskType, description, enabled, formConfig, sort } = req.body

    const task = await prisma.registrationTask.update({
      where: { id },
      data: { name, taskType, description, enabled, formConfig, sort }
    })

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'UPDATE',
        targetType: 'registration_task',
        targetId: id,
        afterValue: task
      }
    })

    res.json({ success: true, data: task })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 删除登记请求（需认证）
router.delete('/requests/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    await prisma.registrationRequest.delete({ where: { id } })
    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'DELETE',
        targetType: 'registration_request',
        targetId: id
      }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete request error:', error)
    res.status(500).json({ success: false, error: '删除失败' })
  }
})

// 删除登记任务（需认证）
router.delete('/tasks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // 检查是否有已提交的申请
    const count = await prisma.registrationRequest.count({ where: { taskId: id } })
    if (count > 0) {
      return res.status(400).json({ success: false, error: '该任务已有登记申请，无法删除' })
    }

    await prisma.registrationTask.delete({ where: { id } })

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'DELETE',
        targetType: 'registration_task',
        targetId: id
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 获取登记请求列表（需认证）
router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, status, startDate, endDate, page = 1, pageSize = 20 } = req.query

    const where: any = {}
    if (taskType) where.taskType = taskType
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const [requests, total] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        include: { task: true },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize)
      }),
      prisma.registrationRequest.count({ where })
    ])

    res.json({ success: true, data: { list: requests, total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (error) {
    console.error('Get requests error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 提交登记请求（公开）
router.post('/requests', async (req: Request, res: Response) => {
  try {
    const validation = submitRequestSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors[0].message })
    }

    const { taskId, submitterName, submitterPhone, formData } = validation.data

    if (!taskId || !submitterName || !submitterPhone) {
      return res.status(400).json({ success: false, error: '请填写必填字段' })
    }

    const task = await prisma.registrationTask.findUnique({ where: { id: taskId } })
    if (!task) {
      return res.status(404).json({ success: false, error: '登记任务不存在' })
    }

    const request = await prisma.registrationRequest.create({
      data: {
        taskId,
        taskType: task.taskType,
        submitterName,
        submitterPhone,
        formData: formData as Prisma.InputJsonValue,
        status: 'PENDING'
      }
    })

    res.json({ success: true, data: request })
  } catch (error) {
    console.error('Submit request error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 审批通过（需认证）
router.put('/requests/:id/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const request = await prisma.registrationRequest.findUnique({
      where: { id },
      include: { task: true }
    })

    if (!request) {
      return res.status(404).json({ success: false, error: '登记请求不存在' })
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: '该请求已处理' })
    }

    // 根据 taskType 分发到对应业务模块
    const { taskType, formData } = request
    const data = formData as any

    switch (taskType) {
      case 'VOLUNTEER':
        if (data.volunteerTaskId) {
          await prisma.volunteerSignup.create({
            data: {
              taskId: data.volunteerTaskId,
              volunteerName: data.name || request.submitterName,
              volunteerPhone: data.phone || request.submitterPhone,
              status: 'SIGNED_UP'
            }
          })
          await prisma.volunteerTask.update({
            where: { id: data.volunteerTaskId },
            data: { currentCount: { increment: 1 } }
          })
        }
        break

      case 'PLAQUE':
        await prisma.memorialPlaque.create({
          data: {
            plaqueType: data.plaqueType || 'LONGEVITY',
            holderName: data.holderName,
            deceasedName: data.deceasedName,
            deceasedName2: data.deceasedName2,
            birthDate2: data.birthDate2,
            deathDate2: data.deathDate2,
            zodiac2: data.zodiac2,
            gender2: data.gender2,
            gender: data.gender,
            zodiac: data.zodiac,
            birthDate: data.birthDate,
            birthLunar: data.birthLunar?.includes('1'),
            deathDate: data.deathDate,
            deathLunar: data.deathLunar?.includes('1'),
            yangShang: data.yangShang || request.submitterName,
            phone: data.phone || request.submitterPhone,
            address: data.address,
            dedicationType: data.dedicationType,
            longevitySubtype: data.longevitySubtype,
            size: data.size,
            blessingText: data.blessingText,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        })
        break

      case 'RITUAL':
        if (data.ritualId) {
          await prisma.ritualParticipant.create({
            data: {
              ritualId: data.ritualId,
              name: data.name || request.submitterName,
              phone: data.phone || request.submitterPhone
            }
          })
        }
        break

      case 'LAMPOFFERING':
        await prisma.lampOffering.create({
          data: {
            name: request.submitterName,
            phone: request.submitterPhone,
            lampType: data.lampType,
            location: data.location,
            blessingName: data.blessingName,
            blessingType: data.blessingType,
            amount: data.amount || 0,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        })
        break

      case 'ACCOMMODATION':
        const roomId = data.roomId
        if (roomId) {
          const room = await prisma.room.findUnique({ where: { id: roomId } })
          if (room && room.status === 'AVAILABLE') {
            await prisma.accommodationRecord.create({
              data: {
                roomId: room.id,
                guestName: data.name || request.submitterName,
                guestPhone: data.phone || request.submitterPhone,
                accommodationType: data.accommodationType || '住宿',
                checkInDate: data.checkInDate ? new Date(data.checkInDate) : new Date(),
                checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : null,
                status: 'CHECKED_IN'
              }
            })
          }
        }
        break

      case 'DINING':
        await prisma.diningReservation.create({
          data: {
            mealType: data.mealType || 'LUNCH',
            date: data.date ? new Date(data.date) : new Date(),
            contactName: request.submitterName,
            contactPhone: request.submitterPhone,
            mealCount: data.mealCount || 1,
            amount: data.amount || 0
          }
        })
        break
    }

    // 更新请求状态
    const updated = await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user!.userId,
        approvedAt: new Date()
      }
    })

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'APPROVE',
        targetType: 'registration_request',
        targetId: id,
        afterValue: { status: 'APPROVED' }
      }
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Approve request error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// 审批拒绝（需认证）
router.put('/requests/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const request = await prisma.registrationRequest.findUnique({ where: { id } })

    if (!request) {
      return res.status(404).json({ success: false, error: '登记请求不存在' })
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: '该请求已处理' })
    }

    const updated = await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectReason: reason,
        approvedById: req.user!.userId,
        approvedAt: new Date()
      }
    })

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'REJECT',
        targetType: 'registration_request',
        targetId: id,
        afterValue: { status: 'REJECTED', reason }
      }
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Reject request error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
