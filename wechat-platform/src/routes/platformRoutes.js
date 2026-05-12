function registerPlatformRoutes(app, deps) {
  const {
    API_TOKEN,
    COMPONENT_APP_ID,
    COMPONENT_ENCODING_AES_KEY,
    COMPONENT_SECRET,
    COMPONENT_TOKEN,
    DRY_RUN,
    PUBLIC_BASE_URL,
    appState,
    createId,
    getPreAuthCode,
    handleAsync,
    handleAuthorizedCallback,
    normalizeArticlePayload,
    normalizeWechatPayload,
    persistEvent,
    persistArticle,
    persistMessage,
    persistTemplateMessage,
    persistToken,
    pool,
    postOfficialAccount,
    requireApiToken,
    saveStore,
    store,
    toDateOrNull,
    verifySignature,
  } = deps

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'temple-os-wechat-platform',
      configured: Boolean(COMPONENT_APP_ID && COMPONENT_SECRET && COMPONENT_TOKEN && COMPONENT_ENCODING_AES_KEY && API_TOKEN),
      store: pool ? 'postgres' : 'json-file',
      hasVerifyTicket: Boolean(store.componentVerifyTicket),
      hasComponentAccessToken: Boolean(store.componentAccessToken && Date.now() < store.componentAccessTokenExpiresAt),
      time: new Date().toISOString(),
    })
  })

  app.post('/wechat-platform/callback/component', async (req, res) => {
    if (COMPONENT_TOKEN && !verifySignature(req.query)) {
      await persistEvent('COMPONENT_CALLBACK_SIGNATURE_FAILED', { query: req.query }, { status: 'FAILED', errorMessage: 'Invalid signature' })
      return res.status(403).send('Invalid signature')
    }
    const payload = normalizeWechatPayload(req.body)
    await persistEvent(payload.InfoType || 'COMPONENT_CALLBACK', payload, { status: 'RECEIVED' })
    if (payload.ComponentVerifyTicket) {
      store.componentVerifyTicket = payload.ComponentVerifyTicket
      await persistToken('component_verify_ticket', 'COMPONENT_VERIFY_TICKET', store.componentVerifyTicket, null, { infoType: payload.InfoType || null })
      await saveStore()
    }
    res.send('success')
  })

  app.get('/wechat-platform/auth-url', requireApiToken, async (req, res) => {
    try {
      const redirectUri = encodeURIComponent(String(req.query.redirectUri || `${PUBLIC_BASE_URL}/wechat-platform/callback/authorized`))
      const state = encodeURIComponent(String(req.query.state || 'temple-os'))
      const preAuthCode = await getPreAuthCode()
      const url = `https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${COMPONENT_APP_ID}&pre_auth_code=${preAuthCode}&redirect_uri=${redirectUri}&auth_type=3&biz_appid=&state=${state}`
      res.json({ success: true, data: { url, state: req.query.state || 'temple-os' } })
    } catch (error) {
      res.status(503).json({ success: false, error: error.message })
    }
  })

  app.post('/wechat-platform/callback/authorized', handleAuthorizedCallback)
  app.get('/wechat-platform/callback/authorized', handleAuthorizedCallback)

  app.post('/wechat-platform/callback/message/:authorizerAppId', async (req, res) => {
    if (COMPONENT_TOKEN && !verifySignature(req.query)) {
      await persistEvent('MESSAGE_CALLBACK_SIGNATURE_FAILED', { query: req.query }, { authorizerAppId: req.params.authorizerAppId, status: 'FAILED', errorMessage: 'Invalid signature' })
      return res.status(403).send('Invalid signature')
    }
    const payload = normalizeWechatPayload(req.body)
    await persistEvent(payload.MsgType || payload.Event || 'MESSAGE_CALLBACK', payload, { authorizerAppId: req.params.authorizerAppId, status: 'RECEIVED' })
    const message = {
      id: createId('msg'),
      authorizerAppId: req.params.authorizerAppId,
      openId: payload.FromUserName || payload.openId || '',
      msgType: payload.MsgType || payload.msgType || '',
      eventType: payload.Event || payload.eventType || '',
      content: payload.Content || payload.content || '',
      rawPayload: payload,
      createdAt: new Date().toISOString(),
    }
    store.messages.push(message)
    await persistMessage(message)
    await saveStore()
    res.send('success')
  })

  app.get('/wechat-platform/authorizers', requireApiToken, async (_req, res) => {
    if (pool) {
      const result = await pool.query('SELECT * FROM wechat_platform_authorizers ORDER BY updated_at DESC')
      return res.json({ success: true, data: result.rows })
    }
    res.json({ success: true, data: Object.values(store.authorizers) })
  })

  app.get('/wechat-platform/messages', requireApiToken, async (req, res) => {
    const authorizerAppId = String(req.query.authorizerAppId || '')
    if (pool) {
      const result = authorizerAppId
        ? await pool.query('SELECT * FROM wechat_platform_messages WHERE authorizer_app_id = $1 ORDER BY created_at DESC LIMIT 200', [authorizerAppId])
        : await pool.query('SELECT * FROM wechat_platform_messages ORDER BY created_at DESC LIMIT 200')
      return res.json({ success: true, data: result.rows })
    }
    const data = authorizerAppId ? store.messages.filter((item) => item.authorizerAppId === authorizerAppId) : store.messages
    res.json({ success: true, data: data.slice(-200).reverse() })
  })

  app.get('/wechat-platform/tokens', requireApiToken, async (_req, res) => {
    if (pool) {
      const result = await pool.query('SELECT token_key, token_type, value, expires_at, metadata, updated_at FROM wechat_platform_tokens ORDER BY updated_at DESC')
      return res.json({
        success: true,
        data: result.rows.map((row) => ({
          tokenKey: row.token_key,
          tokenType: row.token_type,
          configured: Boolean(row.value),
          valueTail: row.value ? String(row.value).slice(-6) : '',
          expiresAt: row.expires_at,
          metadata: row.metadata,
          updatedAt: row.updated_at,
        })),
      })
    }
    res.json({
      success: true,
      data: [
        { tokenKey: 'component_verify_ticket', tokenType: 'COMPONENT_VERIFY_TICKET', configured: Boolean(store.componentVerifyTicket), valueTail: String(store.componentVerifyTicket || '').slice(-6), expiresAt: null },
        { tokenKey: 'component_access_token', tokenType: 'COMPONENT_ACCESS_TOKEN', configured: Boolean(store.componentAccessToken), valueTail: String(store.componentAccessToken || '').slice(-6), expiresAt: toDateOrNull(store.componentAccessTokenExpiresAt) },
        { tokenKey: 'pre_auth_code', tokenType: 'PRE_AUTH_CODE', configured: Boolean(store.preAuthCode), valueTail: String(store.preAuthCode || '').slice(-6), expiresAt: toDateOrNull(store.preAuthCodeExpiresAt) },
      ],
    })
  })

  app.get('/wechat-platform/events', requireApiToken, async (req, res) => {
    const authorizerAppId = String(req.query.authorizerAppId || '')
    const eventType = String(req.query.eventType || '')
    if (!pool) {
      return res.json({ success: true, data: [] })
    }
    const where = []
    const params = []
    if (authorizerAppId) {
      params.push(authorizerAppId)
      where.push(`authorizer_app_id = $${params.length}`)
    }
    if (eventType) {
      params.push(eventType)
      where.push(`event_type = $${params.length}`)
    }
    const sql = `SELECT * FROM wechat_platform_events${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 200`
    const result = await pool.query(sql, params)
    res.json({ success: true, data: result.rows })
  })

  app.post('/wechat-platform/articles/draft', requireApiToken, (req, res) => {
    handleAsync(res, async () => {
      const { authorizerAppId, article } = req.body || {}
      if (!authorizerAppId) throw new Error('authorizerAppId is required')
      const payload = article?.articles ? article : { articles: [normalizeArticlePayload(article || req.body)] }
      const remote = DRY_RUN ? { media_id: createId('dry_media'), dryRun: true } : await postOfficialAccount(authorizerAppId, '/draft/add', payload)
      const record = {
        id: createId('draft'),
        authorizerAppId,
        status: 'DRAFT',
        localPayload: req.body,
        remote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.articles.push(record)
      await persistArticle(record)
      await saveStore()
      return record
    })
  })

  app.post('/wechat-platform/articles/publish', requireApiToken, (req, res) => {
    handleAsync(res, async () => {
      const { authorizerAppId, article, mediaId } = req.body || {}
      if (!authorizerAppId) throw new Error('authorizerAppId is required')
      let draftMediaId = mediaId || article?.media_id || article?.remoteMediaId
      let draftResult = null
      if (!draftMediaId) {
        const payload = article?.articles ? article : { articles: [normalizeArticlePayload(article || req.body)] }
        draftResult = DRY_RUN ? { media_id: createId('dry_media'), dryRun: true } : await postOfficialAccount(authorizerAppId, '/draft/add', payload)
        draftMediaId = draftResult.media_id
      }
      const remote = DRY_RUN ? { publish_id: createId('dry_publish'), dryRun: true } : await postOfficialAccount(authorizerAppId, '/freepublish/submit', { media_id: draftMediaId })
      const publish = {
        publishId: remote.publish_id || createId('publish'),
        authorizerAppId,
        status: 'PUBLISHED',
        draftMediaId,
        draftResult,
        article: article || req.body,
        remote,
        createdAt: new Date().toISOString(),
      }
      store.articles.push(publish)
      await persistArticle({ id: publish.publishId, ...publish })
      await saveStore()
      return publish
    })
  })

  app.post('/wechat-platform/messages/reply', requireApiToken, (req, res) => {
    handleAsync(res, async () => {
      const { authorizerAppId, openId, content } = req.body || {}
      if (!authorizerAppId || !openId || !content) throw new Error('authorizerAppId, openId, and content are required')
      const payload = {
        touser: openId,
        msgtype: 'text',
        text: { content },
      }
      const remote = DRY_RUN ? { errcode: 0, errmsg: 'dry run', dryRun: true } : await postOfficialAccount(authorizerAppId, '/message/custom/send', payload)
      const reply = {
        id: createId('reply'),
        ...req.body,
        status: 'SENT',
        remote,
        createdAt: new Date().toISOString(),
      }
      store.messages.push(reply)
      await persistMessage({ ...reply, direction: 'OUTBOUND', openId })
      await saveStore()
      return reply
    })
  })

  app.post('/wechat-platform/template-messages/send', requireApiToken, (req, res) => {
    handleAsync(res, async () => {
      const { authorizerAppId, openId, templateId, url, miniprogram, payload } = req.body || {}
      if (!authorizerAppId || !openId || !templateId || !payload) {
        throw new Error('authorizerAppId, openId, templateId, and payload are required')
      }
      const message = {
        touser: openId,
        template_id: templateId,
        url,
        miniprogram,
        data: payload,
      }
      Object.keys(message).forEach((key) => message[key] === undefined && delete message[key])
      const remote = DRY_RUN ? { msgid: createId('dry_tplmsg'), dryRun: true } : await postOfficialAccount(authorizerAppId, '/message/template/send', message)
      const record = {
        msgid: remote.msgid || createId('tplmsg'),
        ...req.body,
        status: 'SENT',
        remote,
        createdAt: new Date().toISOString(),
      }
      store.templateMessages.push(record)
      await persistTemplateMessage(record)
      await saveStore()
      return record
    })
  })
}

module.exports = {
  registerPlatformRoutes,
}
