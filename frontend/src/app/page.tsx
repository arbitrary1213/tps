'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registrationAPI, systemAPI } from '@/lib/api'

interface Task {
  id: string
  name: string
  taskType: string
  description?: string
  enabled?: boolean
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [needPassword, setNeedPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    loadTasks()
    checkPassword()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await registrationAPI.getTasks()
      const enabledTasks = (Array.isArray(data) ? data : []).filter((t: Task) => t.enabled !== false)
      setTasks(enabledTasks)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPassword = async () => {
    try {
      const settings = await systemAPI.getSettings()
      if (settings?.accessPassword) {
        const stored = localStorage.getItem('_temple_access')
        if (stored === settings.accessPassword) {
          setUnlocked(true)
        } else {
          setNeedPassword(true)
        }
      }
    } catch (error) {
      // 加载失败则允许访问
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const settings = await systemAPI.getSettings()
      if (passwordInput === settings?.accessPassword) {
        localStorage.setItem('_temple_access', passwordInput)
        setUnlocked(true)
      } else {
        setPasswordError(true)
        setPasswordInput('')
      }
    } catch {
      setPasswordError(true)
    }
  }

  const plaqueTypes = new Set(tasks.map(t => t.taskType))
  const hasPlaqueGroup = plaqueTypes.has('PLAQUE') || plaqueTypes.has('LONGEVITY') || plaqueTypes.has('REBIRTH') || plaqueTypes.has('DELIVERANCE')
  const otherTasks = tasks.filter(t => !['PLAQUE', 'LONGEVITY', 'REBIRTH', 'DELIVERANCE'].includes(t.taskType))

  const commonEntries = [
    { id: 'photo-restore', name: '老照片修复', href: '/photo-restore' },
    { id: 'portrait-compose', name: '人像合成', href: '/portrait-compose' },
  ]

  const displayTasks = [
    ...(hasPlaqueGroup ? [{ id: 'PLAQUE', name: '牌位登记', href: '/register?taskType=PLAQUE' }] : []),
    ...otherTasks.map(t => ({ id: t.id, name: t.name, href: `/register?taskId=${t.id}` })),
    ...commonEntries,
  ]

  // 密码门
  if (needPassword && !unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="text-center px-6 max-w-sm w-full">
          <h1 className="text-4xl sm:text-5xl font-serif mb-8 tracking-widest" style={{ color: '#2C2C2C' }}>
            仙顶寺
          </h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
              placeholder="请输入访问密码"
              className="w-full h-12 px-4 border border-[#E8E0D0] rounded-lg bg-white text-center text-base focus:outline-none focus:border-vermilion"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm">密码错误，请重试</p>
            )}
            <button
              type="submit"
              disabled={!passwordInput}
              className="w-full bg-vermilion text-white py-3 rounded-lg text-sm font-medium tracking-wider hover:bg-vermilion-dark disabled:opacity-50"
            >
              确认
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center px-6 max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif mb-6 tracking-widest" style={{ color: '#2C2C2C' }}>
            仙顶寺
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-12 leading-relaxed tracking-wide">
            精进行道 · 庄严国土 · 利乐有情
          </p>

          {loading ? (
            <p className="text-gray-400">加载中...</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 max-w-md mx-auto">
              {displayTasks.map(task => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-center justify-center px-6 py-5 rounded-xl text-sm sm:text-base font-medium transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#5C5C5C',
                    border: '1px solid #E8E0D0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {task.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="py-6" style={{ backgroundColor: '#F0EDE8' }}>
        <div className="text-center text-gray-500 text-sm tracking-wide">
          <p>浙江省湖州市吴兴区栖贤山仙顶禅寺</p>
        </div>
      </footer>
    </div>
  )
}