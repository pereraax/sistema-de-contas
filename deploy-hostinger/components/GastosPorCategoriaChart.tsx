'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { obterGastosPorCategoria } from '@/lib/actions'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import { PieChart, Pie, Cell as PieCell, ResponsiveContainer as PieResponsiveContainer, Tooltip as PieTooltip } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

const CORES = [
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#a855f7',
]

export default function GastosPorCategoriaChart() {
  const { dataInicio, dataFim } = useFiltroData()
  const [data, setData] = useState<Array<{ categoria: string; total: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      const result = await obterGastosPorCategoria(dataInicio, dataFim)
      setData(result.data || [])
      setLoading(false)
    }
    carregar()
  }, [dataInicio, dataFim])

  const totalGeral = data.reduce((s, d) => s + d.total, 0)
  const periodoTexto = dataInicio && dataFim
    ? `${format(new Date(dataInicio), 'd MMM', { locale: ptBR })} - ${format(new Date(dataFim), 'd MMM yyyy', { locale: ptBR })}`
    : 'Período atual'

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/10">
        <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Carregando gastos por categoria...
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.categoria.length > 12 ? d.categoria.slice(0, 12) + '…' : d.categoria,
    fullName: d.categoria,
    valor: d.total,
    fill: CORES[data.indexOf(d) % CORES.length],
  }))

  return (
    <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/10">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-brand-midnight dark:text-brand-clean">
          Gastos por categoria
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{periodoTexto}</p>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm rounded-xl bg-gray-50 dark:bg-white/5">
          Nenhum gasto no período
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Esquerda: gráfico de barras */}
          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  }
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '10px 14px',
                  }}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]} minPointSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Direita: gráfico de pizza + lista */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 min-w-0">
            <div className="h-44 sm:h-48 w-full max-w-[180px] shrink-0">
              <PieResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="valor"
                    nameKey="fullName"
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="80%"
                    paddingAngle={2}
                    label={false}
                  >
                    {chartData.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <PieTooltip
                    formatter={(value: number, name: string) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                      name || ''
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </PieResponsiveContainer>
            </div>
            <div className="flex-1 w-full min-w-0 space-y-1 max-h-48 overflow-y-auto">
              {data.map((d, i) => (
                <div
                  key={d.categoria}
                  className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-gray-50 dark:bg-white/5"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CORES[i % CORES.length] }}
                  />
                  <span className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean truncate min-w-0">
                    {d.categoria}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalGeral > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:text-left">
          Total de gastos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
        </p>
      )}
    </div>
  )
}
