'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#E8E0D0] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#E8E0D0] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#E8E0D0] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#E8E0D0] border-y-transparent border-l-transparent',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute z-50 ${positionStyles[position]} pointer-events-none`}>
          <div className="bg-ink text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {content}
          </div>
          <div className={`absolute ${arrowStyles[position]} border-4`} />
        </div>
      )}
    </div>
  )
}

interface HintProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function Hint({ title, children, defaultOpen = false }: HintProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-[#E8E0D0] rounded-lg bg-[#F5F0E6]/50">
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-tea">{title}</span>
        <span className={`text-tea/50 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-tea/70">{children}</div>}
    </div>
  )
}

export function RequiredMark() {
  return <span className="text-vermilion ml-1">*</span>
}

export function FormFieldHint({ hint }: { hint?: string }) {
  if (!hint) return null
  return <p className="mt-1 text-xs text-tea/60">{hint}</p>
}