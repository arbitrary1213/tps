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

const setAuthCookie = (token: string) => {
  document.cookie = `temple_token=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`
}

const clearAuthCookie = () => {
  document.cookie = 'temple_token=; Path=/; Max-Age=0; SameSite=Lax; Secure'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  _hasHydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuthCookie(token)
    }
    set({ user, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      clearAuthCookie()
    }
    set({ user: null, token: null })
  },

  setHasHydrated: (state) => {
    if (typeof window !== 'undefined' && state) {
      const token = localStorage.getItem('token')
      const userText = localStorage.getItem('user')
      if (token) {
        setAuthCookie(token)
        try {
          set({ token, user: userText ? JSON.parse(userText) : null, _hasHydrated: state })
          return
        } catch {
          set({ token, _hasHydrated: state })
          return
        }
      }
    }
    set({ _hasHydrated: state })
  },
}))
