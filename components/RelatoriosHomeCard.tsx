'use client'

import { useState, useEffect } from 'react'
import { obterResumoRelatorios } from '@/lib/actions'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import { FileText, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export default function RelatoriosHomeCard() {
  const { dataInicio, dataFim } = useFiltroData()
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [registrosWhatsApp, setRegistrosWhatsApp] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      const result = await obterResumoRelatorios(dataInicio, dataFim)
      setTotalRegistros(result.totalRegistros)
      setRegistrosWhatsApp(result.registrosViaWhatsApp)
      setLoading(false)
    }
    carregar()
  }, [dataInicio, dataFim])

  const periodoTexto = dataInicio && dataFim
    ? `${format(new Date(dataInicio), 'd MMM', { locale: ptBR })} - ${format(new Date(dataFim), 'd MMM yyyy', { locale: ptBR })}`
    : 'Todo o período'

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#252525] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/10">
      <h3 className="text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-1">
        Relatórios
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{periodoTexto}</p>

      {loading ? (
        <div className="flex-1 min-h-24 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Carregando...
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center space-y-4 min-h-0">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg">
                <FileText className="text-brand-aqua" size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total de registros</p>
                <p className="text-lg font-bold text-brand-midnight dark:text-brand-clean tabular-nums">
                  {totalRegistros}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                <MessageCircle className="text-green-600 dark:text-green-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Enviados ao WhatsApp</p>
                <p className="text-lg font-bold text-brand-midnight dark:text-brand-clean tabular-nums">
                  {registrosWhatsApp}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
