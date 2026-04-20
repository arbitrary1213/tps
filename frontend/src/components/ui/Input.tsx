'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-tea mb-2 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full h-11 px-4 border rounded bg-white transition-colors',
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

Input.displayName = 'Input'