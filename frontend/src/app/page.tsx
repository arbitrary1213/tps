'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registrationAPI } from '@/lib/api'

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

  useEffect(() => {
    loadTasks()
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

  // 三种牌位入口：延生禄位 / 不记名牌位 / 记名牌位
  const plaqueTypes = new Set(tasks.map(t => t.taskType))
  const hasPlaqueGroup = plaqueTypes.has('PLAQUE') || plaqueTypes.has('LONGEVITY') || plaqueTypes.has('REBIRTH') || plaqueTypes.has('DELIVERANCE')
  const otherTasks = tasks.filter(t => !['PLAQUE', 'LONGEVITY', 'REBIRTH', 'DELIVERANCE'].includes(t.taskType))

  const displayTasks = [
    ...(hasPlaqueGroup ? [{ id: 'PLAQUE_LONGEVITY', name: '延生禄位', href: '/register?taskType=PLAQUE&plaqueType=LONGEVITY' }] : []),
    ...(hasPlaqueGroup ? [{ id: 'PLAQUE_DELIVERANCE_GENERAL', name: '超度牌位（不记名）', href: '/register?taskType=PLAQUE&plaqueType=DELIVERANCE&deceasedType=general' }] : []),
    ...(hasPlaqueGroup ? [{ id: 'PLAQUE_DELIVERANCE_SPECIFIC', name: '超度牌位（记名）', href: '/register?taskType=PLAQUE&plaqueType=DELIVERANCE&deceasedType=specific' }] : []),
    ...otherTasks.map(t => ({ id: t.id, name: t.name, href: `/register?taskId=${t.id}` })),
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Hero 区域 */}
      <main className="flex-1 flex items-center justify-center py-16">
        {/* 内容 */}
        <div className="text-center px-6 max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif mb-6 tracking-widest" style={{ color: '#2C2C2C' }}>
            仙顶寺
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-12 leading-relaxed tracking-wide">
            精进行道 · 庄严国土 · 利乐有情
          </p>

          {/* 登记任务按钮 */}
          {loading ? (
            <p className="text-gray-400">加载中...</p>
          ) : displayTasks.length > 0 ? (
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
          ) : (
            <p className="text-gray-400">暂无可用登记服务</p>
          )}
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="py-6" style={{ backgroundColor: '#F0EDE8' }}>
        <div className="text-center text-gray-500 text-sm tracking-wide">
          <p>浙江省湖州市吴兴区栖贤山仙顶禅寺</p>
        </div>
      </footer>
    </div>
  )
}