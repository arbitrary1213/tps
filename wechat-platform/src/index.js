const express = require('express')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const { XMLParser } = require('fast-xml-parser')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3010
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${PORT}`
const COMPONENT_APP_ID = process.env.WECHAT_COMPONENT_APP_ID || ''
const COMPONENT_SECRET = process.env.WECHAT_COMPONENT_SECRET || ''
const COMPONENT_TOKEN = process.env.WECHAT_COMPONENT_TOKEN || ''
const COMPONENT_ENCODING_AES_KEY = process.env.WECHAT_COMPONENT_ENCODING_AES_KEY || ''
const API_TOKEN = process.env.WECHAT_PLATFORM_API_TOKEN || ''
const DRY_RUN = process.env.WECHAT_PLATFORM_DRY_RUN !== 'false'
const DATA_DIR = process.env.WECHAT_PLATFORM_DATA_DIR || path.join(__dirname, '..', 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')
const DATABASE_URL = process.env.DATABASE_URL || ''
const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin/component'

const parser = new XMLParser({ ignoreAttributes: false })
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null

const store = loadStore()

app.disable('x-powered-by')
app.use(express.json({ limit: '20mb' }))
app.use(express.text({ type: ['text/*', 'application/xml'], limit: '20mb' }))

function createEmptyStore() {
  return {
    componentVerifyTicket: '',
    componentAccessToken: '',
    componentAccessTokenExpiresAt: 0,
    preAuthCode: '',
    preAuthCodeExpiresAt: 0,
    authorizers: {},
    messages: [],
    articles: [],
    templateMessages: [],
  }
}

function loadStore() {
  const initial = createEmptyStore()
  try {
    if (!fs.existsSync(STORE_FILE)) return initial
    return { ...initial, ...JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) }
  } catch (error) {
    console.warn(`Failed to read WeChat platform store: ${error.message}`)
    return initial
  }
}

function saveStoreToFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2))
}

async function initDatabaseStore() {
  if (!pool) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_store (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_authorizers (
      authorizer_app_id TEXT PRIMARY KEY,
      nick_name TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      authorizer_access_token TEXT,
      authorizer_refresh_token TEXT,
      expires_at TIMESTAMPTZ,
      func_info JSONB,
      raw_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_messages (
      id TEXT PRIMARY KEY,
      authorizer_app_id TEXT NOT NULL,
      open_id TEXT,
      direction TEXT NOT NULL DEFAULT 'INBOUND',
      msg_type TEXT,
      event_type TEXT,
      content TEXT,
      status TEXT,
      raw_payload JSONB,
      remote_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_articles (
      id TEXT PRIMARY KEY,
      authorizer_app_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT,
      draft_media_id TEXT,
      publish_id TEXT,
      local_payload JSONB,
      remote_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_template_messages (
      id TEXT PRIMARY KEY,
      authorizer_app_id TEXT NOT NULL,
      open_id TEXT,
      template_id TEXT,
      business_type TEXT,
      status TEXT,
      local_payload JSONB,
      remote_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_tokens (
      token_key TEXT PRIMARY KEY,
      token_type TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wechat_platform_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      authorizer_app_id TEXT,
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      raw_payload JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_messages_authorizer_created ON wechat_platform_messages (authorizer_app_id, created_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_articles_authorizer_updated ON wechat_platform_articles (authorizer_app_id, updated_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_template_messages_authorizer_created ON wechat_platform_template_messages (authorizer_app_id, created_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_tokens_type_updated ON wechat_platform_tokens (token_type, updated_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_events_type_created ON wechat_platform_events (event_type, created_at DESC)')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wechat_platform_events_authorizer_created ON wechat_platform_events (authorizer_app_id, created_at DESC)')
  const result = await pool.query('SELECT data FROM wechat_platform_store WHERE id = $1', ['main'])
  if (result.rows[0]?.data) {
    Object.assign(store, createEmptyStore(), result.rows[0].data)
    await backfillNormalizedTables()
    return
  }
  await saveStore()
  await backfillNormalizedTables()
}

async function saveStore() {
  if (!pool) {
    saveStoreToFile()
    return
  }
  await pool.query(
    `
      INSERT INTO wechat_platform_store (id, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    ['main', JSON.stringify(store)]
  )
}

function toDateOrNull(value) {
  if (!value) return null
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

async function persistAuthorizer(record) {
  if (!pool || !record?.authorizerAppId) return
  await pool.query(
    `
      INSERT INTO wechat_platform_authorizers (
        authorizer_app_id, nick_name, status, authorizer_access_token,
        authorizer_refresh_token, expires_at, func_info, raw_payload, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, NOW())
      ON CONFLICT (authorizer_app_id)
      DO UPDATE SET
        nick_name = COALESCE(EXCLUDED.nick_name, wechat_platform_authorizers.nick_name),
        status = EXCLUDED.status,
        authorizer_access_token = COALESCE(EXCLUDED.authorizer_access_token, wechat_platform_authorizers.authorizer_access_token),
        authorizer_refresh_token = COALESCE(EXCLUDED.authorizer_refresh_token, wechat_platform_authorizers.authorizer_refresh_token),
        expires_at = COALESCE(EXCLUDED.expires_at, wechat_platform_authorizers.expires_at),
        func_info = COALESCE(EXCLUDED.func_info, wechat_platform_authorizers.func_info),
        raw_payload = COALESCE(EXCLUDED.raw_payload, wechat_platform_authorizers.raw_payload),
        updated_at = NOW()
    `,
    [
      record.authorizerAppId,
      record.nickName || null,
      record.status || 'ACTIVE',
      record.authorizerAccessToken || null,
      record.authorizerRefreshToken || null,
      toDateOrNull(record.expiresAt),
      JSON.stringify(record.funcInfo || null),
      JSON.stringify(record.rawPayload || null),
    ]
  )
}

async function persistMessage(record) {
  if (!pool || !record?.id) return
  await pool.query(
    `
      INSERT INTO wechat_platform_messages (
        id, authorizer_app_id, open_id, direction, msg_type, event_type,
        content, status, raw_payload, remote_payload, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11)
      ON CONFLICT (id) DO NOTHING
    `,
    [
      record.id,
      record.authorizerAppId,
      record.openId || null,
      record.direction || 'INBOUND',
      record.msgType || null,
      record.eventType || null,
      record.content || null,
      record.status || null,
      JSON.stringify(record.rawPayload || null),
      JSON.stringify(record.remote || record.remotePayload || null),
      toDateOrNull(record.createdAt) || new Date(),
    ]
  )
}

async function persistArticle(record) {
  if (!pool || !record?.id) return
  await pool.query(
    `
      INSERT INTO wechat_platform_articles (
        id, authorizer_app_id, status, title, draft_media_id, publish_id,
        local_payload, remote_payload, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
      ON CONFLICT (id)
      DO UPDATE SET
        status = EXCLUDED.status,
        title = EXCLUDED.title,
        draft_media_id = EXCLUDED.draft_media_id,
        publish_id = EXCLUDED.publish_id,
        local_payload = EXCLUDED.local_payload,
        remote_payload = EXCLUDED.remote_payload,
        updated_at = EXCLUDED.updated_at
    `,
    [
      record.id || record.publishId,
      record.authorizerAppId,
      record.status,
      record.localPayload?.article?.title || record.article?.title || null,
      record.draftMediaId || record.remote?.media_id || null,
      record.publishId || record.remote?.publish_id || null,
      JSON.stringify(record.localPayload || record.article || null),
      JSON.stringify(record.remote || null),
      toDateOrNull(record.createdAt) || new Date(),
      toDateOrNull(record.updatedAt) || new Date(),
    ]
  )
}

async function persistTemplateMessage(record) {
  if (!pool || !record?.msgid) return
  await pool.query(
    `
      INSERT INTO wechat_platform_template_messages (
        id, authorizer_app_id, open_id, template_id, business_type,
        status, local_payload, remote_payload, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
      ON CONFLICT (id) DO NOTHING
    `,
    [
      record.msgid,
      record.authorizerAppId,
      record.openId || null,
      record.templateId || null,
      record.businessType || null,
      record.status || null,
      JSON.stringify(record || null),
      JSON.stringify(record.remote || null),
      toDateOrNull(record.createdAt) || new Date(),
    ]
  )
}

async function persistToken(tokenKey, tokenType, value, expiresAt, metadata = {}) {
  if (!pool || !value) return
  await pool.query(
    `
      INSERT INTO wechat_platform_tokens (token_key, token_type, value, expires_at, metadata, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      ON CONFLICT (token_key)
      DO UPDATE SET
        token_type = EXCLUDED.token_type,
        value = EXCLUDED.value,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `,
    [tokenKey, tokenType, value, toDateOrNull(expiresAt), JSON.stringify(metadata || {})]
  )
}

async function persistEvent(eventType, payload, options = {}) {
  if (!pool) return
  await pool.query(
    `
      INSERT INTO wechat_platform_events (
        id, event_type, authorizer_app_id, status, raw_payload, error_message, created_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    `,
    [
      options.id || createId('evt'),
      eventType,
      options.authorizerAppId || null,
      options.status || 'RECEIVED',
      JSON.stringify(payload || null),
      options.errorMessage || null,
      toDateOrNull(options.createdAt) || new Date(),
    ]
  )
}

async function backfillNormalizedTables() {
  if (!pool) return
  for (const authorizer of Object.values(store.authorizers || {})) {
    await persistAuthorizer(authorizer)
  }
  for (const message of store.messages || []) {
    await persistMessage(message)
  }
  for (const article of store.articles || []) {
    await persistArticle({ id: article.id || article.publishId, ...article })
  }
  for (const templateMessage of store.templateMessages || []) {
    await persistTemplateMessage(templateMessage)
  }
  await persistToken('component_verify_ticket', 'COMPONENT_VERIFY_TICKET', store.componentVerifyTicket, null)
  await persistToken('component_access_token', 'COMPONENT_ACCESS_TOKEN', store.componentAccessToken, store.componentAccessTokenExpiresAt)
  await persistToken('pre_auth_code', 'PRE_AUTH_CODE', store.preAuthCode, store.preAuthCodeExpiresAt)
}

function requireApiToken(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!API_TOKEN || token !== API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Invalid platform API token' })
  }
  next()
}

function verifySignature(query) {
  if (!COMPONENT_TOKEN) return false
  const { signature, timestamp, nonce } = query
  if (!signature || !timestamp || !nonce) return false
  const hash = crypto.createHash('sha1').update([COMPONENT_TOKEN, timestamp, nonce].sort().join('')).digest('hex')
  return hash === signature
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function parsePayload(body) {
  if (!body) return {}
  if (typeof body !== 'string') return body
  const trimmed = body.trim()
  if (!trimmed) return {}
  if (trimmed.startsWith('<')) {
    const parsed = parser.parse(trimmed)
    return parsed.xml || parsed
  }
  try {
    return JSON.parse(trimmed)
  } catch {
    return { rawBody: body }
  }
}

function decryptWechatMessage(encrypted) {
  if (!encrypted || !COMPONENT_ENCODING_AES_KEY) return null
  const aesKey = Buffer.from(`${COMPONENT_ENCODING_AES_KEY}=`, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, aesKey.subarray(0, 16))
  decipher.setAutoPadding(false)
  const decrypted = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()])
  const pad = decrypted[decrypted.length - 1]
  const unpadded = decrypted.subarray(0, decrypted.length - pad)
  const xmlLength = unpadded.readUInt32BE(16)
  const xml = unpadded.subarray(20, 20 + xmlLength).toString('utf8')
  return parsePayload(xml)
}

function normalizeWechatPayload(body) {
  const payload = parsePayload(body)
  if (payload.Encrypt) {
    try {
      return decryptWechatMessage(payload.Encrypt) || payload
    } catch (error) {
      return { ...payload, decryptError: error.message }
    }
  }
  return payload
}

async function postWechat(pathname, payload) {
  const response = await fetch(`${WECHAT_API_BASE}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.errcode) {
    throw new Error(json.errmsg || `WeChat API failed: ${response.status}`)
  }
  return json
}

async function postOfficialAccount(authorizerAppId, pathname, payload) {
  const token = await getAuthorizerAccessToken(authorizerAppId)
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin${pathname}${pathname.includes('?') ? '&' : '?'}access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.errcode) {
    throw new Error(json.errmsg || `WeChat official account API failed: ${response.status}`)
  }
  return json
}

async function getComponentAccessToken(force = false) {
  if (!force && store.componentAccessToken && Date.now() < store.componentAccessTokenExpiresAt - 300000) {
    return store.componentAccessToken
  }
  if (!COMPONENT_APP_ID || !COMPONENT_SECRET || !store.componentVerifyTicket) {
    throw new Error('WeChat component app id, secret, or verify ticket is missing')
  }

  const json = await postWechat('/api_component_token', {
    component_appid: COMPONENT_APP_ID,
    component_appsecret: COMPONENT_SECRET,
    component_verify_ticket: store.componentVerifyTicket,
  })
  store.componentAccessToken = json.component_access_token
  store.componentAccessTokenExpiresAt = Date.now() + Number(json.expires_in || 7200) * 1000
  await persistToken('component_access_token', 'COMPONENT_ACCESS_TOKEN', store.componentAccessToken, store.componentAccessTokenExpiresAt, { expiresIn: json.expires_in })
  await persistEvent('COMPONENT_ACCESS_TOKEN_REFRESHED', json, { status: 'SUCCESS' })
  await saveStore()
  return store.componentAccessToken
}

async function getPreAuthCode(force = false) {
  if (!force && store.preAuthCode && Date.now() < store.preAuthCodeExpiresAt - 300000) {
    return store.preAuthCode
  }
  const componentAccessToken = await getComponentAccessToken()
  const json = await postWechat(`/api_create_preauthcode?component_access_token=${componentAccessToken}`, {
    component_appid: COMPONENT_APP_ID,
  })
  store.preAuthCode = json.pre_auth_code
  store.preAuthCodeExpiresAt = Date.now() + Number(json.expires_in || 600) * 1000
  await persistToken('pre_auth_code', 'PRE_AUTH_CODE', store.preAuthCode, store.preAuthCodeExpiresAt, { expiresIn: json.expires_in })
  await persistEvent('PRE_AUTH_CODE_CREATED', json, { status: 'SUCCESS' })
  await saveStore()
  return store.preAuthCode
}

async function queryAuthorization(authCode) {
  const componentAccessToken = await getComponentAccessToken()
  return postWechat(`/api_query_auth?component_access_token=${componentAccessToken}`, {
    component_appid: COMPONENT_APP_ID,
    authorization_code: authCode,
  })
}

async function refreshAuthorizerAccessToken(authorizerAppId) {
  const record = store.authorizers[authorizerAppId]
  if (!record?.authorizerRefreshToken) {
    throw new Error(`Authorizer ${authorizerAppId} has no refresh token`)
  }
  const componentAccessToken = await getComponentAccessToken()
  const json = await postWechat(`/api_authorizer_token?component_access_token=${componentAccessToken}`, {
    component_appid: COMPONENT_APP_ID,
    authorizer_appid: authorizerAppId,
    authorizer_refresh_token: record.authorizerRefreshToken,
  })
  return upsertAuthorizer({
    authorizerAppId,
    authorizerAccessToken: json.authorizer_access_token,
    authorizerRefreshToken: json.authorizer_refresh_token || record.authorizerRefreshToken,
    expiresAt: Date.now() + Number(json.expires_in || 7200) * 1000,
    status: 'ACTIVE',
  })
}

async function getAuthorizerAccessToken(authorizerAppId) {
  const record = store.authorizers[authorizerAppId]
  if (!record) throw new Error(`Authorizer ${authorizerAppId} is not bound`)
  if (record.authorizerAccessToken && Date.now() < Number(record.expiresAt || 0) - 300000) {
    return record.authorizerAccessToken
  }
  const updated = await refreshAuthorizerAccessToken(authorizerAppId)
  return updated.authorizerAccessToken
}

async function upsertAuthorizer(record) {
  store.authorizers[record.authorizerAppId] = {
    ...(store.authorizers[record.authorizerAppId] || {}),
    ...record,
    updatedAt: new Date().toISOString(),
  }
  await persistAuthorizer(store.authorizers[record.authorizerAppId])
  await saveStore()
  return store.authorizers[record.authorizerAppId]
}

function normalizeArticlePayload(input) {
  const source = input?.article || input || {}
  if (source.articles) return source
  return {
    title: source.title || '',
    author: source.author || '',
    digest: source.digest || '',
    content: source.content || '',
    thumb_media_id: source.thumb_media_id || source.thumbMediaId || '',
    need_open_comment: Number(source.need_open_comment || 0),
    only_fans_can_comment: Number(source.only_fans_can_comment || 0),
  }
}

async function handleAsync(res, fn) {
  try {
    const data = await fn()
    res.json({ success: true, data })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

async function handleAuthorizedCallback(req, res) {
  try {
    const payload = parsePayload(Object.keys(req.body || {}).length ? req.body : req.query)
    await persistEvent('AUTHORIZED_CALLBACK', payload, { status: 'RECEIVED' })
    const authCode = payload.auth_code || payload.authorization_code || req.query.auth_code || req.query.authorization_code
    if (authCode) {
      const result = await queryAuthorization(authCode)
      const info = result.authorization_info || {}
      const record = await upsertAuthorizer({
        authorizerAppId: info.authorizer_appid,
        authorizerAccessToken: info.authorizer_access_token,
        authorizerRefreshToken: info.authorizer_refresh_token,
        expiresAt: Date.now() + Number(info.expires_in || 7200) * 1000,
        funcInfo: info.func_info || [],
        rawPayload: result,
        status: 'ACTIVE',
      })
      return res.json({ success: true, data: record })
    }

    const appId = payload.authorizerAppId || payload.AuthorizerAppid || payload.appId || createId('authorizer')
    const record = await upsertAuthorizer({
      authorizerAppId: appId,
      nickName: payload.nickName || payload.NickName || '',
      rawPayload: payload,
      status: 'ACTIVE',
    })
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(503).json({ success: false, error: error.message })
  }
}

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

initDatabaseStore()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Temple OS WeChat platform running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error(`Failed to initialize WeChat platform store: ${error.message}`)
    process.exit(1)
  })
