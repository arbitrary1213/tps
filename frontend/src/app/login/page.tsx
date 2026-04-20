'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setAuth, token, _hasHydrated } = useAuthStore()

  // If already logged in, redirect to admin
  useEffect(() => {
    if (_hasHydrated && token) {
      router.push('/admin')
    }
  }, [_hasHydrated, token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (data.success) {
        setAuth(data.data.user, data.data.token)
        router.push('/admin')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <div className="text-2xl sm:text-3xl font-serif text-classic text-ink tracking-widest">仙顶寺</div>
            <div className="text-xs sm:text-sm text-tea/60 mt-2 tracking-wider">智慧寺院管理系统</div>
          </Link>
        </div>

        {/* 登录表单 */}
        <div className="card shadow-classic-lg p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-medium text-ink mb-4 sm:mb-6 text-center tracking-wide">管理员登录</h1>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-vermilion-light text-vermilion-dark px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">用户名 / 邮箱</label>
              <input
                type="text"
                className="input h-11 sm:h-12"
                placeholder="请输入用户名或邮箱"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                className="input h-11 sm:h-12"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full h-11 sm:h-12 text-base">
              登 录
            </button>
          </form>
        </div>

        {/* 返回首页 */}
        <div className="text-center mt-4 sm:mt-6">
          <Link href="/" className="text-xs sm:text-sm text-tea/60 hover:text-vermilion tracking-wide">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
