'use client'

import { useState, useEffect } from 'react'
import { obterDetalhesBanco } from '@/lib/actions'
import { TrendingUp, TrendingDown, Wallet, Banknote, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

const BANCOS = [
  { id: 'inter', nome: 'Inter', cor: '#FF7A00', inicial: 'I' },
  { id: 'c6bank', nome: 'C6 Bank', cor: '#000000', inicial: 'C' },
  { id: 'nubank', nome: 'Nubank', cor: '#820AD1', inicial: 'N' },
  { id: 'itau', nome: 'Itaú', cor: '#EC7000', inicial: 'I' },
  { id: 'santander', nome: 'Santander', cor: '#EC0000', inicial: 'S' },
  { id: 'picpay', nome: 'PicPay', cor: '#21C25E', inicial: 'P' },
  { id: 'mercadopago', nome: 'Mercado Pago', cor: '#009EE3', inicial: 'M' },
  { id: 'bradesco', nome: 'Bradesco', cor: '#CC092F', inicial: 'B' },
  { id: 'caixa', nome: 'Caixa', cor: '#0066B3', inicial: 'C' },
]

const PERIODOS = [
  { id: '7', label: 'Últimos 7 dias', dias: 7 },
  { id: '15', label: 'Últimos 15 dias', dias: 15 },
  { id: '30', label: 'Últimos 30 dias', dias: 30 },
  { id: 'mes', label: 'Mês atual', dias: null },
] as const

function getDatasPeriodo(periodoId: string): { dataInicio: string; dataFim: string } {
  const now = new Date()
  const fim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  if (periodoId === 'mes') {
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    return { dataInicio: inicio.toISOString(), dataFim: fim.toISOString() }
  }
  const dias = parseInt(periodoId, 10) || 7
  const inicio = new Date(fim)
  inicio.setDate(inicio.getDate() - dias)
  inicio.setHours(0, 0, 0, 0)
  return { dataInicio: inicio.toISOString(), dataFim: fim.toISOString() }
}

export default function GastosPorBancoContent() {
  const [bancoSelecionado, setBancoSelecionado] = useState<string | null>(null)
  const [periodoId, setPeriodoId] = useState<string>('7')
  const [detalhes, setDetalhes] = useState<{
    entradas: number
    gastos: number
    saldo: number
    disponivel: number
    registros: any[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bancoSelecionado) {
      setDetalhes(null)
      return
    }
    setLoading(true)
    setError(null)
    const { dataInicio, dataFim } = getDatasPeriodo(periodoId)
    obterDetalhesBanco(bancoSelecionado, dataInicio, dataFim)
      .then((res) => {
        if (res.error) {
          setError(res.error)
          setDetalhes(null)
        } else {
          setDetalhes(res.data)
        }
      })
      .finally(() => setLoading(false))
  }, [bancoSelecionado, periodoId])

  const bancoAtual = BANCOS.find((b) => b.id === bancoSelecionado)

  return (
    <div className="space-y-6">
      {/* Seletor de banco */}
      <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/10 shadow-sm">
        <p className="text-sm font-semibold text-brand-midnight dark:text-brand-clean mb-3">
          Escolha o banco para ver gastos e saldo
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {BANCOS.map((banco) => {
            const isSelected = bancoSelecionado === banco.id
            return (
              <button
                key={banco.id}
                type="button"
                onClick={() => setBancoSelecionado(isSelected ? null : banco.id)}
                className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl font-medium transition-smooth border-2 min-h-[80px] ${
                  isSelected
                    ? 'bg-brand-aqua/20 dark:bg-brand-aqua/30 border-brand-aqua text-brand-aqua shadow-md'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-brand-midnight dark:text-brand-clean hover:border-brand-aqua/50 hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                }`}
                title={banco.nome}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: banco.cor }}
                >
                  {banco.inicial}
                </div>
                <span className="text-xs text-center leading-tight truncate w-full">{banco.nome}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtro de período e detalhes (só quando um banco está selecionado) */}
      {bancoSelecionado && (
        <>
          {/* Filtro de período */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar size={18} className="text-brand-midnight dark:text-brand-clean flex-shrink-0" />
            <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean">Período:</span>
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodoId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth ${
                  periodoId === p.id
                    ? 'bg-brand-aqua text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-brand-aqua animate-spin" />
            </div>
          ) : detalhes && (
            <>
              {/* Cards: Gastos, Entradas, Saldo, Disponível */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="text-red-500 dark:text-red-400" size={18} />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Gastos no período</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detalhes.gastos)}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="text-green-500 dark:text-green-400" size={18} />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Entradas no período</span>
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detalhes.entradas)}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="text-brand-aqua" size={18} />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Saldo</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${detalhes.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detalhes.saldo)}
                  </p>
                </div>
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="text-brand-aqua" size={18} />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Disponível</span>
                  </div>
                  <p className={`text-lg font-bold tabular-nums ${detalhes.disponivel >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detalhes.disponivel)}
                  </p>
                </div>
              </div>

              {/* Lista de registros do banco */}
              <div className="bg-white dark:bg-[#252525] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                    Movimentações — {bancoAtual?.nome}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {detalhes.registros.length} registro(s)
                  </span>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {detalhes.registros.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhum registro neste período para este banco.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-white/10">
                      {detalhes.registros.map((r: any) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-brand-midnight dark:text-brand-clean truncate">
                              {r.nome}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(r.data_registro), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-sm font-semibold tabular-nums ${
                                r.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {r.tipo === 'entrada' ? '+' : '-'}
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(r.valor))}
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!bancoSelecionado && (
        <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-6 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione um banco acima para ver gastos no período, saldo e disponível.
          </p>
        </div>
      )}
    </div>
  )
}
