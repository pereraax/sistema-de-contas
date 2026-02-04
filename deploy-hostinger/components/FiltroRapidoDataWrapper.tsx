'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import FiltroRapidoData from './FiltroRapidoData'

interface FiltroDataContextType {
  dataInicio: string | undefined
  dataFim: string | undefined
  setFiltroData: (inicio: string | undefined, fim: string | undefined) => void
}

const FiltroDataContext = createContext<FiltroDataContextType | undefined>(undefined)

export function useFiltroData() {
  const context = useContext(FiltroDataContext)
  if (!context) {
    throw new Error('useFiltroData deve ser usado dentro de FiltroDataProvider')
  }
  return context
}

export function FiltroDataProvider({ children }: { children: ReactNode }) {
  const [dataInicio, setDataInicio] = useState<string | undefined>(undefined)
  const [dataFim, setDataFim] = useState<string | undefined>(undefined)

  const setFiltroData = (inicio: string | undefined, fim: string | undefined) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }

  return (
    <FiltroDataContext.Provider value={{ dataInicio, dataFim, setFiltroData }}>
      {children}
    </FiltroDataContext.Provider>
  )
}

export default function FiltroRapidoDataWrapper() {
  return <FiltroRapidoData />
}













