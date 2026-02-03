'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@/lib/types'
import { obterUsuarios, criarUsuario, resetarTodosRegistros, atualizarImagemPerfilUsuario, atualizarImagemProprioPerfil } from '@/lib/actions'
import { Users, Plus, Edit, Trash2, X, User as UserIcon, LogOut, Key, Mail, Eye, EyeOff, AlertTriangle, RotateCcw, MessageCircle, Phone, Crown, Download, Smartphone, Share2, ArrowRight, Lightbulb, Copy, Check, Camera } from 'lucide-react'
import { createNotification } from './NotificationBell'
import { atualizarSenha, reenviarEmailConfirmacao, signOut, limparBypassEmailConfirmacao } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import ModalConfirmacao from './ModalConfirmacao'
import ModalConfirmarEmail from './ModalConfirmarEmail'

interface ConfiguracoesViewProps {
  tabAtivo: string
  initialProfileData?: {
    user: {
      id: string
      email: string
      email_confirmed_at: string | null
    }
    profile: any
    whatsappKey: string | null
  } | null
}

export default function ConfiguracoesView({ tabAtivo: tabInicial, initialProfileData }: ConfiguracoesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tabAtivo, setTabAtivo] = useState(tabInicial)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showNovoUsuario, setShowNovoUsuario] = useState(false)
  const [novoUsuarioNome, setNovoUsuarioNome] = useState('')
  const [editandoUsuario, setEditandoUsuario] = useState<User | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // Estados para perfil
  // Se tiver initialProfileData, começar sem loading para mostrar imediatamente
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(!initialProfileData)
  const [showRedefinirSenha, setShowRedefinirSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [loadingSenha, setLoadingSenha] = useState(false)
  const [showModalResetar, setShowModalResetar] = useState(false)
  const [loadingResetar, setLoadingResetar] = useState(false)
  const [confirmacaoResetar, setConfirmacaoResetar] = useState('')
  const [showModalLogout, setShowModalLogout] = useState(false)
  const [showModalExcluirUsuario, setShowModalExcluirUsuario] = useState(false)
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<User | null>(null)
  const [cpf, setCpf] = useState('')
  const [editandoCpf, setEditandoCpf] = useState(false)
  const [loadingCpf, setLoadingCpf] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [editandoWhatsapp, setEditandoWhatsapp] = useState(false)
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false)
  const [nome, setNome] = useState('')
  const [showModalEditarNome, setShowModalEditarNome] = useState(false)
  const [uploadingImagem, setUploadingImagem] = useState<string | null>(null)
  const [loadingNome, setLoadingNome] = useState(false)
  const [showModalVerificarEmail, setShowModalVerificarEmail] = useState(false)
  const [bypassLimpo, setBypassLimpo] = useState(false) // Flag para evitar limpar bypass múltiplas vezes
  const [carregandoPerfil, setCarregandoPerfil] = useState(false) // Flag para evitar múltiplos carregamentos simultâneos
  const [whatsappKey, setWhatsappKey] = useState<string | null>(null)
  const [loadingWhatsappKey, setLoadingWhatsappKey] = useState(false)
  const historyEntryAdded = useRef(false)
  const [showWhatsappKey, setShowWhatsappKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [uploadingOwnPhoto, setUploadingOwnPhoto] = useState(false)
  const photoPerfilRef = useRef<HTMLInputElement>(null)
  const [avatarCacheKey, setAvatarCacheKey] = useState(0)

  // Inicializar dados do perfil se fornecidos pelo servidor IMEDIATAMENTE (antes de qualquer loading)
  useEffect(() => {
    if (initialProfileData) {
      const { user, profile, whatsappKey } = initialProfileData
      
      // Montar estrutura de userProfile
      const profileData: any = {
        ...user,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at || null,
        profile: profile,
      }
      
      setUserProfile(profileData)
      setLoadingProfile(false)
      setCarregandoPerfil(false)
      
      // Carregar dados adicionais
      if (profile?.cpf) {
        setCpf(profile.cpf)
      }
      if (profile?.whatsapp) {
        setWhatsapp(profile.whatsapp)
      }
      if (whatsappKey) {
        setWhatsappKey(whatsappKey)
      }
      if (profile?.nome) {
        setNome(profile.nome)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'usuarios') {
      setTabAtivo('usuarios')
    } else if (tab === 'perfil') {
      setTabAtivo('perfil')
    } else if (tab === 'whatsapp') {
      setTabAtivo('whatsapp')
    } else {
      setTabAtivo('perfil') // Padrão agora é Perfil ao invés de Geral
    }
    carregarUsuarios()
    // NUNCA carregar perfil se já tiver initialProfileData do servidor
    // Carregar perfil apenas se não houver dados iniciais E não houver userProfile
    if (tab === 'perfil' && !initialProfileData && !userProfile && !userProfile?.error) {
      carregarPerfil()
    }
    // Carregar chave WhatsApp apenas se não foi fornecida pelo servidor e não existir
    if (tab === 'perfil' && !initialProfileData?.whatsappKey && !whatsappKey) {
      carregarWhatsappKey()
    }
  }, [searchParams, initialProfileData])
  
  // Função para carregar chave WhatsApp
  const carregarWhatsappKey = async () => {
    try {
      const response = await fetch('/api/user/whatsapp-key')
      const data = await response.json()
      if (data.success) {
        setWhatsappKey(data.whatsapp_key)
      }
    } catch (error) {
      console.error('Erro ao carregar chave WhatsApp:', error)
    }
  }

  // Listener de mudanças de autenticação
  useEffect(() => {
    const supabase = createClient()
    let userUpdatedTimeout: NodeJS.Timeout | null = null
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email || 'no user')
      
      // Limpar timeout anterior se existir
      if (userUpdatedTimeout) {
        clearTimeout(userUpdatedTimeout)
        userUpdatedTimeout = null
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Usuário autenticado, recarregando perfil...')
        // Só recarregar se estiver na aba de perfil
        if (tabAtivo === 'perfil') {
          carregarPerfil()
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário deslogado')
        setUserProfile(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refresh acontece frequentemente - não recarregar automaticamente
        console.log('🔄 Token atualizado (não recarregando perfil automaticamente)')
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('🔄 Usuário atualizado (possível confirmação de email)')
        // Só recarregar se estiver na aba de perfil e não estiver carregando
        // Usar um delay maior e verificação mais rigorosa para evitar loops
        if (tabAtivo === 'perfil' && !carregandoPerfil && !loadingProfile) {
          userUpdatedTimeout = setTimeout(() => {
            // Verificar novamente antes de recarregar
            if (tabAtivo === 'perfil' && !carregandoPerfil && !loadingProfile) {
              console.log('🔄 Recarregando perfil após USER_UPDATED...')
              carregarPerfil()
            }
            userUpdatedTimeout = null
          }, 2000) // Aumentar delay para 2 segundos
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      if (userUpdatedTimeout) {
        clearTimeout(userUpdatedTimeout)
      }
    }
  }, [tabAtivo, carregandoPerfil, loadingProfile])

  // Recarregar perfil quando a aba de perfil for ativada
  // CRÍTICO: NÃO recarregar se já tiver initialProfileData do servidor
  useEffect(() => {
    if (tabAtivo === 'perfil' && !initialProfileData && !userProfile && !loadingProfile && !carregandoPerfil) {
      console.log('🔄 Recarregando perfil porque está na aba perfil e não há userProfile nem initialProfileData')
      carregarPerfil()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabAtivo, initialProfileData]) // Adicionar initialProfileData para evitar recarregamento

  // Debug: monitorar mudanças no userProfile
  useEffect(() => {
    console.log('🔍 userProfile mudou:', {
      exists: !!userProfile,
      email: userProfile?.email,
      emailConfirmed: userProfile?.email_confirmed_at,
      hasProfile: !!userProfile?.profile,
      loading: loadingProfile
    })
  }, [userProfile, loadingProfile])

  // Bloquear scroll do body quando modais estiverem abertos
  useEffect(() => {
    const hasOpenModal = showModalResetar || showModalLogout || showModalExcluirUsuario || showRedefinirSenha || showModalEditarNome
    
    if (hasOpenModal) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurar o scroll quando o modal fechar
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    // Cleanup: garantir que o scroll seja restaurado quando o componente desmontar
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [showModalResetar, showModalLogout, showModalExcluirUsuario, showRedefinirSenha, showModalEditarNome])

  // Detectar botão "voltar" do navegador e fechar modais
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Fechar todos os modais quando o usuário clicar em "voltar"
      if (showModalResetar) {
        setShowModalResetar(false)
        setConfirmacaoResetar('')
      }
      if (showModalLogout) {
        setShowModalLogout(false)
      }
      if (showModalExcluirUsuario) {
        setShowModalExcluirUsuario(false)
        setUsuarioParaExcluir(null)
      }
      if (showRedefinirSenha) {
        setShowRedefinirSenha(false)
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
      }
      if (showModalEditarNome) {
        setShowModalEditarNome(false)
        setNome(userProfile?.profile?.nome || userProfile?.email?.split('@')[0] || 'Usuário')
      }
      // Resetar a flag quando o modal fechar via popstate
      historyEntryAdded.current = false
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [showModalResetar, showModalLogout, showModalExcluirUsuario, showRedefinirSenha, showModalEditarNome, userProfile])

  // Adicionar entrada no histórico quando modais abrirem
  useEffect(() => {
    const hasOpenModal = showModalResetar || showModalLogout || showModalExcluirUsuario || showRedefinirSenha || showModalEditarNome
    
    if (hasOpenModal && !historyEntryAdded.current) {
      // Adicionar uma entrada no histórico quando o modal abrir pela primeira vez
      window.history.pushState({ modalOpen: true }, '')
      historyEntryAdded.current = true
    } else if (!hasOpenModal && historyEntryAdded.current) {
      // Resetar a flag quando todos os modais fecharem
      historyEntryAdded.current = false
    }
  }, [showModalResetar, showModalLogout, showModalExcluirUsuario, showRedefinirSenha, showModalEditarNome])
  
  const carregarPerfil = async () => {
    // Evitar múltiplos carregamentos simultâneos
    if (carregandoPerfil) {
      console.log('⚠️ Carregamento de perfil já em andamento, ignorando...')
      return
    }
    
    setCarregandoPerfil(true)
    setLoadingProfile(true)
    try {
      const supabase = createClient()
      
      // Tentar getSession primeiro (mais confiável para verificar se há sessão ativa)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('✅ Sessão encontrada via getSession:', session.user.email)
        await continuarCarregamentoPerfil(session.user, supabase)
        return
      }
      
      // Se getSession não retornou sessão, tentar getUser
      console.log('⚠️ getSession não retornou sessão, tentando getUser...')
      if (sessionError) {
        console.log('⚠️ Erro no getSession:', sessionError.message)
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError.message)
        // Se o erro for de sessão, mostrar erro e parar
        if (userError.message.includes('session missing') || userError.message.includes('Auth session missing')) {
          console.log('⚠️ Sessão não encontrada - parando tentativas de recarregar')
          // Definir erro de sessão e parar completamente
          setUserProfile({
            error: 'session_missing',
            message: 'Sessão não encontrada. Por favor, faça login novamente ou tente recarregar a página.'
          })
          setLoadingProfile(false)
          setCarregandoPerfil(false)
          // IMPORTANTE: Não tentar recarregar automaticamente
          return
        }
        setUserProfile({
          error: 'load_failed',
          message: userError.message || 'Erro ao carregar perfil'
        })
        setLoadingProfile(false)
        setCarregandoPerfil(false)
        return
      }
      
      if (!user || !user.email) {
        console.error('❌ Usuário não encontrado ou sem email')
        setUserProfile({
          error: 'user_not_found',
          message: 'Usuário não encontrado. Por favor, faça login novamente.'
        })
        setLoadingProfile(false)
        setCarregandoPerfil(false)
        return
      }
      
      console.log('✅ Usuário encontrado via getUser:', user.email)
      await continuarCarregamentoPerfil(user, supabase)
    } catch (error: any) {
      console.error('❌ Erro inesperado ao carregar perfil:', error)
      setUserProfile({
        error: 'unexpected_error',
        message: error.message || 'Erro inesperado ao carregar perfil'
      })
      setLoadingProfile(false)
      setCarregandoPerfil(false)
    }
  }
  
  const continuarCarregamentoPerfil = async (user: any, supabase: any) => {
    try {
      console.log('✅ Carregando perfil para usuário:', user.email, user.id)
      
      // Verificar se o email está definido - se não estiver, pode ser problema de sessão
      if (!user.email) {
        console.error('❌ Usuário sem email - pode ser problema de sessão')
        setUserProfile({
          error: 'user_incomplete',
          message: 'Dados do usuário incompletos. Por favor, faça login novamente.'
        })
        setLoadingProfile(false)
        return
      }
      
      // Sempre definir userProfile com dados básicos do usuário
      let profileData: any = {
        ...user,
        email: user.email || '',
        email_confirmed_at: user.email_confirmed_at || null,
        profile: null
      }
      
      // Tentar buscar perfil completo do USUÁRIO ATUAL (CRÍTICO: sempre filtrar por user.id)
      try {
        console.log('🔍 Buscando perfil para user.id:', user.id)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id) // CRÍTICO: Sempre buscar pelo ID do usuário autenticado
          .maybeSingle() // Usar maybeSingle para evitar erro se não existir
        
        if (profileError) {
          console.error('⚠️ Erro ao buscar perfil:', profileError)
          // Continuar mesmo com erro
        } else if (profile) {
          // Verificar se o perfil pertence ao usuário correto
          if (profile.id !== user.id) {
            console.error('❌ ERRO CRÍTICO: Perfil encontrado não pertence ao usuário atual!', {
              profileId: profile.id,
              userId: user.id
            })
            setUserProfile({
              error: 'data_mismatch',
              message: 'Erro: Dados de perfil não correspondem ao usuário atual. Por favor, faça logout e login novamente.'
            })
            setLoadingProfile(false)
            return
          }
          
          console.log('✅ Perfil encontrado e validado para o usuário:', user.id, {
            email: profile.email,
            plano: profile.plano,
            nome: profile.nome
          })
          
          // Se encontrou o perfil, adicionar aos dados
          profileData.profile = profile
          
          // Garantir que o plano seja válido (se for null ou inválido, usar 'teste')
          if (!profile.plano || !['teste', 'basico', 'premium'].includes(profile.plano)) {
            console.warn('⚠️ Plano inválido no perfil, usando "teste" como padrão')
            profileData.profile.plano = 'teste'
          }
          
          // Carregar CPF se existir
          if (profile.cpf) {
            setCpf(profile.cpf)
          }
          // Carregar WhatsApp se existir
          if (profile.whatsapp) {
            setWhatsapp(profile.whatsapp)
          }
          
          // Carregar chave WhatsApp se existir
          if (profile.whatsapp_key) {
            setWhatsappKey(profile.whatsapp_key)
          } else {
            setWhatsappKey(null)
          }
          // Carregar nome se existir
          if (profile.nome) {
            setNome(profile.nome)
          }
        } else {
          console.log('ℹ️ Perfil ainda não criado na tabela profiles - isso é normal para novos usuários')
          // Para novos usuários, definir plano padrão como 'teste'
          profileData.profile = {
            id: user.id,
            email: user.email || '',
            nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
            plano: 'teste',
            plano_status: null
          }
        }
      } catch (profileError: any) {
        console.error('⚠️ Erro ao buscar perfil da tabela:', profileError)
        // Continuar mesmo se houver erro ao buscar perfil
      }
      
      // IMPORTANTE: Verificar o valor real de email_confirmed_at
      // Quando confirmação de email está habilitada, só deve ter valor se realmente foi confirmado
      const emailConfirmedAt = user.email_confirmed_at
      const createdAt = user.created_at
      
      console.log('🔍 Verificando email_confirmed_at do usuário:', {
        valorOriginal: emailConfirmedAt,
        tipo: typeof emailConfirmedAt,
        isNull: emailConfirmedAt === null,
        isUndefined: emailConfirmedAt === undefined,
        createdAt: createdAt,
        emailConfirmedAt: emailConfirmedAt
      })
      
      // SIMPLES: Se email_confirmed_at existe e não é null, está confirmado
      // Não importa quando foi confirmado - se existe, foi confirmado via link do email
      const emailConfirmedFinal = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== '' 
        ? emailConfirmedAt 
        : null
      
      console.log('🔍 Resultado final do email_confirmed_at:', {
        valorOriginal: emailConfirmedAt,
        valorFinal: emailConfirmedFinal,
        isConfirmed: !!emailConfirmedFinal
      })
      
      // Garantir estrutura correta do objeto
      // CRÍTICO: created_at deve SEMPRE vir do user, não do profile
      const finalProfileData = {
        id: profileData.id,
        email: profileData.email || '',
        email_confirmed_at: emailConfirmedFinal, // Já processado (null se bypass)
        created_at: user.created_at, // SEMPRE usar user.created_at
        updated_at: profileData.updated_at,
        profile: profileData.profile || null
      }
      
      console.log('🔍 Dados finais do perfil:', {
        email: finalProfileData.email,
        email_confirmed_at: finalProfileData.email_confirmed_at,
        created_at: finalProfileData.created_at,
        isConfirmed: !!finalProfileData.email_confirmed_at,
        userCreatedAt: user.created_at,
        userEmailConfirmedAt: user.email_confirmed_at
      })
      
      // Forçar refresh da sessão para garantir estado atualizado
      try {
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('⚠️ Erro ao fazer refresh da sessão:', refreshError)
        } else {
          console.log('✅ Sessão atualizada com sucesso')
        }
      } catch (refreshException) {
        console.warn('⚠️ Exceção ao fazer refresh da sessão:', refreshException)
      }
      
      console.log('✅ Definindo userProfile:', {
        email: finalProfileData.email,
        hasProfile: !!finalProfileData.profile,
        emailConfirmed: !!finalProfileData.email_confirmed_at,
        emailConfirmedAtValue: finalProfileData.email_confirmed_at,
        userId: finalProfileData.id
      })
      
      setUserProfile(finalProfileData)
      setLoadingProfile(false)
      setCarregandoPerfil(false)
    } catch (error: any) {
      console.error('❌ Erro ao continuar carregamento:', error)
      setUserProfile(null)
      setLoadingProfile(false)
      setCarregandoPerfil(false)
    }
  }

  const carregarUsuarios = async () => {
    const result = await obterUsuarios()
    if (result.data) {
      setUsuarios(result.data)
    }
  }

  // Lista para exibição: sempre incluir o dono da conta no topo se não estiver na tabela users
  const usuariosParaExibir = useMemo(() => {
    if (!userProfile?.id) return usuarios
    const donoJaEstaNaLista = usuarios.some((u) => u.id === userProfile.id)
    if (donoJaEstaNaLista) return usuarios
    const dono: User = {
      id: userProfile.id,
      nome: userProfile.profile?.nome?.trim() || userProfile.email?.split('@')[0] || 'Você (dono da conta)',
      created_at: (userProfile as any).created_at || new Date().toISOString(),
      imagem_url: userProfile.profile?.imagem_url,
    }
    return [dono, ...usuarios]
  }, [usuarios, userProfile])

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
      // Recarregar usuários e atualizar a lista
      await carregarUsuarios()
      // Se não estava na aba de usuários, mudar para ela
      if (tabAtivo !== 'usuarios') {
        setTabAtivo('usuarios')
        router.push('/configuracoes?tab=usuarios')
      }
      setNovoUsuarioNome('')
      setShowNovoUsuario(false)
    }
    setLoading(false)
  }

  const handleUploadImagem = async (userId: string, file: File) => {
    setUploadingImagem(userId)
    
    try {
      // Fazer upload da imagem
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'perfis')
      uploadFormData.append('bucket', 'avatares') // Usar bucket específico para avatares

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok || uploadData.error) {
        // Mensagem mais clara se o bucket não existir
        if (uploadData.error?.includes('Bucket') && uploadData.error?.includes('not found')) {
          throw new Error('Bucket "avatares" não encontrado. Por favor, crie o bucket no Supabase Storage (Dashboard > Storage > New bucket, nome: "avatares", público: sim).')
        }
        throw new Error(uploadData.error || 'Erro ao fazer upload da imagem')
      }

      console.log('📤 [Upload] Upload concluído, URL recebida:', uploadData.url)
      
      // Atualizar o usuário com a URL da imagem
      const result = await atualizarImagemPerfilUsuario(userId, uploadData.url)

      if (result.error) {
        console.error('❌ [Upload] Erro ao atualizar no banco:', result.error)
        createNotification('Erro ao atualizar imagem: ' + result.error, 'warning')
      } else {
        console.log('✅ [Upload] Imagem atualizada no banco:', result.data)
        createNotification('Imagem de perfil atualizada com sucesso!', 'success')
        // Atualizar o estado do usuário sendo editado se estiver no modal
        if (editandoUsuario && editandoUsuario.id === userId) {
          setEditandoUsuario({ ...editandoUsuario, imagem_url: uploadData.url })
        }
        await carregarUsuarios()
        
        // Verificar se a imagem foi carregada corretamente
        const usuariosAtualizados = await obterUsuarios()
        const usuarioAtualizado = usuariosAtualizados.data?.find(u => u.id === userId)
        console.log('🔍 [Upload] Usuário após recarregar:', usuarioAtualizado)
        if (usuarioAtualizado) {
          console.log('🔍 [Upload] imagem_url do usuário:', usuarioAtualizado.imagem_url)
        }
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error)
      createNotification('Erro ao fazer upload da imagem: ' + (error.message || 'Erro desconhecido'), 'warning')
    } finally {
      setUploadingImagem(null)
    }
  }

  // Função para validar senha
  const validarSenha = (senha: string): string[] => {
    const errors: string[] = []
    
    if (senha.length < 8) {
      errors.push('pelo menos 8 caracteres')
    }
    if (!/[A-Z]/.test(senha)) {
      errors.push('uma letra maiúscula')
    }
    if (!/[a-z]/.test(senha)) {
      errors.push('uma letra minúscula')
    }
    if (!/[0-9]/.test(senha)) {
      errors.push('um número')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      errors.push('um caractere especial (!@#$%...)')
    }
    
    return errors
  }

  // Verificar requisitos da senha em tempo real
  const requisitosSenha = {
    minimo: novaSenha.length >= 8,
    maiuscula: /[A-Z]/.test(novaSenha),
    minuscula: /[a-z]/.test(novaSenha),
    numero: /[0-9]/.test(novaSenha),
    especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha),
  }
  
  const senhaValida = Object.values(requisitosSenha).every(Boolean)

  const handleRedefinirSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      createNotification('Preencha todos os campos', 'warning')
      return
    }

    // Validação de senha mais robusta
    const senhaErrors = validarSenha(novaSenha)
    if (senhaErrors.length > 0) {
      createNotification('A nova senha não atende aos requisitos. Verifique as regras abaixo.', 'warning')
      return
    }

    if (novaSenha !== confirmarSenha) {
      createNotification('As senhas não coincidem', 'warning')
      return
    }

    setLoadingSenha(true)
    const result = await atualizarSenha(senhaAtual, novaSenha)
    
    if (result.error) {
      createNotification('Erro: ' + result.error, 'warning')
    } else {
      createNotification('Senha atualizada com sucesso!', 'success')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setShowRedefinirSenha(false)
    }
    setLoadingSenha(false)
  }

  const handleReenviarEmail = async () => {
    if (!userProfile?.email) {
      createNotification('Email não encontrado', 'warning')
      return
    }

    setLoading(true)
    const result = await reenviarEmailConfirmacao()
    
    if (result.error) {
      createNotification('Erro: ' + result.error, 'warning')
      setLoading(false)
    } else {
      createNotification('Código reenviado! Verifique sua caixa de entrada e spam.', 'success')
      setLoading(false)
      // Abrir modal de verificação após reenviar
      setShowModalVerificarEmail(true)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      createNotification('Logout realizado com sucesso!', 'success')
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      createNotification('Erro ao fazer logout', 'warning')
    }
  }

  const handleResetarRegistros = async () => {
    if (confirmacaoResetar !== 'RESETAR') {
      createNotification('Digite "RESETAR" para confirmar', 'warning')
      return
    }

    setLoadingResetar(true)
    const result = await resetarTodosRegistros()
    
    if (result.error) {
      createNotification('Erro ao resetar registros: ' + result.error, 'warning')
    } else {
      createNotification('Todos os registros foram resetados com sucesso!', 'success')
      setShowModalResetar(false)
      setConfirmacaoResetar('')
      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    setLoadingResetar(false)
  }

  // Aba "Usuários/Pessoas" sempre visível - cada conta vê apenas seus próprios usuários/pessoas
  const tabs = [
    { id: 'usuarios', label: 'Usuários/Pessoas', icon: Users },
    { id: 'perfil', label: 'Perfil', icon: UserIcon },
    { id: 'baixar', label: 'Baixar Plataforma', icon: Download },
  ]

  return (
    <div className="bg-brand-white dark:bg-brand-royal rounded-2xl shadow-lg border border-brand-clean dark:border-white/10 overflow-hidden">
      {/* Tabs com scroll horizontal */}
      <div className="border-b border-brand-clean overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTabAtivo(tab.id)
                  router.push(`/configuracoes?tab=${tab.id}`)
                }}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-smooth whitespace-nowrap flex-shrink-0 ${
                  tabAtivo === tab.id
                    ? 'bg-brand-aqua/10 text-brand-aqua border-b-2 border-brand-aqua'
                    : 'text-brand-midnight dark:text-white/80 hover:text-brand-midnight dark:hover:text-white hover:bg-brand-clean dark:bg-brand-royal/50'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">

        {tabAtivo === 'perfil' && (
          <div className="space-y-6">
            {loadingProfile ? (
              <div className="text-center py-12">
                <p className="text-brand-midnight dark:text-brand-clean/60">Carregando perfil...</p>
              </div>
            ) : userProfile?.error ? (
              <div className="bg-brand-royal/30 dark:bg-brand-royal/20 rounded-xl p-6 border border-red-500/30">
                <div className="text-center space-y-4">
                  <AlertTriangle className="mx-auto text-red-500 dark:text-red-400" size={48} strokeWidth={2} />
                  <h3 className="text-xl font-semibold text-brand-midnight dark:text-brand-clean">
                    Erro ao carregar perfil
                  </h3>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70">
                    {userProfile.message || 'Não foi possível carregar suas informações do perfil.'}
                  </p>
                  {userProfile.error === 'session_missing' && (
                    <p className="text-sm text-brand-midnight/60 dark:text-brand-clean/60">
                      Sua sessão pode ter expirado. Por favor, faça login novamente.
                    </p>
                  )}
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => carregarPerfil()}
                      className="px-6 py-2.5 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium"
                    >
                      Tentar Novamente
                    </button>
                    {userProfile.error === 'session_missing' && (
                      <button
                        onClick={() => {
                          signOut().then(() => {
                            window.location.href = '/login'
                          })
                        }}
                        className="px-6 py-2.5 bg-brand-midnight dark:bg-brand-royal text-white rounded-lg hover:opacity-90 transition-smooth font-medium"
                      >
                        Fazer Login
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : userProfile ? (
              <>
                {/* Informações do Perfil */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
                      Informações do Perfil
                    </h2>
                    
                    <div className="bg-white dark:bg-brand-royal/30 rounded-xl p-6 space-y-5 border border-gray-200 dark:border-brand-aqua/20 shadow-sm">
                      {/* Avatar (com coroa = dono da conta) e Nome */}
                      <div className="flex items-center gap-4 pb-4 border-b border-brand-midnight/10 dark:border-white/10">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative">
                            {/* Ícone de coroa acima do avatar = dono da conta */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 shadow-md" title="Dono da conta">
                              <Crown size={14} className="text-amber-900" strokeWidth={2.5} />
                            </div>
                            <div className="w-16 h-16 rounded-full bg-brand-aqua/20 flex items-center justify-center overflow-hidden border-2 border-brand-aqua/30">
                              {userProfile.profile?.imagem_url ? (
                                <img
                                  src={`/api/user/avatar?t=${avatarCacheKey}`}
                                  alt={userProfile.profile?.nome || 'Perfil'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      const inicial = (userProfile.profile?.nome || userProfile.email || 'U').charAt(0).toUpperCase()
                                      const span = document.createElement('span')
                                      span.className = 'text-brand-aqua font-bold text-2xl'
                                      span.textContent = inicial
                                      parent.appendChild(span)
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-brand-aqua font-bold text-2xl">
                                  {(userProfile.profile?.nome || userProfile.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <input
                              ref={photoPerfilRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const maxSize = 2 * 1024 * 1024 // 2MB
                                if (file.size > maxSize) {
                                  createNotification('A imagem ultrapassou o limite. Use uma foto com menos de 2MB.', 'warning')
                                  e.target.value = ''
                                  return
                                }
                                setUploadingOwnPhoto(true)
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('folder', 'perfis')
                                  formData.append('bucket', 'avatares')
                                  const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
                                  const data = await res.json().catch(() => ({}))
                                  if (!res.ok) throw new Error(data?.error || `Erro no upload (${res.status})`)
                                  const url = data?.url
                                  if (!url) throw new Error('Upload retornou sem URL da imagem.')
                                  const result = await atualizarImagemProprioPerfil(url)
                                  if (result.error) throw new Error(result.error)
                                  setUserProfile(prev => ({
                                    ...prev,
                                    profile: { ...(prev.profile || {}), imagem_url: data.url }
                                  }))
                                  setAvatarCacheKey(Date.now())
                                  createNotification('Foto de perfil atualizada!', 'success')
                                  await carregarPerfil()
                                } catch (err: any) {
                                  createNotification(err?.message || 'Erro ao adicionar foto', 'warning')
                                } finally {
                                  setUploadingOwnPhoto(false)
                                  e.target.value = ''
                                }
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => photoPerfilRef.current?.click()}
                            disabled={uploadingOwnPhoto}
                            className="text-xs font-medium text-brand-aqua hover:text-brand-aqua/80 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingOwnPhoto ? 'Enviando...' : 'Adicionar foto'}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-brand-midnight dark:text-brand-clean">
                              {userProfile.profile?.nome || userProfile.email?.split('@')[0] || 'Usuário'}
                            </p>
                            <button
                              onClick={() => {
                                setNome(userProfile.profile?.nome || userProfile.email?.split('@')[0] || 'Usuário')
                                setShowModalEditarNome(true)
                              }}
                              className="p-1.5 text-brand-aqua hover:text-brand-aqua/80 hover:bg-brand-aqua/10 rounded-lg transition-smooth"
                              title="Editar nome"
                            >
                              <Edit size={18} strokeWidth={2} />
                            </button>
                          </div>
                          <p className="text-sm text-brand-midnight dark:text-brand-clean/60 break-words">{userProfile.email || 'Email não disponível'}</p>
                          <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/50 mt-1">
                            O usuário <span className="font-medium text-brand-midnight dark:text-brand-clean/80">{userProfile.profile?.nome || userProfile.email?.split('@')[0] || 'Usuário'}</span> é dono dessa conta.
                          </p>
                        </div>
                      </div>

                      {/* Informações - uma por linha, organizadas verticalmente */}
                      <div className="space-y-4">
                        {/* Email confirmado */}
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">Email confirmado:</span>
                          <div className="flex items-center gap-3">
                            {(() => {
                              // CRÍTICO: O userProfile.email_confirmed_at já foi processado na função continuarCarregamentoPerfil
                              // Se for null, significa que foi detectado como bypass ou não está confirmado
                              // SEMPRE usar o valor já processado, não reprocessar aqui
                              
                              const emailConfirmedAt = userProfile.email_confirmed_at
                              const isConfirmed = !!emailConfirmedAt
                              
                              console.log('🔍 Renderização - Status de confirmação:', {
                                emailConfirmedAt,
                                isConfirmed,
                                tipo: typeof emailConfirmedAt,
                                valorBruto: userProfile.email_confirmed_at
                              })
                              
                              return (
                                <>
                                  <span className={`font-medium ${isConfirmed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {isConfirmed ? '✓ Confirmado' : '✗ Não confirmado'}
                                  </span>
                                  {!isConfirmed && (
                                    <button
                                      onClick={() => setShowModalVerificarEmail(true)}
                                      className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm"
                                    >
                                      Verificar agora
                                    </button>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">WhatsApp:</span>
                          {editandoWhatsapp ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={whatsapp}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  if (value.length <= 10) {
                                    const formatted = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                                    setWhatsapp(formatted)
                                  } else if (value.length <= 11) {
                                    const formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                                    setWhatsapp(formatted)
                                  } else {
                                    setWhatsapp(value.slice(0, 11))
                                  }
                                }}
                                placeholder="(00) 00000-0000"
                                maxLength={14}
                                className="px-3 py-2 bg-white dark:bg-brand-midnight border border-brand-aqua rounded-lg text-brand-midnight dark:text-brand-clean text-sm w-full focus:outline-none focus:border-brand-aqua"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    setLoadingWhatsapp(true)
                                    try {
                                      const supabase = createClient()
                                      const { data: { user } } = await supabase.auth.getUser()
                                      if (user) {
                                        const whatsappLimpo = whatsapp.replace(/\D/g, '')
                                        if (whatsappLimpo.length < 10) {
                                          createNotification('WhatsApp inválido. Digite um número válido.', 'warning')
                                          setLoadingWhatsapp(false)
                                          return
                                        }
                                        
                                        const { error } = await supabase
                                          .from('profiles')
                                          .update({ 
                                            whatsapp: whatsappLimpo,
                                            whatsapp_editado: true
                                          })
                                          .eq('id', user.id)
                                        
                                        if (error) {
                                          createNotification('Erro ao salvar WhatsApp: ' + error.message, 'warning')
                                        } else {
                                          createNotification('WhatsApp salvo com sucesso!', 'success')
                                          setEditandoWhatsapp(false)
                                          carregarPerfil()
                                        }
                                      }
                                    } catch (error: any) {
                                      createNotification('Erro ao salvar WhatsApp', 'warning')
                                    } finally {
                                      setLoadingWhatsapp(false)
                                    }
                                  }}
                                  disabled={loadingWhatsapp || !whatsapp.replace(/\D/g, '').match(/^\d{10,13}$/)}
                                  className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingWhatsapp ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditandoWhatsapp(false)
                                    setWhatsapp(userProfile.profile?.whatsapp || '')
                                  }}
                                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-smooth font-medium text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-brand-midnight dark:text-brand-clean">
                                {userProfile.profile?.whatsapp 
                                  ? (() => {
                                      const whatsappLimpo = userProfile.profile.whatsapp.replace(/\D/g, '')
                                      if (whatsappLimpo.length === 11) {
                                        return whatsappLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                                      } else if (whatsappLimpo.length === 10) {
                                        return whatsappLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                                      }
                                      return userProfile.profile.whatsapp
                                    })()
                                  : 'Não informado'}
                              </span>
                              {!userProfile.profile?.whatsapp_editado && (
                                <button
                                  onClick={() => {
                                    const whatsappAtual = userProfile.profile?.whatsapp || ''
                                    // Formatar o WhatsApp ao carregar para edição
                                    if (whatsappAtual) {
                                      const whatsappLimpo = whatsappAtual.replace(/\D/g, '')
                                      if (whatsappLimpo.length === 11) {
                                        setWhatsapp(whatsappLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'))
                                      } else if (whatsappLimpo.length === 10) {
                                        setWhatsapp(whatsappLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'))
                                      } else {
                                        setWhatsapp(whatsappAtual)
                                      }
                                    } else {
                                      setWhatsapp('')
                                    }
                                    setEditandoWhatsapp(true)
                                  }}
                                  className="text-brand-aqua hover:text-brand-aqua/80 transition-smooth font-medium text-sm underline"
                                >
                                  {userProfile.profile?.whatsapp ? 'Editar' : 'Adicionar'}
                                </button>
                              )}
                              {userProfile.profile?.whatsapp_editado && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  (Já editado)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Telefone */}
                        {userProfile.profile?.telefone && (
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">Telefone:</span>
                            <span className="text-brand-midnight dark:text-brand-clean">{userProfile.profile.telefone}</span>
                          </div>
                        )}

                        {/* CPF */}
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">CPF:</span>
                          {editandoCpf ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={cpf}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  if (value.length <= 11) {
                                    const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                                    setCpf(formatted)
                                  }
                                }}
                                placeholder="000.000.000-00"
                                maxLength={14}
                                className="px-3 py-2 bg-white dark:bg-brand-midnight border border-brand-aqua rounded-lg text-brand-midnight dark:text-brand-clean text-sm w-full focus:outline-none focus:border-brand-aqua"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    setLoadingCpf(true)
                                    try {
                                      const supabase = createClient()
                                      const { data: { user } } = await supabase.auth.getUser()
                                      if (user) {
                                        const { error } = await supabase
                                          .from('profiles')
                                          .update({ 
                                            cpf: cpf.replace(/\D/g, ''),
                                            cpf_editado: true
                                          })
                                          .eq('id', user.id)
                                        
                                        if (error) {
                                          createNotification('Erro ao salvar CPF: ' + error.message, 'warning')
                                        } else {
                                          createNotification('CPF salvo com sucesso!', 'success')
                                          setEditandoCpf(false)
                                          carregarPerfil()
                                        }
                                      }
                                    } catch (error: any) {
                                      createNotification('Erro ao salvar CPF', 'warning')
                                    } finally {
                                      setLoadingCpf(false)
                                    }
                                  }}
                                  disabled={loadingCpf || !cpf.replace(/\D/g, '').match(/^\d{11}$/)}
                                  className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loadingCpf ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditandoCpf(false)
                                    setCpf(userProfile.profile?.cpf || '')
                                  }}
                                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-smooth font-medium text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-brand-midnight dark:text-brand-clean">
                                {userProfile.profile?.cpf ? userProfile.profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado'}
                              </span>
                              {!userProfile.profile?.cpf_editado && (
                                <button
                                  onClick={() => {
                                    setCpf(userProfile.profile?.cpf || '')
                                    setEditandoCpf(true)
                                  }}
                                  className="text-brand-aqua hover:text-brand-aqua/80 transition-smooth font-medium text-sm underline"
                                >
                                  {userProfile.profile?.cpf ? 'Editar' : 'Adicionar'}
                                </button>
                              )}
                              {userProfile.profile?.cpf_editado && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  (Já editado)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Chave WhatsApp para Assistente */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">Chave WhatsApp (Assistente PLEN):</span>
                            <MessageCircle size={16} className="text-brand-aqua" />
                          </div>
                          {whatsappKey ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <code className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-brand-midnight dark:text-brand-clean font-mono text-sm">
                                  {showWhatsappKey ? whatsappKey : '•••••-•••••-•••••'}
                                </code>
                                <button
                                  onClick={async () => {
                                    if (!showWhatsappKey) {
                                      // Se a chave estiver oculta, mostrar primeiro
                                      setShowWhatsappKey(true)
                                      // Aguardar um pouco para o usuário ver a chave
                                      await new Promise(resolve => setTimeout(resolve, 100))
                                    }
                                    // Copiar para o clipboard
                                    if (whatsappKey) {
                                      try {
                                        await navigator.clipboard.writeText(whatsappKey)
                                        setCopiedKey(true)
                                        setTimeout(() => setCopiedKey(false), 2000)
                                      } catch (err) {
                                        console.error('Erro ao copiar:', err)
                                        // Fallback para navegadores antigos
                                        const textArea = document.createElement('textarea')
                                        textArea.value = whatsappKey
                                        textArea.style.position = 'fixed'
                                        textArea.style.opacity = '0'
                                        document.body.appendChild(textArea)
                                        textArea.select()
                                        try {
                                          document.execCommand('copy')
                                          setCopiedKey(true)
                                          setTimeout(() => setCopiedKey(false), 2000)
                                        } catch (fallbackErr) {
                                          console.error('Erro ao copiar (fallback):', fallbackErr)
                                        }
                                        document.body.removeChild(textArea)
                                      }
                                    }
                                  }}
                                  className="p-2 text-brand-aqua hover:text-brand-aqua/80 transition-smooth relative"
                                  title="Copiar chave"
                                >
                                  {copiedKey ? (
                                    <Check size={18} className="text-green-500" />
                                  ) : (
                                    <Copy size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                                  className="p-2 text-brand-aqua hover:text-brand-aqua/80 transition-smooth"
                                  title={showWhatsappKey ? "Ocultar chave" : "Mostrar chave"}
                                >
                                  {showWhatsappKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    if (!confirm('Tem certeza que deseja regenerar a chave? A chave atual será invalidada.')) {
                                      return
                                    }
                                    setLoadingWhatsappKey(true)
                                    try {
                                      const response = await fetch('/api/user/whatsapp-key', {
                                        method: 'POST',
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setWhatsappKey(data.whatsapp_key)
                                        setShowWhatsappKey(true)
                                        createNotification('Chave regenerada com sucesso!', 'success')
                                        carregarPerfil()
                                      } else {
                                        createNotification('Erro ao regenerar chave: ' + (data.error || 'Erro desconhecido'), 'warning')
                                      }
                                    } catch (error: any) {
                                      createNotification('Erro ao regenerar chave', 'warning')
                                    } finally {
                                      setLoadingWhatsappKey(false)
                                    }
                                  }}
                                  disabled={loadingWhatsappKey}
                                  className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  <RotateCcw size={16} />
                                  {loadingWhatsappKey ? 'Regenerando...' : 'Regenerar Chave'}
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Tem certeza que deseja remover a chave? Você precisará gerar uma nova para usar o assistente WhatsApp.')) {
                                      return
                                    }
                                    setLoadingWhatsappKey(true)
                                    try {
                                      const response = await fetch('/api/user/whatsapp-key', {
                                        method: 'DELETE',
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setWhatsappKey(null)
                                        setShowWhatsappKey(false)
                                        createNotification('Chave removida com sucesso!', 'success')
                                        carregarPerfil()
                                      } else {
                                        createNotification('Erro ao remover chave: ' + (data.error || 'Erro desconhecido'), 'warning')
                                      }
                                    } catch (error: any) {
                                      createNotification('Erro ao remover chave', 'warning')
                                    } finally {
                                      setLoadingWhatsappKey(false)
                                    }
                                  }}
                                  disabled={loadingWhatsappKey}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Remover
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Use esta chave junto com seu email para autenticar no assistente PLEN via WhatsApp.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Gere uma chave para usar o assistente PLEN via WhatsApp.
                              </p>
                              <button
                                onClick={async () => {
                                  setLoadingWhatsappKey(true)
                                  try {
                                    const response = await fetch('/api/user/whatsapp-key', {
                                      method: 'POST',
                                    })
                                    const data = await response.json()
                                    if (data.success) {
                                      setWhatsappKey(data.whatsapp_key)
                                      setShowWhatsappKey(true)
                                      createNotification('Chave gerada com sucesso!', 'success')
                                      carregarPerfil()
                                    } else {
                                      createNotification('Erro ao gerar chave: ' + (data.error || 'Erro desconhecido'), 'warning')
                                    }
                                  } catch (error: any) {
                                    createNotification('Erro ao gerar chave', 'warning')
                                  } finally {
                                    setLoadingWhatsappKey(false)
                                  }
                                }}
                                disabled={loadingWhatsappKey}
                                className="px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
                              >
                                <Key size={16} />
                                {loadingWhatsappKey ? 'Gerando...' : 'Gerar Chave'}
                              </button>
                              <a
                                href="https://wa.me/553173403036"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full max-w-xs mt-3 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-400/50"
                              >
                                <MessageCircle size={20} />
                                Iniciar chat com a Assistente PLEN no WhatsApp
                              </a>
                            </div>
                          )}
                          {whatsappKey && (
                            <a
                              href="https://wa.me/553173403036"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full max-w-xs mt-3 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-400/50"
                            >
                              <MessageCircle size={20} />
                              Iniciar chat com a Assistente PLEN no WhatsApp
                            </a>
                          )}
                        </div>
                        {userProfile.profile?.plano && (
                          <>
                            {/* Botão Fazer Upgrade - acima do plano */}
                            {userProfile.profile.plano === 'teste' && (
                              <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">Fazer Upgrade:</span>
                                <button
                                  onClick={() => router.push('/upgrade')}
                                  className="w-full max-w-xs px-4 py-2.5 bg-gradient-to-r from-brand-aqua to-blue-500 text-white rounded-lg font-semibold hover:from-brand-aqua/90 hover:to-blue-400 transition-smooth flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                  <Crown size={18} />
                                  Fazer Upgrade
                                </button>
                              </div>
                            )}
                            
                            {/* Plano */}
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-medium text-brand-midnight dark:text-brand-clean/70">Plano:</span>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-brand-aqua/20 text-brand-aqua rounded-lg font-medium capitalize">
                                  {userProfile.profile.plano}
                                </span>
                                {userProfile.profile.plano_status && (
                                  <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                                    userProfile.profile.plano_status === 'ativo' 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                  }`}>
                                    {userProfile.profile.plano_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confirmar Email */}
                  {userProfile && (!userProfile.email_confirmed_at || userProfile.email_confirmed_at === null || userProfile.email_confirmed_at === undefined || userProfile.email_confirmed_at === '') && (
                    <div>
                      <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
                        Confirmação de Email
                      </h2>
                      
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                        <div className="flex flex-col items-center gap-4">
                          {/* Ícone de carta */}
                          <div className="flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                            <Mail className="text-orange-600 dark:text-orange-400" size={32} />
                          </div>
                          
                          {/* Texto principal */}
                          <div className="text-center space-y-2">
                            <p className="text-orange-800 dark:text-orange-200 font-semibold text-base">
                              Seu email ainda não foi confirmado
                            </p>
                            <p className="text-orange-700 dark:text-orange-300 text-sm max-w-md">
                              Verifique sua caixa de entrada e spam. Se não recebeu o email, clique no botão abaixo para reenviar.
                            </p>
                          </div>
                          
                          {/* Botão de reenviar */}
                          <button
                            onClick={handleReenviarEmail}
                            disabled={loading}
                            className="w-full max-w-xs px-4 py-2.5 bg-orange-600 dark:bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 shadow-md transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Mail size={18} />
                            {loading ? 'Enviando...' : 'Reenviar Email de Confirmação'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações Gerais */}
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
                      Configurações Gerais
                    </h2>

                    {/* Seção de Suporte no WhatsApp */}
                    <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-white/10 mb-6">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-midnight dark:text-brand-clean mb-1">
                          {/* Logotipo oficial do WhatsApp */}
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-green-600 dark:text-green-400 flex-shrink-0"
                          >
                            <path 
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                              fill="currentColor"
                            />
                          </svg>
                          <span>Suporte no WhatsApp</span>
                        </h3>
                        <p className="text-sm text-brand-midnight/70 dark:text-brand-clean/70 mb-3">
                          Precisa de ajuda? Entre em contato conosco pelo WhatsApp. Nossa equipe está pronta para ajudar você!
                        </p>
                        <a
                          href="https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20PLENIPAY"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-smooth font-medium text-sm"
                        >
                          {/* Logotipo oficial do WhatsApp */}
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-white"
                          >
                            <path 
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                              fill="currentColor"
                            />
                          </svg>
                          Abrir WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Seção de Resetar Registros */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-midnight dark:text-brand-clean mb-1">
                          <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} strokeWidth={2} />
                          <span>Resetar Todos os Registros</span>
                        </h3>
                        <p className="text-sm text-brand-midnight/70 dark:text-brand-clean/70 mb-3">
                          Esta ação irá <strong>permanentemente deletar</strong> todos os seus registros financeiros, incluindo entradas, saídas e dívidas. Esta ação não pode ser desfeita.
                        </p>
                        <button
                          onClick={() => setShowModalResetar(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-smooth font-medium text-sm"
                        >
                          <RotateCcw size={16} strokeWidth={2} />
                          Resetar Todos os Registros
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Redefinir Senha */}
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
                      Segurança
                    </h2>
                    
                    <div className="space-y-4">
                      {!showRedefinirSenha ? (
                        <div className="flex justify-start">
                          <button
                            onClick={() => setShowRedefinirSenha(true)}
                            className="px-3 py-1.5 text-brand-aqua hover:text-brand-aqua/80 hover:bg-brand-aqua/10 rounded-lg font-medium transition-smooth flex items-center gap-2 text-sm"
                          >
                            <Key size={16} />
                            Redefinir Senha
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                              Senha Atual
                            </label>
                            <div className="relative">
                              <input
                                type={showSenhaAtual ? 'text' : 'password'}
                                value={senhaAtual}
                                onChange={(e) => setSenhaAtual(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-brand-midnight border border-gray-300 rounded-xl focus:outline-none focus:border-brand-aqua transition-smooth pr-12 text-brand-midnight dark:text-brand-clean"
                                placeholder="Digite sua senha atual"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-midnight dark:text-brand-clean/60 hover:text-brand-aqua"
                              >
                                {showSenhaAtual ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                              Nova Senha
                            </label>
                            <div className="relative">
                              <input
                                type={showNovaSenha ? 'text' : 'password'}
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                className={`w-full px-4 py-3 bg-white dark:bg-brand-midnight border rounded-xl focus:outline-none transition-smooth pr-12 text-brand-midnight dark:text-brand-clean ${
                                  novaSenha && !senhaValida
                                    ? 'border-red-500/50 focus:border-red-500'
                                    : novaSenha && senhaValida
                                    ? 'border-green-500/50 focus:border-green-500'
                                    : 'border-gray-300 focus:border-brand-aqua'
                                }`}
                                placeholder="Digite a nova senha"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNovaSenha(!showNovaSenha)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-midnight dark:text-brand-clean/60 hover:text-brand-aqua"
                              >
                                {showNovaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                            
                            {/* Lista de requisitos da senha */}
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-brand-midnight/30 rounded-lg border border-gray-200 dark:border-white/10">
                              <p className="text-xs font-semibold text-brand-midnight dark:text-brand-clean mb-2">Requisitos da senha:</p>
                              <ul className="space-y-1 text-xs">
                                <li className={`flex items-center gap-2 ${requisitosSenha.minimo ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                                  <span>{requisitosSenha.minimo ? '✓' : '○'}</span>
                                  <span>Pelo menos 8 caracteres</span>
                                </li>
                                <li className={`flex items-center gap-2 ${requisitosSenha.maiuscula ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                                  <span>{requisitosSenha.maiuscula ? '✓' : '○'}</span>
                                  <span>Uma letra maiúscula (A-Z)</span>
                                </li>
                                <li className={`flex items-center gap-2 ${requisitosSenha.minuscula ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                                  <span>{requisitosSenha.minuscula ? '✓' : '○'}</span>
                                  <span>Uma letra minúscula (a-z)</span>
                                </li>
                                <li className={`flex items-center gap-2 ${requisitosSenha.numero ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                                  <span>{requisitosSenha.numero ? '✓' : '○'}</span>
                                  <span>Um número (0-9)</span>
                                </li>
                                <li className={`flex items-center gap-2 ${requisitosSenha.especial ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-brand-clean/60'}`}>
                                  <span>{requisitosSenha.especial ? '✓' : '○'}</span>
                                  <span>Um caractere especial (!@#$%...)</span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                              Confirmar Nova Senha
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmarSenha ? 'text' : 'password'}
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                className={`w-full px-4 py-3 bg-white dark:bg-brand-midnight border-2 rounded-xl focus:outline-none transition-smooth pr-12 text-brand-midnight dark:text-brand-clean ${
                                  confirmarSenha && novaSenha && novaSenha !== confirmarSenha
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                                    : confirmarSenha && novaSenha && novaSenha === confirmarSenha
                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
                                    : 'border-gray-300 focus:border-brand-aqua'
                                }`}
                                placeholder="Confirme a nova senha"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-midnight dark:text-brand-clean/60 hover:text-brand-aqua"
                              >
                                {showConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                            {confirmarSenha && novaSenha && novaSenha !== confirmarSenha && (
                              <div className="mt-2 p-2 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-lg">
                                <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-2 font-medium">
                                  <span>⚠️</span>
                                  <span>As senhas não coincidem</span>
                                </p>
                              </div>
                            )}
                            {confirmarSenha && novaSenha && novaSenha === confirmarSenha && (
                              <p className="mt-2 text-sm text-green-500 dark:text-green-400 flex items-center gap-2">
                                <span>✓</span>
                                <span>Senhas coincidem</span>
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleRedefinirSenha}
                              disabled={loadingSenha}
                              className="flex-1 px-4 py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 shadow-md transition-smooth disabled:opacity-50"
                            >
                              {loadingSenha ? 'Atualizando...' : 'Atualizar Senha'}
                            </button>
                            <button
                              onClick={() => {
                                setShowRedefinirSenha(false)
                                setSenhaAtual('')
                                setNovaSenha('')
                                setConfirmarSenha('')
                              }}
                              className="px-4 py-3 bg-brand-clean dark:bg-brand-royal text-brand-midnight dark:text-brand-clean rounded-xl font-semibold hover:bg-brand-clean dark:bg-brand-royal/80 transition-smooth"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logout */}
                  <div>
                    <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
                      Sessão
                    </h2>
                    
                    <div className="flex justify-start">
                      <button
                        onClick={() => setShowModalLogout(true)}
                        className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-smooth flex items-center gap-2 text-sm"
                      >
                        <LogOut size={16} />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : userProfile === null ? (
              <div className="bg-brand-royal/30 dark:bg-brand-royal/20 rounded-xl p-6 border border-red-500/30">
                <div className="text-center space-y-4">
                  <AlertTriangle className="mx-auto text-red-500 dark:text-red-400" size={48} strokeWidth={2} />
                  <h3 className="text-xl font-semibold text-brand-midnight dark:text-brand-clean">
                    Erro ao carregar perfil
                  </h3>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70">
                    Não foi possível carregar suas informações do perfil. Isso pode acontecer se sua sessão expirou.
                  </p>
                  <p className="text-sm text-brand-midnight/60 dark:text-brand-clean/60">
                    Por favor, tente novamente ou faça login novamente se o problema persistir.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={async () => {
                        console.log('🔄 Tentando recarregar perfil...')
                        setLoadingProfile(true)
                        
                        // Tentar recarregar a página para forçar busca de sessão
                        // Isso pode resolver problemas temporários de sessão
                        await new Promise(resolve => setTimeout(resolve, 500))
                        
                        // Tentar carregar perfil novamente
                        carregarPerfil()
                      }}
                      className="px-6 py-2.5 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-medium"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      onClick={async () => {
                        // Tentar fazer logout e redirecionar para login
                        try {
                          await signOut()
                        } catch (e) {
                          console.error('Erro ao fazer logout:', e)
                        }
                        // Redirecionar para login
                        window.location.href = '/login'
                      }}
                      className="px-6 py-2.5 bg-brand-midnight dark:bg-brand-royal text-white rounded-lg hover:opacity-90 transition-smooth font-medium"
                    >
                      Fazer Login
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-brand-midnight dark:text-brand-clean/60">Carregando...</p>
              </div>
            )}
          </div>
        )}


        {tabAtivo === 'usuarios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-white">
                Gerenciar Usuários/Pessoas
              </h2>
              <button
                onClick={() => setShowNovoUsuario(!showNovoUsuario)}
                className="px-3 py-1.5 bg-brand-aqua/90 text-white rounded-lg font-medium hover:bg-brand-aqua shadow-sm hover:shadow-md transition-smooth flex items-center gap-1.5 text-sm whitespace-nowrap"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Novo Usuário</span>
              </button>
            </div>

            {/* Formulário novo usuário */}
            {showNovoUsuario && (
              <div className="p-5 bg-white dark:bg-brand-royal/30 rounded-xl border border-gray-200 dark:border-brand-aqua/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={novoUsuarioNome}
                    onChange={(e) => setNovoUsuarioNome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCriarUsuario()}
                    placeholder="Nome do novo usuário"
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/20 rounded-lg text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/60 focus:outline-none focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/20 transition-smooth"
                  />
                  <button
                    onClick={handleCriarUsuario}
                    disabled={loading || !novoUsuarioNome.trim()}
                    className="px-6 py-2.5 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 shadow-md hover:shadow-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                  >
                    {loading ? 'Criando...' : 'Criar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNovoUsuario(false)
                      setNovoUsuarioNome('')
                    }}
                    className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-brand-midnight text-gray-600 dark:text-brand-clean rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth border border-gray-300 dark:border-white/20"
                    title="Fechar"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de usuários (sempre inclui o dono da conta no topo) */}
            <div className="space-y-3">
              {usuariosParaExibir.length === 0 ? (
                <div className="text-center py-12 bg-brand-clean dark:bg-brand-royal/30 rounded-xl">
                  <p className="text-brand-midnight dark:text-brand-clean/60">
                    Nenhum usuário cadastrado ainda
                  </p>
                </div>
              ) : (
                usuariosParaExibir.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-white dark:bg-brand-midnight/60 border border-gray-200 rounded-xl hover:bg-brand-clean dark:bg-brand-royal/50 transition-smooth backdrop-blur-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {(user.imagem_url || (user.id === userProfile?.id && userProfile?.profile?.imagem_url)) ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-aqua/20 flex items-center justify-center border-2 border-brand-aqua/30">
                          <img 
                            src={user.id === userProfile?.id ? `/api/user/avatar?t=${avatarCacheKey}` : (user.imagem_url || '')} 
                            alt={user.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback para inicial do nome se a imagem falhar
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<span class="text-brand-aqua font-bold text-xl">${user.nome.charAt(0).toUpperCase()}</span>`
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-aqua/20 flex items-center justify-center">
                          <span className="text-brand-aqua font-bold text-xl">
                            {user.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-medium text-brand-midnight dark:text-white">{user.nome}</p>
                          {userProfile?.id === user.id && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/40">
                              <Crown size={12} className="text-amber-400" strokeWidth={2.5} />
                              Dono da conta
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-midnight/70 dark:text-white/70">
                          Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditandoUsuario(user)}
                        className="p-2 text-brand-aqua hover:bg-brand-aqua/10 rounded-lg transition-smooth"
                        title="Editar"
                      >
                        <Edit size={18} strokeWidth={2} />
                      </button>
                      {user.id !== userProfile?.id && (
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-smooth"
                          title="Excluir"
                          onClick={() => {
                            setUsuarioParaExcluir(user)
                            setShowModalExcluirUsuario(true)
                          }}
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Resetar Registros */}
      {showModalResetar && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 glass-backdrop overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModalResetar(false)
              setConfirmacaoResetar('')
            }
          }}
          onTouchMove={(e) => {
            // Prevenir scroll no backdrop
            if (e.target === e.currentTarget) {
              e.preventDefault()
            }
          }}
        >
          <div 
            className="bg-white dark:bg-brand-royal rounded-xl shadow-2xl max-w-sm w-full p-4 sm:p-5 animate-slide-up border border-gray-200 dark:border-white/20 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={18} strokeWidth={2} />
              </div>
              <h3 className="text-base sm:text-lg font-display font-bold text-brand-midnight dark:text-brand-clean">
                Confirmar Reset de Registros
              </h3>
            </div>

            <div className="space-y-2.5 mb-4">
              <p className="text-sm text-brand-midnight dark:text-brand-clean/90">
                Você está prestes a <strong className="text-red-600 dark:text-red-400">permanentemente deletar</strong> todos os seus registros financeiros.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-2.5">
                <p className="text-xs text-red-800 dark:text-red-300 font-medium mb-1.5">
                  ⚠️ Esta ação não pode ser desfeita!
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300/80 space-y-0.5 list-disc list-inside">
                  <li>Registros de entrada e saída</li>
                  <li>Dívidas e empréstimos</li>
                </ul>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                  Digite <strong className="text-red-600 dark:text-red-400">RESETAR</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmacaoResetar}
                  onChange={(e) => setConfirmacaoResetar(e.target.value)}
                  placeholder="Digite RESETAR"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:border-red-500 dark:focus:border-red-400 transition-smooth text-brand-midnight dark:text-brand-clean bg-white dark:bg-brand-midnight placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowModalResetar(false)
                  setConfirmacaoResetar('')
                }}
                disabled={loadingResetar}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg hover:bg-gray-200 dark:hover:bg-brand-midnight/80 transition-smooth font-medium disabled:opacity-50 border border-gray-200 dark:border-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetarRegistros}
                disabled={loadingResetar || confirmacaoResetar !== 'RESETAR'}
                className="flex-1 px-3 py-2 text-sm bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-smooth font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {loadingResetar ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Resetando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} strokeWidth={2} />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Logout */}
      {showModalLogout && (
        <ModalConfirmacao
          titulo="Confirmar Saída"
          mensagem="Tem certeza que deseja sair da sua conta?"
          onConfirmar={handleLogout}
          onCancelar={() => setShowModalLogout(false)}
          textoConfirmar="Sair"
          tipo="warning"
        />
      )}

      {/* Modal de Confirmação para Excluir Usuário */}
      {showModalExcluirUsuario && usuarioParaExcluir && (
        <ModalConfirmacao
          titulo="Excluir Usuário"
          mensagem={`Tem certeza que deseja excluir "${usuarioParaExcluir.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={() => {
            createNotification('Funcionalidade de exclusão em desenvolvimento', 'info')
            setShowModalExcluirUsuario(false)
            setUsuarioParaExcluir(null)
          }}
          onCancelar={() => {
            setShowModalExcluirUsuario(false)
            setUsuarioParaExcluir(null)
          }}
          textoConfirmar="Excluir"
          tipo="danger"
        />
      )}

      {/* Modal de Editar Usuário */}
      {editandoUsuario && (
        <div
          className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4"
          onClick={() => setEditandoUsuario(null)}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="bg-white dark:bg-brand-royal rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                Editar Usuário
              </h3>
              <button
                onClick={() => setEditandoUsuario(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-brand-midnight dark:text-brand-clean" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar e Upload de Imagem */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {editandoUsuario.imagem_url ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-aqua/20 flex items-center justify-center border-2 border-brand-aqua/30">
                      <img 
                        src={editandoUsuario.imagem_url} 
                        alt={editandoUsuario.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<span class="text-brand-aqua font-bold text-3xl">${editandoUsuario.nome.charAt(0).toUpperCase()}</span>`
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-brand-aqua/20 flex items-center justify-center border-2 border-brand-aqua/30">
                      <span className="text-brand-aqua font-bold text-3xl">
                        {editandoUsuario.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleUploadImagem(editandoUsuario.id, file)
                      }
                    }}
                    disabled={uploadingImagem === editandoUsuario.id}
                  />
                  <div className="px-4 py-2 bg-brand-aqua/10 hover:bg-brand-aqua/20 dark:bg-brand-aqua/20 dark:hover:bg-brand-aqua/30 rounded-lg transition-colors flex items-center gap-2 text-brand-aqua font-medium text-sm">
                    {uploadingImagem === editandoUsuario.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-aqua border-t-transparent rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} strokeWidth={2} />
                        <span>Alterar foto de perfil</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Nome do Usuário */}
              <div>
                <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={editandoUsuario.nome}
                  onChange={(e) => setEditandoUsuario({ ...editandoUsuario, nome: e.target.value })}
                  placeholder="Digite o nome do usuário"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg text-brand-midnight dark:text-brand-clean text-base focus:outline-none focus:border-brand-aqua transition-smooth"
                  autoFocus
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditandoUsuario(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!editandoUsuario.nome.trim()) {
                      createNotification('O nome não pode estar vazio', 'warning')
                      return
                    }
                    setLoading(true)
                    try {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user) {
                        const { error } = await supabase
                          .from('users')
                          .update({ nome: editandoUsuario.nome.trim() })
                          .eq('id', editandoUsuario.id)
                          .eq('account_owner_id', user.id)
                        
                        if (error) {
                          createNotification('Erro ao salvar: ' + error.message, 'warning')
                        } else {
                          createNotification('Usuário atualizado com sucesso!', 'success')
                          setEditandoUsuario(null)
                          await carregarUsuarios()
                        }
                      }
                    } catch (error: any) {
                      createNotification('Erro ao salvar usuário', 'warning')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading || !editandoUsuario.nome.trim()}
                  className="flex-1 px-4 py-3 bg-brand-aqua text-white rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Verificação de Email */}
      {showModalVerificarEmail && userProfile?.email && (
        <ModalConfirmarEmail
          key={`verify-email-${userProfile.email}-${showModalVerificarEmail}`}
          email={userProfile.email}
          obrigatorio={false}
          onConfirmado={() => {
            setShowModalVerificarEmail(false)
            carregarPerfil()
            createNotification('Email confirmado com sucesso!', 'success')
          }}
          onClose={() => {
            setShowModalVerificarEmail(false)
          }}
        />
      )}

      {/* Modal de Editar Nome */}
      {showModalEditarNome && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4"
            onClick={() => setShowModalEditarNome(false)}
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="bg-white dark:bg-brand-royal rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                  Editar Nome
                </h3>
                <button
                  onClick={() => setShowModalEditarNome(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-brand-midnight dark:text-brand-clean" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg text-brand-midnight dark:text-brand-clean text-base focus:outline-none focus:border-brand-aqua transition-smooth"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nome.trim() && !loadingNome) {
                        e.preventDefault()
                        const handleSalvar = async () => {
                          setLoadingNome(true)
                          try {
                            const supabase = createClient()
                            const { data: { user } } = await supabase.auth.getUser()
                            if (user) {
                              const { error } = await supabase
                                .from('profiles')
                                .update({ nome: nome.trim() })
                                .eq('id', user.id)
                              
                              if (error) {
                                createNotification('Erro ao salvar nome: ' + error.message, 'warning')
                              } else {
                                createNotification('Nome salvo com sucesso!', 'success')
                                setShowModalEditarNome(false)
                                carregarPerfil()
                              }
                            }
                          } catch (error: any) {
                            createNotification('Erro ao salvar nome', 'warning')
                          } finally {
                            setLoadingNome(false)
                          }
                        }
                        handleSalvar()
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={async () => {
                      setLoadingNome(true)
                      try {
                        const supabase = createClient()
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ nome: nome.trim() })
                            .eq('id', user.id)
                          
                          if (error) {
                            createNotification('Erro ao salvar nome: ' + error.message, 'warning')
                          } else {
                            createNotification('Nome salvo com sucesso!', 'success')
                            setShowModalEditarNome(false)
                            carregarPerfil()
                          }
                        }
                      } catch (error: any) {
                        createNotification('Erro ao salvar nome', 'warning')
                      } finally {
                        setLoadingNome(false)
                      }
                    }}
                    disabled={loadingNome || !nome.trim()}
                    className="flex-1 px-4 py-3 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua/90 transition-smooth font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingNome ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModalEditarNome(false)
                      setNome(userProfile.profile?.nome || userProfile.email?.split('@')[0] || 'Usuário')
                    }}
                    disabled={loadingNome}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-smooth font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tabAtivo === 'baixar' && (
        <div className="space-y-5 sm:space-y-6 pb-24 sm:pb-28 px-1 sm:px-0">
          <div className="px-2 sm:px-0">
            <h2 className="text-lg sm:text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-2 sm:mb-2.5">
              Baixar Plataforma
            </h2>
            <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 mb-5 sm:mb-6 leading-relaxed">
              Adicione o PLENIPAY à tela inicial do seu iPhone para acesso rápido e fácil.
            </p>
          </div>

          {/* Tutorial para iPhone */}
          <div className="bg-white dark:bg-brand-royal/30 rounded-xl px-5 py-5 sm:px-6 sm:py-6 border border-gray-200 dark:border-brand-aqua/20 shadow-sm">
            <div className="space-y-4 sm:space-y-5">
              {/* Ícone e Título */}
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="p-2.5 sm:p-3 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg flex-shrink-0">
                  <Smartphone size={20} className="sm:w-6 sm:h-6 text-brand-aqua" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-brand-midnight dark:text-brand-clean leading-tight">
                  Como adicionar à Tela Inicial no iPhone
                </h3>
              </div>
              
              {/* Passos - Alinhados à esquerda com o ícone */}
              <div className="space-y-4 sm:space-y-5">
                {/* Passo 1 */}
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-aqua text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Abra o Safari no seu iPhone
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Acesse a plataforma PLENIPAY através do navegador Safari.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-aqua text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Toque no botão de Compartilhar
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Localize e toque no ícone de compartilhar na parte inferior da tela.{' '}
                      <span className="inline-flex items-center gap-1.5 text-brand-aqua font-medium mt-1">
                        <Share2 size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs">Ícone de Compartilhar</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-aqua text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Selecione "Adicionar à Tela de Início"
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Role a lista de opções e toque em "Adicionar à Tela de Início".{' '}
                      <span className="inline-flex items-center gap-1.5 text-brand-aqua font-medium mt-1">
                        <ArrowRight size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs">Adicionar à Tela de Início</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-aqua text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    4
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Personalize o nome (opcional)
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Você pode editar o nome do ícone antes de adicionar. O nome padrão será "PLENIPAY".
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-aqua text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    5
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Toque em "Adicionar"
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Confirme a ação tocando no botão "Adicionar" no canto superior direito.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dica */}
              <div className="mt-5 sm:mt-6 px-4 py-3.5 sm:px-5 sm:py-4 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg border border-brand-aqua/30">
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div className="p-1.5 sm:p-2 bg-brand-aqua/20 rounded flex-shrink-0">
                    <Lightbulb size={16} className="sm:w-[18px] sm:h-[18px] text-brand-aqua" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                      Dica
                    </p>
                    <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70 leading-relaxed">
                      Após adicionar, o ícone do PLENIPAY aparecerá na sua tela inicial. Toque nele para acessar a plataforma rapidamente, como um app nativo!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

