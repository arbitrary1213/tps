import { Router, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { submitRequestSchema } from './validation'
import { prisma } from '../lib/prisma'

const router = Router()

const PLAQUE_TASK_TYPES = new Set(['PLAQUE', 'LONGEVITY', 'DELIVERANCE', 'REBIRTH'])
const LAMP_TASK_TYPES = new Set(['LAMP', 'LAMPOFFERING'])

function normalizeVolunteerPayload(data: any) {
  const payload: Record<string, any> = {
    name: data.name,
    dharmaName: data.dharmaName,
    gender: data.gender,
    phone: data.phone,
    address: data.address,
    ethnicity: data.ethnicity,
    education: data.education,
    emergencyContact: data.emergencyContact,
    currentOccupation: data.currentOccupation,
    healthStatus: data.healthStatus,
    hasInfectiousDisease: data.hasInfectiousDisease,
    hasAllergy: data.hasAllergy,
    hasSpecialNeeds: data.hasSpecialNeeds,
    firstContactBuddhism: data.firstContactBuddhism,
    hasTakenRefuge: data.hasTakenRefuge,
    willingToLearn: data.willingToLearn,
    guidanceHope: data.guidanceHope,
    hasVolunteerExperience: data.hasVolunteerExperience,
    lastVolunteerLocation: data.lastVolunteerLocation,
    lastVolunteerContent: data.lastVolunteerContent,
    serviceDuration: data.serviceDuration,
    signature: data.signature,
  }

  const arrayFields = ['preceptsHeld', 'skills']
  for (const key of arrayFields) {
    if (Array.isArray(data[key]) && data[key].length > 0) payload[key] = data[key]
    else if (typeof data[key] === 'string' && data[key] !== '') payload[key] = [data[key]]
  }

  const intFields = ['volunteerTimes']
  for (const key of intFields) {
    const value = data[key]
    if (value !== undefined && value !== null && value !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) payload[key] = parsed
    }
  }

  const dateFields = ['birthDate', 'refugeTime', 'lastVolunteerDate', 'serviceStartDate', 'serviceEndDate']
  for (const key of dateFields) {
    const value = data[key]
    if (typeof value === 'string' && !['', 'undefined', 'null'].includes(value)) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) payload[key] = parsed
    }
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') delete payload[key]
  }

  return payload
}

function parseOptionalDate(value: unknown, fallback?: Date | null) {
  if (typeof value === 'string' && !['', 'undefined', 'null'].includes(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return fallback ?? undefined
}

function shouldCreateRitualPlaque(data: Record<string, any>) {
  return Boolean(
    data.plaqueType ||
    data.holderName ||
    data.deceasedName ||
    data.deceasedName2 ||
    data.dedicationType ||
    data.customDedicationType ||
    data.longevitySubtype ||
    data.yangShang
  )
}

function buildPlaquePayload(
  data: Record<string, any>,
  taskType: string,
  submitterName: string,
  submitterPhone: string,
  fallbackEndDate?: Date | null,
) {
  const plaqueType = data.plaqueType || (taskType === 'REBIRTH' ? 'REBIRTH' : taskType === 'DELIVERANCE' ? 'DELIVERANCE' : 'LONGEVITY')
  const dedicationType = data.dedicationType === 'custom'
    ? (data.customDedicationType || data.dedicationType)
    : data.dedicationType

  const startDate = parseOptionalDate(data.startDate, fallbackEndDate || new Date())
  const defaultEndDate = fallbackEndDate
    ? new Date(fallbackEndDate)
    : new Date((startDate || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000)
  const endDate = parseOptionalDate(data.endDate, defaultEndDate)

  return {
    plaqueType,
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
    birthLunar: Array.isArray(data.birthLunar) ? data.birthLunar.includes('1') : Boolean(data.birthLunar),
    deathDate: data.deathDate,
    deathLunar: Array.isArray(data.deathLunar) ? data.deathLunar.includes('1') : Boolean(data.deathLunar),
    yangShang: data.yangShang || submitterName,
    phone: data.phone || submitterPhone,
    address: data.address,
    dedicationType,
    longevitySubtype: data.longevitySubtype,
    size: data.size,
    blessingText: data.blessingText,
    startDate,
    endDate,
    ritualId: data.ritualId || null,
  }
}

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
    const { taskType, status, startDate, endDate, updatedSince, page = 1, pageSize = 20 } = req.query

    const where: any = {}
    if (taskType) where.taskType = taskType
    if (status) where.status = status
    if (updatedSince) where.updatedAt = { gte: new Date(updatedSince as string) }
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

    console.log("[DEBUG] body:", JSON.stringify(req.body)); const { taskId, submitterName, submitterPhone, formData } = validation.data

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

    const { taskType, formData } = request
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ success: false, error: '表单数据无效' })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = formData as any

    const result = await prisma.$transaction(async (tx) => {
      if (PLAQUE_TASK_TYPES.has(taskType)) {
        await tx.memorialPlaque.create({
          data: buildPlaquePayload(data, taskType, request.submitterName, request.submitterPhone)
        })
      } else if (LAMP_TASK_TYPES.has(taskType)) {
        await tx.lampOffering.create({
          data: {
            name: data.name || request.submitterName,
            phone: data.phone || request.submitterPhone,
            lampType: data.lampType,
            location: data.location,
            blessingName: data.blessingName,
            blessingType: data.blessingType,
            amount: data.amount || 0,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        })
      } else {
        switch (taskType) {
        case 'VOLUNTEER': {
          const volunteerPayload = normalizeVolunteerPayload({
            ...data,
            name: data.name || request.submitterName,
            phone: data.phone || request.submitterPhone,
          })

          let volunteer = null
          if (volunteerPayload.phone && volunteerPayload.name) {
            volunteer = await tx.volunteer.upsert({
              where: { phone: volunteerPayload.phone },
              update: volunteerPayload,
              create: volunteerPayload as any,
            })
          }

          if (data.volunteerTaskId) {
            await tx.volunteerSignup.create({
              data: {
                taskId: data.volunteerTaskId,
                volunteerId: volunteer?.id,
                volunteerName: volunteerPayload.name || request.submitterName,
                volunteerPhone: volunteerPayload.phone || request.submitterPhone,
                status: 'SIGNED_UP'
              }
            })
            await tx.volunteerTask.update({
              where: { id: data.volunteerTaskId },
              data: { currentCount: { increment: 1 } }
            })
          }
          break
        }

        case 'RITUAL': {
          const ritual = data.ritualId
            ? await tx.ritual.findUnique({ where: { id: data.ritualId } })
            : null

          if (data.ritualId) {
            await tx.ritualParticipant.create({
              data: {
                ritualId: data.ritualId,
                name: data.name || request.submitterName,
                phone: data.phone || request.submitterPhone
              }
            })
          }

          if (shouldCreateRitualPlaque(data)) {
            await tx.memorialPlaque.create({
              data: buildPlaquePayload(
                data,
                data.plaqueType || 'LONGEVITY',
                request.submitterName,
                request.submitterPhone,
                ritual?.ritualDate || null,
              )
            })
          }
          break
        }

        case 'ACCOMMODATION':
          const roomId = data.roomId
          if (roomId) {
            const room = await tx.room.findUnique({ where: { id: roomId } })
            if (room && room.status === 'AVAILABLE') {
              await tx.accommodationRecord.create({
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
              await tx.room.update({
                where: { id: roomId },
                data: { status: 'OCCUPIED' }
              })
            }
          }
          break

        case 'DINING':
          await tx.diningReservation.create({
            data: {
              mealType: data.mealType || 'LUNCH',
              date: (data.mealDate || data.date) ? new Date(data.mealDate || data.date) : new Date(),
              contactName: request.submitterName,
              contactPhone: request.submitterPhone,
              mealCount: data.mealCount || 1,
              amount: data.amount || 0
            }
          })
          break
        }
      }

      const updated = await tx.registrationRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: req.user!.userId,
          approvedAt: new Date()
        }
      })

      await tx.operationLog.create({
        data: {
          userId: req.user!.userId,
          username: req.user!.username,
          action: 'APPROVE',
          targetType: 'registration_request',
          targetId: id,
          afterValue: { status: 'APPROVED' }
        }
      })

      return updated
    })

    res.json({ success: true, data: result })
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
