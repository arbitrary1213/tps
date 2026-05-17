'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { group: '工作台', items: [
    { href: '/admin', label: '总览', icon: '总' },
    { href: '/admin/tasks', label: '登记发布', icon: '登' },
    { href: '/admin/approvals', label: '登记审批', icon: '审' },
  ]},
  { group: '寺院业务', items: [
    { href: '/admin/devotees', label: '信众管理', icon: '信' },
    { href: '/admin/plaques', label: '牌位管理', icon: '牌' },
    { href: '/admin/rituals', label: '法会管理', icon: '法' },
    { href: '/admin/lamps', label: '供灯祈福', icon: '灯' },
    { href: '/admin/donations', label: '功德管理', icon: '功' },
  ]},
  { group: '模板与打印', items: [
    { href: '/print-api/', label: '模板设计', icon: '模' },
  ]},
  { group: '公众号运营', items: [
    { href: '/admin/wechat', label: '公众号控制台', icon: '微' },
  ]},
  { group: '人员与后勤', items: [
    { href: '/admin/volunteers', label: '义工管理', icon: '义' },
    { href: '/admin/volunteer-tasks', label: '义工任务', icon: '任' },
    { href: '/admin/volunteer-attendance', label: '义工考勤', icon: '勤' },
    { href: '/admin/monks', label: '僧众管理', icon: '僧' },
    { href: '/admin/rooms', label: '住宿管理', icon: '住' },
    { href: '/admin/dining', label: '斋堂管理', icon: '斋' },
    { href: '/admin/visits', label: '来访管理', icon: '访' },
    { href: '/admin/warehouse', label: '库房管理', icon: '库' },
  ]},
  { group: '系统', items: [
    { href: '/admin/halls', label: '殿堂管理', icon: '殿' },
    { href: '/admin/settings', label: '系统设置', icon: '设' },
    { href: '/admin/users', label: '用户管理', icon: '用' },
    { href: '/admin/logs', label: '操作日志', icon: '志' },
  ]},
]

export function AdminNav() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-[#E8E0D0] flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-[#E8E0D0]">
        <Link href="/admin" className="text-lg font-serif text-classic text-ink tracking-widest">
          仙顶寺管理
        </Link>
      </div>

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
