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
import { ChevronLeft, ChevronRight, Calendar, Filter, X, Check, ChevronDown } from 'lucide-react'
import ModalRegistrosDia from './ModalRegistrosDia'

interface CalendarioViewProps {
  registros: Registro[]
  usuarios?: User[]
}

type VistaCalendario = 'mes' | 'semana' | 'ano'

export default function CalendarioView({ registros, usuarios = [] }: CalendarioViewProps) {
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

  // Renderização por vista
  const renderVistaMes = () => {
    const inicioMes = startOfMonth(dataAtual)
    const fimMes = endOfMonth(dataAtual)
    const diasDoMes = eachDayOfInterval({ start: inicioMes, end: fimMes })
    const primeiroDiaSemana = inicioMes.getDay()
    const diasVaziosInicio = Array.from({ length: primeiroDiaSemana }, (_, i) => i)

    return (
      <div className="grid grid-cols-7 gap-2">
        {diasVaziosInicio.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {diasDoMes.map((dia) => {
          const registrosDia = registrosPorData(dia)
          const temRegistros = registrosDia.length > 0
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
              className={`aspect-square p-1.5 rounded-xl border-2 transition-all hover:scale-105 overflow-hidden ${
                isSelected
                  ? 'border-brand-aqua bg-gradient-to-br from-brand-aqua/20 to-brand-blue/20 dark:from-brand-aqua/30 dark:to-brand-blue/30 shadow-lg shadow-brand-aqua/20'
                  : isToday
                  ? 'border-brand-aqua/50 bg-gradient-to-br from-brand-aqua/10 to-brand-blue/10 dark:from-brand-aqua/20 dark:to-brand-blue/20'
                  : 'border-gray-200 dark:border-white/20 hover:border-brand-aqua/50 dark:hover:border-brand-aqua/50 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col h-full min-h-0">
                <span
                  className={`text-sm font-bold mb-0.5 flex-shrink-0 ${
                    isSelected
                      ? 'text-brand-aqua'
                      : isToday
                      ? 'text-brand-midnight dark:text-brand-clean'
                      : 'text-brand-midnight dark:text-brand-clean'
                  }`}
                >
                  {format(dia, 'd')}
                </span>
                {temRegistros && (
                  <div className="flex-1 flex flex-col justify-end gap-0.5 min-h-0 overflow-hidden">
                    {totalEntrada > 0 && (
                      <div className="text-[9px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded leading-tight truncate">
                        +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalEntrada)}
                      </div>
                    )}
                    {totalSaida > 0 && (
                      <div className="text-[9px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded leading-tight truncate">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalSaida)}
                      </div>
                    )}
                    {registrosDia.length > 2 && (
                      <div className="text-[9px] text-brand-midnight/60 dark:text-brand-clean/60 font-medium text-center leading-tight">
                        {registrosDia.length} registros
                      </div>
                    )}
                  </div>
                )}
              </div>
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
      <div className="grid grid-cols-7 gap-3">
        {diasSemana.map((dia) => {
          const registrosDia = registrosPorData(dia)
          const isSelected = dataSelecionada && isSameDay(dia, dataSelecionada)
          const isToday = isSameDay(dia, new Date())
          const isOutroMes = !isSameMonth(dia, dataAtual)

          const totalEntrada = registrosDia.filter(r => r.tipo === 'entrada').reduce((sum, r) => sum + r.valor, 0)
          const totalSaida = registrosDia.filter(r => r.tipo === 'saida').reduce((sum, r) => sum + r.valor, 0)
          const saldo = totalEntrada - totalSaida

          return (
            <div
              key={dia.toISOString()}
              className={`rounded-xl border-2 p-4 min-h-[200px] transition-all ${
                isSelected
                  ? 'border-brand-aqua bg-gradient-to-br from-brand-aqua/20 to-brand-blue/20 dark:from-brand-aqua/30 dark:to-brand-blue/30 shadow-lg'
                  : isToday
                  ? 'border-brand-aqua/50 bg-gradient-to-br from-brand-aqua/10 to-brand-blue/10 dark:from-brand-aqua/20 dark:to-brand-blue/20'
                  : 'border-gray-200 dark:border-white/20 bg-white dark:bg-brand-midnight/50'
              }`}
            >
              <button
                onClick={() => {
                  setDataSelecionada(dia)
                  setDataModal(dia)
                }}
                className="w-full text-left mb-3"
              >
                <div className={`text-sm font-bold mb-1 ${isOutroMes ? 'text-gray-400' : isToday ? 'text-brand-aqua' : 'text-brand-midnight dark:text-brand-clean'}`}>
                  {format(dia, 'EEE', { locale: ptBR })}
                </div>
                <div className={`text-2xl font-bold ${isOutroMes ? 'text-gray-400' : isToday ? 'text-brand-aqua' : 'text-brand-midnight dark:text-brand-clean'}`}>
                  {format(dia, 'd')}
                </div>
              </button>
              
              <div className="space-y-2">
                {totalEntrada > 0 && (
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                    +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalEntrada)}
                  </div>
                )}
                {totalSaida > 0 && (
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                    -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(totalSaida)}
                  </div>
                )}
                {saldo !== 0 && (
                  <div className={`text-xs font-bold px-2 py-1 rounded ${saldo > 0 ? 'text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900/40' : 'text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/40'}`}>
                    Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(saldo)}
                  </div>
                )}
                {registrosDia.length > 0 && (
                  <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-2">
                    {registrosDia.length} {registrosDia.length === 1 ? 'registro' : 'registros'}
                  </div>
                )}
              </div>
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
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                isMesAtual
                  ? 'border-brand-aqua bg-gradient-to-br from-brand-aqua/20 to-brand-blue/20 dark:from-brand-aqua/30 dark:to-brand-blue/30 shadow-lg'
                  : 'border-gray-200 dark:border-white/20 bg-white dark:bg-brand-midnight/50 hover:border-brand-aqua/50'
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
      {/* Cabeçalho com controles */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl p-6 shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Título e navegação */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-xl">
              <Calendar size={24} className="text-brand-aqua" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-midnight dark:text-brand-clean">
                {getTituloPeriodo()}
              </h2>
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="flex items-center gap-2">
            <button
              onClick={periodoAnterior}
              className="p-2 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 rounded-xl transition-smooth text-brand-midnight dark:text-brand-clean"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <button
              onClick={irParaHoje}
              className="px-4 py-2 bg-brand-aqua text-brand-midnight rounded-xl hover:bg-brand-aqua/90 transition-smooth font-semibold text-sm shadow-md hover:shadow-lg"
            >
              Hoje
            </button>
            <button
              onClick={proximoPeriodo}
              className="p-2 hover:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 rounded-xl transition-smooth text-brand-midnight dark:text-brand-clean"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Opções de visualização e filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botões de vista */}
          <div className="flex gap-2 bg-gray-100 dark:bg-brand-midnight/80 p-1 rounded-xl">
            {(['mes', 'semana', 'ano'] as VistaCalendario[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-smooth ${
                  vista === v
                    ? 'bg-brand-aqua text-brand-midnight shadow-md'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-smooth ${
              mostrarFiltros || temFiltrosAtivos
                ? 'bg-brand-aqua text-brand-midnight shadow-md'
                : 'bg-gray-100 dark:bg-brand-midnight/80 text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            <Filter size={18} strokeWidth={2.5} />
            Filtros
            {temFiltrosAtivos && (
              <span className="bg-brand-midnight text-brand-aqua rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {[filtroTipo, filtroUsuario, filtroEtiqueta].filter(Boolean).length}
              </span>
            )}
          </button>

          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm hover:bg-red-200 dark:hover:bg-red-900/30 transition-smooth"
            >
              <X size={18} strokeWidth={2.5} />
              Limpar
            </button>
          )}
        </div>

        {/* Painel de filtros */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-white dark:bg-brand-midnight/60 rounded-xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30">
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
                    <span className={filtroTipo ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
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
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                            filtroTipo === 'entrada'
                              ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                              : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                          }`}
                        >
                          <span>Entrada</span>
                          {filtroTipo === 'entrada' && <Check size={18} strokeWidth={3} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroTipo('saida')
                            setDropdownTipoAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                            filtroTipo === 'saida'
                              ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                              : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                          }`}
                        >
                          <span>Saída</span>
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

      {/* Calendário */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl p-6 shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30">
        {vista === 'mes' && (
          <>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="text-center text-sm font-bold text-brand-midnight dark:text-brand-clean py-2 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg"
                >
                  {dia}
                </div>
              ))}
            </div>
            {renderVistaMes()}
          </>
        )}

        {vista === 'semana' && (
          <>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                <div
                  key={dia}
                  className="text-center text-sm font-bold text-brand-midnight dark:text-brand-clean py-2 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg"
                >
                  {dia}
                </div>
              ))}
            </div>
            {renderVistaSemana()}
          </>
        )}

        {vista === 'ano' && (
          <div>
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
          onClose={() => setDataModal(null)}
        />
      )}
    </div>
  )
}
