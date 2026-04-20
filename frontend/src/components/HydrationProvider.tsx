'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [ hydrated, setHydrated ] = useState(false)
  const { setAuth, setHasHydrated } = useAuthStore()

  useEffect(() => {
    // Restore auth from localStorage
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuth(user, token)
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setHydrated(true)
    setHasHydrated(true)
  }, [setAuth, setHasHydrated])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-vermilion border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-tea text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
