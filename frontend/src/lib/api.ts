const API_BASE = ''

import type {
  ApiUser,
  DashboardStats,
  DevoteeRecord,
  OperationLogList,
  PlaqueRecord,
  PrintClientRecord,
  PrintJobRecord,
  RegistrationRequestList,
  RegistrationRequestRecord,
  RegistrationTaskRecord,
  RitualRecord,
  SystemSettingsRecord,
  UserRecord,
} from '@/types/api'
import type { PlaqueTemplate } from '@/types/template'

declare global {
  interface Window {
    templeDesktop?: {
      getCache?: (key: string) => Promise<any>
      setCache?: (key: string, value: any) => Promise<boolean>
      upsertLocalRows?: (entityType: string, rows: any[]) => Promise<{ count: number }>
      listLocalRows?: (entityType: string) => Promise<any[]>
      offlineSave?: (operation: any) => Promise<any>
      getLocalDbInfo?: () => Promise<{ path: string; entityCount: number; pendingCount: number }>
      openTemplateDesigner?: () => Promise<boolean>
      printHtml?: (options: { html: string; deviceName?: string; silent?: boolean }) => Promise<{ success: boolean; failureReason?: string }>
    }
  }
}

const endpointEntityMap: Array<[RegExp, string]> = [
  [/^\/api\/plaques(?:\?|$)/, 'plaques'],
  [/^\/api\/devotees(?:\?|$)/, 'devotees'],
  [/^\/api\/rituals(?:\?|$)/, 'rituals'],
  [/^\/api\/registration\/requests(?:\?|$)/, 'registration_requests'],
  [/^\/api\/print-jobs(?:\?|$)/, 'print_jobs'],
  [/^\/api\/plaque-templates(?:\?|$)/, 'plaque_templates'],
  [/^\/api\/calendar-events(?:\?|$)/, 'calendar_events'],
]

function entityTypeForEndpoint(endpoint: string) {
  return endpointEntityMap.find(([pattern]) => pattern.test(endpoint))?.[1] || ''
}

function normalizeRows(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

interface FetchOptions extends RequestInit {
  token?: string
  skipLocalFallback?: boolean
  preferRemote?: boolean
}

function isDesktopRuntime() {
  return typeof window !== 'undefined' && Boolean(window.templeDesktop)
}

function attachCacheMeta(value: any, meta: any) {
  if (value && typeof value === 'object') {
    Object.defineProperty(value, '__desktopCache', { value: meta, enumerable: false, configurable: true })
  }
  return value
}

async function readLocalFirst<T>(endpoint: string, method: string): Promise<T | null> {
  const entityType = entityTypeForEndpoint(endpoint)
  if (entityType) {
    const rows = await window.templeDesktop?.listLocalRows?.(entityType).catch(() => null)
    if (rows?.length) return attachCacheMeta(rows, { source: 'sqlite' }) as T
  }
  const cached = await window.templeDesktop?.getCache?.(`${method}:${endpoint}`).catch(() => null)
  if (cached) return attachCacheMeta(cached.value, { source: 'cache', savedAt: cached.savedAt }) as T
  return null
}

async function writeLocalFromGet(endpoint: string, method: string, data: any) {
  await window.templeDesktop?.setCache?.(`${method}:${endpoint}`, data).catch(() => false)
  const entityType = entityTypeForEndpoint(endpoint)
  const rows = normalizeRows(data)
  if (entityType && rows.length) {
    await window.templeDesktop?.upsertLocalRows?.(entityType, rows).catch(() => ({ count: 0 }))
  }
}

async function request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, skipLocalFallback, preferRemote, ...fetchOptions } = options
  const method = fetchOptions.method || 'GET'
  const cacheKey = `${method}:${endpoint}`

  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData

  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(typeof options.headers === 'object' && options.headers !== null 
      ? options.headers as Record<string, string>
      : {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint
  const shouldUseLocalFirst = method === 'GET' && isDesktopRuntime() && !skipLocalFallback && !preferRemote
  if (shouldUseLocalFirst) {
    const localValue = await readLocalFirst<T>(endpoint, method)
    if (localValue) {
      fetch(url, { ...fetchOptions, headers })
        .then(async (res) => {
          const json = await res.json()
          if (res.ok && json.success) await writeLocalFromGet(endpoint, method, json.data)
        })
        .catch(() => {})
      return localValue
    }
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.error || '请求失败')
    }

    if (method === 'GET') {
      await writeLocalFromGet(endpoint, method, json.data)
      return json.data
    }
    return json
  } catch (error) {
    if (method === 'GET' && !skipLocalFallback) {
      const localValue = await readLocalFirst<T>(endpoint, method)
      if (localValue) return localValue
    }
    throw error
  }
}

export type DesktopStartupSyncResult = {
  ok: number
  failed: number
  localDb?: {
    path: string
    entityCount: number
    pendingCount: number
  }
  errors: string[]
}

// 认证
export const authAPI = {
  login: (username: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; password: string; email?: string; name?: string }) =>
    request<{ token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<ApiUser>('/api/auth/me', { token }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request('/api/auth/change-password', { method: 'PUT', token, body: JSON.stringify(data) }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST', credentials: 'include' }),
}

// 系统设置
export const systemAPI = {
  getSettings: (options?: FetchOptions) => request<SystemSettingsRecord>('/api/system/settings', options),
  updateSettings: (token: string, data: Partial<SystemSettingsRecord>) =>
    request('/api/system/settings', { method: 'PUT', token, body: JSON.stringify(data) }),
}

// 登记
export const registrationAPI = {
  getTasks: () => request<RegistrationTaskRecord[]>('/api/registration/tasks'),
  getTasksAll: (token: string) => request<RegistrationTaskRecord[]>('/api/registration/tasks/all', { token }),
  createTask: (token: string, data: Partial<RegistrationTaskRecord>) =>
    request<RegistrationTaskRecord>('/api/registration/tasks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateTask: (token: string, id: string, data: Partial<RegistrationTaskRecord>) =>
    request<RegistrationTaskRecord>(`/api/registration/tasks/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteTask: (token: string, id: string) =>
    request(`/api/registration/tasks/${id}`, { method: 'DELETE', token }),

  getRequests: (token: string, params?: Record<string, string>, options?: FetchOptions) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<RegistrationRequestList>(`/api/registration/requests${query}`, { token, ...(options || {}) })
  },
  submitRequest: (data: { taskId: string; submitterName: string; submitterPhone: string; formData: Record<string, unknown> }) =>
    request<RegistrationRequestRecord>('/api/registration/requests', { method: 'POST', body: JSON.stringify(data) }),
  approveRequest: (token: string, id: string) =>
    request<RegistrationRequestRecord>(`/api/registration/requests/${id}/approve`, { method: 'PUT', token }),
  rejectRequest: (token: string, id: string, reason: string) =>
    request<RegistrationRequestRecord>(`/api/registration/requests/${id}/reject`, { method: 'PUT', token, body: JSON.stringify({ reason }) }),
  deleteRequest: (token: string, id: string) =>
    request(`/api/registration/requests/${id}`, { method: 'DELETE', token }),
}

// 业务模块
export const businessAPI = {
  // 僧众
  getMonks: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/monks${query}`, { token })
  },
  createMonk: (token: string, data: any) =>
    request<any>('/api/monks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateMonk: (token: string, id: string, data: any) =>
    request<any>(`/api/monks/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteMonk: (token: string, id: string) =>
    request(`/api/monks/${id}`, { method: 'DELETE', token }),

  // 义工
  getVolunteers: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/volunteers${query}`, { token })
  },
  createVolunteer: (token: string, data: any) =>
    request<any>('/api/volunteers', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVolunteer: (token: string, id: string, data: any) =>
    request<any>(`/api/volunteers/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteVolunteer: (token: string, id: string) =>
    request(`/api/volunteers/${id}`, { method: 'DELETE', token }),

  // 义工任务
  getVolunteerTasks: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/volunteer-tasks${query}`)
  },
  createVolunteerTask: (token: string, data: any) =>
    request<any>('/api/volunteer-tasks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateVolunteerTask: (token: string, id: string, data: any) =>
    request<any>(`/api/volunteer-tasks/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteVolunteerTask: (token: string, id: string) =>
    request(`/api/volunteer-tasks/${id}`, { method: 'DELETE', token }),

  // 义工考勤
  signIn: (data: { taskId: string; volunteerName: string; volunteerPhone: string }) =>
    request<any>('/api/volunteer-attendance/sign-in', { method: 'POST', body: JSON.stringify(data) }),
  signOut: (data: { taskId: string; volunteerPhone: string }) =>
    request<any>('/api/volunteer-attendance/sign-out', { method: 'POST', body: JSON.stringify(data) }),

  // 信众
  getDevotees: (token: string, params?: any, options?: FetchOptions) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<DevoteeRecord[]>(`/api/devotees${query}`, { token, ...(options || {}) })
  },
  createDevotee: (token: string, data: Partial<DevoteeRecord>) =>
    request<DevoteeRecord>('/api/devotees', { method: 'POST', token, body: JSON.stringify(data) }),
  updateDevotee: (token: string, id: string, data: Partial<DevoteeRecord>) =>
    request<DevoteeRecord>(`/api/devotees/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteDevotee: (token: string, id: string) =>
    request(`/api/devotees/${id}`, { method: 'DELETE', token }),

  // 牌位
  getPlaques: (token: string, params?: any, options?: FetchOptions) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PlaqueRecord[]>(`/api/plaques${query}`, { token, ...(options || {}) })
  },
  createPlaque: (token: string, data: Partial<PlaqueRecord> & { customDedicationType?: string }) =>
    request<PlaqueRecord>('/api/plaques', { method: 'POST', token, body: JSON.stringify(data) }),
  updatePlaque: (token: string, id: string, data: Partial<PlaqueRecord> & { customDedicationType?: string }) =>
    request<PlaqueRecord>(`/api/plaques/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  batchUpdatePlaques: (token: string, data: { ids: string[]; action: string; ritualId?: string; endDate?: string }) =>
    request<any>('/api/plaques/batch', { method: 'PUT', token, body: JSON.stringify(data) }),
  deletePlaque: (token: string, id: string) =>
    request(`/api/plaques/${id}`, { method: 'DELETE', token }),
  createPrintJob: (token: string, data: {
    sourceType?: string
    plaqueIds: string[]
    templateId?: string
    templateName?: string
    templateSnapshot?: any
    plaqueType?: string
    paperWidthMm?: number
    paperHeightMm?: number
    printClientId?: string
    remarks?: string
  }) =>
    request<Pick<PrintJobRecord, 'id' | 'jobNo' | 'totalCount'> & { missingIds: string[] }>('/api/print-jobs', { method: 'POST', token, body: JSON.stringify(data) }),
  getPrintJobs: (token: string, params?: any, options?: FetchOptions) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PrintJobRecord[]>(`/api/print-jobs${query}`, { token, ...(options || {}) })
  },
  getPrintJob: (token: string, id: string) =>
    request<PrintJobRecord>(`/api/print-jobs/${id}`, { token }),

  // 法会
  getRituals: (params?: any, options?: FetchOptions) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<RitualRecord[]>(`/api/rituals${query}`, options)
  },
  createRitual: (token: string, data: any) =>
    request<any>('/api/rituals', { method: 'POST', token, body: JSON.stringify(data) }),
  updateRitual: (token: string, id: string, data: any) =>
    request<any>(`/api/rituals/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteRitual: (token: string, id: string) =>
    request(`/api/rituals/${id}`, { method: 'DELETE', token }),

  // 殿堂
  getHalls: () => request<any[]>('/api/halls'),
  createHall: (token: string, data: any) =>
    request<any>('/api/halls', { method: 'POST', token, body: JSON.stringify(data) }),
  updateHall: (token: string, id: string, data: any) =>
    request<any>(`/api/halls/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),

  // 供灯
  getLampOfferings: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/lamp-offerings${query}`)
  },
  createLampOffering: (data: any) =>
    request<any>('/api/lamp-offerings', { method: 'POST', body: JSON.stringify(data) }),

  // 功德
  getDonations: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/donations${query}`, { token })
  },
  createDonation: (token: string, data: any) =>
    request<any>('/api/donations', { method: 'POST', token, body: JSON.stringify(data) }),

  // 库房
  getWarehouseItems: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/warehouse/items${query}`, { token })
  },
  createWarehouseItem: (token: string, data: any) =>
    request<any>('/api/warehouse/items', { method: 'POST', token, body: JSON.stringify(data) }),
  warehouseIn: (token: string, data: any) =>
    request<any>('/api/warehouse/in', { method: 'POST', token, body: JSON.stringify(data) }),
  warehouseOut: (token: string, data: any) =>
    request<any>('/api/warehouse/out', { method: 'POST', token, body: JSON.stringify(data) }),

  // 住宿
  getRooms: (token: string) => request<any[]>('/api/rooms', { token }),
  createRoom: (token: string, data: any) =>
    request<any>('/api/rooms', { method: 'POST', token, body: JSON.stringify(data) }),
  updateRoom: (token: string, id: string, data: any) =>
    request<any>(`/api/rooms/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  getAccommodations: (token: string) => request<any[]>('/api/accommodations', { token }),
  createAccommodation: (token: string, data: any) =>
    request<any>('/api/accommodations', { method: 'POST', token, body: JSON.stringify(data) }),
  checkoutAccommodation: (token: string, id: string) =>
    request<any>(`/api/accommodations/${id}/checkout`, { method: 'PUT', token }),

  // 斋堂
  getDining: (token: string) => request<any[]>('/api/dining', { token }),
  createDining: (token: string, data: any) =>
    request<any>('/api/dining', { method: 'POST', token, body: JSON.stringify(data) }),

  // 来访
  getVisits: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/visits${query}`, { token })
  },
  createVisit: (token: string, data: any) =>
    request<any>('/api/visits', { method: 'POST', token, body: JSON.stringify(data) }),

  // 用户
  getUsers: (token: string) => request<UserRecord[]>('/api/users', { token }),
  createUser: (token: string, data: { username: string; password: string; email?: string; name?: string; role: string }) =>
    request<UserRecord>('/api/users', { method: 'POST', token, body: JSON.stringify(data) }),
  updateUserPassword: (token: string, id: string, newPassword: string) =>
    request(`/api/users/${id}/password`, { method: 'PUT', token, body: JSON.stringify({ newPassword }) }),
  deleteUser: (token: string, id: string) =>
    request(`/api/users/${id}`, { method: 'DELETE', token }),

  // 日志
  getLogs: (token: string, params?: Record<string, string | number>) => {
    const query = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
        ).toString()
      : ''
    return request<OperationLogList>(`/api/logs${query}`, { token })
  },

  // 统计
  getStats: (token: string, options?: FetchOptions) => request<DashboardStats>('/api/stats/dashboard', { token, ...(options || {}) }),

  // 牌位模板
  getPlaqueTemplates: (token: string, options?: FetchOptions) => request<PlaqueTemplate[]>('/api/plaque-templates', { token, ...(options || {}) }),
  getPlaqueTemplate: (id: string) => request<PlaqueTemplate>(`/api/plaque-templates/${id}`),
  createPlaqueTemplate: (token: string, data: Partial<PlaqueTemplate>) =>
    request<PlaqueTemplate>('/api/plaque-templates', { method: 'POST', token, body: JSON.stringify(data) }),
  updatePlaqueTemplate: (token: string, id: string, data: Partial<PlaqueTemplate>) =>
    request<PlaqueTemplate>(`/api/plaque-templates/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deletePlaqueTemplate: (token: string, id: string) =>
    request(`/api/plaque-templates/${id}`, { method: 'DELETE', token }),
  getPrintClients: (token: string, options?: FetchOptions) =>
    request<PrintClientRecord[]>('/api/print-clients', { token, ...(options || {}) }),

  // 牌位导入
  importPlaques: async (token: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await request<any>('/api/import/plaques', {
      method: 'POST',
      token,
      headers: {},
      body: formData as any,
    })
    return result.data || result
  },

// Export plaques (CSV)
  exportPlaques: async (token: string, plaqueIds: string[]): Promise<void> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''
    const url = API_BASE + '/api/batch/export-plaques'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plaqueIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Export failed' }))
      throw new Error(err.error || 'Export failed')
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = 'plaques_' + new Date().toISOString().slice(0, 10) + '.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  },
}

export const wechatAPI = {
  getStatus: (token: string) => request<any>('/api/integrations/wechat/status', { token }),
  getAuthUrl: (token: string) => request<any>('/api/integrations/wechat/auth-url', { token }),
  bind: (token: string, data: any) =>
    request<any>('/api/integrations/wechat/bind', { method: 'POST', token, body: JSON.stringify(data) }),
  getMessages: (token: string) => request<any[]>('/api/wechat/messages', { token }),
  replyMessage: (token: string, id: string, content: string) =>
    request<any>(`/api/wechat/messages/${id}/reply`, { method: 'POST', token, body: JSON.stringify({ content }) }),
  getArticles: (token: string) => request<any[]>('/api/wechat/articles', { token }),
  createArticle: (token: string, data: any) =>
    request<any>('/api/wechat/articles', { method: 'POST', token, body: JSON.stringify(data) }),
  publishArticle: (token: string, id: string) =>
    request<any>(`/api/wechat/articles/${id}/publish`, { method: 'POST', token }),
  sendTemplateMessage: (token: string, data: any) =>
    request<any>('/api/wechat/template-messages/send', { method: 'POST', token, body: JSON.stringify(data) }),
}
