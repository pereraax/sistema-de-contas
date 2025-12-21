'use client'

import { Registro } from '@/lib/types'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardViewProps {
  registros: Registro[]
  estatisticas: {
    totalEntradas?: number
    totalSaidas?: number
    totalDividasPendentes?: number
  }
}

export default function DashboardView({
  registros,
  estatisticas,
}: DashboardViewProps) {
  // Preparar dados dos últimos 30 dias
  const ultimos30Dias = Array.from({ length: 30 }, (_, i) => {
    const data = subDays(new Date(), 29 - i)
    const dataStr = format(data, 'yyyy-MM-dd')
    const registrosDia = registros.filter((reg) => {
      const regData = format(new Date(reg.data_registro), 'yyyy-MM-dd')
      return regData === dataStr
    })

    let entradas = 0
    let saidas = 0

    registrosDia.forEach((reg) => {
      // Excluir dívidas dos cálculos
      if (reg.tipo === 'entrada') {
        entradas += reg.valor
      } else if (reg.tipo === 'saida') {
        saidas += reg.valor
      }
      // Dívidas são ignoradas aqui, pois têm seção própria
    })

    return {
      data: format(data, 'dd/MM'),
      entradas,
      saidas,
      saldo: entradas - saidas,
    }
  })

  // Projeção financeira baseada em parcelas futuras
  const calcularProjecao = () => {
    const hoje = new Date()
    const proximos6Meses = Array.from({ length: 6 }, (_, i) => {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mesStr = format(mes, 'yyyy-MM')
      
      let entradasProjetadas = 0
      let saidasProjetadas = 0

      registros.forEach((reg) => {
        if (reg.tipo === 'divida' && reg.parcelas_pagas < reg.parcelas_totais) {
          const valorParcela = reg.valor / reg.parcelas_totais
          const dataRegistro = new Date(reg.data_registro)
          const parcelasRestantes = reg.parcelas_totais - reg.parcelas_pagas
          
          for (let p = reg.parcelas_pagas; p < reg.parcelas_totais; p++) {
            const dataParcela = new Date(dataRegistro)
            dataParcela.setMonth(dataParcela.getMonth() + p)
            const parcelaMes = format(dataParcela, 'yyyy-MM')
            
            if (parcelaMes === mesStr) {
              saidasProjetadas += valorParcela
            }
          }
        }
      })

      return {
        mes: format(mes, 'MMM yyyy', { locale: ptBR }),
        entradas: entradasProjetadas,
        saidas: saidasProjetadas,
        saldo: entradasProjetadas - saidasProjetadas,
      }
    })

    return proximos6Meses
  }

  const projecao = calcularProjecao()

  const saldoAtual =
    (estatisticas.totalEntradas || 0) - (estatisticas.totalSaidas || 0)

  // Dados para o gráfico de donut (Receitas x Despesas)
  const receitas = estatisticas.totalEntradas || 0
  const despesas = estatisticas.totalSaidas || 0
  const total = receitas + despesas
  
  // Se não houver dados, criar dados mínimos para mostrar o gráfico
  const donutData = total > 0 
    ? [
        { name: 'Receitas', value: receitas, color: '#10b981' },
        { name: 'Despesas', value: despesas, color: '#ef4444' },
      ]
    : [
        { name: 'Receitas', value: 1, color: '#e5e7eb' },
        { name: 'Despesas', value: 1, color: '#e5e7eb' },
      ]

  // Calcular porcentagens
  const receitasPercent = total > 0 ? ((receitas / total) * 100).toFixed(1) : '0.0'
  const despesasPercent = total > 0 ? ((despesas / total) * 100).toFixed(1) : '0.0'

  // Obter primeiro e último dia do mês atual
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  const periodoTexto = `${format(primeiroDia, 'd', { locale: ptBR })} de ${format(primeiroDia, 'MMMM', { locale: ptBR })} - ${format(ultimoDia, 'd', { locale: ptBR })} de ${format(ultimoDia, 'MMMM', { locale: ptBR })}`

  return (
    <div className="space-y-6">
      {/* Cards principais de Entrada e Saída */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total de Entrada */}
        <div className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 dark:from-green-900/30 dark:via-green-800/20 dark:to-emerald-900/30 rounded-3xl p-8 shadow-2xl border-2 border-green-200 dark:border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 dark:bg-green-500/30 rounded-xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-200/50 dark:bg-green-500/20 px-3 py-1 rounded-full">
              ENTRADAS
            </span>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Total de Entrada</p>
          <p className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(estatisticas.totalEntradas || 0)}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70">
            * Dívidas não incluídas
          </p>
        </div>

        {/* Total de Saída */}
        <div className="bg-gradient-to-br from-red-50 via-red-100 to-rose-50 dark:from-red-900/30 dark:via-red-800/20 dark:to-rose-900/30 rounded-3xl p-8 shadow-2xl border-2 border-red-200 dark:border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 dark:bg-red-500/30 rounded-xl">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-200/50 dark:bg-red-500/20 px-3 py-1 rounded-full">
              SAÍDAS
            </span>
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Total de Saída</p>
          <p className="text-4xl font-bold text-red-700 dark:text-red-300 mb-2">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(estatisticas.totalSaidas || 0)}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70">
            * Dívidas não incluídas
          </p>
        </div>
      </div>

      {/* Cards secundários de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-indigo-900/30 rounded-3xl p-6 shadow-xl border-2 border-blue-200 dark:border-blue-500/30">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">Saldo Atual</p>
          <p
            className={`text-3xl ${
              saldoAtual >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
            style={{ fontWeight: 900 }}
          >
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(saldoAtual)}
          </p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
            Entradas - Saídas (sem dívidas)
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 dark:from-orange-900/30 dark:via-orange-800/20 dark:to-amber-900/30 rounded-3xl p-6 shadow-xl border-2 border-orange-200 dark:border-orange-500/30">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2">Dívidas Pendentes</p>
          <p className="text-3xl text-orange-600 dark:text-orange-400" style={{ fontWeight: 900 }}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(estatisticas.totalDividasPendentes || 0)}
          </p>
          <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-2">
            Gerencie na seção Dívidas
          </p>
        </div>
      </div>

      {/* Gráfico de Donut - Receitas x Despesas */}
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

      {/* Gráfico dos últimos 30 dias */}
      <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-clean mb-6">
          Últimos 30 Dias
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ultimos30Dias}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="data" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
            />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#10b981"
              strokeWidth={2}
              name="Entradas"
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="#ef4444"
              strokeWidth={2}
              name="Saídas"
            />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#2E6EE6"
              strokeWidth={2}
              name="Saldo"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Projeção financeira */}
      <div className="bg-white dark:bg-brand-royal rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-clean mb-6">
          Projeção Financeira (Próximos 6 Meses)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projecao}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
            />
            <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
            <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

