'use client'

import { useState } from 'react'
import { useFiltroData } from './FiltroRapidoDataWrapper'

export default function FiltroRapidoData() {
  const { setFiltroData } = useFiltroData()
  const [filtroAtivo, setFiltroAtivo] = useState<string>('Todos')

  const opcoesFiltro = [
    { label: 'Todos', dias: null },
    { label: '7 dias', dias: 7 },
    { label: '30 dias', dias: 30 },
  ]

  const calcularDatas = (dias: number | null) => {
    if (dias === null) {
      return { dataInicio: undefined, dataFim: undefined }
    }
    
    // Data fim: hoje (incluindo o dia de hoje)
    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999) // Fim do dia de hoje
    const dataFim = hoje.toISOString()
    
    // Data início: subtrair (dias - 1) para incluir o dia de hoje nos últimos X dias
    // Exemplo: últimos 7 dias = hoje + 6 dias anteriores = 7 dias no total
    const dataInicioObj = new Date(hoje)
    dataInicioObj.setDate(dataInicioObj.getDate() - (dias - 1))
    dataInicioObj.setHours(0, 0, 0, 0) // Início do dia
    const dataInicio = dataInicioObj.toISOString()
    
    return { dataInicio, dataFim }
  }

  const selecionarFiltro = (opcao: typeof opcoesFiltro[0]) => {
    setFiltroAtivo(opcao.label)
    const { dataInicio, dataFim } = calcularDatas(opcao.dias)
    setFiltroData(dataInicio, dataFim)
  }

  return (
    <div className="flex items-center gap-1.5">
      {opcoesFiltro.map((opcao, index) => (
        <button
          key={index}
          type="button"
          onClick={() => selecionarFiltro(opcao)}
          className={`px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            filtroAtivo === opcao.label
              ? 'bg-brand-aqua text-white shadow-md'
              : 'bg-white/50 dark:bg-white/10 text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30'
          }`}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  )
}






