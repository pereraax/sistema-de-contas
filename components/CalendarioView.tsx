'use client'

import { useState, useMemo } from 'react'
import { Registro, User } from '@/lib/types'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth,
  getWeek,
  addDays,
  subDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Calendar, Filter, X, Check, ChevronDown, Clock } from 'lucide-react'
import ModalRegistrosDia from './ModalRegistrosDia'

interface Lembrete {
  id: string
  descricao: string
  data_lembrete: string
  horario?: string | null
  status: string
  is_recorrente_mensal?: boolean
  recorrencia_dia_mes?: number | null
  valor?: number | null
  tipo?: 'entrada' | 'saida' | null
}

interface CalendarioViewProps {
  registros: Registro[]
  usuarios?: User[]
  lembretes?: Lembrete[]
}

type VistaCalendario = 'mes' | 'semana' | 'ano'

export default function CalendarioView({ registros, usuarios = [], lembretes = [] }: CalendarioViewProps) {
  const [dataAtual, setDataAtual] = useState(new Date())
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null)
  const [dataModal, setDataModal] = useState<Date | null>(null)
  const [vista, setVista] = useState<VistaCalendario>('mes')
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>('')
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false)
  const [dropdownUsuarioAberto, setDropdownUsuarioAberto] = useState(false)
  const [dropdownEtiquetaAberto, setDropdownEtiquetaAberto] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Filtrar registros (excluir dívidas e aplicar filtros)
  const registrosFiltrados = useMemo(() => {
    let filtrados = registros.filter(reg => reg.tipo !== 'divida') // Excluir dívidas
    
    if (filtroTipo) {
      filtrados = filtrados.filter(reg => reg.tipo === filtroTipo)
    }
    if (filtroUsuario) {
      filtrados = filtrados.filter(reg => reg.user_id === filtroUsuario)
    }
    if (filtroEtiqueta) {
      filtrados = filtrados.filter(reg => reg.etiquetas?.includes(filtroEtiqueta))
    }
    
    return filtrados
  }, [registros, filtroTipo, filtroUsuario, filtroEtiqueta])

  const todasEtiquetas = Array.from(
    new Set(registrosFiltrados.flatMap((r) => r.etiquetas || []))
  )

  const registrosPorData = (data: Date) => {
    return registrosFiltrados.filter((reg) =>
      isSameDay(new Date(reg.data_registro), data)
    )
  }

  // Lembretes para uma data: normais na data exata; repetidos mensais no dia do mês (ex: dia 15 = todo dia 15)
  const lembretesPorData = (data: Date) => {
    return lembretes.filter((lem) => {
      if (lem.status === 'concluido' || lem.status === 'cancelado') return false
      if (lem.is_recorrente_mensal && lem.recorrencia_dia_mes) {
        return data.getDate() === lem.recorrencia_dia_mes
      }
      return isSameDay(new Date(lem.data_lembrete), data)
    })
  }

  // Navegação
  const proximoPeriodo = () => {
    if (vista === 'mes') setDataAtual(addMonths(dataAtual, 1))
    else if (vista === 'semana') setDataAtual(addWeeks(dataAtual, 1))
    else if (vista === 'ano') setDataAtual(addMonths(dataAtual, 12))
  }

  const periodoAnterior = () => {
    if (vista === 'mes') setDataAtual(subMonths(dataAtual, 1))
    else if (vista === 'semana') setDataAtual(subWeeks(dataAtual, 1))
    else if (vista === 'ano') setDataAtual(subMonths(dataAtual, 12))
  }

  const irParaHoje = () => setDataAtual(new Date())

  const limparFiltros = () => {
    setFiltroTipo('')
    setFiltroUsuario('')
    setFiltroEtiqueta('')
  }

  const temFiltrosAtivos = filtroTipo || filtroUsuario || filtroEtiqueta

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

  // Renderização por vista
  const renderVistaMes = () => {
    const inicioMes = startOfMonth(dataAtual)
    const fimMes = endOfMonth(dataAtual)
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes })
    const primeiroDiaSemana = inicioMes.getDay()
    const diasVaziosInicio = Array.from({ length: primeiroDiaSemana }, (_, i) => i)

    return (
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {diasVaziosInicio.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[72px] sm:min-h-[80px] md:min-h-[88px]" aria-hidden />
        ))}
        {diasDoMes.map((dia) => {
          const registrosDia = registrosPorData(dia)
          const lembretesDia = lembretesPorData(dia)
          const temRegistros = registrosDia.length > 0
          const temLembretes = lembretesDia.length > 0
          const isSelected = dataSelecionada && isSameDay(dia, dataSelecionada)
          const isToday = isSameDay(dia, new Date())
          const totalEntrada = registrosDia.filter(r => r.tipo === 'entrada').reduce((sum, r) => sum + r.valor, 0)
          const totalSaida = registrosDia.filter(r => r.tipo === 'saida').reduce((sum, r) => sum + r.valor, 0)

          return (
            <button
              key={dia.toISOString()}
              onClick={() => {
                setDataSelecionada(dia)
                setDataModal(dia)
              }}
              className={`min-h-[72px] sm:min-h-[80px] md:min-h-[88px] p-1.5 sm:p-2 rounded-xl border-2 overflow-hidden flex flex-col text-left transition-all duration-200 hover:border-brand-aqua/60 dark:hover:border-[#5ba3e8] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-aqua/50 dark:focus-visible:ring-[#5ba3e8]/50 ${
                isSelected
                  ? 'border-brand-aqua dark:border-[#5ba3e8] bg-white dark:bg-brand-royal shadow-lg shadow-brand-aqua/20 dark:shadow-[0_0_12px_rgba(91,163,232,0.3)] ring-2 ring-brand-aqua/30 dark:ring-[#5ba3e8]/50'
                  : isToday
                  ? 'border-brand-aqua/50 dark:border-[#5ba3e8] bg-white dark:bg-brand-royal'
                  : 'border-gray-200 dark:border-[#4a90d9]/60 bg-white dark:bg-brand-royal'
              }`}
            >
              <div className="flex items-start justify-between gap-0.5 flex-shrink-0">
                <span
                  className={`text-sm sm:text-base font-bold ${
                    isSelected ? 'text-brand-aqua dark:text-[#7ec8f7]' : isToday ? 'text-brand-midnight dark:text-[#7ec8f7]' : 'text-brand-midnight dark:text-brand-clean'
                  }`}
                >
                  {format(dia, 'd')}
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {temRegistros && (
                    <span className="w-5 h-5 rounded-full bg-brand-aqua/25 dark:bg-[#4a90d9] text-brand-aqua dark:text-white text-[10px] font-bold flex items-center justify-center">
                      {registrosDia.length}
                    </span>
                  )}
                  {temLembretes && (
                    <span className="w-5 h-5 rounded-full bg-amber-500/30 dark:bg-amber-500/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center" title={`${lembretesDia.length} lembrete(s)`}>
                      {lembretesDia.length}
                    </span>
                  )}
                </div>
              </div>
              {(temRegistros || temLembretes) && (
                <div className="flex-1 min-h-0 flex flex-col justify-end gap-0.5 mt-0.5">
                  {totalEntrada > 0 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100/90 dark:bg-green-900/40 px-1.5 py-0.5 rounded leading-tight truncate">
                      +{fmt(totalEntrada)}
                    </div>
                  )}
                  {totalSaida > 0 && (
                    <div className="text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100/90 dark:bg-red-900/40 px-1.5 py-0.5 rounded leading-tight truncate">
                      −{fmt(totalSaida)}
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  const renderVistaSemana = () => {
    const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 0 })
    const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 0 })
    const diasSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana })

    return (
      <div className="space-y-3">
        {diasSemana.map((dia) => {
          const registrosDia = registrosPorData(dia)
          const lembretesDia = lembretesPorData(dia)
          const isSelected = dataSelecionada && isSameDay(dia, dataSelecionada)
          const isToday = isSameDay(dia, new Date())
          const isOutroMes = !isSameMonth(dia, dataAtual)
          const temLembretes = lembretesDia.length > 0

          const totalEntrada = registrosDia.filter(r => r.tipo === 'entrada').reduce((sum, r) => sum + r.valor, 0)
          const totalSaida = registrosDia.filter(r => r.tipo === 'saida').reduce((sum, r) => sum + r.valor, 0)
          const saldo = totalEntrada - totalSaida

          return (
            <div
              key={dia.toISOString()}
              className={`rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 ${
                isSelected
                  ? 'border-brand-aqua dark:border-[#5ba3e8] bg-white dark:bg-brand-royal shadow-lg ring-2 ring-brand-aqua/30 dark:ring-[#5ba3e8]/50'
                  : isToday
                  ? 'border-brand-aqua dark:border-[#5ba3e8] bg-white dark:bg-brand-royal'
                  : 'border-gray-200 dark:border-[#4a90d9]/70 bg-white dark:bg-brand-royal hover:border-brand-aqua/60 dark:hover:border-[#5ba3e8]'
              }`}
            >
              <button
                onClick={() => {
                  setDataSelecionada(dia)
                  setDataModal(dia)
                }}
                className="w-full text-left transition-transform duration-200 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
                  <div>
                    <div className={`text-xs sm:text-sm font-bold capitalize ${isOutroMes ? 'text-gray-400' : isToday ? 'text-brand-aqua dark:text-[#7ec8f7]' : 'text-brand-midnight dark:text-brand-clean'}`}>
                      {format(dia, 'EEEE', { locale: ptBR })}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${isOutroMes ? 'text-gray-400' : isToday ? 'text-brand-aqua dark:text-[#7ec8f7]' : 'text-brand-midnight dark:text-brand-clean'}`}>
                      {format(dia, 'd')} {format(dia, 'MMMM', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {registrosDia.length > 0 && (
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-aqua/25 dark:bg-[#4a90d9] text-brand-aqua dark:text-white text-sm font-bold flex items-center justify-center shadow-sm dark:shadow-[0_0_12px_rgba(74,144,217,0.4)]">
                        {registrosDia.length}
                      </span>
                    )}
                    {temLembretes && (
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/30 dark:bg-amber-500/40 text-amber-700 dark:text-amber-400 text-sm font-bold flex items-center justify-center" title={`${lembretesDia.length} lembrete(s)`}>
                        {lembretesDia.length}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {totalEntrada > 0 && (
                  <div className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1.5 rounded-lg leading-tight">
                    +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalEntrada)}
                  </div>
                )}
                {totalSaida > 0 && (
                  <div className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1.5 rounded-lg leading-tight">
                    −{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSaida)}
                  </div>
                )}
                {saldo !== 0 && (
                  <div className={`text-xs sm:text-sm font-bold px-2 py-1.5 rounded-lg leading-tight ${saldo > 0 ? 'text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900/40' : 'text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/40'}`}>
                    Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(saldo)}
                  </div>
                )}
                {temLembretes && (
                  <div className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1.5 rounded-lg leading-tight flex items-center gap-1">
                    <Clock size={14} /> {lembretesDia.length} lembrete(s)
                  </div>
                )}
              </div>
              {(registrosDia.length > 0 || temLembretes) && (
                <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-2 flex gap-2">
                  {registrosDia.length > 0 && <span>{registrosDia.length} {registrosDia.length === 1 ? 'registro' : 'registros'}</span>}
                  {temLembretes && <span>{lembretesDia.length} {lembretesDia.length === 1 ? 'lembrete' : 'lembretes'}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderVistaAno = () => {
    const inicioAno = startOfYear(dataAtual)
    const fimAno = endOfYear(dataAtual)
    const meses = eachMonthOfInterval({ start: inicioAno, end: fimAno })

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {meses.map((mes) => {
          const registrosMes = registrosFiltrados.filter(reg => 
            isSameMonth(new Date(reg.data_registro), mes)
          )
          const totalEntrada = registrosMes.filter(r => r.tipo === 'entrada').reduce((sum, r) => sum + r.valor, 0)
          const totalSaida = registrosMes.filter(r => r.tipo === 'saida').reduce((sum, r) => sum + r.valor, 0)
          const saldo = totalEntrada - totalSaida
          const isMesAtual = isSameMonth(mes, new Date())

          return (
            <button
              key={mes.toISOString()}
              onClick={() => {
                setDataAtual(mes)
                setVista('mes')
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                isMesAtual
                  ? 'border-brand-aqua bg-white dark:bg-brand-royal shadow-lg'
                  : 'border-gray-200 dark:border-white/20 bg-white dark:bg-brand-royal hover:border-brand-aqua/50'
              }`}
            >
              <div className="text-lg font-bold text-brand-midnight dark:text-brand-clean mb-2">
                {format(mes, 'MMMM', { locale: ptBR })}
              </div>
              <div className="space-y-1 text-xs">
                {totalEntrada > 0 && (
                  <div className="text-green-600 dark:text-green-400 font-semibold">
                    +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalEntrada)}
                  </div>
                )}
                {totalSaida > 0 && (
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalSaida)}
                  </div>
                )}
                <div className={`font-bold ${saldo >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(saldo)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  const getTituloPeriodo = () => {
    if (vista === 'mes') return format(dataAtual, 'MMMM yyyy', { locale: ptBR })
    if (vista === 'semana') {
      const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 0 })
      const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 0 })
      return `${format(inicioSemana, 'd', { locale: ptBR })} - ${format(fimSemana, 'd MMMM yyyy', { locale: ptBR })}`
    }
    if (vista === 'ano') return format(dataAtual, 'yyyy', { locale: ptBR })
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com controles - Responsivo */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Título e navegação */}
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
            <div className="p-1.5 sm:p-2 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-xl flex-shrink-0">
              <Calendar size={20} className="sm:w-6 sm:h-6 text-brand-aqua" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-brand-midnight dark:text-brand-clean truncate">
                {getTituloPeriodo()}
              </h2>
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end">
            <button
              onClick={periodoAnterior}
              className="p-1.5 sm:p-2 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 rounded-xl transition-all duration-200 text-brand-midnight dark:text-brand-clean flex-shrink-0 active:scale-95"
              aria-label="Período anterior"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>
            <button
              onClick={irParaHoje}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-aqua text-white rounded-xl hover:bg-brand-aqua/90 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg flex-shrink-0 active:scale-95"
            >
              Hoje
            </button>
            <button
              onClick={proximoPeriodo}
              className="p-1.5 sm:p-2 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 rounded-xl transition-all duration-200 text-brand-midnight dark:text-brand-clean flex-shrink-0 active:scale-95"
              aria-label="Próximo período"
            >
              <ChevronRight size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Opções de visualização e filtros - Responsivo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Botões de vista */}
          <div className="flex gap-1 sm:gap-2 bg-gray-100 dark:bg-brand-midnight/80 p-0.5 sm:p-1 rounded-xl">
            {(['mes', 'semana', 'ano'] as VistaCalendario[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
                  vista === v
                    ? 'bg-brand-aqua text-white shadow-md'
                    : 'text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {v === 'mes' ? 'Mês' : v === 'semana' ? 'Semana' : 'Ano'}
              </button>
            ))}
          </div>

          {/* Botão de filtros */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
              mostrarFiltros || temFiltrosAtivos
                ? 'bg-brand-aqua text-white shadow-md'
                : 'bg-gray-100 dark:bg-brand-midnight/80 text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            <Filter size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
            <span className="hidden sm:inline">Filtros</span>
            <span className="sm:hidden">Filt.</span>
            {temFiltrosAtivos && (
              <span className="bg-brand-midnight text-brand-aqua rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                {[filtroTipo, filtroUsuario, filtroEtiqueta].filter(Boolean).length}
              </span>
            )}
          </button>

          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-xs sm:text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-all duration-200 active:scale-95"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
              Limpar
            </button>
          )}
        </div>

        {/* Painel de filtros */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-white dark:bg-brand-midnight/60 rounded-xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro Tipo */}
              <div className="relative">
                <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                  Tipo
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownTipoAberto(!dropdownTipoAberto)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm"
                  >
                    <span className={`flex items-center gap-2 ${filtroTipo ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                      {filtroTipo === 'entrada' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                      {filtroTipo === 'saida' && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                      {filtroTipo === 'entrada' ? 'Entrada' : filtroTipo === 'saida' ? 'Saída' : 'Todos'}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`text-brand-aqua transition-transform duration-200 ${dropdownTipoAberto ? 'rotate-180' : ''}`}
                      strokeWidth={2.5}
                    />
                  </button>
                  
                  {dropdownTipoAberto && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDropdownTipoAberto(false)}
                      />
                      <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroTipo('')
                            setDropdownTipoAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                            filtroTipo === ''
                              ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                              : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                          }`}
                        >
                          <span>Todos</span>
                          {filtroTipo === '' && <Check size={18} strokeWidth={3} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroTipo('entrada')
                            setDropdownTipoAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-t border-gray-100 dark:border-white/10 ${
                            filtroTipo === 'entrada'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-md'
                              : 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${filtroTipo === 'entrada' ? 'bg-white' : 'bg-green-500'}`} />
                            Entrada
                          </span>
                          {filtroTipo === 'entrada' && <Check size={18} strokeWidth={3} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroTipo('saida')
                            setDropdownTipoAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-t border-gray-100 dark:border-white/10 ${
                            filtroTipo === 'saida'
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-md'
                              : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${filtroTipo === 'saida' ? 'bg-white' : 'bg-red-500'}`} />
                            Saída
                          </span>
                          {filtroTipo === 'saida' && <Check size={18} strokeWidth={3} />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Filtro Usuário */}
              {usuarios.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                    Usuário
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownUsuarioAberto(!dropdownUsuarioAberto)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm"
                    >
                      <span className={filtroUsuario ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                        {filtroUsuario ? usuarios.find(u => u.id === filtroUsuario)?.nome || 'Todos' : 'Todos'}
                      </span>
                      <ChevronDown 
                        size={18} 
                        className={`text-brand-aqua transition-transform duration-200 ${dropdownUsuarioAberto ? 'rotate-180' : ''}`}
                        strokeWidth={2.5}
                      />
                    </button>
                    
                    {dropdownUsuarioAberto && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setDropdownUsuarioAberto(false)}
                        />
                        <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroUsuario('')
                              setDropdownUsuarioAberto(false)
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                              filtroUsuario === ''
                                ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                                : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                            }`}
                          >
                            <span>Todos</span>
                            {filtroUsuario === '' && <Check size={18} strokeWidth={3} />}
                          </button>
                          {usuarios.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setFiltroUsuario(user.id)
                                setDropdownUsuarioAberto(false)
                              }}
                              className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                                filtroUsuario === user.id
                                  ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                                  : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                              }`}
                            >
                              <span>{user.nome}</span>
                              {filtroUsuario === user.id && <Check size={18} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Filtro Etiqueta */}
              {todasEtiquetas.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                    Etiqueta
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownEtiquetaAberto(!dropdownEtiquetaAberto)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm"
                    >
                      <span className={filtroEtiqueta ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                        {filtroEtiqueta || 'Todas'}
                      </span>
                      <ChevronDown 
                        size={18} 
                        className={`text-brand-aqua transition-transform duration-200 ${dropdownEtiquetaAberto ? 'rotate-180' : ''}`}
                        strokeWidth={2.5}
                      />
                    </button>
                    
                    {dropdownEtiquetaAberto && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setDropdownEtiquetaAberto(false)}
                        />
                        <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setFiltroEtiqueta('')
                              setDropdownEtiquetaAberto(false)
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                              filtroEtiqueta === ''
                                ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                                : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                            }`}
                          >
                            <span>Todas</span>
                            {filtroEtiqueta === '' && <Check size={18} strokeWidth={3} />}
                          </button>
                          {todasEtiquetas.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setFiltroEtiqueta(tag)
                                setDropdownEtiquetaAberto(false)
                              }}
                              className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                                filtroEtiqueta === tag
                                  ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                                  : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                              }`}
                            >
                              <span className="capitalize">{tag}</span>
                              {filtroEtiqueta === tag && <Check size={18} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendário - Responsivo com animação de troca de vista */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30">
        {vista === 'mes' && (
          <div key={`mes-${format(dataAtual, 'yyyy-MM')}`} className="animate-fade-in">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="text-center text-xs sm:text-sm font-bold text-brand-midnight dark:text-brand-clean py-1.5 sm:py-2 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg"
                >
                  {dia}
                </div>
              ))}
            </div>
            {renderVistaMes()}
          </div>
        )}

        {vista === 'semana' && (
          <div key="semana" className="animate-fade-in">
            {renderVistaSemana()}
          </div>
        )}

        {vista === 'ano' && (
          <div key="ano" className="animate-fade-in">
            <h3 className="text-xl font-bold text-brand-midnight dark:text-brand-clean mb-4">
              {format(dataAtual, 'yyyy', { locale: ptBR })}
            </h3>
            {renderVistaAno()}
          </div>
        )}
      </div>

      {/* Modal de registros do dia */}
      {dataModal && (
        <ModalRegistrosDia
          data={dataModal}
          registros={registrosPorData(dataModal)}
          lembretes={lembretesPorData(dataModal)}
          onClose={() => setDataModal(null)}
        />
      )}
    </div>
  )
}
