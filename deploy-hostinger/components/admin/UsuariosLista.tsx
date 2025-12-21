'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Mail, Phone, Calendar, CreditCard, Key, Crown, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import ModalDetalhesUsuario from './ModalDetalhesUsuario'

interface Usuario {
  id: string
  id_curto?: string
  email: string
  nome: string
  telefone?: string
  whatsapp?: string
  plano: 'teste' | 'basico' | 'premium'
  created_at: string
  last_sign_in_at?: string | null
}

interface UsuariosListaProps {
  usuarios: Usuario[]
  error?: string | null
}

export default function UsuariosLista({ usuarios: usuariosIniciais, error }: UsuariosListaProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlano, setFilterPlano] = useState<string>('todos')
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [alterandoPlano, setAlterandoPlano] = useState<string | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais)

  // Atualizar usuários quando usuariosIniciais mudar
  useEffect(() => {
    setUsuarios(usuariosIniciais)
  }, [usuariosIniciais])

  // Função para atualizar o plano de um usuário
  const handlePlanoAlterado = (usuarioId: string, novoPlano: 'teste' | 'basico' | 'premium') => {
    setUsuarios(prevUsuarios => 
      prevUsuarios.map(usuario => 
        usuario.id === usuarioId ? { ...usuario, plano: novoPlano } : usuario
      )
    )
    
    // Atualizar usuário selecionado também
    if (usuarioSelecionado && usuarioSelecionado.id === usuarioId) {
      setUsuarioSelecionado({ ...usuarioSelecionado, plano: novoPlano })
    }
  }

  // Filtrar usuários
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchSearch = 
        usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (usuario.id_curto && usuario.id_curto.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchPlano = filterPlano === 'todos' || usuario.plano === filterPlano
      
      return matchSearch && matchPlano
    })
  }, [usuarios, searchTerm, filterPlano])

  const planoColors = {
    teste: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
    basico: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    premium: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
  }

  const planoLabels = {
    teste: 'Teste',
    basico: 'Básico',
    premium: 'Premium',
  }

  const handleAlterarPlanoRapido = async (usuario: Usuario, novoPlano: 'teste' | 'basico' | 'premium') => {
    if (usuario.plano === novoPlano) return

    setAlterandoPlano(usuario.id)
    setMensagem(null)

    try {
      const response = await fetch('/api/admin/alterar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: usuario.id,
          plano: novoPlano,
          planoStatus: novoPlano === 'teste' ? 'trial' : 'ativo',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMensagem({ tipo: 'error', texto: data.error || 'Erro ao alterar plano' })
        setTimeout(() => setMensagem(null), 5000)
      } else {
        setMensagem({ tipo: 'success', texto: `Plano de ${usuario.nome} alterado para ${planoLabels[novoPlano]}!` })
        handlePlanoAlterado(usuario.id, novoPlano)
        setTimeout(() => {
          setMensagem(null)
        }, 3000)
      }
    } catch (error: any) {
      setMensagem({ tipo: 'error', texto: 'Erro ao conectar com o servidor' })
      setTimeout(() => setMensagem(null), 5000)
    } finally {
      setAlterandoPlano(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {mensagem && (
        <div className={`p-4 rounded-xl border ${
          mensagem.tipo === 'success' 
            ? 'bg-green-900/20 border-green-800/50 text-green-400' 
            : 'bg-red-900/20 border-red-800/50 text-red-400'
        }`}>
          <p className="text-sm font-medium">{mensagem.texto}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-brand-royal rounded-2xl p-4 shadow-lg border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-clean/60" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou ID..."
              className="w-full pl-10 pr-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean placeholder-brand-clean/50"
            />
          </div>
          <select
            value={filterPlano}
            onChange={(e) => setFilterPlano(e.target.value)}
            className="px-4 py-3 bg-brand-midnight border border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-brand-clean"
          >
            <option value="todos">Todos os Planos</option>
            <option value="teste">Teste</option>
            <option value="basico">Básico</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-brand-clean/70">
          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuários
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
          <p className="text-red-400 text-sm">
            <strong>Erro:</strong> {error}
          </p>
          <p className="text-red-400/70 text-xs mt-2">
            Verifique se a variável SUPABASE_SERVICE_ROLE_KEY está configurada no arquivo .env.local
          </p>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-brand-royal rounded-2xl shadow-lg border border-white/10 overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-clean/60 text-lg mb-2">
              {error ? 'Não foi possível carregar os usuários' : 'Nenhum usuário cadastrado ainda'}
            </p>
            <p className="text-brand-clean/40 text-sm">
              {error 
                ? 'Verifique a configuração do banco de dados e as permissões RLS.'
                : 'Os usuários aparecerão aqui após se cadastrarem na plataforma.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-midnight border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    ID Admin
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Cadastrado em
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-brand-royal divide-y divide-white/10">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-brand-clean/60">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                <tr 
                  key={usuario.id} 
                  className="hover:bg-white/5 transition-smooth cursor-pointer"
                  onClick={() => setUsuarioSelecionado(usuario)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-brand-aqua" />
                      <span className="text-xs font-mono text-brand-clean/80 font-semibold">
                        #{usuario.id_curto || usuario.id.substring(0, 5)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-brand-clean">
                      {usuario.nome}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-brand-clean/60" />
                      <span className="text-sm text-brand-clean/80">
                        {usuario.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {usuario.telefone && (
                        <div className="flex items-center gap-2 text-xs text-brand-clean/70">
                          <Phone size={14} />
                          {usuario.telefone}
                        </div>
                      )}
                      {usuario.whatsapp && (
                        <div className="flex items-center gap-2 text-xs text-brand-clean/70">
                          <Phone size={14} />
                          {usuario.whatsapp}
                        </div>
                      )}
                      {!usuario.telefone && !usuario.whatsapp && (
                        <span className="text-xs text-brand-clean/40">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${planoColors[usuario.plano]}`}>
                      {planoLabels[usuario.plano]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-brand-clean/80">
                      <Calendar size={16} className="text-brand-clean/60" />
                      {format(new Date(usuario.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {/* Menu rápido de alteração de plano */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuAberto(menuAberto === usuario.id ? null : usuario.id)
                          }}
                          disabled={alterandoPlano === usuario.id}
                          className="px-2 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-smooth text-xs font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Alterar plano rapidamente"
                        >
                          {alterandoPlano === usuario.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Crown size={12} />
                          )}
                        </button>
                        {menuAberto === usuario.id && (
                          <div className="absolute right-0 top-full mt-1 bg-brand-midnight border border-white/20 rounded-lg shadow-xl z-50 min-w-[120px]">
                            <div className="py-1">
                              {usuario.plano !== 'teste' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAlterarPlanoRapido(usuario, 'teste')
                                    setMenuAberto(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-brand-clean hover:bg-white/5 transition-smooth flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                  Teste
                                </button>
                              )}
                              {usuario.plano !== 'basico' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAlterarPlanoRapido(usuario, 'basico')
                                    setMenuAberto(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-brand-clean hover:bg-white/5 transition-smooth flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                  Básico
                                </button>
                              )}
                              {usuario.plano !== 'premium' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAlterarPlanoRapido(usuario, 'premium')
                                    setMenuAberto(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-brand-clean hover:bg-white/5 transition-smooth flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                  Premium
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setUsuarioSelecionado(usuario)
                        }}
                        className="px-3 py-1.5 bg-brand-aqua/20 text-brand-aqua rounded-lg hover:bg-brand-aqua/30 transition-smooth text-xs font-medium"
                        title="Ver detalhes e recuperar senha"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </td>
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-6 shadow-lg">
          <p className="text-red-400 font-semibold mb-2">Erro ao carregar usuários</p>
          <p className="text-red-300/80 text-sm">{error}</p>
          <p className="text-red-300/60 text-xs mt-2">
            Verifique se a função RPC get_all_profiles está criada no banco de dados ou configure a variável SUPABASE_SERVICE_ROLE_KEY.
          </p>
        </div>
      )}

      {!error && usuariosFiltrados.length === 0 && (
        <div className="bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-white/10">
          <p className="text-brand-clean/60 text-lg">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {usuarioSelecionado && (
        <ModalDetalhesUsuario
          usuario={usuarioSelecionado}
          onClose={() => setUsuarioSelecionado(null)}
          onPlanoAlterado={handlePlanoAlterado}
        />
      )}
    </div>
  )
}


