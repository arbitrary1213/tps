'use client'

import { clsx } from 'clsx'

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex gap-1 bg-paper-dark p-1 rounded', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2 text-sm font-medium rounded transition-all',
            activeTab === tab.id
              ? 'bg-white text-ink shadow-sm'
              : 'text-tea hover:text-ink'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx(
              'ml-2 px-2 py-0.5 text-xs rounded-full',
              activeTab === tab.id ? 'bg-vermilion text-white' : 'bg-paper text-tea'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}