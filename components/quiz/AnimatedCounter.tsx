'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type AnimatedCounterProps = {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  delay?: number
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  delay = 0,
}: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const format = (n: number) =>
    (decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString()).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      '.'
    )

  if (!mounted) return <span className={className}>{prefix}0{suffix}</span>

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
      >
        {prefix}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
        >
          {format(value)}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  )
}
