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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ user: null, token: null })
  },

  setHasHydrated: (state) => {
    set({ _hasHydrated: state })
  },
}))
