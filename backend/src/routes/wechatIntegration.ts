import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { prisma } from '../lib/prisma'
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth'
import { callWechatPlatform, createAiReplySuggestion, createSyncToken } from '../services/wechatIntegration'

const router = Router()

async function getOrCreateIntegration() {
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

router.get('/integrations/wechat/status', authMiddleware, async (_req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  res.json({ success: true, data: integration })
})

router.get('/integrations/wechat/auth-url', authMiddleware, requireRole('ADMIN'), async (_req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const redirectUri = `${String(process.env.PUBLIC_SERVER_URL || integration.serverUrl || '').replace(/\/+$/, '')}/admin/wechat`
  const platformResult = await callWechatPlatform('/wechat-platform/auth-url', {
    templeCode: integration.templeCode,
    redirectUri,
    state: integration.templeCode,
  })
  res.json({
    success: true,
    data: {
      configured: platformResult.ok,
      authUrl: (platformResult.data as any)?.url || '',
      templeCode: integration.templeCode,
      message: platformResult.ok ? '' : platformResult.error,
    },
  })
})

router.post('/integrations/wechat/bind', authMiddleware, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const { authorizerAppId, authorizerNickName, templeCode, templeName, serverUrl } = req.body || {}
  const updated = await prisma.wechatIntegration.update({
    where: { id: integration.id },
    data: {
      templeCode: templeCode || integration.templeCode,
      templeName: templeName || integration.templeName,
      serverUrl: serverUrl || integration.serverUrl,
      authorizerAppId: authorizerAppId || integration.authorizerAppId,
      authorizerNickName: authorizerNickName || integration.authorizerNickName,
      status: authorizerAppId ? 'ACTIVE' : integration.status,
      boundAt: authorizerAppId ? new Date() : integration.boundAt,
    },
  })
  res.json({ success: true, data: updated })
})

router.get('/wechat/messages', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const messages = await prisma.wechatMessageRecord.findMany({
    where: { integrationId: integration.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json({ success: true, data: messages })
})

router.post('/wechat/messages/:id/reply', authMiddleware, requireRole('ADMIN', 'OPERATOR'), asyncHandler(async (req: AuthRequest, res) => {
  const message = await prisma.wechatMessageRecord.findUnique({ where: { id: req.params.id }, include: { integration: true } })
  if (!message) return res.status(404).json({ success: false, error: '消息不存在' })

  const content = String(req.body?.content || message.aiSuggestion || '').trim()
  if (!content) return res.status(400).json({ success: false, error: '回复内容不能为空' })

  const platformResult = await callWechatPlatform('/wechat-platform/messages/reply', {
    authorizerAppId: message.integration.authorizerAppId,
    openId: message.openId,
    content,
    localMessageId: message.id,
  })

  const updated = await prisma.wechatMessageRecord.update({
    where: { id: message.id },
    data: {
      status: platformResult.ok ? 'REPLIED' : 'FAILED',
      repliedAt: platformResult.ok ? new Date() : null,
    },
  })

  await prisma.wechatMessageRecord.create({
    data: {
      integrationId: message.integrationId,
      authorizerAppId: message.authorizerAppId,
      openId: message.openId,
      direction: 'OUTBOUND',
      msgType: 'text',
      content,
      status: platformResult.ok ? 'REPLIED' : 'FAILED',
      rawPayload: { platformResult },
      repliedAt: platformResult.ok ? new Date() : null,
    },
  })

  res.json({ success: true, data: updated, platform: platformResult })
})

router.post('/wechat/messages/sync', async (req, res) => {
  const { syncToken, authorizerAppId, openId, msgType, eventType, content, rawPayload } = req.body || {}
  const integration = await prisma.wechatIntegration.findFirst({ where: { syncToken, authorizerAppId } })
  if (!integration) return res.status(401).json({ success: false, error: 'Invalid sync token' })

  const message = await prisma.wechatMessageRecord.create({
    data: {
      integrationId: integration.id,
      authorizerAppId,
      openId,
      msgType: msgType || 'text',
      eventType,
      content,
      rawPayload,
      aiSuggestion: createAiReplySuggestion(content),
      status: 'AI_SUGGESTED',
    },
  })
  res.json({ success: true, data: message })
})

router.get('/wechat/articles', authMiddleware, async (_req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const articles = await prisma.wechatArticle.findMany({
    where: { integrationId: integration.id },
    orderBy: { updatedAt: 'desc' },
  })
  res.json({ success: true, data: articles })
})

router.post('/wechat/articles', authMiddleware, requireRole('ADMIN', 'OPERATOR'), asyncHandler(async (req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const { title, author, digest, content, thumbMediaId } = req.body || {}
  if (!title || !content) return res.status(400).json({ success: false, error: '标题和正文不能为空' })

  const article = await prisma.wechatArticle.create({
    data: {
      integrationId: integration.id,
      authorizerAppId: integration.authorizerAppId,
      title,
      author,
      digest,
      content,
      thumbMediaId,
      status: 'DRAFT',
    },
  })
  res.json({ success: true, data: article })
})

router.post('/wechat/articles/:id/publish', authMiddleware, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res) => {
  const article = await prisma.wechatArticle.findUnique({ where: { id: req.params.id }, include: { integration: true } })
  if (!article) return res.status(404).json({ success: false, error: '文章不存在' })

  const platformResult = await callWechatPlatform('/wechat-platform/articles/publish', {
    authorizerAppId: article.integration.authorizerAppId,
    article,
  })
  const updated = await prisma.wechatArticle.update({
    where: { id: article.id },
    data: {
      status: platformResult.ok ? 'PUBLISHED' : 'FAILED',
      lastError: platformResult.ok ? null : platformResult.error,
      publishedAt: platformResult.ok ? new Date() : null,
      remotePublishId: (platformResult.data as any)?.publishId || article.remotePublishId,
    },
  })
  res.json({ success: true, data: updated, platform: platformResult })
})

router.post('/wechat/template-messages/send', authMiddleware, requireRole('ADMIN', 'OPERATOR'), asyncHandler(async (req: AuthRequest, res) => {
  const integration = await getOrCreateIntegration()
  const { openId, businessType, templateId, title, payload } = req.body || {}
  if (!openId || !businessType) return res.status(400).json({ success: false, error: 'openId 和 businessType 必填' })

  const record = await prisma.wechatTemplateMessage.create({
    data: {
      integrationId: integration.id,
      authorizerAppId: integration.authorizerAppId,
      openId,
      businessType,
      templateId,
      title,
      payload,
      status: 'PENDING',
    },
  })

  const platformResult = await callWechatPlatform('/wechat-platform/template-messages/send', {
    authorizerAppId: integration.authorizerAppId,
    openId,
    businessType,
    templateId,
    title,
    payload,
    localMessageId: record.id,
  })
  const updated = await prisma.wechatTemplateMessage.update({
    where: { id: record.id },
    data: {
      status: platformResult.ok ? 'SENT' : 'FAILED',
      remoteMsgId: (platformResult.data as any)?.msgid || null,
      errorMessage: platformResult.ok ? null : platformResult.error,
      sentAt: platformResult.ok ? new Date() : null,
    },
  })
  res.json({ success: true, data: updated, platform: platformResult })
})

export default router
