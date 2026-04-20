'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-tea mb-2 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={4}
          className={clsx(
            'w-full px-4 py-3 border rounded bg-white transition-colors resize-none',
            'focus:outline-none focus:border-vermilion',
            error ? 'border-vermilion' : 'border-[#E8E0D0]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-vermilion">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'