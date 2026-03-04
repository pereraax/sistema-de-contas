'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createNotification } from '@/components/NotificationBell'
import { useAppPlatform } from '@/components/AppPlatformProvider'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import ModalEmailConfirmadoSucesso from '@/components/ModalEmailConfirmadoSucesso'
import ModalLoginConcluido from '@/components/ModalLoginConcluido'
import ModalEsqueceuSenha from '@/components/ModalEsqueceuSenha'
import logoTipoFundoClaro from '@/assets/fundo claro.png'

export const dynamic = 'force-dynamic'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isApp = useAppPlatform()

  // No app: nunca mostrar o formulário do site — voltar para a tela do app (bem-vindo + Google/email).
  useEffect(() => {
    if (isApp) router.replace('/?platform=app')
  }, [isApp, router])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModalLoginConcluido, setShowModalLoginConcluido] = useState(false)
  const [showModalEsqueceuSenha, setShowModalEsqueceuSenha] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
  })
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  type LoginStep = 'email' | 'password' | 'first_access'
  const [loginStep, setLoginStep] = useState<LoginStep>('email')
  const [enviandoLinkSenha, setEnviandoLinkSenha] = useState(false)
  const [linkSenhaEnviado, setLinkSenhaEnviado] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos(null)
  }, [])

  // Detectar modo escuro/claro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  // Carregar estado do "Lembrar-me" do localStorage
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'
    setRememberMe(savedRememberMe)
    
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem('savedEmail')
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }))
      }
    }
  }, [])

  // Salvar estado do "Lembrar-me" no localStorage
  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('savedEmail')
    }
  }, [rememberMe])

  // OAuth: se retorno do Google/Apple caiu em /login (code na query ou tokens no hash), enviar para /auth/callback
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const hasCode = params.get('code')
    const hash = window.location.hash || ''
    const hasOAuthHash = hash.includes('access_token') || hash.includes('refresh_token')
    if (hasCode || hasOAuthHash) {
      if (!params.has('next')) params.set('next', '/home')
      const qs = params.toString()
      window.location.replace(`/auth/callback${qs ? `?${qs}` : '?next=/home'}${hash}`)
    }
  }, [])

  // Prefetch da home para carregamento instantâneo após login
  useEffect(() => {
    router.prefetch('/home')
  }, [router])

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
      setOauthError('Login com Google não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch {
      setOauthError('Erro ao abrir login do Google.')
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
      setOauthError('Login com Apple não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch {
      setOauthError('Erro ao abrir login da Apple.')
    } finally {
      setOauthLoading(null)
    }
  }

  // Mostrar mensagem da URL se existir (vindo do cadastro)
  useEffect(() => {
    const mensagem = searchParams?.get('mensagem')
    if (mensagem) {
      createNotification(mensagem, 'info')
      // Remover parâmetro da URL para não mostrar novamente
      router.replace('/login')
    }
  }, [searchParams, router])

  const handleContinuar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const email = formData.email.trim()
    if (!email || !email.includes('@')) {
      setErrorMessage('Informe um email válido')
      createNotification('Informe um email válido', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.precisaDefinirSenha) {
        setLoginStep('first_access')
      } else {
        setLoginStep('password')
      }
    } catch {
      setLoginStep('password')
    } finally {
      setLoading(false)
    }
  }

  const handleCriarSenha = async () => {
    const email = formData.email.trim()
    if (!email || !email.includes('@')) return
    setEnviandoLinkSenha(true)
    setErrorMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/redefinir-senha`,
      })
      if (error) {
        setErrorMessage(error.message || 'Erro ao enviar link.')
        createNotification('Não foi possível enviar o link. Tente novamente.', 'warning')
      } else {
        setLinkSenhaEnviado(true)
        createNotification('Link enviado! Verifique seu email.', 'success')
      }
    } catch {
      setErrorMessage('Erro ao enviar link. Tente novamente.')
    } finally {
      setEnviandoLinkSenha(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null) // Limpar erro anterior

    if (!formData.email.trim() || !formData.email.includes('@')) {
      const msg = 'Informe um email válido'
      setErrorMessage(msg)
      createNotification(msg, 'warning')
      setLoading(false)
      return
    }

    if (!formData.senha.trim()) {
      const msg = 'Informe sua senha'
      setErrorMessage(msg)
      createNotification(msg, 'warning')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Iniciando login diretamente no cliente...')
      
      // IMPORTANTE: Fazer login diretamente no cliente para garantir que os cookies sejam salvos
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      })

      if (error) {
        console.error('❌ Erro no login:', error)
        console.error('❌ Código do erro:', error.status)
        console.error('❌ Mensagem do erro:', error.message)
        console.error('❌ Objeto completo do erro:', JSON.stringify(error, null, 2))
        
        let mensagemErro = 'Email ou senha incorretos'
        
        // Verificar diferentes tipos de erro do Supabase
        const errorMessage = (error.message || '').toLowerCase()
        const errorStatus = error.status || 0
        
        // Verificar também o código de erro do Supabase
        const errorCode = (error as any).code || ''
        
        console.log('🔍 Verificando erro - Message:', errorMessage, 'Status:', errorStatus, 'Code:', errorCode)
        
        // IMPORTANTE: Se email não estiver confirmado, BLOQUEAR login
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_not_confirmed') ||
            errorCode === 'email_not_confirmed') {
          // Email não foi confirmado - BLOQUEAR login
          console.log('🔒 Email não confirmado - Login bloqueado')
          mensagemErro = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada (incluindo spam).'
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid_credentials') ||
            errorMessage.includes('invalid email or password') ||
            errorMessage.includes('wrong password') ||
            errorCode === 'invalid_credentials') {
          mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('too many requests') || 
                   errorMessage.includes('rate_limit')) {
          mensagemErro = 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else if (errorMessage.includes('user not found') ||
                   errorMessage.includes('no user found')) {
          mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        } else {
          // Para outros erros 400, verificar se é email não confirmado
          if (errorStatus === 400) {
            // Pode ser email não confirmado ou outro erro
            mensagemErro = 'Erro ao fazer login. Verifique se seu email foi confirmado ou suas credenciais estão corretas.'
          } else {
            // Para outros erros, usar mensagem genérica mas clara
            mensagemErro = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
          }
          
          console.log('📢 Exibindo notificação:', mensagemErro)
          
          setErrorMessage(mensagemErro)
          createNotification(mensagemErro, 'warning')
          setLoading(false)
          return
        }
      }

      if (!data.user) {
        console.error('❌ Usuário não retornado')
        createNotification('Erro ao fazer login. Tente novamente.', 'warning')
        setLoading(false)
        return
      }

      // Verificar se email foi confirmado
      console.log('📧 Email confirmado?', !!data.user.email_confirmed_at)
      
      // Se veio do callback de confirmação, garantir que o estado está atualizado
      const emailConfirmed = searchParams?.get('emailConfirmed')
      if (emailConfirmed === 'true') {
        console.log('✅ Login após confirmação de email - estado deve estar atualizado')
      }

      console.log('✅ Login bem-sucedido!')
      console.log('👤 User ID:', data.user.id)
      console.log('🔐 Session:', data.session ? 'existe' : 'não existe')
      
      // Salvar email se "Lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('savedEmail', formData.email)
      } else {
        localStorage.removeItem('savedEmail')
      }
      
      if (!data.session) {
        console.error('❌ Nenhuma sessão retornada!')
        createNotification('Erro: Sessão não foi criada. Tente novamente.', 'warning')
        setLoading(false)
        return
      }
      
      // IMPORTANTE: Forçar refresh da página para garantir que o middleware reconheça a sessão
      // O Supabase SSR salva os cookies automaticamente, mas pode levar um momento
      console.log('⏳ Aguardando 1s para garantir que cookies foram salvos...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar cookies
      const cookies = document.cookie
      console.log('🍪 Cookies salvos:', cookies.length > 0 ? 'sim' : 'não')
      console.log('🍪 Lista:', cookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean).join(', ') || 'nenhum')
      
      // Verificar se a sessão foi salva
      const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
      
      if (verifyError) {
        console.error('❌ Erro ao verificar sessão:', verifyError)
      }
      
      if (!verifiedUser) {
        console.error('❌ Sessão não foi salva - tentando salvar manualmente...')
        
        // Tentar salvar manualmente
        try {
          const { error: setError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
          
          if (setError) {
            console.error('❌ Erro ao salvar manualmente:', setError)
            createNotification('Erro ao salvar sessão. Tente novamente.', 'warning')
            setLoading(false)
            return
          }
          
          console.log('✅ Sessão salva manualmente')
          
          // Verificar novamente
          const { data: { user: reVerified } } = await supabase.auth.getUser()
          if (!reVerified) {
            console.error('❌ Ainda não funcionou após salvar manualmente')
            createNotification('Erro: Não foi possível salvar a sessão. Tente novamente.', 'warning')
            setLoading(false)
            return
          }
          
          console.log('✅ Sessão verificada após salvar manualmente!')
        } catch (e: any) {
          console.error('❌ Erro ao salvar manualmente:', e)
          createNotification('Erro inesperado. Tente novamente.', 'warning')
          setLoading(false)
          return
        }
      } else {
        console.log('✅ Sessão verificada! Usuário:', verifiedUser.id)
      }

      // Mostrar popup de login concluído
      console.log('✅ Login bem-sucedido - mostrando popup...')
      setShowModalLoginConcluido(true)
      
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error)
      const errorMsg = error?.message || 'Erro desconhecido'
      const mensagemErro = errorMsg.toLowerCase().includes('invalid') || 
                          errorMsg.toLowerCase().includes('credentials') ||
                          errorMsg.toLowerCase().includes('password') ||
                          errorMsg.toLowerCase().includes('email')
        ? 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        : 'Erro inesperado: ' + errorMsg
      
      setErrorMessage(mensagemErro)
      try {
        createNotification(mensagemErro, 'warning')
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError)
      }
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrap min-h-screen flex flex-col md:flex-row bg-gray-50 md:bg-white dark:bg-[#1A1A1A]">
      {/* Área do login */}
      <div
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          const el = sectionRef.current
          if (!el || !e.touches[0]) return
          const rect = el.getBoundingClientRect()
          setMousePos({
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top,
          })
        }}
        onTouchMove={(e) => {
          const el = sectionRef.current
          if (!el || !e.touches[0]) return
          const rect = el.getBoundingClientRect()
          setMousePos({
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top,
          })
        }}
        onTouchEnd={() => setMousePos(null)}
        className="login-page-inner w-full md:w-1/2 relative overflow-hidden bg-gray-50 md:bg-white dark:bg-[#1A1A1A] flex items-center justify-center p-4 md:p-6 lg:p-8 min-h-screen md:min-h-0"
      >
        {/* Grade com linhas brancas ao passar o mouse (mobile: toque; desktop: hover) — igual página inicial */}
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
        <div className="w-full max-w-md bg-white dark:bg-[#252525] rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 p-6 sm:p-8 relative z-10">
          {/* Logo centralizado acima do login — apenas mobile */}
          <div className="md:hidden flex justify-center mb-5">
            <Image
              src={logoTipoFundoClaro}
              alt="PLENIPAY"
              width={80}
              height={80}
              className="object-contain"
            />
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
              Entrar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acesse sua conta para continuar
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
              Continuar com Google
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
              Continuar com Apple
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
              <span className="px-3 bg-white dark:bg-[#252525] text-gray-500 dark:text-gray-400">ou entre com e-mail</span>
            </div>
          </div>

          {loginStep === 'first_access' ? (
            <div className="space-y-3">
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3">
                  <p className="text-xs text-red-600 dark:text-red-300 font-medium">{errorMessage}</p>
                </div>
              )}
              {linkSenhaEnviado ? (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Enviamos um link para <strong>{formData.email}</strong>. Clique no link para criar sua senha e depois faça login normalmente.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('email')
                      setLinkSenhaEnviado(false)
                      setFormData(prev => ({ ...prev, senha: '' }))
                      setErrorMessage(null)
                    }}
                    className="text-sm text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium"
                  >
                    Usar outro e-mail
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Percebemos que este é seu primeiro acesso. Vamos criar uma senha para sua conta.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    E-mail: <strong>{formData.email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleCriarSenha}
                    disabled={enviandoLinkSenha}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviandoLinkSenha ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Enviando...
                      </span>
                    ) : (
                      'Criar senha'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('email')
                      setFormData(prev => ({ ...prev, senha: '' }))
                      setErrorMessage(null)
                    }}
                    className="text-sm text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium"
                  >
                    Usar outro e-mail
                  </button>
                </>
              )}
            </div>
          ) : (
          <form onSubmit={loginStep === 'email' ? handleContinuar : handleSubmit} className="space-y-3">
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3">
                <p className="text-xs text-red-600 dark:text-red-300 font-medium">{errorMessage}</p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                readOnly={loginStep === 'password'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20 transition-all disabled:opacity-70"
                placeholder="seu@email.com"
                style={{ fontSize: '16px' }}
              />
            </div>

            {loginStep === 'password' && (
              <>
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
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#1e4976] dark:focus:border-brand-aqua focus:ring-2 focus:ring-[#1e4976]/10 dark:focus:ring-brand-aqua/20 transition-all pr-10"
                      placeholder="Sua senha"
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-[#1e4976] dark:hover:text-brand-aqua transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                        id="remember-me"
                      />
                      <div className={`w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                        rememberMe 
                          ? 'bg-[#1e4976] dark:bg-brand-aqua border-[#1e4976] dark:border-brand-aqua shadow-sm' 
                          : 'border-gray-300 dark:border-gray-500 group-hover:border-[#1e4976] dark:group-hover:border-brand-aqua'
                      }`}>
                        {rememberMe && (
                          <svg 
                            className="w-3 h-3 text-white" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="3" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="select-none group-hover:text-[#1e4976] dark:group-hover:text-brand-aqua transition-colors">Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModalEsqueceuSenha(true)}
                    className="text-xs text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  {loginStep === 'email' ? 'Verificando...' : 'Entrando...'}
                </span>
              ) : (
                loginStep === 'email' ? 'Continuar' : 'Entrar'
              )}
            </button>

            {loginStep === 'password' && (
              <button
                type="button"
                onClick={() => {
                  setLoginStep('email')
                  setFormData(prev => ({ ...prev, senha: '' }))
                  setErrorMessage(null)
                }}
                className="text-sm text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium"
              >
                Usar outro e-mail
              </button>
            )}

            <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Não tem uma conta?{' '}
              <Link 
                href="/cadastro?plano=teste"
                className="text-[#1e4976] dark:text-brand-aqua hover:text-[#163a5f] dark:hover:text-brand-aqua/80 font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/cadastro?plano=teste')
                }}
              >
                Criar conta
              </Link>
            </p>
          </form>
          )}
        </div>
      </div>

      {/* Lado direito - Imagem (oculta no mobile para tela clean e só o formulário centralizado) */}
      <div className="hidden md:block w-full md:w-1/2 min-h-screen relative bg-[#0D1B2A]">
        <Image
          src="/banner cadastro.png"
          alt="PLENIPAY"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      
      {/* Popup de sucesso quando email foi confirmado via link */}
      <ModalEmailConfirmadoSucesso />
      
      {/* Modal Esqueceu a senha */}
      <ModalEsqueceuSenha
        isOpen={showModalEsqueceuSenha}
        onClose={() => setShowModalEsqueceuSenha(false)}
        emailPadrao={formData.email}
      />

      {/* Popup de sucesso quando login for concluído */}
      <ModalLoginConcluido
        isOpen={showModalLoginConcluido}
        onClose={() => {
          setShowModalLoginConcluido(false)
          window.location.href = '/home'
        }}
        titulo="Autenticado com Sucesso!"
        mensagem="Login realizado com sucesso! Você será redirecionado em instantes..."
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1A1A1A]">
        <Loader2 className="animate-spin text-[#1e4976] dark:text-brand-aqua" size={48} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
