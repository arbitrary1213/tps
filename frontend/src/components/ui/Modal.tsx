'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" />
      <div
        className={clsx(
          'relative bg-white rounded-lg shadow-classic-lg w-full mx-4',
          'max-h-[90vh] overflow-hidden flex flex-col',
          'max-w-[calc(100vw-32px)] sm:max-w-none',
          {
            'max-w-sm': size === 'sm',
            'max-w-md': size === 'md',
            'max-w-2xl': size === 'lg',
            'max-w-4xl': size === 'xl',
          }
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D0]">
            <h2 className="text-lg font-medium text-ink tracking-wide">{title}</h2>
            <button
              onClick={onClose}
              className="text-tea/60 hover:text-ink transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#E8E0D0] bg-paper flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}