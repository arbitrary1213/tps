'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { clsx } from 'clsx'

const navItems = [
  { group: '核心', items: [
    { href: '/admin', label: '仪表盘', icon: '◉' },
    { href: '/admin/tasks', label: '登记发布', icon: '◎' },
    { href: '/admin/approvals', label: '登记审批', icon: '◇' },
  ]},
  { group: '人员管理', items: [
    { href: '/admin/volunteers', label: '义工管理', icon: '☺' },
    { href: '/admin/monks', label: '僧众管理', icon: '♝' },
    { href: '/admin/devotees', label: '信众管理', icon: '❀' },
  ]},
  { group: '佛事管理', items: [
    { href: '/admin/plaques', label: '牌位管理', icon: '▣' },
    { href: '/admin/plaques/batch-print', label: '批量打印', icon: '⬇' },
    { href: '/admin/plaque-templates', label: '模板设计', icon: '✎' },
    { href: '/admin/rituals', label: '法会管理', icon: '☸' },
    { href: '/admin/halls', label: '殿堂管理', icon: '⌂' },
    { href: '/admin/lamps', label: '供灯祈福', icon: '✧' },
  ]},
  { group: '后勤管理', items: [
    { href: '/admin/rooms', label: '住宿管理', icon: '⌂' },
    { href: '/admin/dining', label: '斋堂管理', icon: '☕' },
    { href: '/admin/visits', label: '来访管理', icon: '▷' },
  ]},
  { group: '财务后勤', items: [
    { href: '/admin/donations', label: '功德管理', icon: '♡' },
    { href: '/admin/warehouse', label: '库房管理', icon: '▤' },
  ]},
  { group: '系统', items: [
    { href: '/admin/settings', label: '系统设置', icon: '⚙' },
    { href: '/admin/users', label: '用户管理', icon: '⚙' },
    { href: '/admin/logs', label: '操作日志', icon: '☰' },
  ]},
]

export function AdminNav() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-[#E8E0D0] flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#E8E0D0]">
        <Link href="/admin" className="text-lg font-serif text-classic text-ink tracking-widest">
          仙顶寺
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            <div className="px-6 py-2 text-xs text-tea/50 font-medium tracking-wider">
              {group.group}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'text-vermilion bg-vermilion-light/30 border-r-2 border-vermilion'
                      : 'text-tea hover:text-ink hover:bg-paper'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[#E8E0D0] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-vermilion-light text-vermilion flex items-center justify-center text-sm font-medium">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink truncate">{user?.name || user?.username}</div>
            <div className="text-xs text-tea/60 truncate">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-sm text-tea/60 hover:text-vermilion transition-colors text-left"
        >
          退出登录
        </button>
      </div>
    </aside>
  )
}