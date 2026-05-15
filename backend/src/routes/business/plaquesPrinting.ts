import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../../middleware/auth'
import {
  buildPlaqueImportDuplicateKey,
  buildPrintClientCode,
  buildPrintJobNo,
  buildMachineToken,
  calculatePrintJobProgress,
  logOperation,
  normalizeDateFields,
  normalizeNullableForeignKeys,
  normalizeReportedItemStatus,
  parseSpreadsheetDateValue,
  prisma,
  templateAssetUpload,
  upload,
  XLSX,
} from './shared'

const router = Router()

async function generatePlaqueCode(): Promise<string> {
  const latest = await prisma.memorialPlaque.findFirst({
    where: { code: { not: null } },
    orderBy: { code: 'desc' },
    select: { code: true },
  })
  const next = latest?.code ? parseInt(latest.code, 10) + 1 : 1
  return String(next).padStart(6, '0')
}

router.get('/plaques', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plaqueType, status, keyword, devoteeId, ritualId, updatedSince } = req.query
    const where: any = {}
    if (plaqueType) where.plaqueType = plaqueType
    if (status) where.status = status
    if (devoteeId) where.devoteeId = devoteeId
    if (ritualId) where.ritualId = ritualId
    if (updatedSince) where.updatedAt = { gte: new Date(updatedSince as string) }
    if (keyword) {
      where.OR = [
        { code: { contains: keyword as string } },
        { holderName: { contains: keyword as string } },
        { yangShang: { contains: keyword as string } },
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
    const validFields = ['code', 'id', 'plaqueType', 'holderName', 'deceasedName', 'deceasedName2', 'yinGeng', 'birthDate2', 'deathDate2', 'yinGeng2', 'zodiac2', 'gender2', 'gender', 'zodiac', 'age', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'dedicationType', 'longevitySubtype', 'size', 'startDate', 'endDate', 'message', 'blessingText', 'status', 'remarks', 'templateId', 'devoteeId', 'ritualId', 'createdBy', 'createdAt', 'updatedAt']
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

    if (!data.code) data.code = await generatePlaqueCode()

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

    const parsedEndDate = typeof endDate === 'string' && endDate ? new Date(endDate) : null

    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ success: false, error: '结束日期格式无效' })
    }

    const plaques = await prisma.memorialPlaque.findMany({
      where: { id: { in: ids } },
      select: { id: true, ritualId: true, endDate: true },
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
            afterValue: { action, count: deleted.count },
          },
        })
        return { count: deleted.count }
      }

      if (action === 'associate') {
        const updated = await tx.memorialPlaque.updateMany({ where: { id: { in: ids } }, data: { ritualId } })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, ritualId, count: updated.count },
          },
        })
        return { count: updated.count }
      }

      if (action === 'clear') {
        const updated = await tx.memorialPlaque.updateMany({ where: { id: { in: ids } }, data: { ritualId: null } })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, count: updated.count },
          },
        })
        return { count: updated.count }
      }

      if (action === 'extend') {
        const updated = await tx.memorialPlaque.updateMany({
          where: { id: { in: ids } },
          data: { endDate: parsedEndDate!, status: 'ACTIVE' },
        })
        await tx.operationLog.create({
          data: {
            userId: req.user!.userId,
            username: req.user!.username,
            action: 'BATCH_UPDATE',
            targetType: 'memorial_plaque',
            targetId: batchTargetId,
            beforeValue: plaques,
            afterValue: { action, endDate, count: updated.count },
          },
        })
        return { count: updated.count }
      }

      const ritualIds = Array.from(new Set([...(ritualId ? [ritualId] : []), ...plaques.map((plaque) => plaque.ritualId).filter(Boolean)])) as string[]
      const rituals = ritualIds.length > 0
        ? await tx.ritual.findMany({ where: { id: { in: ritualIds } }, select: { id: true, ritualDate: true } })
        : []
      const ritualDateMap = new Map(rituals.filter((ritual) => ritual.ritualDate).map((ritual) => [ritual.id, ritual.ritualDate]))

      for (const plaque of plaques) {
        const archiveDate = parsedEndDate
          || (ritualId ? ritualDateMap.get(ritualId) : undefined)
          || (plaque.ritualId ? ritualDateMap.get(plaque.ritualId) : undefined)
          || plaque.endDate
          || new Date()

        await tx.memorialPlaque.update({
          where: { id: plaque.id },
          data: { status: 'EXPIRED', endDate: archiveDate },
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
          afterValue: { action, ritualId: ritualId || null, endDate: endDate || null, count: plaques.length },
        },
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
    const validFields = ['code', 'id', 'plaqueType', 'holderName', 'deceasedName', 'deceasedName2', 'yinGeng', 'birthDate2', 'deathDate2', 'yinGeng2', 'zodiac2', 'gender2', 'gender', 'zodiac', 'age', 'birthDate', 'birthLunar', 'deathDate', 'deathLunar', 'yangShang', 'phone', 'address', 'dedicationType', 'longevitySubtype', 'size', 'startDate', 'endDate', 'message', 'blessingText', 'status', 'remarks', 'templateId', 'devoteeId', 'ritualId', 'createdBy', 'createdAt', 'updatedAt']
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
    const { status, sourceType, updatedSince } = req.query
    const where: any = {}
    if (status) where.status = status
    if (sourceType) where.sourceType = sourceType
    if (updatedSince) where.updatedAt = { gte: new Date(updatedSince as string) }
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
    const { sourceType = 'PLAQUE', plaqueIds, templateId, templateName, templateSnapshot, plaqueType, paperWidthMm, paperHeightMm, printClientId, remarks } = req.body || {}

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
      },
    })

    if (!plaques.length) {
      return res.status(400).json({ success: false, error: '未找到可打印的牌位数据' })
    }

    const missingIds = plaqueIds.filter((id: string) => !plaques.some((plaque) => plaque.id === id))
    const orderedPlaques = plaqueIds.map((id: string) => plaques.find((plaque) => plaque.id === id)).filter(Boolean)

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
        },
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
          })),
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
          afterValue: { totalCount: orderedPlaques.length, plaqueIds, missingIds, templateId: templateId || null, printClientId: printClientId || null },
        },
      })

      return created
    })

    res.json({ success: true, data: { id: job.id, jobNo: job.jobNo, totalCount: orderedPlaques.length, missingIds } })
  } catch (error) {
    console.error('Create print job error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/print-clients', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const clients = await prisma.printClient.findMany({
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      include: { _count: { select: { jobs: true } } },
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
      },
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
      },
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
      data: { status: 'ONLINE', lastSeenAt: new Date(), lastIp: req.ip || client.lastIp || '' },
    })

    const job = await prisma.printJob.findFirst({
      where: {
        OR: [
          { printClientId: client.id, status: { in: ['PENDING', 'DISPATCHED', 'PRINTING', 'FAILED'] } },
          { printClientId: null, status: 'PENDING' },
        ],
      },
      include: {
        items: { where: { status: { in: ['PENDING', 'PRINTING', 'FAILED'] } }, orderBy: { seqNo: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!job) {
      return res.json({ success: true, data: null })
    }

    const assignedJob = job.printClientId === client.id
      ? job
      : await prisma.printJob.update({
          where: { id: job.id },
          data: { printClientId: client.id, status: 'DISPATCHED' },
          include: {
            items: { where: { status: { in: ['PENDING', 'PRINTING', 'FAILED'] } }, orderBy: { seqNo: 'asc' } },
          },
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

    const job = await prisma.printJob.findUnique({ where: { id: req.params.jobId }, include: { items: true, printClient: true } })
    if (!job || !job.printClient || job.printClient.machineToken !== machineToken) {
      return res.status(401).json({ success: false, error: '客户端认证失败' })
    }

    await prisma.printJobItem.update({
      where: { id: req.params.itemId },
      data: {
        status: nextStatus,
        printedAt: nextStatus === 'COMPLETED' ? new Date() : null,
        errorMessage: nextStatus === 'FAILED' ? (errorMessage || '打印失败') : null,
      },
    })

    const items = await prisma.printJobItem.findMany({ where: { jobId: job.id } })
    const progress = calculatePrintJobProgress(items)

    const updatedJob = await prisma.printJob.update({
      where: { id: job.id },
      data: { printedCount: progress.printedCount, failedCount: progress.failedCount, status: progress.status },
    })

    res.json({ success: true, data: updatedJob })
  } catch (error) {
    console.error('Report print item error:', error)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/plaque-templates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { updatedSince } = req.query
    const where: any = {}
    if (updatedSince) where.updatedAt = { gte: new Date(updatedSince as string) }
    const templates = await prisma.plaqueTemplate.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: templates })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.get('/plaque-templates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.plaqueTemplate.findUnique({ where: { id: req.params.id } })
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
    const template = await prisma.plaqueTemplate.update({ where: { id: req.params.id }, data: req.body })
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
      },
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

    const allRows: any[][] = []
    let headers: string[] = []

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (data.length < 2) continue

      const sheetHeaders = data[0].map((h: any) => String(h).trim())

      if (headers.length === 0) {
        headers = sheetHeaders
      } else if (sheetHeaders.join(',') !== headers.join(',')) {
        continue
      }

      const sheetRows = data.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))
      allRows.push(...sheetRows)
    }

    if (headers.length === 0 || allRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel 文件为空或格式不正确' })
    }

    const rows = allRows

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

    const typeMap: Record<string, 'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE'> = {
      '延生禄位': 'LONGEVITY',
      '往生莲位': 'REBIRTH',
      '超度牌位': 'DELIVERANCE',
    }

    const createImportIdentity = (mappedType: 'LONGEVITY' | 'REBIRTH' | 'DELIVERANCE', row: any[]) => ({
      plaqueType: mappedType,
      holderName: getValue(row, '牌位主体'),
      longevitySubtype: getValue(row, '禄位类型'),
      size: getValue(row, '规格'),
      gender: getValue(row, '性别'),
      birthDate: getValue(row, '亡者生日') || getValue(row, '出生日期'),
      birthLunar: getValue(row, '农历') === '是' || getValue(row, '亡者农历') === '是',
      deceasedName: getValue(row, '亡者') || getValue(row, '亡者姓名'),
      deceasedName2: getValue(row, '亡者二') || getValue(row, '第二亡者'),
      yinGeng: getValue(row, '亡者阴庚') || getValue(row, '阴庚'),
      deathDate: getValue(row, '亡者忌日') || getValue(row, '忌日'),
      deathLunar: getValue(row, '忌日农历') === '是',
      birthDate2: getValue(row, '亡者二生日') || getValue(row, '第二亡者生日'),
      deathDate2: getValue(row, '亡者二忌日') || getValue(row, '第二亡者忌日'),
      yinGeng2: getValue(row, '亡者二阴庚') || getValue(row, '第二亡者阴庚'),
      dedicationType: getValue(row, '牌位主体'),
      yangShang: getValue(row, '阳上'),
      phone: getValue(row, '电话'),
      address: getValue(row, '地址'),
      blessingText: getValue(row, '祝福语'),
      startDate: getRawValue(row, '开始日期'),
      endDate: getRawValue(row, '结束日期'),
    })

    const importKeys = rows
      .map((row) => {
        const mapped = typeMap[getValue(row, '牌位类型') as keyof typeof typeMap]
        return mapped ? buildPlaqueImportDuplicateKey(createImportIdentity(mapped, row)) : ''
      })
      .filter(Boolean)

    const [existingLongevity, existingRebirth, existingDeliverance] = await Promise.all([
      importKeys.some((k) => k.startsWith('LONGEVITY|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'LONGEVITY', status: 'ACTIVE' },
        select: { holderName: true, longevitySubtype: true, size: true, gender: true, birthDate: true, birthLunar: true, yangShang: true, phone: true, address: true, blessingText: true, startDate: true, endDate: true },
      }) : [],
      importKeys.some((k) => k.startsWith('REBIRTH|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'REBIRTH', status: 'ACTIVE' },
        select: { deceasedName: true, deceasedName2: true, yinGeng: true, size: true, gender: true, birthDate: true, birthLunar: true, deathDate: true, deathLunar: true, birthDate2: true, deathDate2: true, yinGeng2: true, yangShang: true, phone: true, address: true, startDate: true, endDate: true },
      }) : [],
      importKeys.some((k) => k.startsWith('DELIVERANCE|')) ? prisma.memorialPlaque.findMany({
        where: { plaqueType: 'DELIVERANCE', status: 'ACTIVE' },
        select: { dedicationType: true, deceasedName: true, deceasedName2: true, yinGeng: true, size: true, birthDate: true, deathDate: true, yinGeng2: true, birthDate2: true, deathDate2: true, yangShang: true, phone: true, address: true, startDate: true, endDate: true },
      }) : [],
    ])

    const existingKeySet = new Set<string>()
    existingLongevity.forEach((p) => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({ plaqueType: 'LONGEVITY', holderName: p.holderName, longevitySubtype: p.longevitySubtype, size: p.size, gender: p.gender, birthDate: p.birthDate, birthLunar: p.birthLunar, yangShang: p.yangShang, phone: p.phone, address: p.address, blessingText: p.blessingText, startDate: p.startDate, endDate: p.endDate }))
    })
    existingRebirth.forEach((p) => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({ plaqueType: 'REBIRTH', deceasedName: p.deceasedName, deceasedName2: p.deceasedName2, yinGeng: p.yinGeng, size: p.size, gender: p.gender, birthDate: p.birthDate, birthLunar: p.birthLunar, deathDate: p.deathDate, deathLunar: p.deathLunar, birthDate2: p.birthDate2, deathDate2: p.deathDate2, yinGeng2: p.yinGeng2, yangShang: p.yangShang, phone: p.phone, address: p.address, startDate: p.startDate, endDate: p.endDate }))
    })
    existingDeliverance.forEach((p) => {
      existingKeySet.add(buildPlaqueImportDuplicateKey({ plaqueType: 'DELIVERANCE', dedicationType: p.dedicationType, deceasedName: p.deceasedName, deceasedName2: p.deceasedName2, yinGeng: p.yinGeng, size: p.size, birthDate: p.birthDate, deathDate: p.deathDate, yinGeng2: p.yinGeng2, birthDate2: p.birthDate2, deathDate2: p.deathDate2, yangShang: p.yangShang, phone: p.phone, address: p.address, startDate: p.startDate, endDate: p.endDate }))
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

        const plaqueData: any = { plaqueType: typeMap[plaqueType as keyof typeof typeMap], status: 'ACTIVE' }

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
          plaqueData.birthLunar = getValue(row, '亡者农历') === '是' || getValue(row, '农历') === '是'
          plaqueData.deathDate = getOptionalValue(row, '忌日')
          plaqueData.deathLunar = getValue(row, '忌日农历') === '是'
          plaqueData.yinGeng = getOptionalValue(row, '亡者阴庚') || getOptionalValue(row, '阴庚')
          plaqueData.deceasedName2 = getOptionalValue(row, '亡者二') || getOptionalValue(row, '第二亡者')
          plaqueData.birthDate2 = getOptionalValue(row, '亡者二生日') || getOptionalValue(row, '第二亡者生日')
          plaqueData.deathDate2 = getOptionalValue(row, '亡者二忌日') || getOptionalValue(row, '第二亡者忌日')
          plaqueData.yinGeng2 = getOptionalValue(row, '亡者二阴庚') || getOptionalValue(row, '第二亡者阴庚')
        } else if (plaqueData.plaqueType === 'DELIVERANCE') {
          const dedicationType = getValue(row, '牌位主体')
          if (!dedicationType) {
            errors.push('第 ' + rowNum + ' 行: 超度牌位缺少牌位主体')
            continue
          }
          plaqueData.dedicationType = dedicationType
          plaqueData.size = getOptionalValue(row, '规格')
          plaqueData.deceasedName = getOptionalValue(row, '亡者')
          plaqueData.yinGeng = getOptionalValue(row, '亡者阴庚')
          plaqueData.birthDate = getOptionalValue(row, '亡者生日')
          plaqueData.deathDate = getOptionalValue(row, '亡者忌日')
          plaqueData.deceasedName2 = getOptionalValue(row, '亡者二')
          plaqueData.yinGeng2 = getOptionalValue(row, '亡者二阴庚')
          plaqueData.birthDate2 = getOptionalValue(row, '亡者二生日')
          plaqueData.deathDate2 = getOptionalValue(row, '亡者二忌日')
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
        plaqueData.message = getOptionalValue(row, '寄语')
        if (!plaqueData.blessingText) plaqueData.blessingText = plaqueData.message

        const parsedStartDate = parseSpreadsheetDateValue(getRawValue(row, '开始日期'))
        const parsedEndDate = parseSpreadsheetDateValue(getRawValue(row, '结束日期'))
        if (parsedStartDate) plaqueData.startDate = parsedStartDate
        if (parsedEndDate) plaqueData.endDate = parsedEndDate
        if (plaqueData.startDate && plaqueData.endDate && plaqueData.endDate < plaqueData.startDate) {
          errors.push('第 ' + rowNum + ' 行: 结束日期不能早于开始日期')
          continue
        }

        plaqueData.remarks = getOptionalValue(row, '备注')
        if (!plaqueData.code) plaqueData.code = await generatePlaqueCode()

        await prisma.memorialPlaque.create({ data: plaqueData })
        await logOperation(req.user, 'CREATE', 'plaque', 'import_' + i, null, plaqueData)
        successCount.current++
      } catch (rowError) {
        const msg = rowError instanceof Error ? rowError.message : '未知错误'
        errors.push('第 ' + rowNum + ' 行: ' + msg)
      }
    }

    res.json({ success: true, data: { success: successCount.current, failed: errors.length, errors: errors.slice(0, 50) } })
  } catch (error) {
    console.error('Import plaques error:', error)
    const msg = error instanceof Error ? error.message : '未知错误'
    res.status(500).json({ success: false, error: '导入失败: ' + msg })
  }
})

export default router
