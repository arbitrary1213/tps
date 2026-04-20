'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={clsx('flex items-center gap-2 cursor-pointer', className)}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 text-vermilion border-[#E8E0D0] rounded focus:ring-vermilion"
          {...props}
        />
        {label && <span className="text-sm text-ink">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'