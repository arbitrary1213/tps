'use client'

import { Button } from './Button'

interface EmptyProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function Empty({ title = '暂无数据', description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-5xl text-tea/20 mb-4"></div>
      <h3 className="text-lg font-medium text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-tea/60 mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}