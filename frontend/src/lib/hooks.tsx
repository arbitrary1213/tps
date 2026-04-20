'use client'

import { useState, useCallback, ReactNode } from 'react'
import { Toast } from '../components/ui'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, hideToast, ToastContainer }
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const confirm = useCallback(
    (options: {
      title: string
      message: string
      onConfirm: () => void
      variant?: 'danger' | 'warning' | 'info'
    }) => {
      setConfirmState({
        open: true,
        title: options.title,
        message: options.message,
        onConfirm: options.onConfirm,
        variant: options.variant,
      })
    },
    []
  )

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }))
  }, [])

  return { confirm, closeConfirm, confirmState }
}

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async function<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return { loading, error, execute, reset }
}