'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [ hydrated, setHydrated ] = useState(false)
  const { setAuth, setHasHydrated } = useAuthStore()

  useEffect(() => {
    // Restore auth from localStorage on mount
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

  // Don't render children until hydrated (prevents hydration mismatch)
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E6]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5D4E37] text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
