'use client'

import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray'
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  success: 'bg-bamboo/10 text-bamboo border border-bamboo/20',
  warning: 'bg-gold-pale text-tea border border-gold/30',
  danger: 'bg-vermilion-light text-vermilion-dark border border-vermilion/20',
  info: 'bg-paper-dark text-tea border border-[#E8E0D0]',
  gray: 'bg-paper-dark/50 text-tea/70 border border-[#E8E0D0]',
}

export function Badge({ variant = 'info', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-0.5 rounded text-xs font-medium tracking-wide',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}