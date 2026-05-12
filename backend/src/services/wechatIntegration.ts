import crypto from 'crypto'

const PLATFORM_BASE_URL = process.env.WECHAT_PLATFORM_BASE_URL || ''
const PLATFORM_API_TOKEN = process.env.WECHAT_PLATFORM_API_TOKEN || ''

export function createSyncToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function callWechatPlatform<T = any>(path: string, payload?: any): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!PLATFORM_BASE_URL || !PLATFORM_API_TOKEN) {
    return { ok: false, error: 'WECHAT_PLATFORM_BASE_URL or WECHAT_PLATFORM_API_TOKEN is not configured' }
  }

  try {
    const response = await fetch(`${PLATFORM_BASE_URL.replace(/\/+$/, '')}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PLATFORM_API_TOKEN}`,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })
    const json: any = await response.json().catch(() => ({}))
    if (!response.ok || json.success === false) {
      return { ok: false, error: json.error || `Wechat platform request failed: ${response.status}` }
    }
    return { ok: true, data: json.data ?? json }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Wechat platform request failed' }
  }
}

export function createAiReplySuggestion(content?: string | null): string {
  const text = String(content || '').trim()
  if (!text) return '您好，已收到您的消息，工作人员会尽快回复。'
  if (text.includes('法会')) return '您好，关于法会安排请留下姓名和联系方式，工作人员会为您确认报名与时间。'
  if (text.includes('牌位')) return '您好，关于牌位登记、续期或打印事项，请留下姓名、电话和具体需求。'
  if (text.includes('地址') || text.includes('怎么去')) return '您好，寺院地址和交通方式可在公众号菜单中查看，也可以留下电话由工作人员联系您。'
  return '您好，已收到您的咨询。请留下姓名、电话和具体事项，工作人员会尽快处理。'
}
