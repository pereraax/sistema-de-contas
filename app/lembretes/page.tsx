'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import PlanoGuard from '@/components/PlanoGuard'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { createNotification } from '@/components/NotificationBell'
import { Loader2, Clock, CheckCircle2, XCircle, Calendar, Trash2, Search, Filter, AlertCircle, Sparkles, X, Plus, Pencil, User as UserIcon, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import ModalSelecionarUsuario from '@/components/ModalSelecionarUsuario'
import ModalSelecionarTipo from '@/components/ModalSelecionarTipo'
import { User } from '@/lib/types'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'

import { ptBR } from 'date-fns/locale/pt-BR'

interface Lembrete {
  id: string
  descricao: string
  data_lembrete: string
  horario: string | null
  status: 'pendente' | 'concluido' | 'cancelado'
  created_at: string
  valor?: number | null
  nota?: string | null
  user_id?: string | null
  tipo?: 'entrada' | 'saida' | null
}

export default function LembretesPage() {
  const router = useRouter()
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'concluido' | 'cancelado'>('todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lembreteToDelete, setLembreteToDelete] = useState<{ id: string; descricao: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [lembreteToEdit, setLembreteToEdit] = useState<Lembrete | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalUsuario, setShowModalUsuario] = useState(false)
  const [showModalUsuarioEdit, setShowModalUsuarioEdit] = useState(false)
  const [showModalTipo, setShowModalTipo] = useState(false)
  const [showModalTipoEdit, setShowModalTipoEdit] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(null)
  const [usuarioSelecionadoEdit, setUsuarioSelecionadoEdit] = useState<User | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [lembreteDetalhes, setLembreteDetalhes] = useState<Lembrete | null>(null)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [formData, setFormData] = useState({
    descricao: '',
    data_lembrete: new Date().toISOString().slice(0, 16),
    valor: '',
    nota: '',
    user_id: '',
    tipo: '' as 'entrada' | 'saida' | '',
  })
  const [editFormData, setEditFormData] = useState({
    descricao: '',
    data_lembrete: new Date().toISOString().slice(0, 16),
    valor: '',
    nota: '',
    user_id: '',
    tipo: '' as 'entrada' | 'saida' | '',
  })

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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setErrorMessage('Usuário não autenticado')
        setShowErrorModal(true)
        return
      }

      // Buscar o lembrete para obter valor e tipo
      const { data: lembrete, error: fetchError } = await supabase
        .from('lembretes')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !lembrete) {
        console.error('Erro ao buscar lembrete:', fetchError)
        setErrorMessage('Erro ao buscar lembrete')
        setShowErrorModal(true)
        return
      }

      // Atualizar status do lembrete
      const { error } = await supabase
        .from('lembretes')
        .update({ status: 'concluido' })
        .eq('id', id)

      if (error) {
        console.error('Erro ao marcar como concluído:', error)
        setErrorMessage('Erro ao marcar como concluído')
        setShowErrorModal(true)
        return
      }

      // Se o lembrete tiver valor e tipo, criar registro automaticamente
      if (lembrete.valor && lembrete.valor > 0 && lembrete.tipo && (lembrete.tipo === 'entrada' || lembrete.tipo === 'saida')) {
        try {
          console.log('📝 Criando registro do lembrete:', {
            valor: lembrete.valor,
            tipo: lembrete.tipo,
            user_id_lembrete: lembrete.user_id,
            account_owner_id: user.id
          })

          // Buscar o primeiro usuário da tabela users que pertence a este account_owner
          // Isso é necessário porque user_id precisa ser um id da tabela users, não do auth.users
          const { data: usuarios, error: usuariosError } = await supabase
            .from('users')
            .select('id')
            .eq('account_owner_id', user.id)
            .limit(1)
          
          let registroUserId: string | null = null

          if (usuariosError) {
            console.error('❌ Erro ao buscar usuários:', usuariosError)
          } else if (usuarios && usuarios.length > 0) {
            // Se o lembrete tem um user_id específico, verificar se ele pertence ao account_owner
            if (lembrete.user_id) {
              const { data: usuarioLembrete } = await supabase
                .from('users')
                .select('id')
                .eq('id', lembrete.user_id)
                .eq('account_owner_id', user.id)
                .single()
              
              if (usuarioLembrete) {
                registroUserId = usuarioLembrete.id
                console.log('✅ Usando user_id do lembrete:', registroUserId)
              } else {
                registroUserId = usuarios[0].id
                console.log('⚠️ User_id do lembrete não pertence ao account_owner, usando primeiro usuário:', registroUserId)
              }
            } else {
              registroUserId = usuarios[0].id
              console.log('✅ Usando primeiro usuário do account_owner:', registroUserId)
            }
          } else {
            console.error('❌ Nenhum usuário encontrado para o account_owner:', user.id)
            setErrorMessage('Nenhum usuário encontrado. Por favor, crie um usuário primeiro.')
            setShowErrorModal(true)
            return
          }

          // Verificar se temos um user_id válido
          if (!registroUserId) {
            console.error('❌ Não foi possível determinar o user_id para o registro')
            setErrorMessage('Erro ao criar registro: usuário não encontrado')
            setShowErrorModal(true)
            return
          }

          // Criar registro
          // IMPORTANTE: A tabela registros NÃO tem account_owner_id, apenas user_id
          // O account_owner_id está na tabela users, não em registros
          const novoRegistro: any = {
            user_id: registroUserId,
            nome: lembrete.descricao,
            tipo: lembrete.tipo,
            valor: lembrete.valor,
            data_registro: new Date().toISOString(),
            observacao: lembrete.nota || `Lembrete concluído: ${lembrete.descricao}`,
            categoria: null,
            etiquetas: [],
            parcelas_totais: 1,
            parcelas_pagas: 0,
          }

          console.log('📤 Enviando registro para o banco:', novoRegistro)

          const { data: registroCriado, error: registroError } = await supabase
            .from('registros')
            .insert([novoRegistro])
            .select()
            .single()

          if (registroError) {
            console.error('❌ Erro ao criar registro do lembrete:', registroError)
            setErrorMessage(`Lembrete concluído, mas houve um erro ao criar o registro: ${registroError.message}`)
            setShowErrorModal(true)
          } else if (registroCriado) {
            console.log('✅ Registro criado automaticamente do lembrete:', registroCriado)
            createNotification(
              `Registro de ${lembrete.tipo === 'entrada' ? 'entrada' : 'saída'} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lembrete.valor)} criado automaticamente!`,
              'success'
            )
            // Forçar atualização do cache e recarregar a página home
            router.refresh()
            // Aguardar um pouco e recarregar a página home se estiver aberta
            setTimeout(() => {
              if (window.location.pathname === '/home') {
                window.location.reload()
              }
            }, 500)
          }
        } catch (registroError) {
          console.error('Erro ao criar registro do lembrete:', registroError)
          // Não bloquear a conclusão do lembrete se falhar ao criar o registro
        }
      }

      carregarLembretes()
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error)
      setErrorMessage('Erro ao marcar como concluído')
      setShowErrorModal(true)
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

  const abrirModalEditar = async (lembrete: Lembrete) => {
    const dataLembrete = new Date(lembrete.data_lembrete)
    const dataFormatada = new Date(dataLembrete.getTime() - dataLembrete.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    // Formatar valor: multiplicar por 100 para converter para centavos, depois formatar
    let valorFormatado = ''
    if (lembrete.valor) {
      const valorCentavos = Math.round(lembrete.valor * 100)
      valorFormatado = formatarValorEmTempoReal(String(valorCentavos))
    }
    
    setLembreteToEdit(lembrete)
    setEditFormData({
      descricao: lembrete.descricao,
      data_lembrete: dataFormatada,
      valor: valorFormatado,
      nota: lembrete.nota || '',
      user_id: lembrete.user_id || '',
      tipo: lembrete.tipo || '',
    })
    
    // Carregar dados do usuário se houver user_id
    if (lembrete.user_id) {
      try {
        const { obterUsuarios } = await import('@/lib/actions')
        const result = await obterUsuarios()
        const user = result.data?.find(u => u.id === lembrete.user_id)
        if (user) {
          setUsuarioSelecionadoEdit(user)
        } else {
          setUsuarioSelecionadoEdit(null)
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        setUsuarioSelecionadoEdit(null)
      }
    } else {
      setUsuarioSelecionadoEdit(null)
    }
    
    setShowEditModal(true)
  }

  const fecharModalEditar = () => {
    setShowModalUsuarioEdit(false)
    setShowEditModal(false)
    setLembreteToEdit(null)
    setUsuarioSelecionadoEdit(null)
    setEditFormData({
      descricao: '',
      data_lembrete: new Date().toISOString().slice(0, 16),
      valor: '',
      nota: '',
      user_id: '',
      tipo: '',
    })
  }

  const carregarUsuarios = async () => {
    try {
      const { obterUsuarios } = await import('@/lib/actions')
      const result = await obterUsuarios()
      setUsuarios(result.data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUsuarios([])
    }
  }

  const abrirModalDetalhes = (lembrete: Lembrete) => {
    setLembreteDetalhes(lembrete)
    setShowDetailModal(true)
  }

  const fecharModalDetalhes = () => {
    setShowDetailModal(false)
    setLembreteDetalhes(null)
  }

  const salvarEdicao = async () => {
    if (!lembreteToEdit || !editFormData.descricao.trim()) {
      alert('Descrição é obrigatória')
      return
    }

    setEditing(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setErrorMessage('Usuário não autenticado')
        setShowErrorModal(true)
        return
      }

      // Converter data e hora
      const dataLembrete = new Date(editFormData.data_lembrete)
      
      // Extrair horário da data
      const horarioFinal = `${dataLembrete.getHours().toString().padStart(2, '0')}:${dataLembrete.getMinutes().toString().padStart(2, '0')}:00`
      
      // Converter valor formatado para número
      const valorNumerico = editFormData.valor ? converterValorFormatadoParaNumero(editFormData.valor) : null

      const updateData: any = {
        descricao: editFormData.descricao.trim(),
        data_lembrete: dataLembrete.toISOString(),
        horario: horarioFinal,
        nota: editFormData.nota.trim() || null,
        valor: valorNumerico,
      }
      
      // Se houver user_id selecionado, adicionar
      if (editFormData.user_id) {
        updateData.user_id = editFormData.user_id
      }
      
      // Adicionar tipo apenas se houver um valor válido
      if (editFormData.tipo && (editFormData.tipo === 'entrada' || editFormData.tipo === 'saida')) {
        updateData.tipo = editFormData.tipo
      } else {
        updateData.tipo = null
      }

      const { error } = await supabase
        .from('lembretes')
        .update(updateData)
        .eq('id', lembreteToEdit.id)

      if (error) {
        console.error('Erro ao editar lembrete:', error)
        setErrorMessage('Erro ao editar lembrete: ' + error.message)
        setShowErrorModal(true)
      } else {
        fecharModalEditar()
        carregarLembretes()
      }
    } catch (error: any) {
      console.error('Erro ao editar lembrete:', error)
      setErrorMessage('Erro ao editar lembrete: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setEditing(false)
    }
  }

  const criarLembrete = async () => {
    if (!formData.descricao.trim()) {
      setErrorMessage('Descrição é obrigatória')
      setShowErrorModal(true)
      return
    }

    setCreating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setErrorMessage('Usuário não autenticado')
        setShowErrorModal(true)
        return
      }

      // Converter data e hora
      const dataLembrete = new Date(formData.data_lembrete)
      
      // Extrair horário da data
      const horarioFinal = `${dataLembrete.getHours().toString().padStart(2, '0')}:${dataLembrete.getMinutes().toString().padStart(2, '0')}:00`
      
      // Converter valor formatado para número
      const valorNumerico = formData.valor ? converterValorFormatadoParaNumero(formData.valor) : null
      
      // user_id do lembrete: usar o selecionado ou null (mas não enviar se vazio)
      const insertData: any = {
        account_owner_id: user.id,
        descricao: formData.descricao.trim(),
        data_lembrete: dataLembrete.toISOString(),
        horario: horarioFinal,
        status: 'pendente',
        nota: formData.nota.trim() || null,
        valor: valorNumerico,
      }
      
      // Adicionar user_id apenas se houver um selecionado
      if (formData.user_id && formData.user_id.trim() !== '') {
        insertData.user_id = formData.user_id
      }
      
      // Adicionar tipo apenas se houver um valor válido
      if (formData.tipo && (formData.tipo === 'entrada' || formData.tipo === 'saida')) {
        insertData.tipo = formData.tipo
      }

      const { error } = await supabase
        .from('lembretes')
        .insert(insertData)

      if (error) {
        console.error('Erro ao criar lembrete:', error)
        alert('Erro ao criar lembrete: ' + error.message)
      } else {
        setShowCreateModal(false)
        setUsuarioSelecionado(null)
        setFormData({
          descricao: '',
          data_lembrete: new Date().toISOString().slice(0, 16),
          valor: '',
          nota: '',
          user_id: '',
          tipo: '',
        })
        carregarLembretes()
      }
    } catch (error: any) {
      console.error('Erro ao criar lembrete:', error)
      setErrorMessage('Erro ao criar lembrete: ' + error.message)
      setShowErrorModal(true)
    } finally {
      setCreating(false)
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

  useEffect(() => {
    carregarUsuarios()
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
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4 pb-24 sm:pb-28">
        <div className="max-w-7xl mx-auto">
          {/* Logotipo centralizado acima do header */}
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>

          {/* Header com notificações - Primeira linha */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <MenuButton />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {/* Título e botão - Segunda linha */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-brand-aqua to-blue-500 flex items-center justify-center shadow-md">
                <Clock className="text-white" size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none">
                Lembretes
              </h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Novo Lembrete</span>
              <span className="sm:hidden">Novo</span>
            </button>
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
                          onClick={() => abrirModalDetalhes(lembrete)}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-red-400 dark:border-red-500/50 hover:border-red-500 dark:hover:border-red-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer"
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
                            <div className="flex gap-2 mt-3 sm:mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalEditar(lembrete)}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <Pencil size={16} />
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
                          onClick={() => abrirModalDetalhes(lembrete)}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-blue-400 dark:border-blue-500/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer"
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
                            <div className="flex gap-2 mt-3 sm:mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalEditar(lembrete)}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <Pencil size={16} />
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
                          onClick={() => abrirModalDetalhes(lembrete)}
                          className="group relative bg-white dark:bg-brand-royal rounded-xl p-4 sm:p-5 shadow-lg border-2 border-purple-400 dark:border-purple-500/50 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer"
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
                            <div className="flex gap-2 mt-3 sm:mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalEditar(lembrete)}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <Pencil size={16} />
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
                            <div className="flex gap-2 mt-3 sm:mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => marcarComoConcluido(lembrete.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <CheckCircle2 size={16} />
                                Concluir
                              </button>
                              <button
                                onClick={() => abrirModalEditar(lembrete)}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <Pencil size={16} />
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
                          onClick={() => abrirModalDetalhes(lembrete)}
                          className="group relative bg-white/60 dark:bg-brand-royal/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-400/50 dark:border-green-500/30 opacity-80 hover:opacity-100 transition-all duration-300 cursor-pointer"
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
                                onClick={() => abrirModalEditar(lembrete)}
                                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => abrirModalDeletar(lembrete.id, lembrete.descricao)}
                                disabled={deletingId === lembrete.id}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-center max-w-md mb-6">
                    {searchTerm || filterStatus !== 'todos'
                      ? 'Tente ajustar os filtros ou a busca para encontrar lembretes.'
                      : 'Crie lembretes via WhatsApp enviando: "me lembre de [tarefa] [data] [horário]" ou clique no botão abaixo.'}
                  </p>
                  {(!searchTerm && filterStatus === 'todos') && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Plus size={20} />
                      Criar Lembrete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal de Criar Lembrete */}
          {showCreateModal && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
              onClick={() => {
                setShowCreateModal(false)
                setUsuarioSelecionado(null)
                setFormData({
                  descricao: '',
                  data_lembrete: new Date().toISOString().slice(0, 16),
                  valor: '',
                  nota: '',
                  user_id: '',
                  tipo: '',
                })
              }}
            >
              <div 
                className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slide-up border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                    Criar Lembrete
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setUsuarioSelecionado(null)
                      setFormData({
                        descricao: '',
                        data_lembrete: new Date().toISOString().slice(0, 16),
                        valor: '',
                        nota: '',
                        user_id: '',
                      })
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-brand-midnight dark:text-brand-clean" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Pagar conta de luz"
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg text-brand-midnight dark:text-brand-clean focus:outline-none focus:border-brand-aqua transition-smooth text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Usuário
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalUsuario(true)}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {usuarioSelecionado ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-brand-aqua/20 dark:bg-brand-aqua/30 flex items-center justify-center">
                              <span className="text-brand-aqua font-bold text-xs">
                                {usuarioSelecionado.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-brand-midnight dark:text-brand-clean text-sm">{usuarioSelecionado.nome}</span>
                          </>
                        ) : (
                          <>
                            <UserIcon size={16} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                            <span className="text-brand-midnight/50 dark:text-brand-clean/50 text-sm">Selecione um usuário</span>
                          </>
                        )}
                      </div>
                      <Plus size={16} className="text-brand-aqua" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                        Valor
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50 text-xs">
                          R$
                        </span>
                        <input
                          type="text"
                          value={formData.valor}
                          onChange={(e) => {
                            const formatted = formatarValorEmTempoReal(e.target.value)
                            setFormData({ ...formData, valor: formatted })
                          }}
                          placeholder="0,00"
                          className="w-full pl-7 pr-2 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                        Tipo
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowModalTipo(true)}
                        className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {formData.tipo === 'entrada' ? (
                            <>
                              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                              <span className="text-brand-midnight dark:text-brand-clean">Entrada</span>
                            </>
                          ) : formData.tipo === 'saida' ? (
                            <>
                              <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                              <span className="text-brand-midnight dark:text-brand-clean">Saída</span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4"></div>
                              <span className="text-brand-midnight/50 dark:text-brand-clean/50">Selecione...</span>
                            </>
                          )}
                        </div>
                        <ChevronDown size={16} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.data_lembrete}
                      onChange={(e) => setFormData({ ...formData, data_lembrete: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg text-brand-midnight dark:text-brand-clean focus:outline-none focus:border-brand-aqua transition-smooth text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Nota
                    </label>
                    <textarea
                      value={formData.nota}
                      onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                      rows={2}
                      placeholder="Observações sobre o lembrete..."
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={criarLembrete}
                    disabled={creating || !formData.descricao.trim()}
                    className="flex-1 px-4 py-3 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Criando...' : 'Criar Lembrete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Editar Lembrete */}
          {showEditModal && lembreteToEdit && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
              onClick={fecharModalEditar}
            >
              <div 
                className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slide-up border-2 border-brand-aqua/30 dark:border-brand-aqua/40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                    Editar Lembrete
                  </h2>
                  <button
                    onClick={fecharModalEditar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-brand-midnight dark:text-brand-clean" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Descrição *
                    </label>
                    <input
                      type="text"
                      value={editFormData.descricao}
                      onChange={(e) => setEditFormData({ ...editFormData, descricao: e.target.value })}
                      placeholder="Ex: Pagar conta de luz"
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg text-brand-midnight dark:text-brand-clean focus:outline-none focus:border-brand-aqua transition-smooth text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Usuário
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalUsuarioEdit(true)}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {usuarioSelecionadoEdit ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-brand-aqua/20 dark:bg-brand-aqua/30 flex items-center justify-center">
                              <span className="text-brand-aqua font-bold text-xs">
                                {usuarioSelecionadoEdit.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-brand-midnight dark:text-brand-clean text-sm">{usuarioSelecionadoEdit.nome}</span>
                          </>
                        ) : (
                          <>
                            <UserIcon size={16} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                            <span className="text-brand-midnight/50 dark:text-brand-clean/50 text-sm">Selecione um usuário</span>
                          </>
                        )}
                      </div>
                      <Plus size={16} className="text-brand-aqua" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                        Valor
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50 text-xs">
                          R$
                        </span>
                        <input
                          type="text"
                          value={editFormData.valor}
                          onChange={(e) => {
                            const formatted = formatarValorEmTempoReal(e.target.value)
                            setEditFormData({ ...editFormData, valor: formatted })
                          }}
                          placeholder="0,00"
                          className="w-full pl-7 pr-2 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                        Tipo
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowModalTipoEdit(true)}
                        className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {editFormData.tipo === 'entrada' ? (
                            <>
                              <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                              <span className="text-brand-midnight dark:text-brand-clean">Entrada</span>
                            </>
                          ) : editFormData.tipo === 'saida' ? (
                            <>
                              <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
                              <span className="text-brand-midnight dark:text-brand-clean">Saída</span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4"></div>
                              <span className="text-brand-midnight/50 dark:text-brand-clean/50">Selecione...</span>
                            </>
                          )}
                        </div>
                        <ChevronDown size={16} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      value={editFormData.data_lembrete}
                      onChange={(e) => setEditFormData({ ...editFormData, data_lembrete: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg text-brand-midnight dark:text-brand-clean focus:outline-none focus:border-brand-aqua transition-smooth text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Nota
                    </label>
                    <textarea
                      value={editFormData.nota}
                      onChange={(e) => setEditFormData({ ...editFormData, nota: e.target.value })}
                      rows={2}
                      placeholder="Observações sobre o lembrete..."
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={fecharModalEditar}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarEdicao}
                    disabled={editing || !editFormData.descricao.trim()}
                    className="flex-1 px-4 py-3 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editing ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ModalSelecionarUsuario
            isOpen={showModalUsuario}
            onClose={() => setShowModalUsuario(false)}
            onSelect={(user) => {
              setUsuarioSelecionado(user)
              setFormData({ ...formData, user_id: user.id })
            }}
            selectedUserId={formData.user_id}
          />

          <ModalSelecionarUsuario
            isOpen={showModalUsuarioEdit}
            onClose={() => setShowModalUsuarioEdit(false)}
            onSelect={(user) => {
              setUsuarioSelecionadoEdit(user)
              setEditFormData({ ...editFormData, user_id: user.id })
            }}
            selectedUserId={editFormData.user_id}
          />

          <ModalSelecionarTipo
            isOpen={showModalTipo}
            onClose={() => setShowModalTipo(false)}
            onSelect={(tipo) => {
              setFormData({ ...formData, tipo })
            }}
            selectedTipo={formData.tipo}
          />

          <ModalSelecionarTipo
            isOpen={showModalTipoEdit}
            onClose={() => setShowModalTipoEdit(false)}
            onSelect={(tipo) => {
              setEditFormData({ ...editFormData, tipo })
            }}
            selectedTipo={editFormData.tipo}
          />

          {/* Modal de Erro */}
          {showErrorModal && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[10001] flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setShowErrorModal(false)}
            >
              <div 
                className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-red-900/20 dark:via-red-800/20 dark:to-red-900/20 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slide-up border-2 border-red-400/30 dark:border-red-500/40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 dark:bg-red-500/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
                      <AlertCircle className="text-white" size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-1">
                        Erro
                      </h3>
                      <p className="text-sm text-brand-midnight/60 dark:text-brand-clean/60">
                        Ocorreu um problema
                      </p>
                    </div>
                    <button
                      onClick={() => setShowErrorModal(false)}
                      className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-all duration-200"
                    >
                      <XCircle className="text-brand-midnight dark:text-brand-clean" size={24} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4">
                      <p className="text-sm text-red-800 dark:text-red-300 font-medium leading-relaxed">
                        {errorMessage}
                      </p>
                      {errorMessage.includes('nota') || errorMessage.includes('valor') ? (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300">
                            <strong>Dica:</strong> Execute o script SQL <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">ADICIONAR-CAMPOS-LEMBRETES.sql</code> no Supabase para adicionar as colunas necessárias.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="w-full px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Entendi
                  </button>
                </div>
              </div>
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

          {/* Modal de Detalhes do Lembrete */}
          {showDetailModal && lembreteDetalhes && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={fecharModalDetalhes}
              ></div>
              <div className="relative bg-white dark:bg-brand-royal rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 dark:border-brand-midnight/50 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-brand-midnight dark:text-brand-clean">
                    Detalhes do Lembrete
                  </h2>
                  <button
                    onClick={fecharModalDetalhes}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-brand-midnight rounded-lg transition-colors"
                  >
                    <X size={24} className="text-brand-midnight dark:text-brand-clean" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Descrição */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                      Descrição
                    </label>
                    <p className="text-lg text-brand-midnight dark:text-brand-clean font-medium">
                      {lembreteDetalhes.descricao}
                    </p>
                  </div>

                  {/* Data e Hora */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Data
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-brand-aqua" size={18} />
                        <p className="text-brand-midnight dark:text-brand-clean">
                          {format(new Date(lembreteDetalhes.data_lembrete), 'dd-MM-yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Hora
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="text-brand-aqua" size={18} />
                        <p className="text-brand-midnight dark:text-brand-clean">
                          {lembreteDetalhes.horario || '10:00:00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Valor */}
                  {lembreteDetalhes.valor && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Valor
                      </label>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(lembreteDetalhes.valor)}
                      </p>
                    </div>
                  )}

                  {/* Tipo */}
                  {lembreteDetalhes.tipo && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Tipo
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        lembreteDetalhes.tipo === 'entrada'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {lembreteDetalhes.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </div>
                  )}

                  {/* Usuário */}
                  {lembreteDetalhes.user_id && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Usuário
                      </label>
                      <div className="flex items-center gap-2">
                        <UserIcon className="text-brand-aqua" size={18} />
                        <p className="text-brand-midnight dark:text-brand-clean">
                          {usuarios.find(u => u.id === lembreteDetalhes.user_id)?.nome || 'Usuário não encontrado'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Nota */}
                  {lembreteDetalhes.nota && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                        Nota
                      </label>
                      <p className="text-brand-midnight dark:text-brand-clean bg-gray-50 dark:bg-brand-midnight/50 p-3 rounded-lg">
                        {lembreteDetalhes.nota}
                      </p>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                      Status
                    </label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      lembreteDetalhes.status === 'concluido'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : lembreteDetalhes.status === 'cancelado'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {lembreteDetalhes.status === 'concluido' ? 'Concluído' : 
                       lembreteDetalhes.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-brand-midnight/50">
                  <button
                    onClick={() => {
                      fecharModalDetalhes()
                      abrirModalEditar(lembreteDetalhes)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Pencil size={18} />
                    Editar
                  </button>
                  {lembreteDetalhes.status === 'pendente' && (
                    <button
                      onClick={() => {
                        fecharModalDetalhes()
                        marcarComoConcluido(lembreteDetalhes.id)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <CheckCircle2 size={18} />
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
