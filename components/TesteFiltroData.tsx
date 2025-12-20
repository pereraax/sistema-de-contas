'use client'

// Componente temporário para debug - pode ser removido depois
import { useFiltroData } from './FiltroRapidoDataWrapper'

export default function TesteFiltroData() {
  const { dataInicio, dataFim } = useFiltroData()
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div>Início: {dataInicio || 'N/A'}</div>
      <div>Fim: {dataFim || 'N/A'}</div>
    </div>
  )
}










