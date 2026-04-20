import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

interface WechatConfig {
  appId: string
  appSecret: string
  token: string
  encodingAESKey?: string
}

interface AccessTokenCache {
  token: string
  expiresAt: number
}

let accessTokenCache: AccessTokenCache | null = null

export async function getWechatConfig(): Promise<WechatConfig | null> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'system' }
  }) as (typeof settings extends null ? null : {
    appId?: string | null;
    appSecret?: string | null;
    wechatToken?: string | null;
    wechatEncodingAESKey?: string | null;
  } & typeof settings) | null

  if (!settings || !settings.appId || !settings.appSecret) {
    const account = await prisma.wechatAccount.findFirst({
      where: { status: 'ACTIVE' }
    })
    if (!account) return null
    return {
      appId: account.appId,
      appSecret: account.appSecret,
      token: account.token || '',
      encodingAESKey: account.encodingKey || undefined
    }
  }

  return {
    appId: settings.appId!,
    appSecret: settings.appSecret!,
    token: settings.wechatToken || '',
    encodingAESKey: settings.wechatEncodingAESKey || undefined
  }
}

export async function getAccessToken(): Promise<string | null> {
  const config = await getWechatConfig()
  if (!config) return null

  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token
  }

  return refreshAccessToken()
}

export async function refreshAccessToken(): Promise<string | null> {
  const config = await getWechatConfig()
  if (!config) return null

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`
    const response = await fetch(url)
    const data = await response.json() as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string }

    if (data.errcode) {
      console.error('WeChat getAccessToken error:', data)
      return null
    }

    accessTokenCache = {
      token: data.access_token!,
      expiresAt: Date.now() + (data.expires_in! - 300) * 1000
    }

    return accessTokenCache.token
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    return null
  }
}

export async function verifyURL(params: {
  signature: string
  timestamp: string
  nonce: string
  echostr?: string
}): Promise<{ valid: boolean; echostr?: string }> {
  const config = await getWechatConfig()
  if (!config) return { valid: false }

  const { signature, timestamp, nonce, echostr } = params
  const arr = [config.token, timestamp, nonce].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1').update(str).digest('hex')

  if (sha1 === signature) {
    return { valid: true, echostr }
  }
  return { valid: false }
}

export interface WechatMessage {
  ToUserName: string
  FromUserName: string
  CreateTime: number
  MsgType: string
  Content?: string
  MsgId?: string
  Event?: string
  EventKey?: string
  Latitude?: string
  Longitude?: string
  Precision?: string
  PicUrl?: string
  MediaId?: string
  ThumbMediaId?: string
  Location_X?: string
  Location_Y?: string
  Scale?: string
  Label?: string
  Title?: string
  Description?: string
  Url?: string
  Format?: string
  Recognition?: string
  MenuId?: string
  Status?: string
  MsgDataId?: string
  Index?: string
  StatusBrushFreq?: string
  SelectCount?: string
  BindOpenid?: string
  Scene?: string
  Ticket?: string
  BusinessId?: string
  SrcAccountId?: string
  OriginComment?: string
}

export function parseMessage(xml: string): WechatMessage | null {
  const msg: Record<string, string> = {}
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3]
    const value = match[2] || match[4]
    msg[key] = value
  }

  if (Object.keys(msg).length === 0) {
    const simpleRegex = /<(\w+)>([^<]*)<\/\1>/g
    while ((match = simpleRegex.exec(xml)) !== null) {
      msg[match[1]] = match[2]
    }
  }

  if (msg.ToUserName && msg.FromUserName && msg.CreateTime) {
    return msg as unknown as WechatMessage
  }

  return null
}

export function decryptMessage(encryptStr: string, encodingAESKey: string): { success: boolean; message?: string; fromUsername?: string } {
  try {
    const aesKey = Buffer.from(encodingAESKey + '=', 'base64')
    const encrypted = Buffer.from(encryptStr, 'base64')

    const iv = aesKey.slice(0, 16)
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv)
    let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    const msgLen = decrypted.readUInt32BE(16)
    const fromUsernameLen = decrypted.slice(20, 24).readUInt32BE(0)
    const fromUsername = decrypted.slice(24, 24 + fromUsernameLen).toString('utf8')
    const message = decrypted.slice(24 + fromUsernameLen, 20 + msgLen).toString('utf8')

    return { success: true, message, fromUsername }
  } catch (error) {
    console.error('Decrypt message error:', error)
    return { success: false }
  }
}

export function encryptMessage(text: string, encodingAESKey: string, toUsername: string): string {
  const randomStr = crypto.randomBytes(16).toString('hex')
  const textLength = Buffer.alloc(4)
  textLength.writeUInt32BE(Buffer.byteLength(text, 'utf8'))

  const msg = Buffer.concat([
    Buffer.from(randomStr, 'hex'),
    textLength,
    Buffer.from(text, 'utf8'),
    Buffer.from(toUsername, 'utf8')
  ])

  const iv = encodingAESKey ? Buffer.from(encodingAESKey.slice(0, 16), 'utf8') : crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encodingAESKey + '=', 'base64'), iv)
  const encrypted = Buffer.concat([cipher.update(msg), cipher.final()])

  return encrypted.toString('base64')
}

export function buildMessageResponse(toUsername: string, fromUsername: string, content: string): string {
  const time = Math.floor(Date.now() / 1000)
  return `<xml>
<ToUserName><![CDATA[${toUsername}]]></ToUserName>
<FromUserName><![CDATA[${fromUsername}]]></FromUserName>
<CreateTime>${time}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
}

export interface TemplateMessageParams {
  touser: string
  template_id: string
  url?: string
  data: Record<string, { value: string; color?: string }>
}

export async function sendTemplateMessage(params: TemplateMessageParams): Promise<{ success: boolean; msgid?: string; error?: string }> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return { success: false, error: 'Failed to get access token' }
  }

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    const result = await response.json() as { errcode?: number; errmsg?: string; msgid?: string }

    if (result.errcode && result.errcode !== 0) {
      console.error('WeChat sendTemplateMessage error:', result)
      return { success: false, error: result.errmsg || 'Failed to send template message' }
    }

    return { success: true, msgid: result.msgid?.toString() }
  } catch (error) {
    console.error('Failed to send template message:', error)
    return { success: false, error: 'Network error' }
  }
}

export function createMenu(menuConfig: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  return Promise.resolve({ success: true })
}

export default {
  getAccessToken,
  refreshAccessToken,
  verifyURL,
  parseMessage,
  decryptMessage,
  encryptMessage,
  buildMessageResponse,
  sendTemplateMessage,
  createMenu
}
