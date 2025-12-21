'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'

interface CheckboxModernoProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function CheckboxModerno({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: CheckboxModernoProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 16,
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor={id}
          className={`
            relative flex items-center justify-center cursor-pointer transition-all duration-300
            ${sizeClasses[size]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Checkbox container */}
          <div
            className={`
              absolute inset-0 rounded-lg border-2 transition-all duration-300
              ${checked
                ? 'bg-gradient-to-br from-brand-aqua to-brand-blue border-brand-aqua shadow-lg shadow-brand-aqua/30'
                : 'bg-white dark:bg-brand-midnight border-gray-300 dark:border-white/20'
              }
              ${isHovered && !disabled && !checked
                ? 'border-brand-aqua/50 bg-brand-aqua/5 dark:bg-brand-aqua/10'
                : ''
              }
              ${disabled ? 'opacity-50' : ''}
            `}
            style={{
              transform: checked ? 'scale(1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {/* Checkmark icon */}
            {checked && (
              <div className="absolute inset-0 flex items-center justify-center animate-checkbox-check">
                <Check
                  size={iconSizes[size]}
                  className="text-white dark:text-brand-midnight font-bold"
                  strokeWidth={3}
                />
              </div>
            )}

            {/* Ripple effect on click */}
            {checked && (
              <div className="absolute inset-0 rounded-lg bg-brand-aqua/20 animate-ping" />
            )}
          </div>
        </label>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`
            text-sm font-medium cursor-pointer transition-colors duration-200
            ${checked
              ? 'text-brand-aqua dark:text-brand-aqua'
              : 'text-brand-midnight dark:text-brand-clean'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {label}
        </label>
      )}
    </div>
  )
}

