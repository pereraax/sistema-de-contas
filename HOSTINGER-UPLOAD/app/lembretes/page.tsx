'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import PlanoGuard from '@/components/PlanoGuard'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { Loader2, Clock, CheckCircle2, XCircle, Calendar, Trash2, Search, Filter, AlertCircle, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface Lembrete {
  id: string
  descricao: string
  data_lembrete: string
  horario: string | null
  status: 'pendente' | 'concluido' | 'cancelado'
  created_at: string
}

export default function LembretesPage() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'concluido' | 'cancelado'>('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lembreteToDelete, setLembreteToDelete] = useState<{ id: string; descricao: string } | null>(null)

  const carregarLembretes = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLembretes([])
        return
      }

      // Buscar lembretes onde account_owner_id é o usuário atual
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .eq('account_owner_id', user.id)
        .order('data_lembrete', { ascending: true })

      if (error) {
        console.error('Erro ao carregar lembretes:', error)
        setLembretes([])
      } else {
        setLembretes(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error)
      setLembretes([])
    } finally {
      setLoading(false)
    }
  }

  const marcarComoConcluido = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('lembretes')
        .update({ status: 'concluido' })
        .eq('id', id)

      if (error) {
        console.error('Erro ao marcar como concluído:', error)
        alert('Erro ao marcar como concluído')
      } else {
        carregarLembretes()
      }
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error)
      alert('Erro ao marcar como concluído')
    }
  }

  const abrirModalDeletar = (id: string, descricao: string) => {
    setLembreteToDelete({ id, descricao })
    setShowDeleteModal(true)
  }

  const fecharModalDeletar = () => {
    setShowDeleteModal(false)
    setLembreteToDelete(null)
    setDeletingId(null)
  }

  const confirmarDeletar = async () => {
    if (!lembreteToDelete) return

    setDeletingId(lembreteToDelete.id)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('lembretes')
        .delete()
        .eq('id', lembreteToDelete.id)

      if (error) {
        console.error('Erro ao deletar lembrete:', error)
        alert('Erro ao deletar lembrete')
      } else {
        carregarLembretes()
      }
    } catch (error) {
      console.error('Erro ao deletar lembrete:', error)
      alert('Erro ao deletar lembrete')
    } finally {
      fecharModalDeletar()
    }
  }

  useEffect(() => {
    carregarLembretes()
    
    const handleFocus = () => {
      carregarLembretes()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Filtrar lembretes
  const lembretesFiltrados = lembretes.filter(lembrete => {
    if (filterStatus !== 'todos' && lembrete.status !== filterStatus) {
      return false
    }
    
    if (searchTerm) {
      const termo = searchTerm.toLowerCase()
      return lembrete.descricao.toLowerCase().includes(termo)
    }
    
    return true
  })

  const lembretesPendentes = lembretesFiltrados.filter(l => l.status === 'pendente')
  const lembretesConcluidos = lembretesFiltrados.filter(l => l.status === 'concluido')
  
  // Separar lembretes pendentes por urgência
  const lembretesAtrasados = lembretesPendentes.filter(l => {
    const dataLembrete = new Date(l.data_lembrete)
    return isPast(dataLembrete)
  })
  
  const lembretesHoje = lembretesPendentes.filter(l => {
    const dataLembrete = new Date(l.data_lembrete)
    return isToday(dataLembrete)
  })
  
  const lembretesAmanha = lembretesPendentes.filter(l => {
    const dataLembrete = new Date(l.data_lembrete)
    return isTomorrow(dataLembrete)
  })
  
  const lembretesProximos = lembretesPendentes.filter(l => {
    const dataLembrete = new Date(l.data_lembrete)
    return !isPast(dataLembrete) && !isToday(dataLembrete) && !isTomorrow(dataLembrete)
  })

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Logotipo centralizado acima do header */}
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>

          {/* Header com notificações */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <MenuButton />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-brand-aqua to-blue-500 flex items-center justify-center shadow-md">
                  <Clock className="text-white" size={18} />
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none">
                  Lembretes
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-brand-aqua" size={40} />
                <p className="text-brand-midnight/60 dark:text-brand-clean/60">Carregando lembretes...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {/* Estatísticas - Design Moderno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 sm:p-5 shadow-lg border-2 border-yellow-400/50 dark:border-yellow-500/30 hover:border-yellow-500 dark:hover:border-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <Sparkles className="text-yellow-600 dark:text-yellow-400" size={24} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center shadow-md">
                      <Clock className="text-white" size={20} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-brand-midnight/80 dark:text-brand-clean/80">Pendentes</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-brand-midnight dark:text-brand-clean">{lembretesPendentes.length}</p>
                </div>

                <div className="group relative bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 sm:p-5 shadow-lg border-2 border-red-400/50 dark:border-red-500/30 hover:border-red-500 dark:hover:border-red-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-md">
                      <AlertCircle className="text-white" size={20} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-brand-midnight/80 dark:text-brand-clean/80">Atrasados</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-brand-midnight dark:text-brand-clean">{lembretesAtrasados.length}</p>
                </div>

                <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 sm:p-5 shadow-lg border-2 border-green-400/50 dark:border-green-500/30 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <CheckCircle2 className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-md">
                      <CheckCircle2 className="text-white" size={20} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-brand-midnight/80 dark:text-brand-clean/80">Concluídos</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-brand-midnight dark:text-brand-clean">{lembretesConcluidos.length}</p>
                </div>

                <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 sm:p-5 shadow-lg border-2 border-blue-400/50 dark:border-blue-500/30 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-30 transition-opacity">
                    <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-md">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-brand-midnight/80 dark:text-brand-clean/80">Total</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-brand-midnight dark:text-brand-clean">{lembretes.length}</p>
                </div>
              </div>

              {/* Filtros e Busca - Design Moderno */}
              <div className="bg-white/80 dark:bg-brand-royal/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg border border-gray-200/50 dark:border-brand-midnight/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/40 dark:text-brand-clean/40" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar lembretes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-brand-midnight/50 bg-white dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean placeholder:text-brand-midnight/40 dark:placeholder:text-brand-clean/40 focus:outline-none focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/20 transition-all duration-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterStatus('todos')}
                      className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                        filterStatus === 'todos'
                          ? 'bg-gradient-to-r from-brand-aqua to-blue-500 text-white shadow-md shadow-brand-aqua/30 scale-105'
                          : 'bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-brand-midnight/80'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterStatus('pendente')}
                      className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                        filterStatus === 'pendente'
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md shadow-yellow-500/30 scale-105'
                          : 'bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-brand-midnight/80'
                      }`}
                    >
                      Pendentes
                    </button>
                    <button
                      onClick={() => setFilterStatus('concluido')}
                      className={`px-3 sm:px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                        filterStatus === 'concluido'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30 scale-105'
                          : 'bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean hover:bg-gray-200 dark:hover:bg-brand-midnight/80'
                      }`}
                    >
                      Concluídos
                    </button>
                  </div>
                </div>
              </div>

              {/* Lembretes Atrasados */}
              {lembretesAtrasados.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                      <AlertCircle className="text-white" size={18} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                      Atrasados <span className="text-red-500 dark:text-red-400">({lembretesAtrasados.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lembretesAtrasados.map((lembrete) => {
                      const dataLembrete = new Date(lembrete.data_lembrete)
                      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
                      const horarioFormatado = lembrete.horario || '10:00:00'

                      return (
                        <div
                          key={lembrete.id}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-red-400 dark:border-red-500/50 hover:border-red-500 dark:hover:border-red-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 dark:bg-red-500/20 rounded-full -mr-12 -mt-12 blur-xl"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-brand-midnight dark:text-brand-clean text-base sm:text-lg mb-2 leading-tight">
                                  {lembrete.descricao}
                                </h3>
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Calendar className="text-red-500 dark:text-red-400" size={14} />
                                    <span>{dataFormatada}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Clock className="text-red-500 dark:text-red-400" size={14} />
                                    <span>{horarioFormatado}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full shadow-md">
                                Atrasado
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-4">
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === lembrete.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lembretes Hoje */}
              {lembretesHoje.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Calendar className="text-white" size={18} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                      Hoje <span className="text-blue-500 dark:text-blue-400">({lembretesHoje.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lembretesHoje.map((lembrete) => {
                      const dataLembrete = new Date(lembrete.data_lembrete)
                      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
                      const horarioFormatado = lembrete.horario || '10:00:00'

                      return (
                        <div
                          key={lembrete.id}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-blue-400 dark:border-blue-500/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/20 rounded-full -mr-12 -mt-12 blur-xl"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-brand-midnight dark:text-brand-clean text-base sm:text-lg mb-2 leading-tight">
                                  {lembrete.descricao}
                                </h3>
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Calendar className="text-blue-500 dark:text-blue-400" size={14} />
                                    <span>{dataFormatada}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Clock className="text-blue-500 dark:text-blue-400" size={14} />
                                    <span>{horarioFormatado}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full shadow-md">
                                Hoje
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-4">
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === lembrete.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lembretes Amanhã */}
              {lembretesAmanha.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                      <Calendar className="text-white" size={18} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                      Amanhã <span className="text-purple-500 dark:text-purple-400">({lembretesAmanha.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lembretesAmanha.map((lembrete) => {
                      const dataLembrete = new Date(lembrete.data_lembrete)
                      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
                      const horarioFormatado = lembrete.horario || '10:00:00'

                      return (
                        <div
                          key={lembrete.id}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-purple-400 dark:border-purple-500/50 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/20 rounded-full -mr-12 -mt-12 blur-xl"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-brand-midnight dark:text-brand-clean text-base sm:text-lg mb-2 leading-tight">
                                  {lembrete.descricao}
                                </h3>
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Calendar className="text-purple-500 dark:text-purple-400" size={14} />
                                    <span>{dataFormatada}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Clock className="text-purple-500 dark:text-purple-400" size={14} />
                                    <span>{horarioFormatado}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full shadow-md">
                                Amanhã
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-4">
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === lembrete.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lembretes Próximos */}
              {lembretesProximos.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-md">
                      <Clock className="text-white" size={18} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                      Próximos <span className="text-yellow-500 dark:text-yellow-400">({lembretesProximos.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lembretesProximos.map((lembrete) => {
                      const dataLembrete = new Date(lembrete.data_lembrete)
                      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
                      const horarioFormatado = lembrete.horario || '10:00:00'

                      return (
                        <div
                          key={lembrete.id}
                          className="group relative bg-white dark:bg-brand-royal rounded-2xl p-6 shadow-xl border-2 border-yellow-400 dark:border-yellow-500/50 hover:border-yellow-500 dark:hover:border-yellow-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-full -mr-12 -mt-12 blur-xl"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-brand-midnight dark:text-brand-clean text-base sm:text-lg mb-2 leading-tight">
                                  {lembrete.descricao}
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Calendar className="text-yellow-500 dark:text-yellow-400" size={16} />
                                    <span>{dataFormatada}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-brand-midnight/70 dark:text-brand-clean/70">
                                    <Clock className="text-yellow-500 dark:text-yellow-400" size={16} />
                                    <span>{horarioFormatado}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-4">
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === lembrete.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lembretes Concluídos */}
              {lembretesConcluidos.length > 0 && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                      <CheckCircle2 className="text-white" size={18} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                      Concluídos <span className="text-green-500 dark:text-green-400">({lembretesConcluidos.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {lembretesConcluidos.map((lembrete) => {
                      const dataLembrete = new Date(lembrete.data_lembrete)
                      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
                      const horarioFormatado = lembrete.horario || '10:00:00'

                      return (
                        <div
                          key={lembrete.id}
                          className="group relative bg-white/60 dark:bg-brand-royal/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-400/50 dark:border-green-500/30 opacity-80 hover:opacity-100 transition-all duration-300"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-brand-midnight/60 dark:text-brand-clean/60 text-lg mb-3 leading-tight line-through">
                                  {lembrete.descricao}
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-brand-midnight/50 dark:text-brand-clean/50">
                                    <Calendar className="text-green-500 dark:text-green-400" size={16} />
                                    <span>{dataFormatada}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-brand-midnight/50 dark:text-brand-clean/50">
                                    <Clock className="text-green-500 dark:text-green-400" size={16} />
                                    <span>{horarioFormatado}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full shadow-md">
                                Concluído
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-4">
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === lembrete.id ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Deletando...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={18} />
                                    Deletar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem quando não há lembretes */}
              {lembretesFiltrados.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-aqua/20 to-blue-500/20 flex items-center justify-center mb-6">
                    <Clock className="text-brand-aqua dark:text-blue-400" size={48} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-2">
                    Nenhum lembrete encontrado
                  </h3>
                  <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-center max-w-md">
                    {searchTerm || filterStatus !== 'todos'
                      ? 'Tente ajustar os filtros ou a busca para encontrar lembretes.'
                      : 'Crie lembretes via WhatsApp enviando: "me lembre de [tarefa] [data] [horário]"'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Modal de Confirmação de Exclusão - Design Moderno */}
          {showDeleteModal && lembreteToDelete && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
              onClick={fecharModalDeletar}
            >
              <div 
                className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up border-2 border-red-400/30 dark:border-red-500/40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ícone decorativo de fundo */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 dark:bg-red-500/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
                      <AlertCircle className="text-white" size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-1">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-sm text-brand-midnight/60 dark:text-brand-clean/60">
                        Esta ação não pode ser desfeita
                      </p>
                    </div>
                    <button
                      onClick={fecharModalDeletar}
                      disabled={deletingId === lembreteToDelete.id}
                      className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="text-brand-midnight dark:text-brand-clean" size={24} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Mensagem */}
                  <div className="mb-8">
                    <p className="text-base text-brand-midnight/80 dark:text-brand-clean/80 leading-relaxed mb-4">
                      Tem certeza que deseja deletar este lembrete?
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                        📝 Lembrete:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        {lembreteToDelete.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <button
                      onClick={fecharModalDeletar}
                      disabled={deletingId === lembreteToDelete.id}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-brand-midnight hover:bg-gray-200 dark:hover:bg-brand-midnight/80 text-brand-midnight dark:text-brand-clean transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmarDeletar}
                      disabled={deletingId === lembreteToDelete.id}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deletingId === lembreteToDelete.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Deletar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
