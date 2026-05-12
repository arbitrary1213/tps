const express = require('express')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const { XMLParser } = require('fast-xml-parser')
const { createEmptyStore, loadStore, saveStoreToFile: persistStoreToFile } = require('./store')
const { createId, handleAsync, toDateOrNull } = require('./utils')
const { registerPlatformRoutes } = require('./routes/platformRoutes')
const { createPlatformAuthService } = require('./services/platformAuth')
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

const store = loadStore(STORE_FILE)

app.disable('x-powered-by')
app.use(express.json({ limit: '20mb' }))
app.use(express.text({ type: ['text/*', 'application/xml'], limit: '20mb' }))

function saveStoreToFile() {
  persistStoreToFile(DATA_DIR, STORE_FILE, store)
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

const platformAuth = createPlatformAuthService({
  COMPONENT_APP_ID,
  COMPONENT_SECRET,
  createId: (prefix) => createId(prefix, crypto),
  persistAuthorizer,
  persistEvent,
  persistToken,
  postWechat,
  saveStore,
  store,
})

const {
  getAuthorizerAccessToken,
  getPreAuthCode,
  handleAuthorizedCallback,
} = {
  ...platformAuth,
  handleAuthorizedCallback: (req, res) => platformAuth.handleAuthorizedCallback(req, res, parsePayload),
}

registerPlatformRoutes(app, {
  API_TOKEN,
  COMPONENT_APP_ID,
  COMPONENT_ENCODING_AES_KEY,
  COMPONENT_SECRET,
  COMPONENT_TOKEN,
  DRY_RUN,
  PUBLIC_BASE_URL,
  createId: (prefix) => createId(prefix, crypto),
  getPreAuthCode,
  handleAsync,
  handleAuthorizedCallback,
  normalizeArticlePayload,
  normalizeWechatPayload,
  persistArticle,
  persistEvent,
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
