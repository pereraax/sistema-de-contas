'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimePickerProps {
  value: string // HH:mm ou vazio
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  id?: string
}

export default function TimePicker({
  value,
  onChange,
  placeholder = 'Horário (opcional)',
  className = '',
  inputClassName = '',
  id,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const applyTime = (h: string, m: string) => {
    const nh = Math.min(23, Math.max(0, parseInt(h, 10) || 0))
    const nm = Math.min(59, Math.max(0, parseInt(m, 10) || 0))
    const next = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
    onChange(next)
    setOpen(false)
  }

  const quickTimes = [
    '08:00', '09:00', '10:00', '12:00', '14:00', '18:00', '20:00', '22:00',
  ]

  const displayValue = value || ''

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`w-full pl-10 pr-3 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-aqua/30 focus:border-brand-aqua transition-smooth text-left text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50 flex items-center justify-between ${inputClassName}`}
      >
        <span className={displayValue ? '' : 'text-gray-400 dark:text-brand-clean/50'}>
          {displayValue || placeholder}
        </span>
        <Clock size={18} className="text-brand-midnight/50 dark:text-brand-clean/50 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[100] w-full min-w-[260px] max-w-[320px] bg-white dark:bg-brand-royal rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
            <p className="text-xs font-medium text-brand-midnight/70 dark:text-brand-clean/70 mb-3">
              Atalhos
            </p>
            <div className="grid grid-cols-4 gap-2">
              {quickTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => applyTime(t.slice(0, 2), t.slice(3, 5))}
                  className={`py-2 rounded-xl text-sm font-medium transition-smooth ${
                    value === t
                      ? 'bg-brand-aqua text-white dark:bg-brand-aqua dark:text-white shadow-md'
                      : 'hover:bg-brand-aqua/15 dark:hover:bg-brand-aqua/25 text-brand-midnight dark:text-brand-clean'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 dark:border-white/10">
            <label className="block text-xs font-medium text-brand-midnight/70 dark:text-brand-clean/70 mb-2">
              Horário personalizado
            </label>
            <input
              type="time"
              value={displayValue}
              onChange={(e) => {
                const v = e.target.value
                setInputValue(v)
                onChange(v)
              }}
              className="w-full px-3 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-aqua/30 focus:border-brand-aqua text-brand-midnight dark:text-brand-clean text-sm"
            />
          </div>
          <div className="flex justify-end px-4 py-2.5 bg-white dark:bg-brand-royal border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="text-xs font-semibold text-brand-aqua hover:text-brand-aqua/80 dark:text-brand-aqua dark:hover:text-white/90 transition-smooth"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
