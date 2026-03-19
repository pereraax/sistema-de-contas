'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { createNotification } from '@/components/NotificationBell'
import { useAppPlatform } from '@/components/AppPlatformProvider'
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ModalConfirmarEmail from '@/components/ModalConfirmarEmail'
import ModalLoginConcluido from '@/components/ModalLoginConcluido'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const AFFILIATE_REF_COOKIE = 'plenipay_ref'
const CONFIRM_EMAIL_MODAL_KEY = 'plenipay_confirm_email_modal'

function CadastroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isApp = useAppPlatform()

  // No app: nunca mostrar o formulário do site — voltar para a tela do app (cadastro por Google/email no app).
  useEffect(() => {
    if (isApp) router.replace('/?platform=app')
  }, [isApp, router])
  const plano = (searchParams?.get('plano') as 'teste' | 'basico' | 'premium') || 'teste'
  const emailFromUrl = searchParams?.get('email')?.trim() || ''
  const refFromUrl = searchParams?.get('ref') || null

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showModalConfirmacao, setShowModalConfirmacao] = useState(false)
  const [showModalLoginConcluido, setShowModalLoginConcluido] = useState(false)
  const [emailCadastrado, setEmailCadastrado] = useState('')
  const [signUpResult, setSignUpResult] = useState<any>(null) // Armazenar resultado do signUp
  const [erroRateLimit, setErroRateLimit] = useState<string | null>(null) // Armazenar erro de rate limiting
  const [mostrarAvisoCampos, setMostrarAvisoCampos] = useState(false) // Controlar exibição do aviso de campos incompletos
  const restoredModalRef = useRef(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
    codigoIndicacao: '',
  })
  const [codigoPreenchidoPeloLink, setCodigoPreenchidoPeloLink] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    if (refFromUrl && typeof document !== 'undefined') {
      document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(refFromUrl)}; path=/; max-age=2592000`
      setFormData((prev) => ({ ...prev, codigoIndicacao: refFromUrl.trim() }))
      setCodigoPreenchidoPeloLink(true)
    }
  }, [refFromUrl])

  // Se o e-mail vier no link (ex.: checkout guest), pré-preenche para reduzir erros.
  useEffect(() => {
    if (!emailFromUrl) return
    setFormData((prev) => ({ ...prev, email: emailFromUrl }))
    setEmailCadastrado(emailFromUrl)
  }, [emailFromUrl])

  useEffect(() => {
    if (refFromUrl || formData.codigoIndicacao) return
    if (typeof document === 'undefined') return
    const match = document.cookie.match(new RegExp(`(^| )${AFFILIATE_REF_COOKIE}=([^;]+)`))
    const cookieRef = match ? decodeURIComponent(match[2]) : null
    if (cookieRef && cookieRef.trim()) {
      setFormData((prev) => ({ ...prev, codigoIndicacao: cookieRef.trim() }))
      setCodigoPreenchidoPeloLink(true)
    }
  }, [])

  // Restaurar modal de confirmação de email se o usuário fechou o popup "Salvar senha?" (iOS/Safari)
  // e o estado do React foi perdido — persistimos em sessionStorage e reabrimos ao recuperar foco
  const restoreConfirmEmailModal = useCallback(() => {
    if (typeof sessionStorage === 'undefined' || restoredModalRef.current) return
    try {
      const raw = sessionStorage.getItem(CONFIRM_EMAIL_MODAL_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { open?: boolean; email?: string; emailEnviado?: boolean }
      if (!data.open || !data.email) return
      restoredModalRef.current = true
      setEmailCadastrado(data.email)
      setShowModalConfirmacao(true)
      setSignUpResult((prev: any) => ({ ...prev, emailEnviado: data.emailEnviado ?? false }))
    } catch {
      sessionStorage.removeItem(CONFIRM_EMAIL_MODAL_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    restoreConfirmEmailModal()
    const onVisible = () => restoreConfirmEmailModal()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [restoreConfirmEmailModal])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])
  const handleMouseLeave = useCallback(() => setMousePos(null), [])

  const getOAuthRedirectUrl = () => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/auth/callback?next=/home`
  }

  const handleSignInWithGoogle = async () => {
    setOauthError(null)
    setOauthLoading('google')
    try {
      const supabase = createClient()
      const redirectTo = getOAuthRedirectUrl()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) {
        setOauthError(error.message || 'Erro ao conectar com Google.')
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setOauthError('Cadastro com Google não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch {
      setOauthError('Erro ao abrir cadastro com Google.')
    } finally {
      setOauthLoading(null)
    }
  }

  const handleSignInWithApple = async () => {
    setOauthError(null)
    setOauthLoading('apple')
    try {
      const supabase = createClient()
      const redirectTo = getOAuthRedirectUrl()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      })
      if (error) {
        setOauthError(error.message || 'Erro ao conectar com Apple.')
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setOauthError('Cadastro com Apple não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch {
      setOauthError('Erro ao abrir cadastro com Apple.')
    } finally {
      setOauthLoading(null)
    }
  }

  // Estrutura de verificação de email removida temporariamente

  const formatarTelefone = (value: string) => {
    const telefone = value.replace(/\D/g, '')
    if (telefone.length <= 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
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
    minimo: formData.senha.length >= 8,
    maiuscula: /[A-Z]/.test(formData.senha),
    minuscula: /[a-z]/.test(formData.senha),
    numero: /[0-9]/.test(formData.senha),
    especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.senha),
  }
  
  const senhaValida = Object.values(requisitosSenha).every(Boolean)
  
  // Verificar se as senhas coincidem (em tempo real)
  const temSenha = formData.senha.length > 0
  const temConfirmacao = formData.confirmarSenha.length > 0
  const senhasNaoCoincidem = temSenha && temConfirmacao && formData.senha !== formData.confirmarSenha
  const senhasCoincidem = temSenha && temConfirmacao && formData.senha === formData.confirmarSenha

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevenir comportamento padrão IMEDIATAMENTE para evitar interferência do iOS
    e.preventDefault()
    e.stopPropagation()
    
    // Bloquear qualquer outra ação do navegador
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    
    console.log('🚀 ========== FORMULÁRIO SUBMETIDO ==========')
    console.log('📋 Dados do formulário:', formData)
    console.log('📦 Plano selecionado:', plano)
    
    // Verificar se já está carregando (evitar duplo submit)
    if (loading) {
      console.log('⚠️ Já está processando, ignorando submit duplicado')
      return
    }
    
    // Marcar como carregando IMEDIATAMENTE para bloquear cliques adicionais
    setLoading(true)
    
    // Usar requestAnimationFrame para garantir que o estado foi atualizado
    // e processar o submit no próximo frame, evitando interferência do iOS
    requestAnimationFrame(() => {
      processarCadastro()
    })
  }
  
  const processarCadastro = async () => {

    // Validações
    if (!formData.nome.trim()) {
      console.log('Validação falhou: nome vazio')
      setMostrarAvisoCampos(true)
      createNotification('Informe seu nome', 'warning')
      setLoading(false)
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      console.log('Validação falhou: email inválido')
      setMostrarAvisoCampos(true)
      createNotification('Informe um email válido', 'warning')
      setLoading(false)
      return
    }

    // Validação de senha mais robusta
    const senhaErrors = validarSenha(formData.senha)
    if (senhaErrors.length > 0) {
      console.log('Validação falhou:', senhaErrors.join(', '))
      setMostrarAvisoCampos(true)
      createNotification('A senha não atende aos requisitos. Verifique as regras abaixo.', 'warning')
      setLoading(false)
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      console.log('Validação falhou: senhas não coincidem')
      setMostrarAvisoCampos(true)
      createNotification('As senhas não coincidem', 'warning')
      setLoading(false)
      return
    }

    const whatsappLimpo = formData.whatsapp.replace(/\D/g, '')

    if (!whatsappLimpo || whatsappLimpo.length < 10) {
      console.log('Validação falhou: whatsapp inválido', whatsappLimpo)
      setMostrarAvisoCampos(true)
      createNotification('Informe um WhatsApp válido (com DDD)', 'warning')
      setLoading(false)
      return
    }
    
    // Se passou todas as validações, ocultar aviso
    setMostrarAvisoCampos(false)

    console.log('✅ Todas as validações passaram, criando conta...')

    const refCode = (formData.codigoIndicacao?.trim() || refFromUrl || (typeof document !== 'undefined' ? document.cookie.match(new RegExp(`(^| )${AFFILIATE_REF_COOKIE}=([^;]+)`))?.[2] : null) || '').trim() || undefined

    try {
      console.log('📞 Chamando signUp com:', {
        email: formData.email,
        nome: formData.nome,
        whatsapp: whatsappLimpo,
        plano: plano,
        ref: refCode || '(nenhum)',
      })
      
      const result = await signUp(
        formData.email,
        formData.senha,
        formData.nome,
        '', // telefone removido - passar string vazia
        whatsappLimpo,
        plano,
        refCode || undefined
      )

      console.log('📥 Resultado do signUp recebido:', JSON.stringify(result, null, 2))
      
      // Armazenar resultado para usar no modal
      setSignUpResult(result)

      // Verificar se há erro crítico (usuário não foi criado)
      if (result?.error && !result?.userCreated) {
        console.error('❌ Erro ao criar conta:', result.error)
        createNotification(result.error, 'error')
        setLoading(false)
        return
      }

      // Se usuário foi criado (mesmo com erro de envio de email), continuar
      if (result?.userCreated) {
        console.log('✅ Conta criada com sucesso!')
        
        // Rastrear evento de cadastro no Facebook Pixel
        try {
          const { trackRegistration } = await import('@/lib/facebook-pixel-events')
          trackRegistration()
        } catch (error) {
          console.warn('⚠️ [Facebook Pixel] Erro ao rastrear cadastro:', error)
        }
        
        // Verificar status do email
        if (result.emailConfirmado || result.data?.session) {
          // Email já confirmado - login automático
          console.log('✅ Email confirmado - redirecionando')
          createNotification('Conta criada com sucesso! Redirecionando...', 'success')
          setTimeout(() => {
            router.push('/home')
          }, 1000)
        } else {
          // Email não confirmado - mostrar modal para confirmar
          console.log('📧 Email não confirmado - mostrando modal')
          setEmailCadastrado(formData.email)
          setShowModalConfirmacao(true)
          restoredModalRef.current = false
          try {
            sessionStorage.setItem(CONFIRM_EMAIL_MODAL_KEY, JSON.stringify({
              open: true,
              email: formData.email,
              emailEnviado: result.emailEnviado ?? false,
            }))
          } catch {
            // ignore
          }
          
          // Mensagem diferente se email não foi enviado
          if (result.emailEnviado === false) {
            createNotification('Conta criada! Houve um problema ao enviar o email. Use o botão "Reenviar link" abaixo.', 'warning')
          } else {
            createNotification('Conta criada! Verifique seu email para confirmar.', 'success')
          }
        }
        
        setLoading(false)
      } else {
        createNotification('Erro ao criar conta. Tente novamente.', 'error')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Erro inesperado no try/catch:', error)
      console.error('❌ Stack trace:', error?.stack)
      createNotification('Erro inesperado: ' + (error.message || 'Erro desconhecido'), 'warning')
      setLoading(false)
    }
  }

  // Garantir que, depois do signUp, se o usuário foi criado mas o email NÃO está confirmado,
  // o modal de confirmação fique visível mesmo que algum estado tenha sido perdido no mobile.
  useEffect(() => {
    if (
      signUpResult?.userCreated &&
      !signUpResult?.emailConfirmado &&
      emailCadastrado &&
      !showModalConfirmacao
    ) {
      console.log('📧 [Cadastro] Reabrindo modal de confirmação automaticamente após signUp')
      setShowModalConfirmacao(true)
    }
  }, [signUpResult, emailCadastrado, showModalConfirmacao])

  const planosNomes = {
    teste: 'Teste Grátis',
    basico: 'Plano Básico',
    premium: 'Plano Premium',
  }

  return (
    <div
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => {
        const el = sectionRef.current
        if (!el || !e.touches[0]) return
        const rect = el.getBoundingClientRect()
        setMousePos({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top })
      }}
      onTouchMove={(e) => {
        const el = sectionRef.current
        if (!el || !e.touches[0]) return
        const rect = el.getBoundingClientRect()
        setMousePos({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top })
      }}
      onTouchEnd={() => setMousePos(null)}
      className="min-h-screen bg-neutral-50 dark:bg-[#1A1A1A] relative overflow-hidden"
    >
      {/* Efeito de fundo: grade com linhas brancas ao passar o mouse/toque (igual página inicial) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: mousePos ? 0.9 : 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          WebkitMaskImage: mousePos
            ? `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
            : 'none',
          maskImage: mousePos
            ? `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`
            : 'none',
        }}
        aria-hidden
      />
      {/* Conteúdo - Centralizado, clean */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-md py-6 sm:py-10">
        <div className="bg-white dark:bg-[#252525] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 sm:p-8">
          {/* Logo centralizado no topo da janela Criar Conta */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="block">
              <Image
                src="/logo-header.png"
                alt="PLENIPAY"
                width={140}
                height={48}
                className="h-10 sm:h-12 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1e4976] dark:hover:text-brand-aqua transition-colors mb-5"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D1B2A] dark:text-white mb-1">
              Criar Conta
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Plano: <Link href="/planos" className="text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium">{planosNomes[plano]}</Link>
            </p>
          </div>

          {/* Botões Google e Apple */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={handleSignInWithGoogle}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-gray-800 dark:text-white font-medium text-sm hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Cadastrar com Google
            </button>
            <button
              type="button"
              onClick={handleSignInWithApple}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-white/20 bg-white dark:bg-white/5 text-gray-800 dark:text-white font-medium text-sm hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {oauthLoading === 'apple' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              Cadastrar com Apple
            </button>
            {oauthError && (
              <p className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{oauthError}</p>
            )}
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-[#252525] text-gray-500 dark:text-gray-400">ou preencha o formulário</span>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              console.log('📝 Form onSubmit disparado')
              handleSubmit(e).catch((error) => {
                console.error('❌ Erro não capturado no handleSubmit:', error)
                createNotification('Erro ao processar formulário. Tente novamente.', 'warning')
                setLoading(false)
              })
            }} 
            className="space-y-3"
            noValidate
            autoComplete="off"
            data-form-type="other"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                data-form-type="other"
                className="w-full px-3 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  autoComplete="new-password"
                  data-form-type="other"
                  className={`w-full px-3 py-2.5 bg-white dark:bg-white/10 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all pr-10 ${
                    formData.senha && !senhaValida
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                      : formData.senha && senhaValida
                      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10'
                      : 'border-gray-200 dark:border-white/20 focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20'
                  }`}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-[#1e4976] dark:hover:text-brand-aqua transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Lista de requisitos da senha - Compacta em grid */}
              <div className="mt-1.5 p-3 bg-neutral-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Requisitos da senha:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.minimo ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-xs">{requisitosSenha.minimo ? '✓' : '○'}</span>
                    <span>8+ caracteres</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.maiuscula ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-xs">{requisitosSenha.maiuscula ? '✓' : '○'}</span>
                    <span>Maiúscula (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.minuscula ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-xs">{requisitosSenha.minuscula ? '✓' : '○'}</span>
                    <span>Minúscula (a-z)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none ${requisitosSenha.numero ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-xs">{requisitosSenha.numero ? '✓' : '○'}</span>
                    <span>Número (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-1.5 text-xs list-none col-span-2 ${requisitosSenha.especial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-xs">{requisitosSenha.especial ? '✓' : '○'}</span>
                    <span>Caractere especial (!@#$%...)</span>
                  </li>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                autoComplete="new-password"
                data-form-type="other"
                className={`w-full px-3 py-2.5 bg-white dark:bg-white/10 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all ${
                  senhasNaoCoincidem
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                    : senhasCoincidem
                    ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/10'
                    : 'border-gray-200 dark:border-white/20 focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20'
                }`}
                placeholder="Confirme sua senha"
              />
              {senhasNaoCoincidem && (
                <div className="mt-1.5 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                  <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2 font-medium">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <span className="flex-1">
                      <strong>As senhas não coincidem!</strong>
                    </span>
                  </p>
                </div>
              )}
              {senhasCoincidem && (
                <div className="mt-1.5 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl">
                  <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5 font-semibold">
                    <span className="text-sm">✓</span>
                    <span>Senhas coincidem</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp *
              </label>
              <input
                type="text"
                required
                value={formatarTelefone(formData.whatsapp)}
                onChange={(e) => {
                  const valorLimpo = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, whatsapp: valorLimpo })
                  // Ocultar aviso quando começar a preencher
                  if (valorLimpo.length > 0) {
                    setMostrarAvisoCampos(false)
                  }
                }}
                maxLength={15}
                className={`w-full px-3 py-2.5 bg-white dark:bg-white/10 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                  mostrarAvisoCampos && (!formData.whatsapp || formData.whatsapp.replace(/\D/g, '').length < 10)
                    ? 'border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                    : 'border-gray-200 dark:border-white/20 focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20'
                }`}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código de indicação <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.codigoIndicacao}
                onChange={(e) => {
                  setFormData({ ...formData, codigoIndicacao: e.target.value.toUpperCase().replace(/\s/g, '') })
                  if (!e.target.value) setCodigoPreenchidoPeloLink(false)
                }}
                className="w-full px-3 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20 transition-all uppercase"
                placeholder="Ex: ABC12XYZ"
              />
              {codigoPreenchidoPeloLink && formData.codigoIndicacao && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Preenchido pelo link de indicação
                </p>
              )}
            </div>

            {/* Mensagem de aviso na parte inferior */}
            {mostrarAvisoCampos && (
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-500/30">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Complete todos os campos obrigatórios
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                      Por favor, preencha todos os campos marcados com * antes de continuar. Verifique especialmente o campo de WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                // Forçar submit imediatamente sem esperar pelo gerenciador de senhas do iOS
                // Prevenir qualquer comportamento padrão que possa interferir
                e.preventDefault()
                e.stopPropagation()
                
                // Bloquear propagação imediata
                if (e.nativeEvent) {
                  e.nativeEvent.stopImmediatePropagation()
                }
                
                // Se não está carregando, processar imediatamente
                if (!loading) {
                  // Chamar handleSubmit diretamente, que já previne default e processa
                  handleSubmit(e as any).catch((error) => {
                    console.error('❌ Erro não capturado no handleSubmit:', error)
                    createNotification('Erro ao processar formulário. Tente novamente.', 'warning')
                    setLoading(false)
                  })
                }
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Criando conta...
                </span>
              ) : (
                'Criar Conta'
              )}
            </button>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Ao criar uma conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium">Termos</Link>
              {' '}e{' '}
              <Link href="/privacidade" className="text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium">Política</Link>
            </p>

            <p className="text-center text-xs text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium">
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* PARTE 3 & 4: Modal de Confirmação de Email */}
      {(showModalConfirmacao || (signUpResult?.userCreated && !signUpResult?.emailConfirmado)) && emailCadastrado && (
        <ModalConfirmarEmail
          email={emailCadastrado}
          obrigatorio={false}
          emailJaEnviado={signUpResult?.emailEnviado || false}
          onEmailEnviado={() => {
            // Atualizar signUpResult quando email for reenviado com sucesso
            console.log('✅ [Cadastro] Email reenviado - atualizando signUpResult')
            setSignUpResult((prev: any) => ({
              ...prev,
              emailEnviado: true
            }))
          }}
          onConfirmado={async () => {
            console.log('✅ Email confirmado via callback - fazendo login automático...')
            setShowModalConfirmacao(false)
            try { sessionStorage.removeItem(CONFIRM_EMAIL_MODAL_KEY) } catch { /* ignore */ }
            restoredModalRef.current = false
            
            // Verificar se já está logado (o callback cria sessão automaticamente)
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
              createNotification('Email confirmado! Redirecionando...', 'success')
              router.push('/home?emailConfirmed=true')
            } else {
              createNotification('Email confirmado! Faça login para continuar.', 'info')
              setTimeout(() => {
                router.push('/login?mensagem=Email confirmado! Faça login para continuar.')
              }, 1000)
            }
          }}
          onClose={() => {
            setShowModalConfirmacao(false)
            try { sessionStorage.removeItem(CONFIRM_EMAIL_MODAL_KEY) } catch { /* ignore */ }
            restoredModalRef.current = false
            createNotification('Verifique seu email e confirme sua conta antes de fazer login.', 'info')
            setTimeout(() => {
              router.push('/login?mensagem=Verifique seu email para confirmar a conta.')
            }, 1000)
          }}
        />
      )}

      {/* Popup de Login Concluído */}
      <ModalLoginConcluido
        isOpen={showModalLoginConcluido}
        onClose={() => {
          setShowModalLoginConcluido(false)
          // Redirecionar para home após fechar o popup
          window.location.href = '/home'
        }}
      />
      
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#1A1A1A]">
        <Loader2 className="animate-spin text-[#1e4976] dark:text-brand-aqua" size={48} />
      </div>
    }>
      <CadastroContent />
    </Suspense>
  )
}

