'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import FiltroRapidoData from './FiltroRapidoData'

interface FiltroDataContextType {
  dataInicio: string | undefined
  dataFim: string | undefined
  setFiltroData: (inicio: string | undefined, fim: string | undefined) => void
}

const FiltroDataContext = createContext<FiltroDataContextType | undefined>(undefined)

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { inicio: start.toISOString(), fim: end.toISOString() }
}

export function useFiltroData() {
  const context = useContext(FiltroDataContext)
  if (!context) {
    throw new Error('useFiltroData deve ser usado dentro de FiltroDataProvider')
  }
  return context
}

export function FiltroDataProvider({ children }: { children: ReactNode }) {
  const { inicio: defaultInicio, fim: defaultFim } = getCurrentMonthRange()
  const [dataInicio, setDataInicio] = useState<string | undefined>(defaultInicio)
  const [dataFim, setDataFim] = useState<string | undefined>(defaultFim)

  const setFiltroData = useCallback((inicio: string | undefined, fim: string | undefined) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }, [])

  return (
    <FiltroDataContext.Provider value={{ dataInicio, dataFim, setFiltroData }}>
      {children}
    </FiltroDataContext.Provider>
  )
}

export default function FiltroRapidoDataWrapper() {
  return <FiltroRapidoData />
}













