import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.post('/approve-requests', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  const { requestIds } = req.body as { requestIds: string[] }

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({ success: false, error: 'requestIds 必须是非空数组' })
  }

  const errors: string[] = []
  let success = 0
  let failed = 0

  try {
    await prisma.$transaction(async (tx) => {
      for (const id of requestIds) {
        try {
          const request = await tx.registrationRequest.findUnique({
            where: { id },
            include: { task: true }
          })

          if (!request) {
            errors.push(`ID ${id}: 登记请求不存在`)
            failed++
            continue
          }

          if (request.status !== 'PENDING') {
            errors.push(`ID ${id}: 状态已是 ${request.status}`)
            failed++
            continue
          }

          const { taskType, formData } = request
          const data = formData as any

          switch (taskType) {
            case 'VOLUNTEER':
              await tx.volunteer.create({
                data: {
                  name: data.name || request.submitterName,
                  phone: data.phone || request.submitterPhone,
                  skills: data.skills || []
                }
              })
              break

            case 'PLAQUE':
              await tx.memorialPlaque.create({
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
                await tx.ritualParticipant.create({
                  data: {
                    ritualId: data.ritualId,
                    name: data.name || request.submitterName,
                    phone: data.phone || request.submitterPhone
                  }
                })
              }
              break

            case 'LAMPOFFERING':
              await tx.lampOffering.create({
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
              if (data.roomId) {
                const room = await tx.room.findUnique({ where: { id: data.roomId } })
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
                }
              }
              break

            case 'DINING':
              await tx.diningReservation.create({
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

          await tx.registrationRequest.update({
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
              action: 'BATCH_APPROVE',
              targetType: 'registration_request',
              targetId: id,
              afterValue: { status: 'APPROVED' }
            }
          })

          success++
        } catch (err) {
          errors.push(`ID ${id}: ${err instanceof Error ? err.message : '未知错误'}`)
          failed++
        }
      }
    })

    res.json({ success, failed, errors })
  } catch (error) {
    console.error('Batch approve error:', error)
    res.status(500).json({ success: false, error: '批量审批失败' })
  }
})

router.post('/delete-volunteers', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  const { volunteerIds } = req.body as { volunteerIds: string[] }

  if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
    return res.status(400).json({ success: false, error: 'volunteerIds 必须是非空数组' })
  }

  let success = 0
  let failed = 0

  try {
    await prisma.$transaction(async (tx) => {
      for (const id of volunteerIds) {
        try {
          await tx.volunteer.delete({ where: { id } })

          await tx.operationLog.create({
            data: {
              userId: req.user!.userId,
              username: req.user!.username,
              action: 'BATCH_DELETE',
              targetType: 'volunteer',
              targetId: id
            }
          })

          success++
        } catch (err) {
          failed++
        }
      }
    })

    res.json({ success, failed })
  } catch (error) {
    console.error('Batch delete volunteers error:', error)
    res.status(500).json({ success: false, error: '批量删除义工失败' })
  }
})

router.post('/update-plaques', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  const { plaqueIds, status } = req.body as { plaqueIds: string[]; status: string }

  if (!Array.isArray(plaqueIds) || plaqueIds.length === 0) {
    return res.status(400).json({ success: false, error: 'plaqueIds 必须是非空数组' })
  }

  const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `status 必须是以下值之一: ${validStatuses.join(', ')}` })
  }

  let success = 0
  let failed = 0

  try {
    await prisma.$transaction(async (tx) => {
      for (const id of plaqueIds) {
        try {
          await tx.memorialPlaque.update({
            where: { id },
            data: { status }
          })

          await tx.operationLog.create({
            data: {
              userId: req.user!.userId,
              username: req.user!.username,
              action: 'BATCH_UPDATE',
              targetType: 'memorial_plaque',
              targetId: id,
              afterValue: { status }
            }
          })

          success++
        } catch (err) {
          failed++
        }
      }
    })

    res.json({ success, failed })
  } catch (error) {
    console.error('Batch update plaques error:', error)
    res.status(500).json({ success: false, error: '批量更新牌位状态失败' })
  }
})

router.post('/export-plaques', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  const { plaqueIds } = req.body as { plaqueIds: string[] }

  if (!Array.isArray(plaqueIds) || plaqueIds.length === 0) {
    return res.status(400).json({ success: false, error: 'plaqueIds 必须是非空数组' })
  }

  try {
    const plaques = await prisma.memorialPlaque.findMany({
      where: { id: { in: plaqueIds } },
      orderBy: { createdAt: 'desc' }
    })

    const headers = ['ID', '类型', '持名者', '亡者姓名', '性别', '生肖', '生日', '忌日', '阳上', '电话', '地址', '超度类型', '状态', '开始日期', '结束日期', '创建时间']
    const rows = plaques.map(p => [
      p.id,
      p.plaqueType,
      p.holderName || '',
      p.deceasedName || '',
      p.gender || '',
      p.zodiac || '',
      p.birthDate || '',
      p.deathDate || '',
      p.yangShang || '',
      p.phone || '',
      p.address || '',
      p.dedicationType || '',
      p.status,
      p.startDate ? p.startDate.toISOString().split('T')[0] : '',
      p.endDate ? p.endDate.toISOString().split('T')[0] : '',
      p.createdAt.toISOString()
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const buffer = Buffer.from('\ufeff' + csv, 'utf-8')

    await prisma.operationLog.create({
      data: {
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'BATCH_EXPORT',
        targetType: 'memorial_plaque',
        afterValue: { count: plaques.length, plaqueIds }
      }
    })

    const filename = `plaques_export_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv;charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Batch export plaques error:', error)
    res.status(500).json({ success: false, error: '批量导出牌位失败' })
  }
})

export default router
