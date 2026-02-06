'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@/lib/types'
import { obterUsuarios, criarUsuario } from '@/lib/actions'
import { X, Plus, Settings, Search, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'
import { useModalBodyLock } from '@/hooks/useModalBodyLock'

interface ModalSelecionarUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (user: User) => void
  selectedUserId?: string
  buttonRef?: React.RefObject<HTMLButtonElement>
}

export default function ModalSelecionarUsuario({
  isOpen,
  onClose,
  onSelect,
  selectedUserId,
  buttonRef
}: ModalSelecionarUsuarioProps) {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNovoUsuario, setShowNovoUsuario] = useState(false)
  const [novoUsuarioNome, setNovoUsuarioNome] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useModalBodyLock(isOpen && !buttonRef)

  useEffect(() => {
    if (isOpen) {
      carregarUsuarios()
      carregarUsuarioAtual()
    }
  }, [isOpen])

  const carregarUsuarioAtual = async () => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const carregarUsuarios = async () => {
    const result = await obterUsuarios()
    if (result.data) {
      setUsuarios(result.data)
    }
  }

  const handleCriarUsuario = async () => {
    if (!novoUsuarioNome.trim()) return

    setLoading(true)
    const formData = new FormData()
    formData.append('nome', novoUsuarioNome.trim())
    const result = await criarUsuario(formData)
    
    if (result.error) {
      createNotification('Erro ao criar usuário: ' + result.error, 'warning')
    } else {
      createNotification(`Usuário "${novoUsuarioNome.trim()}" criado com sucesso!`, 'success')
      await carregarUsuarios()
      if (result.data) {
        onSelect(result.data)
        onClose()
      }
      setNovoUsuarioNome('')
      setShowNovoUsuario(false)
    }
    setLoading(false)
  }

  const handleGerenciarUsuarios = () => {
    onClose()
    router.push('/configuracoes?tab=usuarios')
  }

  const usuariosFiltrados = usuarios.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fechar ao clicar fora (apenas para dropdown)
  useEffect(() => {
    if (!buttonRef) return
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
          onClose()
        }
      }
    }

    if (isOpen && buttonRef) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, buttonRef])

  if (!isOpen) return null

  // Renderizar como dropdown se tiver buttonRef
  if (buttonRef) {
    return (
      <div 
        ref={dropdownRef}
        className="absolute top-full left-0 mt-2 w-full max-w-md bg-white dark:bg-brand-midnight rounded-xl shadow-2xl z-[50] overflow-hidden animate-fade-in border-2 border-gray-200 dark:border-white/20 max-h-[70vh] flex flex-col pointer-events-auto"
      >
          {/* Header simplificado para dropdown */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between bg-white dark:bg-brand-midnight">
            <h3 className="text-lg font-bold text-brand-midnight dark:text-brand-clean">
              Selecionar Usuário
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGerenciarUsuarios}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
                title="Gerenciar usuários"
              >
                <Settings size={18} className="text-brand-aqua" strokeWidth={2.5} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 space-y-3" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-aqua dark:text-brand-aqua" size={20} strokeWidth={2.5} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuário..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-brand-midnight border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-base placeholder-gray-400 dark:placeholder-brand-clean/60 shadow-sm hover:shadow-md"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Botão adicionar novo */}
          <button
            onClick={() => setShowNovoUsuario(!showNovoUsuario)}
            className="w-full px-5 py-3 bg-brand-aqua text-white rounded-xl font-bold hover:bg-brand-aqua/90 transition-smooth flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
          >
            <Plus size={20} strokeWidth={3} />
            Adicionar Novo Usuário
          </button>

          {/* Formulário novo usuário */}
          {showNovoUsuario && (
            <div className="p-4 bg-gradient-to-br from-brand-aqua/10 via-brand-aqua/5 to-transparent dark:from-brand-aqua/20 dark:via-brand-aqua/10 rounded-xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoUsuarioNome}
                  onChange={(e) => setNovoUsuarioNome(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCriarUsuario()}
                  placeholder="Digite o nome do novo usuário..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-brand-midnight border-2 border-gray-200 dark:border-white/20 rounded-xl text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/60 focus:outline-none focus:border-brand-aqua transition-smooth text-base shadow-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={handleCriarUsuario}
                  disabled={loading || !novoUsuarioNome.trim()}
                  className="px-5 py-2.5 bg-brand-aqua text-white rounded-xl hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-md hover:shadow-lg"
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
                <button
                  onClick={() => {
                    setShowNovoUsuario(false)
                    setNovoUsuarioNome('')
                  }}
                  className="px-3 py-2.5 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth border-2 border-gray-200 dark:border-white/20"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Lista de usuários */}
          <div className="space-y-2">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-midnight/60 dark:text-brand-clean/70">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              usuariosFiltrados.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user)
                    onClose()
                  }}
                  className={`w-full p-4 rounded-xl transition-all duration-300 text-left ${
                    selectedUserId === user.id
                      ? 'bg-gradient-to-r from-brand-aqua/30 via-brand-aqua/20 to-brand-blue/20 dark:from-brand-aqua/40 dark:via-brand-aqua/30 dark:to-brand-blue/30 border-2 border-brand-aqua shadow-xl shadow-brand-aqua/30'
                      : 'bg-white dark:bg-brand-midnight/80 border-2 border-gray-200 dark:border-white/20 hover:bg-gradient-to-r hover:from-brand-aqua/10 hover:to-brand-blue/10 dark:hover:from-brand-aqua/20 dark:hover:to-brand-blue/20 hover:border-brand-aqua/50 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {user.imagem_url ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-brand-aqua/30 to-brand-blue/30 dark:from-brand-aqua/40 dark:to-brand-blue/40 flex items-center justify-center border-2 border-brand-aqua/30 dark:border-brand-aqua/50">
                        <img 
                          src={user.imagem_url} 
                          alt={user.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback para inicial do nome se a imagem falhar
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<span class="text-brand-aqua dark:text-brand-aqua font-bold text-lg">${user.nome.charAt(0).toUpperCase()}</span>`
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-aqua/30 to-brand-blue/30 dark:from-brand-aqua/40 dark:to-brand-blue/40 flex items-center justify-center border-2 border-brand-aqua/30 dark:border-brand-aqua/50">
                        <span className="text-brand-aqua dark:text-brand-aqua font-bold text-lg">
                          {user.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-brand-midnight dark:text-brand-clean text-base">
                          {user.nome}
                        </p>
                        {currentUserId === user.id && (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/70 mt-0.5">
                        Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedUserId === user.id && (
                      <div className="w-6 h-6 rounded-full bg-brand-aqua flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Renderizar como modal centralizado (compatibilidade com código antigo)
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border-2 border-brand-aqua/30 dark:border-brand-aqua/40">
        <div className="flex-shrink-0 border-b-2 border-brand-aqua/20 dark:border-brand-aqua/30 px-6 py-5 flex items-center justify-between bg-gradient-to-r from-brand-aqua to-blue-500 dark:from-brand-midnight dark:to-brand-royal">
          <h2 className="text-2xl font-display font-bold text-white dark:text-brand-clean">
            Selecionar Usuário
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGerenciarUsuarios}
              className="p-2 hover:bg-white/20 dark:hover:bg-brand-aqua/30 rounded-xl transition-smooth"
              title="Gerenciar usuários"
            >
              <Settings size={20} className="text-white dark:text-brand-clean" strokeWidth={2.5} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 dark:hover:bg-red-500/30 rounded-xl transition-smooth"
            >
              <X size={20} className="text-white dark:text-brand-clean" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-5 space-y-4 bg-white/50 dark:bg-brand-midnight/60" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-aqua dark:text-brand-aqua" size={20} strokeWidth={2.5} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuário..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-brand-midnight border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-base placeholder-gray-400 dark:placeholder-brand-clean/60 shadow-sm hover:shadow-md"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Botão adicionar novo */}
          <button
            onClick={() => setShowNovoUsuario(!showNovoUsuario)}
            className="w-full px-5 py-3 bg-brand-aqua text-white rounded-xl font-bold hover:bg-brand-aqua/90 transition-smooth flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
          >
            <Plus size={20} strokeWidth={3} />
            Adicionar Novo Usuário
          </button>

          {/* Formulário novo usuário */}
          {showNovoUsuario && (
            <div className="p-4 bg-gradient-to-br from-brand-aqua/10 via-brand-aqua/5 to-transparent dark:from-brand-aqua/20 dark:via-brand-aqua/10 rounded-xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoUsuarioNome}
                  onChange={(e) => setNovoUsuarioNome(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCriarUsuario()}
                  placeholder="Digite o nome do novo usuário..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-brand-midnight border-2 border-gray-200 dark:border-white/20 rounded-xl text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/60 focus:outline-none focus:border-brand-aqua transition-smooth text-base shadow-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={handleCriarUsuario}
                  disabled={loading || !novoUsuarioNome.trim()}
                  className="px-5 py-2.5 bg-brand-aqua text-white rounded-xl hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-md hover:shadow-lg"
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
                <button
                  onClick={() => {
                    setShowNovoUsuario(false)
                    setNovoUsuarioNome('')
                  }}
                  className="px-3 py-2.5 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth border-2 border-gray-200 dark:border-white/20"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Lista de usuários */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-midnight/60 dark:text-brand-clean/70">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              usuariosFiltrados.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user)
                    onClose()
                  }}
                  className={`w-full p-4 rounded-xl transition-all duration-300 text-left ${
                    selectedUserId === user.id
                      ? 'bg-gradient-to-r from-brand-aqua/30 via-brand-aqua/20 to-brand-blue/20 dark:from-brand-aqua/40 dark:via-brand-aqua/30 dark:to-brand-blue/30 border-2 border-brand-aqua shadow-xl shadow-brand-aqua/30'
                      : 'bg-white dark:bg-brand-midnight/80 border-2 border-gray-200 dark:border-white/20 hover:bg-gradient-to-r hover:from-brand-aqua/10 hover:to-brand-blue/10 dark:hover:from-brand-aqua/20 dark:hover:to-brand-blue/20 hover:border-brand-aqua/50 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {user.imagem_url ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-brand-aqua/30 to-brand-blue/30 dark:from-brand-aqua/40 dark:to-brand-blue/40 flex items-center justify-center border-2 border-brand-aqua/30 dark:border-brand-aqua/50">
                        <img 
                          src={user.imagem_url} 
                          alt={user.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<span class="text-brand-aqua dark:text-brand-aqua font-bold text-lg">${user.nome.charAt(0).toUpperCase()}</span>`
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-aqua/30 to-brand-blue/30 dark:from-brand-aqua/40 dark:to-brand-blue/40 flex items-center justify-center border-2 border-brand-aqua/30 dark:border-brand-aqua/50">
                        <span className="text-brand-aqua dark:text-brand-aqua font-bold text-lg">
                          {user.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-brand-midnight dark:text-brand-clean text-base">
                          {user.nome}
                        </p>
                        {currentUserId === user.id && (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/70 mt-0.5">
                        Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedUserId === user.id && (
                      <div className="w-6 h-6 rounded-full bg-brand-aqua flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

