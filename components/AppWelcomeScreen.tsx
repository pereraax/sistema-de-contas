'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppPlatform } from '@/components/AppPlatformProvider'
import { X, Loader2, Eye, EyeOff, Mail, BarChart2, ChevronLeft, Check, Circle } from 'lucide-react'

/** Logo oficial Apple (maçã mordida) em preto */
function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#000"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  )
}

/** Ícone Google "G" multicolor (estilo do print) */
function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const PLANOS = [
  { id: 'teste' as const, nome: 'Gratuito', preco: 'R$ 0', periodo: 'sempre grátis', destaque: false },
  { id: 'basico' as const, nome: 'Básico', preco: 'R$ 9,90', periodo: '/mês', testeGratis: '7 dias grátis', destaque: false },
  { id: 'premium' as const, nome: 'Premium', preco: 'R$ 49,90', periodo: '/mês', destaque: true },
]

const ONBOARDING_SLIDES_COUNT = 4

export default function AppWelcomeScreen() {
  const router = useRouter()
  const isApp = useAppPlatform()
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'welcome' | 'auth' | 'login' | 'cadastro'>('splash')
  const [slideIndex, setSlideIndex] = useState(0)
  const [showPlanos, setShowPlanos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', senha: '' })
  const [loginView, setLoginView] = useState<'choice' | 'form'>('choice')
  const [cadastroView, setCadastroView] = useState<'choice' | 'form'>('choice')
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', senha: '' })
  const [showCadastroPassword, setShowCadastroPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null)
  const [devLoading, setDevLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const isDevOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(window.location.hostname))
  const [authReveal, setAuthReveal] = useState(false)
  const [loginReveal, setLoginReveal] = useState(false)
  const [authExiting, setAuthExiting] = useState(false)
  const [loginExiting, setLoginExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ANIM_DURATION_MS = 450

  // Persistir modo app no navegador/webview para SSR e para retorno do OAuth.
  useEffect(() => {
    if (!isApp) return
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('platform', 'app')
    } catch {
      // ignore
    }
    const isHttps = window.location.protocol === 'https:'
    const secure = isHttps ? '; Secure' : ''
    document.cookie = `platform=app; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
  }, [isApp])

  const handleAuthBack = () => {
    setAuthExiting(true)
  }

  const handleAuthTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'transform' || !authExiting) return
    setPhase('onboarding')
    setAuthExiting(false)
  }

  const handleLoginBack = () => {
    setLoginExiting(true)
  }

  const handleLoginTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'transform' || !loginExiting) return
    setPhase('auth')
    setErrorMessage(null)
    setLoginExiting(false)
  }

  const getOAuthRedirectUrl = () => {
    if (typeof window === 'undefined') return ''
    // CRÍTICO: usar SEMPRE a origem atual (localhost em dev, plenipay.com em prod).
    const origin = window.location.origin
    // No app: ir direto para /onboarding (bem-vindo + notificações + quiz → planos). No site: /home.
    const next = isApp ? '/onboarding' : '/home'
    const q = new URLSearchParams({ next })
    if (isApp) q.set('platform', 'app')
    const url = `${origin}/auth/callback?${q.toString()}`
    if (typeof window !== 'undefined' && origin.includes('localhost')) {
      console.log('[OAuth] redirectTo (local):', url, '- Confira em Supabase → Redirect URLs se http://localhost:3000/auth/callback está na lista.')
    }
    return url
  }

  const getOAuthErrorMessage = (provider: string, error: { message?: string } | null) => {
    const msg = error?.message?.toLowerCase() || ''
    if (msg.includes('not enabled') || msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
      return `Login com ${provider} não está habilitado. No painel do Supabase: Authentication → Providers → ative "${provider}" e configure.`
    }
    return error?.message || `Não foi possível abrir o login com ${provider}.`
  }

  const handleSignInWithApple = async () => {
    setOauthError(null)
    setOauthLoading('apple')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: getOAuthRedirectUrl() },
      })
      if (error) {
        setOauthError(getOAuthErrorMessage('Apple', error))
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setOauthError('Login com Apple não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch (e) {
      setOauthError('Erro ao abrir login da Apple.')
    } finally {
      setOauthLoading(null)
    }
  }

  const handleSignInWithGoogle = async () => {
    setOauthError(null)
    setOauthLoading('google')
    const redirectTo = getOAuthRedirectUrl()
    if (!redirectTo) {
      setOauthError('URL de redirect não disponível.')
      return
    }
    if (typeof window !== 'undefined' && window.location.origin.includes('localhost') && !redirectTo.includes('localhost')) {
      console.error('[OAuth] ERRO: você está em localhost mas o redirectTo não é localhost:', redirectTo)
      setOauthError('Redirect está apontando para produção. Recarregue a página em http://localhost:3000?platform=app')
      return
    }
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) {
        setOauthError(getOAuthErrorMessage('Google', error))
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setOauthError('Login com Google não disponível. Habilite em Supabase → Authentication → Providers.')
    } catch (e) {
      setOauthError('Erro ao abrir login do Google.')
    } finally {
      setOauthLoading(null)
    }
  }

  const handleDevLogin = async () => {
    if (!isDevOrigin) return
    setOauthError(null)
    setDevLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        setOauthError('Ative "Anonymous" em Supabase → Authentication → Providers.')
        setDevLoading(false)
        return
      }
      if (data?.session) {
        router.push('/onboarding?platform=app')
        return
      }
      setOauthError('Não foi possível entrar como dev.')
    } catch {
      setOauthError('Erro ao entrar como dev.')
    }
    setDevLoading(false)
  }

  // Splash: logo 2s depois vai para onboarding
  useEffect(() => {
    if (phase !== 'splash') return
    const t = setTimeout(() => setPhase('onboarding'), 2200)
    return () => clearTimeout(t)
  }, [phase])

  // Animação de baixo para cima: tela auth
  useEffect(() => {
    if (phase === 'auth') {
      setAuthReveal(false)
      const t = setTimeout(() => setAuthReveal(true), 30)
      return () => clearTimeout(t)
    }
    setAuthReveal(false)
  }, [phase])

  // Animação de baixo para cima: tela login
  useEffect(() => {
    if (phase === 'login') {
      setLoginView('choice')
      setLoginReveal(false)
      const t = setTimeout(() => setLoginReveal(true), 30)
      return () => clearTimeout(t)
    }
    setLoginReveal(false)
  }, [phase])

  // Não resetar cadastroView ao entrar em cadastro: "Continuar com E-mail" já leva direto ao form

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    if (!formData.email.trim() || !formData.senha.trim()) {
      setErrorMessage('Preencha email e senha.')
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha,
      })
      if (error) {
        const msg = error.message?.toLowerCase().includes('email not confirmed')
          ? 'Confirme seu email antes de entrar.'
          : 'Email ou senha incorretos.'
        setErrorMessage(msg)
        setLoading(false)
        return
      }
      if (data?.user) {
        await new Promise(r => setTimeout(r, 400))
        router.push('/home')
        return
      }
    } catch {
      setErrorMessage('Erro ao entrar. Tente de novo.')
    }
    setLoading(false)
  }

  const handleSelecionarPlano = (planoId: 'teste' | 'basico' | 'premium') => {
    setShowPlanos(false)
    if (isApp) {
      router.push(planoId === 'teste' ? '/onboarding' : `/onboarding?plano=${planoId}`)
      return
    }
    router.push(`/cadastro?plano=${planoId}`)
  }

  const goToSlide = (index: number) => {
    const next = Math.max(0, Math.min(index, ONBOARDING_SLIDES_COUNT - 1))
    setSlideIndex(next)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: next * scrollRef.current.offsetWidth, behavior: 'smooth' })
    }
  }

  const skipOnboarding = () => {
    setPhase('welcome')
  }

  // ——— Splash: só logo (fundo azul escuro Plenipay)
  if (phase === 'splash') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D1B2A]">
        <div className="opacity-0 animate-[appSplashFade_0.5s_ease-out_forwards]">
          <Image
            src="/logo-header.png"
            alt="PLENIPAY"
            width={160}
            height={56}
            className="h-14 w-auto object-contain brightness-0 invert"
            priority
          />
        </div>
      </div>
    )
  }

  // ——— Onboarding: gradiente Plenipay, slider com card placeholder, bottom sheet 45%
  const onboardingScreen = (
    <div className="fixed inset-0 z-[100] flex flex-col app-onboarding-bg overflow-hidden">
      <div
        ref={scrollRef}
        className="app-onboarding-scroll flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
        onScroll={(e) => {
          const el = e.currentTarget
          const i = Math.round(el.scrollLeft / el.offsetWidth)
          if (i !== slideIndex) setSlideIndex(i)
        }}
      >
        {Array.from({ length: ONBOARDING_SLIDES_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-full flex flex-col items-center justify-center px-6 snap-center min-h-full"
            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: '1rem' }}
          >
            <div className="app-card-phone w-full max-w-[300px] rounded-[28px] overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-full h-full min-h-[260px] bg-[#E6F7FF]/40 border border-[#00C2FF]/10 rounded-2xl m-3" aria-hidden />
            </div>
          </div>
        ))}
      </div>
      <div
        className="flex-shrink-0 w-full rounded-t-[32px] bg-[#0a1628] border-t border-[#00C2FF]/20 px-6 pt-8 pb-8 flex flex-col items-center"
        style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 24px))' }}
      >
        <h1 className="text-xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight">
          Controle total dos seus cartões em um só lugar
        </h1>
        <p className="text-white/85 text-sm text-center max-w-[320px] mb-6 leading-snug">
          Gerencie limites, acompanhe faturas e organize seus pagamentos de forma simples, rápida e inteligente.
        </p>
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: ONBOARDING_SLIDES_COUNT }).map((_, j) => (
            <button
              key={j}
              type="button"
              onClick={() => goToSlide(j)}
              className={`rounded-full transition-all duration-300 ${
                j === slideIndex ? 'w-6 h-2 bg-[#00C2FF]' : 'w-2 h-2 bg-white/35'
              }`}
              aria-label={`Slide ${j + 1}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => setPhase('auth')} className="app-btn-pill block w-full py-4 rounded-full text-white font-semibold text-center text-base">
          Criar conta
        </button>
        <button type="button" onClick={() => setPhase('auth')} className="mt-4 text-[#00C2FF] text-sm font-medium">
          Já tenho conta
        </button>
      </div>
    </div>
  )

  if (phase === 'onboarding' && !authExiting) {
    return onboardingScreen
  }

  // ——— Tela de autenticação: entra por cima (subindo), sai descendo com onboarding já visível por baixo
  if (phase === 'auth' || authExiting) {
    return (
      <>
        {authExiting && (
          <div className="fixed inset-0 z-[99] pointer-events-none" aria-hidden>
            {onboardingScreen}
          </div>
        )}
        <div
          className={`fixed inset-0 z-[100] flex flex-col app-onboarding-bg overflow-hidden transition-transform ${
            authExiting
              ? 'duration-[450ms] ease-in translate-y-full'
              : `duration-300 ease-out ${authReveal ? 'translate-y-0' : 'translate-y-full'}`
          }`}
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          onTransitionEnd={handleAuthTransitionEnd}
        >
        {/* Botão Voltar: canto superior esquerdo, estilo Plenipay */}
        <button
          type="button"
          onClick={handleAuthBack}
          className="fixed top-0 left-0 z-[102] m-4 p-2.5 rounded-full bg-white/10 border border-[#00C2FF]/25 text-[#00C2FF] flex items-center justify-center transition-transform active:scale-95 hover:bg-white/15"
          style={{ marginTop: 'max(1rem, env(safe-area-inset-top))' }}
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-full">
          {/* Ícone Plenipay: container quadrado com gradiente e glow */}
          <div
            className="app-auth-icon-box w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
            aria-hidden
          >
            <BarChart2 className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight">
            É hora de iniciar sua jornada!
          </h1>
          <p className="text-white/75 text-base text-center max-w-[320px] mb-10 leading-snug">
            Crie sua conta e comece a transformar suas finanças.
          </p>

          {/* Botões de autenticação */}
          <div className="w-full max-w-[320px] space-y-4">
            {oauthError && (
              <p className="text-sm text-red-300 bg-red-500/20 rounded-xl px-3 py-2 text-center">{oauthError}</p>
            )}
            <button
              type="button"
              disabled={oauthLoading !== null}
              className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70"
              onClick={handleSignInWithApple}
              aria-label="Continuar com Apple"
            >
              {oauthLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <AppleLogoIcon className="w-5 h-5 flex-shrink-0" />}
              <span>Continuar com Apple</span>
            </button>
            <button
              type="button"
              disabled={oauthLoading !== null}
              className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70"
              onClick={handleSignInWithGoogle}
              aria-label="Continuar com Google"
            >
              {oauthLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <GoogleGIcon className="w-5 h-5 flex-shrink-0" />}
              <span>Continuar com Google</span>
            </button>
            <button
              type="button"
              onClick={() => { setOauthError(null); setPhase('cadastro'); setCadastroView('form'); }}
              className="app-btn-pill w-full py-4 rounded-full flex items-center justify-center gap-3 text-white font-semibold text-base transition-transform active:scale-[0.98]"
            >
              <Mail className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={2} />
              <span>Continuar com E-mail</span>
            </button>
            {isDevOrigin && (
              <>
                <button type="button" disabled={devLoading} onClick={handleDevLogin} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-white/80 text-sm border border-dashed border-white/40 hover:border-white/60 transition-colors disabled:opacity-60">
                  {devLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{devLoading ? 'Entrando...' : '🔧 Entrar como dev (pula Google, só local)'}</span>
                </button>
                <Link href="/?platform=site" className="block text-center text-white/60 text-xs mt-2 hover:text-white/80">
                  Ver versão site (desenvolvimento)
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPhase('login')}
            className="mt-8 text-[#00C2FF] text-base font-medium"
          >
            Entrar
          </button>

          {/* Termos de Uso logo abaixo de Entrar */}
          <p className="text-center text-white/55 text-xs px-2 mt-4 max-w-[320px] leading-snug">
            Ao continuar você estará concordando com os{' '}
            <Link href="/termos" className="text-[#00C2FF] font-medium hover:underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="text-[#00C2FF] font-medium hover:underline">
              Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
      </>
    )
  }

  // Barra fixa inferior (tela welcome)
  const BottomBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-[101] px-5 pt-5 border-t border-[#00C2FF]/20 bg-[#0a1628]"
      style={{ paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 16px))' }}
    >
      <button
        type="button"
        onClick={() => setPhase('auth')}
        className="block w-full py-4 rounded-2xl bg-[#007A99] hover:bg-[#006688] text-white font-semibold text-center text-base transition-colors"
      >
        Cadastrar
      </button>
      <button
        type="button"
        onClick={() => setPhase('auth')}
        className="block w-full mt-3 text-[#00C2FF] text-sm font-medium text-center"
      >
        Já sou cadastrado
      </button>
    </div>
  )

  // ——— Welcome: conteúdo logo acima da barra, barra com fundo
  if (phase === 'welcome') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#0D1B2A] overflow-auto">
        <div className="flex-1 flex flex-col items-center justify-end px-5 pt-6 pb-4 min-h-0">
          <div className="w-full flex flex-col items-center">
          <div
            className="w-full max-w-[260px] h-[200px] rounded-[28px] bg-[#E6F7FF] flex items-center justify-center mb-8 border border-[#00C2FF]/20"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px -15px rgba(0, 194, 255, 0.2)' }}
          >
            <Image src="/logo-header.png" alt="PLENIPAY" width={100} height={36} className="h-9 w-auto object-contain opacity-90" priority />
          </div>
          <h1 className="text-xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight">
            O jeito mais fácil de controlar suas finanças
          </h1>
          <p className="text-white/90 text-sm text-center max-w-[300px] mb-2">
            Cadastre-se, crie planejamentos, controle todos os seus gastos e muito mais!
          </p>
          <button type="button" onClick={() => setShowPlanos(true)} className="text-white/60 text-xs mt-2 mb-2">
            Ver planos
          </button>
          </div>
        </div>
        <BottomBar />
        {showPlanos && (
          <PlanosModal onClose={() => setShowPlanos(false)} onSelect={handleSelecionarPlano} />
        )}
      </div>
    )
  }

  // ——— Login: opções (igual print) ou formulário e-mail/senha
  if (phase === 'login') {
    const isLoginForm = loginView === 'form'
    return (
      <div
        className={`fixed inset-0 z-[100] flex flex-col app-onboarding-bg overflow-auto transition-transform ${
          loginExiting
            ? 'duration-[450ms] ease-in translate-y-full'
            : `duration-300 ease-out ${loginReveal ? 'translate-y-0' : 'translate-y-full'}`
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onTransitionEnd={handleLoginTransitionEnd}
      >
        <button
          type="button"
          onClick={isLoginForm ? () => setLoginView('choice') : handleLoginBack}
          className="fixed top-0 left-0 z-[102] m-4 p-2.5 rounded-full bg-white/10 border border-[#00C2FF]/25 text-[#00C2FF] flex items-center justify-center transition-transform active:scale-95"
          style={{ marginTop: 'max(1rem, env(safe-area-inset-top))' }}
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {!isLoginForm ? (
          /* Opções de entrar (igual ao print: ícone + título + 3 botões) */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-full">
            <div className="app-auth-icon-box w-16 h-16 rounded-2xl flex items-center justify-center mb-8" aria-hidden>
              <BarChart2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight">Entrar</h1>
            <p className="text-white/75 text-base text-center max-w-[320px] mb-10 leading-snug">
              Acesse sua conta com Apple, Google ou E-mail.
            </p>
            <div className="w-full max-w-[320px] space-y-4">
              {oauthError && (
                <p className="text-sm text-red-300 bg-red-500/20 rounded-xl px-3 py-2 text-center">{oauthError}</p>
              )}
              <button type="button" disabled={oauthLoading !== null} className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70" onClick={handleSignInWithApple} aria-label="Continuar com Apple">
                {oauthLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <AppleLogoIcon className="w-5 h-5 flex-shrink-0" />}
                <span>Continuar com Apple</span>
              </button>
              <button type="button" disabled={oauthLoading !== null} className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70" onClick={handleSignInWithGoogle} aria-label="Continuar com Google">
                {oauthLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <GoogleGIcon className="w-5 h-5 flex-shrink-0" />}
                <span>Continuar com Google</span>
              </button>
              <button type="button" onClick={() => { setOauthError(null); setLoginView('form'); }} className="app-btn-pill w-full py-4 rounded-full flex items-center justify-center gap-3 text-white font-semibold text-base transition-transform active:scale-[0.98]">
                <Mail className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={2} />
                <span>Continuar com E-mail</span>
              </button>
            </div>
          </div>
        ) : (
          /* Formulário E-mail + Senha (estilo print) */
          <div className="flex-1 flex flex-col items-center px-6 py-8 pt-14 pb-8">
            <div className="w-full max-w-[320px]">
              <h2 className="text-xl font-bold text-white text-center mb-6">Entrar com E-mail</h2>
              <form onSubmit={handleLogin} className="space-y-5">
                {errorMessage && (
                  <p className="text-sm text-red-300 bg-red-500/20 rounded-xl px-3 py-2">{errorMessage}</p>
                )}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-[#00C2FF]/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 text-base"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={e => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-[#00C2FF]/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 pr-12 text-base"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <Link href="/auth/redefinir-senha" className="block text-sm text-[#00C2FF] text-right mb-4">Esqueceu a senha?</Link>
                <button type="submit" disabled={loading} className="app-btn-pill w-full py-4 rounded-full text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                  {loading ? <><Loader2 size={20} className="animate-spin" /> Entrando...</> : 'Entrar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ——— Cadastro: opções (Apple, Google, E-mail) ou formulário Nome + E-mail + Senha
  if (phase === 'cadastro') {
    const isCadastroForm = cadastroView === 'form'
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cadastroForm.email)
    const senha = cadastroForm.senha
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha)
    const hasUpper = /[A-Z]/.test(senha)
    const hasLower = /[a-z]/.test(senha)
    const hasNumber = /\d/.test(senha)
    const hasMin8 = senha.length >= 8
    const senhaOk = hasSpecial && hasUpper && hasLower && hasNumber && hasMin8
    const formValid = cadastroForm.nome.trim().length >= 2 && emailValid && senhaOk

    const handleCadastroSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!formValid) return
      router.push(`/cadastro?plano=teste&nome=${encodeURIComponent(cadastroForm.nome)}&email=${encodeURIComponent(cadastroForm.email)}`)
    }

    return (
      <div className="fixed inset-0 z-[100] flex flex-col app-onboarding-bg overflow-auto" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button
          type="button"
          onClick={isCadastroForm ? () => setCadastroView('choice') : () => setPhase('auth')}
          className="fixed top-0 left-0 z-[102] m-4 p-2.5 rounded-full bg-white/10 border border-[#00C2FF]/25 text-[#00C2FF] flex items-center justify-center transition-transform active:scale-95"
          style={{ marginTop: 'max(1rem, env(safe-area-inset-top))' }}
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {!isCadastroForm ? (
          /* Opções de cadastro: ícone + Bem-vindo + 3 botões */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-full">
            <div className="app-auth-icon-box w-16 h-16 rounded-2xl flex items-center justify-center mb-8" aria-hidden>
              <BarChart2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight">Bem-vindo à Plenipay!</h1>
            <p className="text-white/75 text-base text-center max-w-[320px] mb-10 leading-snug">
              Crie sua conta com Apple, Google ou E-mail.
            </p>
            <div className="w-full max-w-[320px] space-y-4">
              {oauthError && (
                <p className="text-sm text-red-300 bg-red-500/20 rounded-xl px-3 py-2 text-center">{oauthError}</p>
              )}
              <button type="button" disabled={oauthLoading !== null} className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70" onClick={handleSignInWithApple} aria-label="Continuar com Apple">
                {oauthLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <AppleLogoIcon className="w-5 h-5 flex-shrink-0" />}
                <span>Continuar com Apple</span>
              </button>
              <button type="button" disabled={oauthLoading !== null} className="app-auth-btn-light w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#0D1B2A] font-semibold text-base transition-transform active:scale-[0.98] disabled:opacity-70" onClick={handleSignInWithGoogle} aria-label="Continuar com Google">
                {oauthLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <GoogleGIcon className="w-5 h-5 flex-shrink-0" />}
                <span>Continuar com Google</span>
              </button>
              <button type="button" onClick={() => { setOauthError(null); setCadastroView('form'); }} className="app-btn-pill w-full py-4 rounded-full flex items-center justify-center gap-3 text-white font-semibold text-base transition-transform active:scale-[0.98]">
                <Mail className="w-5 h-5 flex-shrink-0 text-white" strokeWidth={2} />
                <span>Continuar com E-mail</span>
              </button>
              {isDevOrigin && (
                <>
                  <button type="button" disabled={devLoading} onClick={handleDevLogin} className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-white/80 text-sm border border-dashed border-white/40 hover:border-white/60 transition-colors disabled:opacity-60">
                    {devLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{devLoading ? 'Entrando...' : '🔧 Entrar como dev (pula Google, só local)'}</span>
                  </button>
                  <Link href="/?platform=site" className="block text-center text-white/60 text-xs mt-2 hover:text-white/80">
                    Ver versão site (desenvolvimento)
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Formulário cadastro: Nome, E-mail, Senha (critérios), Concordar e Continuar */
          <div className="flex-1 flex flex-col items-center px-6 py-8 pt-14 pb-8 overflow-auto">
            <div className="w-full max-w-[320px]">
              <h2 className="text-xl font-bold text-white text-center mb-6">Bem-vindo à Plenipay!</h2>
              <form onSubmit={handleCadastroSubmit} className="space-y-5">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={cadastroForm.nome}
                    onChange={e => setCadastroForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-[#00C2FF]/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 text-base"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={cadastroForm.email}
                    onChange={e => setCadastroForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-[#00C2FF]/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 text-base"
                    placeholder="seu@email.com"
                  />
                  {(cadastroForm.email.length > 0 || emailValid) && (
                    <p className={`flex items-center gap-2 mt-1.5 text-xs ${emailValid ? 'text-[#00C2FF]' : 'text-white/45'}`}>
                      {emailValid ? <Check className="w-4 h-4 flex-shrink-0" /> : <Circle className="w-4 h-4 flex-shrink-0" />}
                      {emailValid ? 'E-mail válido' : 'E-mail inválido'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showCadastroPassword ? 'text' : 'password'}
                      value={cadastroForm.senha}
                      onChange={e => setCadastroForm(prev => ({ ...prev, senha: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-[#00C2FF]/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/50 pr-12 text-base"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowCadastroPassword(!showCadastroPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" aria-label={showCadastroPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                      {showCadastroPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      { ok: hasSpecial, label: 'Caractere especial' },
                      { ok: hasUpper, label: 'Letra maiúscula' },
                      { ok: hasLower, label: 'Letra minúscula' },
                      { ok: hasNumber, label: 'Números' },
                      { ok: hasMin8, label: 'Mínimo de 8 caracteres' },
                    ].map(({ ok, label }) => (
                      <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-[#00C2FF]' : 'text-white/45'}`}>
                        {ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <Circle className="w-4 h-4 flex-shrink-0" />}
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="submit"
                  disabled={!formValid}
                  className={`w-full py-4 rounded-full font-semibold text-base transition-transform active:scale-[0.98] flex items-center justify-center ${
                    formValid
                      ? 'app-btn-pill text-white'
                      : 'bg-white/20 text-white/60 cursor-not-allowed'
                  }`}
                >
                  Concordar e Continuar
                </button>
              </form>
              <p className="text-center text-white/55 text-xs mt-6 leading-snug">
                Ao continuar você estará concordando com os{' '}
                <Link href="/termos" className="text-[#00C2FF] font-medium hover:underline">Termos de Uso</Link>{' '}
                e{' '}
                <Link href="/privacidade" className="text-[#00C2FF] font-medium hover:underline">Privacidade</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

function PlanosModal({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (id: 'teste' | 'basico' | 'premium') => void
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="app-glass w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl mx-4 mb-0 sm:mb-4"
        style={{ marginBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-[#0D1B2A] dark:text-white">Planos</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#0D1B2A] dark:text-white"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {PLANOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                p.destaque
                  ? 'border-[#007A99] bg-[#007A99]/10 dark:bg-[#00C2FF]/10'
                  : 'border-gray-200 dark:border-white/15 bg-white/50 dark:bg-white/5 hover:border-[#007A99]/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-[#0D1B2A] dark:text-white">{p.nome}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {p.preco}{p.periodo}
                    {p.testeGratis && <span className="text-[#007A99]"> · {p.testeGratis}</span>}
                  </p>
                </div>
                <span className="text-sm font-medium text-[#007A99]">Assinar</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
