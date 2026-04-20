'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const sidebarNav = [
  { group: '核心', items: [
    { name: '仪表盘', path: '/admin' },
    { name: '登记发布', path: '/admin/tasks' },
    { name: '登记审批', path: '/admin/approvals' },
  ]},
  { group: '人员管理', items: [
    { name: '义工管理', path: '/admin/volunteers' },
    { name: '义工任务', path: '/admin/volunteer-tasks' },
    { name: '义工考勤', path: '/admin/volunteer-attendance' },
    { name: '僧众管理', path: '/admin/monks' },
    { name: '信众管理', path: '/admin/devotees' },
  ]},
  { group: '佛事管理', items: [
    { name: '牌位管理', path: '/admin/plaques' },
    { name: '模板设计', path: '/admin/plaque-templates' },
    { name: '法会管理', path: '/admin/rituals' },
    { name: '殿堂管理', path: '/admin/halls' },
    { name: '供灯祈福', path: '/admin/lamps' },
  ]},
  { group: '财务管理', items: [
    { name: '功德管理', path: '/admin/donations' },
    { name: '库房管理', path: '/admin/warehouse' },
  ]},
  { group: '后勤管理', items: [
    { name: '住宿管理', path: '/admin/rooms' },
    { name: '斋堂管理', path: '/admin/dining' },
    { name: '来访管理', path: '/admin/visits' },
  ]},
  { group: '系统管理', items: [
    { name: '系统设置', path: '/admin/settings' },
    { name: '用户管理', path: '/admin/users' },
    { name: '操作日志', path: '/admin/logs' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, token, _hasHydrated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/login')
    }
  }, [_hasHydrated, token, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Show loading while checking auth or not authenticated
  if (!_hasHydrated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-vermilion border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-tea text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-[#E8E0D0] flex flex-col shadow-classic lg:shadow-none transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[#E8E0D0]">
          <Link href="/admin" className="text-base sm:text-lg font-serif text-classic text-ink tracking-widest">
            仙顶寺
          </Link>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-2 -mr-2 text-tea hover:text-ink"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 sm:py-4">
          {sidebarNav.map((group) => (
            <div key={group.group} className="mb-2 sm:mb-4">
              <div className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs text-tea/50 font-medium tracking-wider">
                {group.group}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.path ||
                    (item.path !== '/admin' && pathname.startsWith(item.path))
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={clsx(
                          'block px-4 sm:px-6 py-2 text-sm transition-colors tracking-wide',
                          isActive
                            ? 'text-vermilion bg-vermilion-light/30 border-r-2 border-vermilion'
                            : 'text-tea hover:text-ink hover:bg-paper'
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-[#E8E0D0] p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 rounded-full bg-vermilion-light text-vermilion flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink truncate">{user?.name || user?.username}</div>
              <div className="text-xs text-tea/60 truncate">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => {
              useAuthStore.getState().logout()
              router.push('/login')
            }}
            className="w-full text-sm text-tea/60 hover:text-vermilion transition-colors text-left py-1"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-[#E8E0D0] sticky top-0 z-20 shadow-sm">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 -ml-2 text-tea hover:text-ink"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-base sm:text-lg font-medium text-ink tracking-wide truncate">
              {sidebarNav.flatMap(g => g.items).find(i => pathname === i.path)?.name || '仪表盘'}
            </h1>
            
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-sm text-tea/60">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
