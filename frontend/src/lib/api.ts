const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface FetchOptions extends RequestInit {
  token?: string
}

async function request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof options.headers === 'object' && options.headers !== null 
      ? options.headers as Record<string, string>
      : {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint
  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.error || '请求失败')
  }

  // GET requests return data.data, POST/PUT/DELETE return the full response
  if (fetchOptions.method === 'GET' || !fetchOptions.method) {
    return json.data
  }
  return json
}

// 认证
export const authAPI = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; password: string; email?: string; name?: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<any>('/api/auth/me', { token }),

  changePassword: (token: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request('/api/auth/change-password', { method: 'PUT', token, body: JSON.stringify(data) }),
}

// 系统设置
export const systemAPI = {
  getSettings: () => request<any>('/api/system/settings'),
  updateSettings: (token: string, data: any) =>
    request('/api/system/settings', { method: 'PUT', token, body: JSON.stringify(data) }),
}

// 登记
export const registrationAPI = {
  getTasks: () => request<any[]>('/api/registration/tasks'),
  getTasksAll: (token: string) => request<any[]>('/api/registration/tasks/all', { token }),
  createTask: (token: string, data: any) =>
    request<any>('/api/registration/tasks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateTask: (token: string, id: string, data: any) =>
    request<any>(`/api/registration/tasks/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteTask: (token: string, id: string) =>
    request(`/api/registration/tasks/${id}`, { method: 'DELETE', token }),

  getRequests: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any>(`/api/registration/requests${query}`, { token })
  },
  submitRequest: (data: { taskId: string; submitterName: string; submitterPhone: string; formData: any }) =>
    request<any>('/api/registration/requests', { method: 'POST', body: JSON.stringify(data) }),
  approveRequest: (token: string, id: string) =>
    request<any>(`/api/registration/requests/${id}/approve`, { method: 'PUT', token }),
  rejectRequest: (token: string, id: string, reason: string) =>
    request<any>(`/api/registration/requests/${id}/reject`, { method: 'PUT', token, body: JSON.stringify({ reason }) }),
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
  getDevotees: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/devotees${query}`, { token })
  },
  createDevotee: (token: string, data: any) =>
    request<any>('/api/devotees', { method: 'POST', token, body: JSON.stringify(data) }),
  updateDevotee: (token: string, id: string, data: any) =>
    request<any>(`/api/devotees/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deleteDevotee: (token: string, id: string) =>
    request(`/api/devotees/${id}`, { method: 'DELETE', token }),

  // 牌位
  getPlaques: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/plaques${query}`, { token })
  },
  createPlaque: (token: string, data: any) =>
    request<any>('/api/plaques', { method: 'POST', token, body: JSON.stringify(data) }),
  updatePlaque: (token: string, id: string, data: any) =>
    request<any>(`/api/plaques/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deletePlaque: (token: string, id: string) =>
    request(`/api/plaques/${id}`, { method: 'DELETE', token }),

  // 法会
  getRituals: (params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>(`/api/rituals${query}`)
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
  getUsers: (token: string) => request<any[]>('/api/users', { token }),
  createUser: (token: string, data: any) =>
    request<any>('/api/users', { method: 'POST', token, body: JSON.stringify(data) }),
  deleteUser: (token: string, id: string) =>
    request(`/api/users/${id}`, { method: 'DELETE', token }),

  // 日志
  getLogs: (token: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any>(`/api/logs${query}`, { token })
  },

  // 统计
  getStats: (token: string) => request<any>('/api/stats/dashboard', { token }),

  // 牌位模板
  getPlaqueTemplates: (token: string) => request<any[]>('/api/plaque-templates', { token }),
  getPlaqueTemplate: (id: string) => request<any>(`/api/plaque-templates/${id}`),
  createPlaqueTemplate: (token: string, data: any) =>
    request<any>('/api/plaque-templates', { method: 'POST', token, body: JSON.stringify(data) }),
  updatePlaqueTemplate: (token: string, id: string, data: any) =>
    request<any>(`/api/plaque-templates/${id}`, { method: 'PUT', token, body: JSON.stringify(data) }),
  deletePlaqueTemplate: (token: string, id: string) =>
    request(`/api/plaque-templates/${id}`, { method: 'DELETE', token }),

  // 牌位导入
  importPlaques: (token: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ success: number; failed: number; errors: string[] }>('/api/import/plaques', {
      method: 'POST',
      token,
      headers: {}, // 让 fetch 不设置 Content-Type，让 FormData 自己设置
      body: formData as any,
    })
  },
}
