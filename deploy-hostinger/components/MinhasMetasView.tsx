'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Plus, 
  Target, 
  Trophy, 
  TrendingUp,
  Calendar,
  Loader2,
  Plane,
  Car,
  Home,
  Smartphone,
  Heart,
  GraduationCap,
  ShoppingBag,
  Gamepad2,
  Camera,
  Music,
  Dumbbell,
  Briefcase,
  Gift,
  PiggyBank,
  Wallet,
  CreditCard,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react'
import type { MetaCofrinho } from '@/lib/types'
import ModalCriarMeta from './ModalCriarMeta'
import CardMeta from './CardMeta'
import ModalConfirmacao from './ModalConfirmacao'
import { excluirMetaCofrinho } from '@/lib/actions'
import { MenuButton } from './MobileMenu'
import NotificationBell from './NotificationBell'
import UserProfileMenu from './UserProfileMenu'
import PlanoGuard from './PlanoGuard'

interface MinhasMetasViewProps {
  metas: MetaCofrinho[]
}

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  Plane,
  Car,
  Home,
  Smartphone,
  Heart,
  GraduationCap,
  ShoppingCart: ShoppingBag,
  Gamepad: Gamepad2,
  Camera,
  Music,
  Dumbbell,
  Briefcase,
  Gift,
  PiggyBank,
  Wallet,
  CreditCard
}

export default function MinhasMetasView({ metas: metasIniciais = [] }: MinhasMetasViewProps) {
  const [metas, setMetas] = useState<MetaCofrinho[]>(Array.isArray(metasIniciais) ? metasIniciais : [])
  const [modalCriarAberto, setModalCriarAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [metaParaExcluir, setMetaParaExcluir] = useState<MetaCofrinho | null>(null)
  const [metaParaEditar, setMetaParaEditar] = useState<MetaCofrinho | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const router = useRouter()

  // Atualizar metas quando props mudarem
  useEffect(() => {
    if (Array.isArray(metasIniciais)) {
      setMetas(metasIniciais)
    }
  }, [metasIniciais])

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuAberto) {
        const target = event.target as HTMLElement
        // Verificar se o clique foi fora do menu
        if (!target.closest('.menu-dropdown') && !target.closest('.menu-button')) {
          setMenuAberto(null)
        }
      }
    }

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuAberto])

  const handleMetaCriada = (novaMeta: MetaCofrinho) => {
    // Fechar modal primeiro
    setModalCriarAberto(false)
    
    // Adicionar a nova meta ao estado imediatamente para feedback visual
    setMetas(prev => [novaMeta, ...prev])
    
    // Forçar recarregamento da página após um pequeno delay para garantir que o servidor processou
    setTimeout(() => {
      window.location.href = '/minhas-metas'
    }, 500)
  }

  const handleVerMeta = (metaId: string) => {
    router.push(`/juntar-dinheiro?meta=${metaId}`)
  }

  const handleAbrirMenu = (e: React.MouseEvent, metaId: string) => {
    e.stopPropagation() // Prevenir que o clique abra a meta
    setMenuAberto(menuAberto === metaId ? null : metaId)
  }

  const handleFecharMenu = () => {
    setMenuAberto(null)
  }

  const handleEditarMeta = (e: React.MouseEvent, meta: MetaCofrinho) => {
    e.stopPropagation()
    setMenuAberto(null)
    setMetaParaEditar(meta)
    setModalCriarAberto(true)
  }

  const handleExcluirMeta = (e: React.MouseEvent, meta: MetaCofrinho) => {
    e.stopPropagation()
    setMenuAberto(null)
    setMetaParaExcluir(meta)
  }

  const confirmarExcluir = async () => {
    if (!metaParaExcluir) return

    setExcluindo(true)
    try {
      const resultado = await excluirMetaCofrinho(metaParaExcluir.id)
      
      if (resultado.error) {
        alert(`Erro ao excluir meta: ${resultado.error}`)
      } else {
        // Remover a meta do estado local
        setMetas(prev => prev.filter(m => m.id !== metaParaExcluir.id))
        // Recarregar a página
        setTimeout(() => {
          window.location.href = '/minhas-metas'
        }, 300)
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
      alert('Erro ao excluir meta. Tente novamente.')
    } finally {
      setExcluindo(false)
      setMetaParaExcluir(null)
    }
  }

  const handleMetaEditada = (metaEditada: MetaCofrinho) => {
    // Atualizar a meta no estado local
    setMetas(prev => prev.map(m => m.id === metaEditada.id ? metaEditada : m))
    setMetaParaEditar(null)
    setModalCriarAberto(false)
    
    // Recarregar a página
    setTimeout(() => {
      window.location.href = '/minhas-metas'
    }, 500)
  }

  const metasAtivas = metas.filter(m => m.status === 'ativo')
  const metasConcluidas = metas.filter(m => m.status === 'concluido')

  return (
    <>
          {/* Botão Nova Meta */}
          <div className="mb-6 sm:mb-8">
        <button
          onClick={() => setModalCriarAberto(true)}
          className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-brand-aqua to-blue-500 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-smooth font-semibold text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span className="font-bold">Nova Meta</span>
        </button>
      </div>

      {/* Metas Ativas */}
      {metasAtivas.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="text-brand-aqua sm:w-6 sm:h-6" size={20} />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-brand-clean">
              Metas Ativas
            </h2>
            <span className="px-2 sm:px-3 py-1 bg-brand-aqua/20 text-brand-aqua rounded-full text-xs sm:text-sm font-semibold">
              {metasAtivas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {metasAtivas.map((meta) => {
              const IconComponent = meta.icone ? iconMap[meta.icone] : Target
              const Icon = IconComponent || Target
              
              return (
                <div
                  key={meta.id}
                  onClick={() => {
                    if (menuAberto !== meta.id) {
                      handleVerMeta(meta.id)
                    }
                  }}
                  className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-brand-aqua/50 cursor-pointer transition-smooth hover:shadow-xl hover:scale-[1.02] relative shadow-md dark:shadow-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-aqua/20 rounded-xl">
                        <Icon size={24} className="text-brand-aqua" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-brand-clean">
                          {meta.nome}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-brand-clean/60">
                          {meta.periodicidade === 'diario' ? 'Diário' : 
                           meta.periodicidade === 'semanal' ? 'Semanal' : 'Mensal'}
                        </p>
                      </div>
                    </div>
                    {/* Menu de 3 pontinhos */}
                    <div className="relative z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAbrirMenu(e, meta.id)
                        }}
                        className="menu-button p-2 hover:bg-white/10 rounded-lg transition-smooth"
                        title="Opções"
                      >
                        <MoreVertical size={20} className="text-gray-600 dark:text-brand-clean/70" />
                      </button>
                      {menuAberto === meta.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-[100] bg-transparent" 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleFecharMenu()
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleFecharMenu()
                            }}
                          />
                          <div 
                            className="menu-dropdown absolute right-0 top-10 bg-white dark:bg-brand-midnight rounded-xl shadow-2xl border border-gray-200 dark:border-white/20 z-[110] min-w-[160px] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditarMeta(e, meta)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/10 transition-smooth text-left"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                              <span className="text-brand-midnight dark:text-brand-clean font-medium">Editar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleExcluirMeta(e, meta)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth text-left"
                            >
                              <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                              <span className="text-red-600 dark:text-red-400 font-medium">Excluir</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-brand-clean/70">Progresso</span>
                      <span className="text-sm font-bold text-brand-aqua">
                        {((meta.valor_acumulado || 0) / (meta.meta_total || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-brand-midnight/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50"
                        style={{
                          width: `${Math.min(((meta.valor_acumulado || 0) / (meta.meta_total || 1)) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-brand-clean/70">
                      R$ {(meta.valor_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-900 dark:text-brand-clean font-semibold">
                      de R$ {(meta.meta_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metas Concluídas */}
      {metasConcluidas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Trophy className="text-yellow-400 sm:w-6 sm:h-6" size={20} />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-brand-clean">
              Metas Concluídas
            </h2>
            <span className="px-2 sm:px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs sm:text-sm font-semibold">
              {metasConcluidas.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {metasConcluidas.map((meta) => {
              const IconComponent = meta.icone ? iconMap[meta.icone] : Target
              const Icon = IconComponent || Target
              
              return (
                <div
                  key={meta.id}
                  onClick={() => {
                    if (menuAberto !== meta.id) {
                      handleVerMeta(meta.id)
                    }
                  }}
                  className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-yellow-400/50 cursor-pointer transition-smooth hover:shadow-xl hover:scale-[1.02] opacity-75 relative shadow-md dark:shadow-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-400/20 rounded-xl">
                        <Icon size={24} className="text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-brand-clean">
                          {meta.nome}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-brand-clean/60">
                          Concluída
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="text-yellow-400" size={20} />
                      {/* Menu de 3 pontinhos */}
                      <div className="relative z-30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAbrirMenu(e, meta.id)
                          }}
                          className="menu-button p-2 hover:bg-white/10 rounded-lg transition-smooth"
                          title="Opções"
                        >
                          <MoreVertical size={20} className="text-gray-600 dark:text-brand-clean/70" />
                        </button>
                        {menuAberto === meta.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-[100] bg-transparent" 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleFecharMenu()
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleFecharMenu()
                              }}
                            />
                            <div 
                              className="menu-dropdown absolute right-0 top-10 bg-white dark:bg-brand-midnight rounded-xl shadow-2xl border border-gray-200 dark:border-white/20 z-[110] min-w-[160px] overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditarMeta(e, meta)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/10 transition-smooth text-left"
                              >
                                <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-brand-midnight dark:text-brand-clean font-medium">Editar</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExcluirMeta(e, meta)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-smooth text-left"
                              >
                                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                <span className="text-red-600 dark:text-red-400 font-medium">Excluir</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 dark:bg-brand-midnight/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-brand-clean/70">
                      R$ {(meta.valor_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-900 dark:text-brand-clean font-semibold">
                      de R$ {(meta.meta_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {metas.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-aqua/20 rounded-full mb-6">
            <Target size={48} className="text-brand-aqua" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-brand-clean mb-2">
            Nenhuma meta criada ainda
          </h3>
          <p className="text-gray-600 dark:text-brand-clean/70 mb-6">
            Crie sua primeira meta e comece a economizar!
          </p>
          <button
            onClick={() => setModalCriarAberto(true)}
            className="px-6 py-3 bg-gradient-to-r from-brand-aqua to-blue-500 text-white rounded-xl hover:shadow-lg transition-smooth font-semibold"
          >
            <Plus size={20} className="inline mr-2" />
            Criar Primeira Meta
          </button>
        </div>
      )}

      {/* Modal Criar/Editar Meta */}
      {modalCriarAberto && (
        <ModalCriarMeta
          onClose={() => {
            setModalCriarAberto(false)
            setMetaParaEditar(null)
          }}
          onMetaCriada={metaParaEditar ? handleMetaEditada : handleMetaCriada}
          metaParaEditar={metaParaEditar}
        />
      )}

      {/* Modal de Confirmação para Excluir */}
      {metaParaExcluir && (
        <ModalConfirmacao
          titulo="Excluir Meta"
          mensagem={`Tem certeza que deseja excluir a meta "${metaParaExcluir.nome}"? Esta ação não pode ser desfeita e todos os baús e depósitos relacionados serão perdidos.`}
          onConfirmar={confirmarExcluir}
          onCancelar={() => setMetaParaExcluir(null)}
          textoConfirmar="Excluir"
          textoCancelar="Cancelar"
          tipo="danger"
          loading={excluindo}
        />
      )}
    </>
  )
}

