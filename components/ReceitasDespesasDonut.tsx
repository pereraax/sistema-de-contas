'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { obterEstatisticas } from '@/lib/actions'
import { useState, useEffect } from 'react'
import { useFiltroData } from './FiltroRapidoDataWrapper'

export default function ReceitasDespesasDonut() {
  const { dataInicio, dataFim } = useFiltroData()
  const [stats, setStats] = useState<{
    totalEntradas: number
    totalSaidas: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        const result = await obterEstatisticas(dataInicio, dataFim)
        
        if (result.error) {
          setStats({
            totalEntradas: 0,
            totalSaidas: 0,
          })
        } else {
          setStats({
            totalEntradas: result.totalEntradas || 0,
            totalSaidas: result.totalSaidas || 0,
          })
        }
        setLoading(false)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        setStats({
          totalEntradas: 0,
          totalSaidas: 0,
        })
        setLoading(false)
      }
    }

    carregarEstatisticas()

    // Atualizar a cada 10 segundos
    const interval = setInterval(() => {
      carregarEstatisticas()
    }, 10000)

    return () => clearInterval(interval)
  }, [dataInicio, dataFim])

  const receitas = stats?.totalEntradas || 0
  const despesas = stats?.totalSaidas || 0
  const total = receitas + despesas
  const saldoAtual = receitas - despesas

  const donutData = total > 0 
    ? [
        { name: 'Receitas', value: receitas, color: '#10b981' },
        { name: 'Despesas', value: despesas, color: '#ef4444' },
      ]
    : [
        { name: 'Receitas', value: 1, color: '#e5e7eb' },
        { name: 'Despesas', value: 1, color: '#e5e7eb' },
      ]

  const receitasPercent = total > 0 ? ((receitas / total) * 100).toFixed(1) : '0.0'
  const despesasPercent = total > 0 ? ((despesas / total) * 100).toFixed(1) : '0.0'

  // Obter primeiro e último dia do mês atual
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  const periodoTexto = `${format(primeiroDia, 'd', { locale: ptBR })} de ${format(primeiroDia, 'MMMM', { locale: ptBR })} - ${format(ultimoDia, 'd', { locale: ptBR })} de ${format(ultimoDia, 'MMMM', { locale: ptBR })}`

  if (loading) {
    return (
      <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-clean mb-1">
          Receitas x Despesas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {periodoTexto}
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Gráfico de Donut */}
        <div className="relative w-[300px] h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(value)
                }
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Saldo no centro do donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo</p>
            <p
              className={`text-2xl font-bold ${
                saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(saldoAtual)}
            </p>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Receitas</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(receitas)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{receitasPercent}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Despesas</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(despesas)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{despesasPercent}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





