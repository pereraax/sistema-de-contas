'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface DiaMesPickerProps {
  value: string // 1-31
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function DiaMesPicker({
  value,
  onChange,
  placeholder = 'Selecione o dia',
  className = '',
  inputClassName = '',
}: DiaMesPickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const firstDay = new Date(view.year, view.month, 1)
  const lastDay = new Date(view.year, view.month + 1, 0)
  const startPad = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectedDay = value ? parseInt(value, 10) : null
  const today = new Date().getDate()

  const select = (e: React.MouseEvent, day: number) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(String(day))
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
    const d = new Date().getDate()
    onChange(String(d))
    setView({ year: new Date().getFullYear(), month: new Date().getMonth() })
    setOpen(false)
  }

  const monthLabel = `${MESES[view.month]} ${view.year}`

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full pl-3 pr-3 py-2.5 bg-white dark:bg-brand-midnight border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-aqua/40 focus:border-brand-aqua transition-all duration-200 text-left text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50 flex items-center justify-between hover:border-brand-aqua/50 dark:hover:border-brand-aqua/50 shadow-sm hover:shadow-md ${inputClassName}`}
      >
        <span className={value ? 'font-semibold' : 'text-gray-400 dark:text-brand-clean/50'}>
          {value ? `Dia ${value}` : placeholder}
        </span>
        <span className="flex items-center gap-2">
          <Calendar size={18} className="text-brand-aqua flex-shrink-0" strokeWidth={2} />
          <ChevronDown size={16} className={`text-brand-midnight/50 dark:text-brand-clean/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[9999] w-full min-w-[300px] max-w-[340px] bg-white dark:bg-brand-royal rounded-2xl shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gradient-to-br from-brand-aqua/5 to-transparent dark:from-brand-aqua/10 dark:to-transparent">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrev}
                className="p-2.5 rounded-xl hover:bg-brand-aqua/15 dark:hover:bg-brand-aqua/25 text-brand-midnight dark:text-brand-clean transition-all hover:scale-105 active:scale-95"
                aria-label="Mês anterior"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm font-bold text-brand-midnight dark:text-brand-clean">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goNext}
                className="p-2.5 rounded-xl hover:bg-brand-aqua/15 dark:hover:bg-brand-aqua/25 text-brand-midnight dark:text-brand-clean transition-all hover:scale-105 active:scale-95"
                aria-label="Próximo mês"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-bold text-brand-midnight/70 dark:text-brand-clean/70 py-1"
                >
                  {d}
                </div>
              ))}
              {days.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} className="aspect-square" />
                }
                const isSelected = selectedDay === day
                const isToday = day === today && view.month === new Date().getMonth() && view.year === new Date().getFullYear()
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => select(e, day)}
                    className={`
                      aspect-square rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center
                      hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 hover:scale-105 active:scale-95
                      ${isSelected ? 'bg-brand-aqua text-white dark:bg-brand-aqua dark:text-white shadow-lg shadow-brand-aqua/30 scale-105' : 'text-brand-midnight dark:text-brand-clean'}
                      ${isToday && !isSelected ? 'ring-2 ring-brand-aqua ring-offset-2 dark:ring-offset-brand-royal' : ''}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-end px-4 py-3 bg-white dark:bg-brand-royal border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={setHoje}
              className="px-4 py-2 text-xs font-bold text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-xl transition-all"
            >
              Usar dia de hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
