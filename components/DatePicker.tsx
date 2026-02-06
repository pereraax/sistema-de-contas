'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  className?: string
  inputClassName?: string
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD
  id?: string
}

function formatDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function DatePicker({
  value,
  onChange,
  required,
  placeholder = 'Selecione a data',
  className = '',
  inputClassName = '',
  min,
  max,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return { year: y, month: m - 1 }
    }
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setView({ year: y, month: m - 1 })
    }
  }, [value])

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

  const firstDay = new Date(view.year, view.month, 1)
  const lastDay = new Date(view.year, view.month + 1, 0)
  const startPad = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const select = (day: number) => {
    const y = view.year
    const m = String(view.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const next = `${y}-${m}-${d}`
    if (min && next < min) return
    if (max && next > max) return
    onChange(next)
    setOpen(false)
  }

  const goPrev = () => {
    if (view.month === 0) setView({ year: view.year - 1, month: 11 })
    else setView({ year: view.year, month: view.month - 1 })
  }

  const goNext = () => {
    if (view.month === 11) setView({ year: view.year + 1, month: 0 })
    else setView({ year: view.year, month: view.month + 1 })
  }

  const setHoje = () => {
    const d = new Date()
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (min && next < min) return
    if (max && next > max) return
    onChange(next)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    setOpen(false)
  }

  const limpar = () => {
    onChange('')
    setOpen(false)
  }

  const monthLabel = `${MESES[view.month]} de ${view.year}`

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`w-full pl-10 pr-3 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-aqua/30 focus:border-brand-aqua transition-smooth text-left text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50 flex items-center justify-between ${inputClassName}`}
      >
        <span className={value ? '' : 'text-gray-400 dark:text-brand-clean/50'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="text-brand-midnight/50 dark:text-brand-clean/50 flex-shrink-0 ml-2" />
      </button>

      {required && (
        <input
          type="text"
          required
          value={value}
          readOnly
          className="absolute opacity-0 pointer-events-none w-0 h-0 min-w-0 min-h-0"
          tabIndex={-1}
          aria-hidden
        />
      )}

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[100] w-full min-w-[280px] max-w-[320px] bg-white dark:bg-brand-royal rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrev}
                className="p-2 rounded-xl hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 text-brand-midnight dark:text-brand-clean transition-smooth"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-semibold text-brand-midnight dark:text-brand-clean capitalize">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-xl hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 text-brand-midnight dark:text-brand-clean transition-smooth"
                aria-label="Próximo mês"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-medium text-brand-midnight/60 dark:text-brand-clean/60 py-1"
                >
                  {d}
                </div>
              ))}
              {days.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} className="aspect-square" />
                }
                const dateStr = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = value === dateStr
                const isToday = dateStr === todayStr
                const isDisabled = (min && dateStr < min) || (max && dateStr > max)
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && select(day)}
                    className={`
                      aspect-square rounded-xl text-sm font-medium transition-smooth flex items-center justify-center
                      ${isDisabled ? 'text-gray-300 dark:text-brand-clean/30 cursor-not-allowed' : 'hover:bg-brand-aqua/15 dark:hover:bg-brand-aqua/25 text-brand-midnight dark:text-brand-clean'}
                      ${isSelected ? 'bg-brand-aqua text-white dark:bg-brand-aqua dark:text-white shadow-md' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-brand-aqua/50 dark:ring-brand-aqua/50' : ''}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-brand-royal border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={limpar}
              className="text-xs font-semibold text-brand-aqua hover:text-brand-aqua/80 dark:text-brand-aqua dark:hover:text-white/90 transition-smooth"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={setHoje}
              className="text-xs font-semibold text-brand-aqua hover:text-brand-aqua/80 dark:text-brand-aqua dark:hover:text-white/90 transition-smooth"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
