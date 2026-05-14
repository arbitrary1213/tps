'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuthStore } from '@/stores/authStore'
import { businessAPI, registrationAPI, systemAPI } from '@/lib/api'

const sidebarNav = [
  { group: '工作台', items: [
    { name: '总览', path: '/admin' },
    { name: '登记发布', path: '/admin/tasks' },
    { name: '登记审批', path: '/admin/approvals' },
  ]},
  { group: '寺院业务', items: [
    { name: '信众管理', path: '/admin/devotees' },
    { name: '牌位管理', path: '/admin/plaques' },
    { name: '法会管理', path: '/admin/rituals' },
    { name: '供灯祈福', path: '/admin/lamps' },
    { name: '功德管理', path: '/admin/donations' },
  ]},
  { group: '模板与打印', items: [
    { name: '模板设计', path: '/print-api/' },
    { name: '批量打印', path: '/admin/plaques/batch-print' },
  ]},
  { group: '公众号运营', items: [
    { name: '公众号控制台', path: '/admin/wechat' },
  ]},
  { group: '人员与后勤', items: [
    { name: '义工管理', path: '/admin/volunteers' },
    { name: '义工任务', path: '/admin/volunteer-tasks' },
    { name: '义工考勤', path: '/admin/volunteer-attendance' },
    { name: '僧众管理', path: '/admin/monks' },
    { name: '住宿管理', path: '/admin/rooms' },
    { name: '斋堂管理', path: '/admin/dining' },
    { name: '来访管理', path: '/admin/visits' },
    { name: '库房管理', path: '/admin/warehouse' },
  ]},
  { group: '系统', items: [
    { name: '殿堂管理', path: '/admin/halls' },
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
  const [syncState, setSyncState] = useState({
    status: 'idle',
    message: '未同步',
    ok: 0,
    failed: 0,
    localDb: null as null | { path: string; entityCount: number; pendingCount: number },
  })

  const isDesktop = typeof window !== 'undefined' && Boolean(window.templeDesktop)

  useEffect(() => {
    if (_hasHydrated && !token) router.push('/login')
  }, [_hasHydrated, token, router])

  useEffect(() => {
    if (!_hasHydrated || !token || !isDesktop) return
    let cancelled = false

    const coreSyncTasks = [
      { label: '牌位', run: () => businessAPI.getPlaques(token, undefined, { preferRemote: true }) },
      { label: '打印任务', run: () => businessAPI.getPrintJobs(token, { status: 'PENDING' }, { preferRemote: true }) },
      { label: '模板', run: () => businessAPI.getPlaqueTemplates(token, { preferRemote: true }) },
      { label: '系统设置', run: () => systemAPI.getSettings({ preferRemote: true }) },
    ]
    const secondarySyncTasks = [
      { label: '统计', run: () => businessAPI.getStats(token, { preferRemote: true }) },
      { label: '待审批登记', run: () => registrationAPI.getRequests(token, { status: 'PENDING' }, { preferRemote: true }) },
      { label: '信众', run: () => businessAPI.getDevotees(token, undefined, { preferRemote: true }) },
      { label: '法会', run: () => businessAPI.getRituals(undefined, { preferRemote: true }) },
    ]

    const run = async () => {
      const initialLocalDb = await window.templeDesktop?.getLocalDbInfo?.().catch(() => null)
      setSyncState((prev) => ({
        ...prev,
        status: 'syncing',
        message: '正在同步服务器数据...',
        ok: 0,
        failed: 0,
        localDb: initialLocalDb || prev.localDb,
      }))
      let ok = 0
      let failed = 0
      const runTaskGroup = async (tasks: Array<{ label: string; run: () => Promise<unknown> }>) => {
        for (const task of tasks) {
          try {
            await task.run()
            ok += 1
            if (!cancelled) {
              setSyncState((prev) => ({ ...prev, ok, failed, message: `正在同步：${task.label}` }))
            }
          } catch (error) {
            failed += 1
          }
        }
      }

      await runTaskGroup(coreSyncTasks)

      const localDb = await window.templeDesktop?.getLocalDbInfo?.().catch(() => null)
      if (!cancelled) {
        setSyncState({
          status: failed ? 'partial' : 'done',
          message: failed ? '核心同步完成，部分数据失败' : '核心同步完成',
          ok,
          failed,
          localDb: localDb || null,
        })
      }

      await runTaskGroup(secondarySyncTasks)

      const refreshedLocalDb = await window.templeDesktop?.getLocalDbInfo?.().catch(() => null)
      if (!cancelled) {
        setSyncState({
          status: failed ? 'partial' : 'done',
          message: failed ? '同步完成，部分数据失败' : '同步完成',
          ok,
          failed,
          localDb: refreshedLocalDb || localDb || null,
        })
      }
    }

    run().catch((error) => {
      if (!cancelled) {
        setSyncState({
          status: 'error',
          message: error instanceof Error ? error.message : '同步失败',
          ok: 0,
          failed: coreSyncTasks.length + secondarySyncTasks.length,
          localDb: null,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [_hasHydrated, token, isDesktop])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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

  const activeItem = sidebarNav.flatMap((group) => group.items).find((item) => pathname === item.path)
  const syncTone = syncState.status === 'done'
    ? 'text-bamboo'
    : syncState.status === 'syncing'
      ? 'text-vermilion'
      : syncState.failed
        ? 'text-amber-700'
        : 'text-tea'

  return (
    <div className={clsx('flex min-h-screen bg-paper', isDesktop && 'desktop-admin')}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 w-56 h-screen bg-white border-r border-[#E8E0D0] flex flex-col shadow-classic lg:shadow-none transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[#E8E0D0]">
          <Link href="/admin" className="text-base sm:text-lg font-serif text-classic text-ink tracking-widest">
            仙顶寺管理
          </Link>
          <button
            className="lg:hidden p-2 -mr-2 text-tea hover:text-ink"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 sm:py-4">
          {sidebarNav.map((group) => (
            <div key={group.group} className="mb-2 sm:mb-4">
              <div className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs text-tea/50 font-medium tracking-wider">
                {group.group}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
                  const isTemplateDesigner = item.path === '/print-api/'
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={(event) => {
                          if (isTemplateDesigner && window.templeDesktop?.openTemplateDesigner) {
                            event.preventDefault()
                            window.templeDesktop.openTemplateDesigner()
                          }
                        }}
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

      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        <header className="h-14 sm:h-16 bg-white border-b border-[#E8E0D0] sticky top-0 z-20 shadow-sm desktop-toolbar">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <button
              className="lg:hidden p-2 -ml-2 text-tea hover:text-ink"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-base sm:text-lg font-medium text-ink tracking-wide truncate">
              {activeItem?.name || '总览'}
            </h1>

            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className={clsx('text-xs', syncTone)}>{syncState.message}</div>
                <div className="text-xs text-tea/50">
                  {syncState.ok} 成功 / {syncState.failed} 失败
                  {syncState.localDb ? ` / 本地 ${syncState.localDb.entityCount} 条` : ''}
                </div>
              </div>
              {isDesktop && (
                <button
                  onClick={() => window.templeDesktop?.openTemplateDesigner?.()}
                  className="h-8 px-3 rounded border border-[#E8E0D0] text-xs text-tea hover:text-vermilion hover:border-vermilion transition-colors"
                >
                  模板设计
                </button>
              )}
              <span className="text-sm text-tea/60">{user?.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 desktop-content">
          {children}
        </main>

        {isDesktop && (
          <footer className="desktop-statusbar h-8 px-4 border-t border-[#E8E0D0] bg-white text-xs text-tea/70 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <span className={syncTone}>{syncState.status === 'syncing' ? '同步中' : syncState.failed ? '部分离线' : '本地就绪'}</span>
              <span className="truncate">本地库：{syncState.localDb?.path || '初始化中'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>本地 {syncState.localDb?.entityCount || 0} 条</span>
              <span>待同步 {syncState.localDb?.pendingCount || 0} 条</span>
              <span>{user?.name || user?.username}</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
