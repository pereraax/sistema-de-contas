'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface InputDiaMesProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export default function InputDiaMes({
  value,
  onChange,
  min = 1,
  max = 31,
  className = '',
}: InputDiaMesProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Permitir campo vazio temporariamente
    if (newValue === '') {
      return
    }
    
    const numValue = parseInt(newValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
      if (clampedValue !== numValue) {
        setInputValue(clampedValue.toString())
      }
    }
  }

  const handleBlur = () => {
    // Validar quando perder o foco
    const numValue = parseInt(inputValue)
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numValue > max) {
      setInputValue(max.toString())
      onChange(max)
    } else {
      setInputValue(numValue.toString())
      onChange(numValue)
    }
  }

  const increment = () => {
    const newValue = Math.min(max, value + 1)
    setInputValue(newValue.toString())
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(min, value - 1)
    setInputValue(newValue.toString())
    onChange(newValue)
  }

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Botão de decremento (esquerda) */}
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex items-center justify-center w-10 h-10 bg-brand-aqua/10 dark:bg-brand-aqua/20 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-smooth border border-brand-aqua/30 dark:border-brand-aqua/40"
        title="Diminuir"
      >
        <ChevronLeft 
          size={20} 
          className="text-brand-aqua dark:text-brand-aqua" 
          strokeWidth={2.5}
        />
      </button>

      {/* Input */}
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        className="flex-1 px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm text-center font-medium"
        placeholder={`${min}-${max}`}
      />

      {/* Botão de incremento (direita) */}
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="flex items-center justify-center w-10 h-10 bg-brand-aqua/10 dark:bg-brand-aqua/20 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-smooth border border-brand-aqua/30 dark:border-brand-aqua/40"
        title="Aumentar"
      >
        <ChevronRight 
          size={20} 
          className="text-brand-aqua dark:text-brand-aqua" 
          strokeWidth={2.5}
        />
      </button>
    </div>
  )
}

