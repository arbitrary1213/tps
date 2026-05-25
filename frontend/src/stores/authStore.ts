import { create } from 'zustand'

interface User {
  id: string
  username: string
  email?: string
  name?: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  _hasHydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  _hasHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ user, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ user: null, token: null })
  },

  setHasHydrated: (state) => {
    if (typeof window !== 'undefined' && state) {
      const token = localStorage.getItem('token')
      const userText = localStorage.getItem('user')
      if (token) {
        try {
          set({ token, user: userText ? JSON.parse(userText) : null, _hasHydrated: state })
          return
        } catch {
          set({ token, _hasHydrated: state })
          return
        }
      }
      // Standalone mode: auto-create local admin user
      const w = window as any
      if (w.templeDesktop?.getAppMode) {
        w.templeDesktop.getAppMode().then((mode: string) => {
          if (mode === 'standalone') {
            const localUser = { id: 'local-admin', username: '本地管理员', name: '本地管理员', role: 'admin' }
            const localToken = 'local-standalone-token'
            localStorage.setItem('token', localToken)
            localStorage.setItem('user', JSON.stringify(localUser))
            set({ token: localToken, user: localUser, _hasHydrated: state })
          } else {
            set({ _hasHydrated: state })
          }
        }).catch(() => set({ _hasHydrated: state }))
        return
      }
    }
    set({ _hasHydrated: state })
  },
}))
