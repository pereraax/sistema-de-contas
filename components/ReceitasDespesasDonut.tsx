'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { obterEstatisticas } from '@/lib/actions'
import { useState, useEffect } from 'react'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ReceitasDespesasDonut() {
  const { dataInicio, dataFim } = useFiltroData()
  const [stats, setStats] = useState<{
    totalEntradas: number
    totalSaidas: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'donut' | 'bar'>('donut')

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

  // Dados para gráfico de barras
  const barData = [
    {
      name: 'Receitas',
      valor: receitas,
      fill: '#10b981',
    },
    {
      name: 'Despesas',
      valor: despesas,
      fill: '#ef4444',
    },
  ]

  // Calcular diferença percentual
  const diferencaPercent = total > 0 
    ? (((receitas - despesas) / Math.max(receitas, despesas)) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-brand-royal dark:to-brand-midnight rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all duration-300">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-clean">
            Receitas x Despesas
          </h2>
          <div className="flex items-center gap-2">
            {saldoAtual >= 0 ? (
              <TrendingUp className="text-green-500" size={20} />
            ) : (
              <TrendingDown className="text-red-500" size={20} />
            )}
            {/* Botões de navegação */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-brand-midnight/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('donut')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'donut'
                    ? 'bg-brand-aqua text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-brand-midnight'
                }`}
              >
                Donut
              </button>
              <button
                onClick={() => setViewMode('bar')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'bar'
                    ? 'bg-brand-aqua text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-brand-midnight'
                }`}
              >
                Comparativo
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {periodoTexto}
        </p>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'donut' ? (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center gap-8">
          {/* Gráfico de Donut com animação - Responsivo */}
          <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[300px] md:h-[300px] mx-auto md:mx-0 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {donutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value)
                  }
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Saldo no centro do donut com animação - Responsivo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Saldo</p>
              <p
                className={`text-base sm:text-lg md:text-xl font-bold transition-colors duration-300 leading-tight ${
                  saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(saldoAtual)}
              </p>
              {saldoAtual >= 0 ? (
                <ArrowUpRight className="text-green-500 mt-0.5 sm:mt-1" size={12} />
              ) : (
                <ArrowDownRight className="text-red-500 mt-0.5 sm:mt-1" size={12} />
              )}
            </div>
          </div>
          
          {/* Legenda melhorada */}
          <div className="space-y-4 w-full md:w-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
              <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 shadow-md"></div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Receitas</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(receitas)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{receitasPercent}% do total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
              <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0 shadow-md"></div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Despesas</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(despesas)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{despesasPercent}% do total</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Receitas</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(receitas)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{receitasPercent}%</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="text-red-600 dark:text-red-400" size={18} />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Despesas</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(despesas)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{despesasPercent}%</p>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value)
                  }
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {barData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicador de saldo */}
          <div className={`mt-4 p-4 rounded-xl border-2 ${
            saldoAtual >= 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Final</p>
                <p className={`text-xl font-bold ${
                  saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(saldoAtual)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Diferença</p>
                <p className={`text-lg font-semibold ${
                  saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {saldoAtual >= 0 ? '+' : ''}{diferencaPercent}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}








