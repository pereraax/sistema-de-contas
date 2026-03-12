'use client'

import { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

const variants = {
  primary: 'bg-[#25D366] hover:bg-[#20BA5A] text-white border-0',
  secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white border-0',
  ghost: 'bg-transparent hover:bg-white/10 text-zinc-300 border-0',
  outline: 'bg-transparent border border-zinc-600 hover:bg-white/5 text-zinc-300',
  destructive: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
