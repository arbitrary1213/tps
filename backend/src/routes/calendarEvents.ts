import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth'
import { createSyncToken } from '../services/wechatIntegration'

const router = Router()

function normalizeEventInput(body: any, user?: AuthRequest['user']) {
  const calendarType = body.calendarType === 'lunar' ? 'lunar' : 'solar'
  const data: any = {
    title: String(body.title || '').trim(),
    type: String(body.type || '寺院日程').trim(),
    calendarType,
    note: body.note ? String(body.note).trim() : null,
    enabled: body.enabled === undefined ? true : Boolean(body.enabled),
    sort: Number(body.sort || 0),
  }

  if (calendarType === 'lunar') {
    data.date = null
    data.lunarMonth = Number(body.lunarMonth)
    data.lunarDay = Number(body.lunarDay)
  } else {
    data.date = body.date ? new Date(body.date) : null
    data.lunarMonth = null
    data.lunarDay = null
  }

  if (user) {
    data.createdById = user.userId
    data.createdByName = user.username
  }

  return data
}

function validateEvent(data: any) {
  if (!data.title) return '事项名称不能为空'
  if (data.calendarType === 'lunar') {
    if (!Number.isInteger(data.lunarMonth) || data.lunarMonth < 1 || data.lunarMonth > 12) return '农历月份必须为 1-12'
    if (!Number.isInteger(data.lunarDay) || data.lunarDay < 1 || data.lunarDay > 30) return '农历日期必须为 1-30'
  } else if (!data.date || Number.isNaN(data.date.getTime())) {
    return '公历日期无效'
  }
  return ''
}

async function getOrCreateWechatIntegration() {
  const existing = await prisma.wechatIntegration.findFirst({ orderBy: { createdAt: 'asc' } })
  if (existing) return existing

  const settings = await prisma.systemSettings.findUnique({ where: { id: 'system' } }).catch(() => null)
  return prisma.wechatIntegration.create({
    data: {
      templeCode: `temple_${Date.now()}`,
      templeName: settings?.templeName || 'Temple OS',
      serverUrl: process.env.PUBLIC_SERVER_URL || process.env.ALLOWED_ORIGIN || '',
      syncToken: createSyncToken(),
    },
  })
}

router.get('/calendar-events', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const includeDisabled = req.query.includeDisabled === 'true'
    const where = includeDisabled ? {} : { enabled: true }
    const events = await prisma.buddhistCalendarEvent.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { date: 'asc' }, { lunarMonth: 'asc' }, { lunarDay: 'asc' }, { createdAt: 'desc' }],
    })
    res.json({ success: true, data: events })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/calendar-events', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  try {
    const data = normalizeEventInput(req.body, req.user)
    const error = validateEvent(data)
    if (error) return res.status(400).json({ success: false, error })

    const event = await prisma.buddhistCalendarEvent.create({ data })
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.put('/calendar-events/:id', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  try {
    const data = normalizeEventInput(req.body)
    delete data.createdById
    delete data.createdByName
    const error = validateEvent(data)
    if (error) return res.status(400).json({ success: false, error })

    const event = await prisma.buddhistCalendarEvent.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: event })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.delete('/calendar-events/:id', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.buddhistCalendarEvent.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

router.post('/calendar-events/:id/reminder-drafts', authMiddleware, requireRole('ADMIN', 'OPERATOR'), async (req: AuthRequest, res: Response) => {
  try {
    const event = await prisma.buddhistCalendarEvent.findUnique({ where: { id: req.params.id } })
    if (!event) return res.status(404).json({ success: false, error: '佛事日程不存在' })

    const openIds = Array.isArray(req.body?.openIds)
      ? req.body.openIds.map((item: unknown) => String(item).trim()).filter(Boolean)
      : String(req.body?.openIds || '').split(/[\n,，\s]+/).map((item) => item.trim()).filter(Boolean)

    if (!openIds.length) return res.status(400).json({ success: false, error: '请提供至少一个公众号 openId' })

    const integration = await getOrCreateWechatIntegration()
    const templateId = req.body?.templateId ? String(req.body.templateId).trim() : undefined
    const title = req.body?.title ? String(req.body.title).trim() : `${event.title}提醒`
    const dateText = event.calendarType === 'lunar'
      ? `农历${event.lunarMonth}月${event.lunarDay}日`
      : (event.date ? event.date.toISOString().slice(0, 10) : '')

    const records = await prisma.$transaction(openIds.map((openId) => prisma.wechatTemplateMessage.create({
      data: {
        integrationId: integration.id,
        authorizerAppId: integration.authorizerAppId,
        openId,
        businessType: 'CALENDAR_EVENT_REMINDER',
        templateId,
        title,
        payload: {
          eventId: event.id,
          eventTitle: event.title,
          eventType: event.type,
          dateText,
          note: event.note,
          generatedBy: req.user?.username,
          generatedAt: new Date().toISOString(),
        },
        status: 'PENDING',
      },
    })))

    res.json({ success: true, data: { count: records.length, records } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router
