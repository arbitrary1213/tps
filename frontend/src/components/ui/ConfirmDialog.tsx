'use client'

import { useEffect } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
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

  const variantStyles = {
    danger: 'text-vermilion',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  }

  const iconMap = {
    danger: '',
    warning: '',
    info: '',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-lg shadow-classic-lg max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-4">
          <div className={`text-3xl ${variantStyles[variant]}`}>
            {iconMap[variant]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-ink">{title}</h3>
            <p className="mt-2 text-sm text-tea/70">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-vermilion',
    info: 'bg-tea',
  }

  const iconMap = {
    success: '',
    error: '',
    info: '',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-classic-lg flex items-center gap-3`}>
        <span>{iconMap[type]}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
        </button>
      </div>
    </div>
  )
}