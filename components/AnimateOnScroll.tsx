'use client'

import { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

export default function AnimateOnScroll({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up' 
}: AnimateOnScrollProps) {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1 })

  const getAnimationClass = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return 'opacity-0 translate-y-8'
        case 'down':
          return 'opacity-0 -translate-y-8'
        case 'left':
          return 'opacity-0 translate-x-8'
        case 'right':
          return 'opacity-0 -translate-x-8'
        case 'fade':
          return 'opacity-0'
        default:
          return 'opacity-0 translate-y-8'
      }
    }
    return 'opacity-100 translate-y-0 translate-x-0'
  }

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ease-out ${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
