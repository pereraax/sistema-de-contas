'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Registro, User } from '@/lib/types'
import { Edit, Trash2, CheckCircle, X, Search, Filter, ChevronDown, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { marcarParcelaPaga, excluirRegistro } from '@/lib/actions'
import ModalConfirmacao from './ModalConfirmacao'
import ModalEditarRegistro from './ModalEditarRegistro'

interface RegistrosListaProps {
  registros: Registro[]
  usuarios: User[]
  filtrosAtuais: Record<string, string>
}

export default function RegistrosLista({
  registros,
  usuarios,
  filtrosAtuais,
}: RegistrosListaProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filtros, setFiltros] = useState({
    nome: filtrosAtuais.nome || '',
    tipo: filtrosAtuais.tipo || '',
    user_id: filtrosAtuais.user_id || '',
    etiqueta: filtrosAtuais.etiqueta || '',
    data_inicio: filtrosAtuais.data_inicio || '',
    data_fim: filtrosAtuais.data_fim || '',
  })
  const [registroEditando, setRegistroEditando] = useState<Registro | null>(null)
  const [showModalExcluir, setShowModalExcluir] = useState(false)
  const [registroParaExcluir, setRegistroParaExcluir] = useState<string | null>(null)
  const [dropdownEtiquetaAberto, setDropdownEtiquetaAberto] = useState(false)
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false)
  const [dropdownUsuarioAberto, setDropdownUsuarioAberto] = useState(false)
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false)

  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    if (filtros.nome) params.set('nome', filtros.nome)
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.user_id) params.set('user_id', filtros.user_id)
    if (filtros.etiqueta) params.set('etiqueta', filtros.etiqueta)
    if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio)
    if (filtros.data_fim) params.set('data_fim', filtros.data_fim)
    router.push(`/registros?${params.toString()}`)
  }

  const limparFiltros = () => {
    setFiltros({
      nome: '',
      tipo: '',
      user_id: '',
      etiqueta: '',
      data_inicio: '',
      data_fim: '',
    })
    router.push('/registros')
  }

  const todasEtiquetas = Array.from(
    new Set(registros.flatMap((r) => r.etiquetas || []))
  )

  const temFiltrosAtivos = Object.values(filtrosAtuais).some((v) => v)

  const handleMarcarPago = async (id: string) => {
    await marcarParcelaPaga(id)
    router.refresh()
  }

  const handleExcluir = async (id: string) => {
    setRegistroParaExcluir(id)
    setShowModalExcluir(true)
  }

  const confirmarExcluir = async () => {
    if (registroParaExcluir) {
      await excluirRegistro(registroParaExcluir)
      router.refresh()
      setShowModalExcluir(false)
      setRegistroParaExcluir(null)
    }
  }

  const tipoColors = {
    entrada: 'bg-green-100 text-green-700 border-green-300',
    saida: 'bg-red-100 text-red-700 border-red-300',
    divida: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const tipoLabels = {
    entrada: 'Entrada',
    saida: 'Saída',
    divida: 'Dívida',
  }

  // Função para limpar observação removendo JSON do histórico
  const limparObservacao = (observacao: string | undefined): string => {
    if (!observacao) return ''
    
    // Remover JSON do histórico (última linha que começa com [)
    const linhas = observacao.split('\n')
    const linhasLimpas = linhas.filter(linha => {
      const linhaTrim = linha.trim()
      return !(linhaTrim.startsWith('[') && linhaTrim.endsWith(']'))
    })
    
    const observacaoLimpa = linhasLimpas.join('\n').trim()
    
    // Limitar tamanho para exibição (máximo 60 caracteres)
    if (observacaoLimpa.length > 60) {
      return observacaoLimpa.substring(0, 60) + '...'
    }
    
    return observacaoLimpa
  }

  return (
    <div>
      {/* Barra de busca */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-brand-clean/60" size={20} />
          <input
            type="text"
            value={filtros.nome}
            onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
            placeholder="Buscar por nome..."
            className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight placeholder-gray-400 dark:placeholder-brand-clean/50 hover:border-brand-aqua/50 shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      {/* Mobile: Filtros sempre abertos */}
      <div className="md:hidden mb-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-xl p-3 shadow-lg border border-brand-aqua/20 dark:border-brand-aqua/30">
        <div className="space-y-2.5">
          {/* Tipo */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-brand-clean/90 mb-1">Tipo</label>
            <button
              type="button"
              onClick={() => setDropdownTipoAberto(!dropdownTipoAberto)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-xs text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight flex items-center justify-between"
            >
              <span className={filtros.tipo ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                {filtros.tipo === 'entrada' ? 'Entrada' : filtros.tipo === 'saida' ? 'Saída' : 'Todos'}
              </span>
              <ChevronDown size={14} className={`text-brand-aqua transition-transform ${dropdownTipoAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownTipoAberto && (
              <div className="absolute z-20 w-full mt-1 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-lg shadow-xl border border-brand-aqua/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setFiltros({ ...filtros, tipo: '' }); setDropdownTipoAberto(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs ${filtros.tipo === '' ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                >
                  <span>Todos</span>
                  {filtros.tipo === '' && <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => { setFiltros({ ...filtros, tipo: 'entrada' }); setDropdownTipoAberto(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between border-t text-xs ${filtros.tipo === 'entrada' ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                >
                  <span>Entrada</span>
                  {filtros.tipo === 'entrada' && <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => { setFiltros({ ...filtros, tipo: 'saida' }); setDropdownTipoAberto(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between border-t text-xs ${filtros.tipo === 'saida' ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                >
                  <span>Saída</span>
                  {filtros.tipo === 'saida' && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Usuário */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-brand-clean/90 mb-1">Usuário</label>
            <button
              type="button"
              onClick={() => setDropdownUsuarioAberto(!dropdownUsuarioAberto)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-xs text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight flex items-center justify-between"
            >
              <span className={filtros.user_id ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                {filtros.user_id ? usuarios.find(u => u.id === filtros.user_id)?.nome || 'Todos' : 'Todos'}
              </span>
              <ChevronDown size={14} className={`text-brand-aqua transition-transform ${dropdownUsuarioAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownUsuarioAberto && (
              <div className="absolute z-20 w-full mt-1 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-lg shadow-xl border border-brand-aqua/30 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setFiltros({ ...filtros, user_id: '' }); setDropdownUsuarioAberto(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs ${filtros.user_id === '' ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                >
                  <span>Todos</span>
                  {filtros.user_id === '' && <Check size={14} />}
                </button>
                {usuarios.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { setFiltros({ ...filtros, user_id: user.id }); setDropdownUsuarioAberto(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between border-t text-xs ${filtros.user_id === user.id ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                  >
                    <span>{user.nome}</span>
                    {filtros.user_id === user.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Etiqueta */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-brand-clean/90 mb-1">Etiqueta</label>
            <button
              type="button"
              onClick={() => setDropdownEtiquetaAberto(!dropdownEtiquetaAberto)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-xs text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight flex items-center justify-between"
            >
              <span className={filtros.etiqueta ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                {filtros.etiqueta || 'Todas'}
              </span>
              <ChevronDown size={14} className={`text-brand-aqua transition-transform ${dropdownEtiquetaAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownEtiquetaAberto && (
              <div className="absolute z-20 w-full mt-1 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-lg shadow-xl border border-brand-aqua/30 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setFiltros({ ...filtros, etiqueta: '' }); setDropdownEtiquetaAberto(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs ${filtros.etiqueta === '' ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                >
                  <span>Todas</span>
                  {filtros.etiqueta === '' && <Check size={14} />}
                </button>
                {todasEtiquetas.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setFiltros({ ...filtros, etiqueta: tag }); setDropdownEtiquetaAberto(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between border-t text-xs ${filtros.etiqueta === tag ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold' : 'text-brand-midnight dark:text-brand-clean'}`}
                  >
                    <span className="capitalize">{tag}</span>
                    {filtros.etiqueta === tag && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-brand-clean/90 mb-1">Data início</label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-xs text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-brand-clean/90 mb-1">Data fim</label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-white/20 rounded-lg text-xs text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                aplicarFiltros()
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-aqua via-brand-aqua to-blue-500 text-white rounded-lg font-bold shadow-lg text-xs flex items-center justify-center gap-1.5 hover:shadow-xl transition-all"
            >
              <Filter size={14} strokeWidth={2.5} />
              Aplicar
            </button>
            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  limparFiltros()
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Botão de filtro */}
      <div className="hidden md:flex items-center gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setModalFiltrosAberto(!modalFiltrosAberto)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-xl transition-smooth text-sm font-semibold whitespace-nowrap ${
            temFiltrosAtivos
              ? 'bg-brand-aqua text-brand-midnight border-brand-aqua shadow-md'
              : 'bg-white dark:bg-brand-royal text-brand-midnight dark:text-brand-clean border-gray-200 dark:border-white/20 hover:border-brand-aqua'
          }`}
        >
          <Filter size={18} className="text-brand-aqua" strokeWidth={2.5} />
          <span>Filtros</span>
          {temFiltrosAtivos && (
            <span className="px-1.5 py-0.5 bg-brand-midnight dark:bg-brand-aqua text-white dark:text-brand-midnight rounded-full text-xs font-bold">
              {Object.values(filtrosAtuais).filter(v => v).length}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: Filtros - aparecem quando o botão é clicado */}
      {modalFiltrosAberto && (
      <div className="hidden md:block bg-gradient-to-br from-white via-gray-50 to-white dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-brand-aqua/20 dark:border-brand-aqua/30 mb-4 sm:mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-xl">
              <Filter size={24} className="text-brand-aqua" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">Filtros do Extrato</h3>
          </div>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-smooth text-sm font-semibold border-2 border-red-200 dark:border-red-800/50"
            >
              <X size={18} strokeWidth={2.5} />
              <span>Limpar</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">

          {/* Tipo */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-brand-clean/90 mb-1.5">
              Tipo
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownTipoAberto(!dropdownTipoAberto)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <span className={filtros.tipo ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                  {filtros.tipo === 'entrada' ? 'Entrada' : filtros.tipo === 'saida' ? 'Saída' : 'Todos'}
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
                  <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden animate-slide-up">
                    <div className="max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFiltros({ ...filtros, tipo: '' })
                          setDropdownTipoAberto(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                          filtros.tipo === ''
                            ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                            : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        }`}
                      >
                        <span>Todos</span>
                        {filtros.tipo === '' && (
                          <Check size={18} strokeWidth={3} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFiltros({ ...filtros, tipo: 'entrada' })
                          setDropdownTipoAberto(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                          filtros.tipo === 'entrada'
                            ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                            : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        }`}
                      >
                        <span>Entrada</span>
                        {filtros.tipo === 'entrada' && (
                          <Check size={18} strokeWidth={3} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFiltros({ ...filtros, tipo: 'saida' })
                          setDropdownTipoAberto(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                          filtros.tipo === 'saida'
                            ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                            : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        }`}
                      >
                        <span>Saída</span>
                        {filtros.tipo === 'saida' && (
                          <Check size={18} strokeWidth={3} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Usuário */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-brand-clean/90 mb-1.5">
              Usuário
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownUsuarioAberto(!dropdownUsuarioAberto)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <span className={filtros.user_id ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                  {filtros.user_id ? usuarios.find(u => u.id === filtros.user_id)?.nome || 'Todos' : 'Todos'}
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
                  <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden animate-slide-up">
                    <div className="max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFiltros({ ...filtros, user_id: '' })
                          setDropdownUsuarioAberto(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                          filtros.user_id === ''
                            ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                            : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        }`}
                      >
                        <span>Todos</span>
                        {filtros.user_id === '' && (
                          <Check size={18} strokeWidth={3} />
                        )}
                      </button>
                      {usuarios.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setFiltros({ ...filtros, user_id: user.id })
                            setDropdownUsuarioAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                            filtros.user_id === user.id
                              ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                              : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                          }`}
                        >
                          <span>{user.nome}</span>
                          {filtros.user_id === user.id && (
                            <Check size={18} strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Etiqueta */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-brand-clean/90 mb-1.5">
              Etiqueta
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownEtiquetaAberto(!dropdownEtiquetaAberto)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <span className={filtros.etiqueta ? 'font-medium' : 'text-gray-500 dark:text-brand-clean/60'}>
                  {filtros.etiqueta || 'Todas'}
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
                  <div className="absolute z-20 w-full mt-2 bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-midnight dark:via-brand-royal dark:to-brand-midnight rounded-xl shadow-2xl border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden animate-slide-up">
                    <div className="max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFiltros({ ...filtros, etiqueta: '' })
                          setDropdownEtiquetaAberto(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth ${
                          filtros.etiqueta === ''
                            ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                            : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        }`}
                      >
                        <span>Todas</span>
                        {filtros.etiqueta === '' && (
                          <Check size={18} strokeWidth={3} />
                        )}
                      </button>
                      {todasEtiquetas.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFiltros({ ...filtros, etiqueta: tag })
                            setDropdownEtiquetaAberto(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-smooth border-t border-gray-100 dark:border-white/10 ${
                            filtros.etiqueta === tag
                              ? 'bg-gradient-to-r from-brand-aqua to-brand-blue text-white font-bold'
                              : 'text-brand-midnight dark:text-brand-clean hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                          }`}
                        >
                          <span className="capitalize">{tag}</span>
                          {filtros.etiqueta === tag && (
                            <Check size={18} strokeWidth={3} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Data início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-brand-clean/90 mb-1.5">
              Data início
            </label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 shadow-sm hover:shadow-md"
            />
          </div>

          {/* Data fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-brand-clean/90 mb-1.5">
              Data fim
            </label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-white/20 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight hover:border-brand-aqua/50 shadow-sm hover:shadow-md"
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={aplicarFiltros}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-aqua to-brand-blue text-brand-midnight rounded-xl hover:from-brand-aqua/90 hover:to-brand-blue/90 transition-smooth font-bold shadow-lg hover:shadow-xl text-sm flex items-center justify-center gap-2"
          >
            <Filter size={18} strokeWidth={2.5} />
            Aplicar Filtros
          </button>
          <button
            onClick={limparFiltros}
            className="px-6 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth text-sm font-semibold border-2 border-gray-200 dark:border-white/20"
          >
            Limpar
          </button>
        </div>
      </div>
      )}

      {/* Lista de registros */}
      {registros.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-brand-clean dark:border-white/10">
          <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-lg">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl shadow-lg border border-brand-clean dark:border-white/10 overflow-hidden animate-fade-in">
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-4 p-4">
            {registros.map((registro) => (
              <div key={registro.id} className="bg-brand-royal dark:bg-brand-midnight rounded-xl p-3 border border-brand-clean/20 dark:border-white/10 relative">
                {/* Botões de ação no canto superior direito */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                  <button
                    onClick={() => handleExcluir(registro.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-smooth"
                    title="Excluir"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setRegistroEditando(registro)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-smooth"
                    title="Editar"
                  >
                    <Edit size={16} strokeWidth={2} />
                  </button>
                </div>
                
                <div className="space-y-2 pr-12">
                  {/* Nome e Tipo */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-brand-midnight dark:text-brand-clean">
                        {registro.nome}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${tipoColors[registro.tipo]} dark:opacity-90`}
                      >
                        {tipoLabels[registro.tipo]}
                      </span>
                    </div>
                    {limparObservacao(registro.observacao) && (
                      <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                        {limparObservacao(registro.observacao)}
                      </p>
                    )}
                  </div>

                  {/* Grid de informações */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Valor</p>
                      <p className="text-sm font-bold text-brand-midnight dark:text-brand-clean">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(registro.valor)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Usuário</p>
                      <p className="text-xs text-brand-midnight/80 dark:text-brand-clean/80">👤 {registro.user?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Categoria</p>
                      <p className="text-xs font-medium text-brand-midnight/80 dark:text-brand-clean/80">{registro.categoria || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Data</p>
                      <p className="text-xs text-brand-midnight/80 dark:text-brand-clean/80">
                        {format(new Date(registro.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Parcelas */}
                  {registro.parcelas_totais > 1 && (
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Parcelas</p>
                      <p className="text-xs text-brand-midnight/80 dark:text-brand-clean/80">
                        {registro.parcelas_pagas}/{registro.parcelas_totais} - Faltam {registro.parcelas_totais - registro.parcelas_pagas}
                      </p>
                    </div>
                  )}

                  {/* Etiquetas */}
                  {registro.etiquetas && registro.etiquetas.length > 0 && (
                    <div>
                      <p className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mb-1">Etiquetas</p>
                      <div className="flex flex-wrap gap-1">
                        {registro.etiquetas.map((tag, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua dark:text-brand-aqua text-[10px] rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações - apenas botão de marcar pago se for dívida */}
                  {registro.tipo === 'divida' && registro.parcelas_pagas < registro.parcelas_totais && (
                    <div className="pt-1 border-t border-brand-clean/20 dark:border-white/10">
                      <button
                        onClick={() => handleMarcarPago(registro.id)}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Marcar parcela como paga"
                      >
                        <CheckCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-royal dark:bg-brand-midnight border-b border-brand-midnight dark:border-white/10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Etiquetas
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Parcelas
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-display font-bold text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-brand-white dark:bg-brand-royal divide-y divide-brand-clean dark:divide-white/10">
                {registros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-brand-clean/50 dark:hover:bg-white/5 transition-smooth">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-brand-midnight dark:text-brand-clean">
                          {registro.nome}
                        </div>
                        {limparObservacao(registro.observacao) && (
                          <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1 line-clamp-1" title={limparObservacao(registro.observacao)}>
                            {limparObservacao(registro.observacao)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${tipoColors[registro.tipo]} dark:opacity-90`}
                      >
                        {tipoLabels[registro.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-brand-midnight dark:text-brand-clean" style={{ fontWeight: 900 }}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(registro.valor)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                        👤 {registro.user?.nome || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                        {registro.categoria || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {registro.etiquetas && registro.etiquetas.length > 0 ? (
                          registro.etiquetas.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua dark:text-brand-aqua text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-brand-midnight/40 dark:text-brand-clean/40">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {registro.parcelas_totais > 1 ? (
                        <div>
                          <div className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                            {registro.parcelas_pagas}/{registro.parcelas_totais}
                          </div>
                          <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                            Faltam {registro.parcelas_totais - registro.parcelas_pagas}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-brand-midnight/40 dark:text-brand-clean/40">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                        <div>{format(new Date(registro.data_registro), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}</div>
                        <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                          {format(new Date(registro.data_registro), "HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {registro.tipo === 'divida' && registro.parcelas_pagas < registro.parcelas_totais && (
                          <button
                            onClick={() => handleMarcarPago(registro.id)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Marcar parcela como paga"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => setRegistroEditando(registro)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-smooth"
                          title="Editar"
                        >
                          <Edit size={18} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleExcluir(registro.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-smooth"
                          title="Excluir"
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {registroEditando && (
        <ModalEditarRegistro
          registro={registroEditando}
          onClose={() => setRegistroEditando(null)}
        />
      )}

      {/* Modal de Confirmação para Excluir Registro */}
      {showModalExcluir && (
        <ModalConfirmacao
          titulo="Excluir Registro"
          mensagem="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
          onConfirmar={confirmarExcluir}
          onCancelar={() => {
            setShowModalExcluir(false)
            setRegistroParaExcluir(null)
          }}
          textoConfirmar="Excluir"
          tipo="danger"
        />
      )}
    </div>
  )
}

