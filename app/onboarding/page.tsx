'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppPlatform } from '@/components/AppPlatformProvider'
import { createClient } from '@/lib/supabase/client'
import { Bell, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'

/** No app nativo (iOS/Android) pede permissão nativa do sistema; no web usa Notification API */
async function requestNativeNotificationPermission(): Promise<boolean> {
  const cap = typeof window !== 'undefined' ? (window as any).Capacitor : undefined
  const isNative = cap?.isNativePlatform?.()
  if (isNative) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      // No iOS isso exibe o diálogo nativo "PleniPay gostaria de enviar notificações"
      const status = await PushNotifications.requestPermissions()
      if (status.receive === 'granted') {
        await PushNotifications.register()
        return true
      }
      return false
    } catch {
      return false
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  }
  return false
}

/** Perguntas do quiz (vida financeira, por que não guarda, mensagem dos 5 meses, é isso que quer?) */
const QUIZ_STEPS = [
  {
    id: 'vida_financeira',
    title: 'Como você descreveria sua vida financeira hoje?',
    options: [
      'Vivo no limite, não sobra nada',
      'Consigo guardar um pouco, mas sem planejamento',
      'Tenho controle, mas quero melhorar',
      'Já organizo bem e quero potencializar',
    ],
  },
  {
    id: 'por_que_nao_guarda',
    title: 'O que mais atrapalha você a guardar dinheiro?',
    options: [
      'Gastos imprevistos e dívidas',
      'Falta de disciplina e impulso',
      'Não saber por onde começar',
      'Já guardo, quero só otimizar',
    ],
  },
  {
    id: 'cinco_meses',
    title: 'Em 5 meses, com um método simples, muita gente consegue juntar um valor que nem imaginava. Você acredita que pode ser o seu caso?',
    options: [
      'Sim, quero muito mudar isso',
      'Acredito que com ajuda consigo',
      'Já tentei antes, mas estou disposto de novo',
      'Quero ver os resultados primeiro',
    ],
  },
  {
    id: 'e_isso_que_quer',
    title: 'É isso que você quer? Ter controle, reduzir a ansiedade e ver seu dinheiro crescer?',
    options: [
      'Sim, é exatamente isso!',
      'Quero começar o quanto antes',
      'Preciso de uma ferramenta que me guie',
      'Sim, quero conhecer os planos',
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const isApp = useAppPlatform()
  const [step, setStep] = useState<'welcome' | 'notifications' | 'quiz' | 'done'>('welcome')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward')
  const [exiting, setExiting] = useState(false)

  // Só exibir onboarding no app; senão redireciona para /home
  useEffect(() => {
    if (!isApp) {
      router.replace('/home')
      return
    }
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login?next=/onboarding')
        return
      }
      if ((user.user_metadata as Record<string, unknown>)?.app_onboarding_completed_at) {
        router.replace('/home')
        return
      }
      setLoading(false)
    }
    check()
  }, [isApp, router])

  const requestNotificationPermission = async () => {
    setRequestingPermission(true)
    try {
      await requestNativeNotificationPermission()
    } catch (_) {
      // Permissão negada ou erro: segue para o quiz mesmo assim
    } finally {
      setRequestingPermission(false)
      setTransitionDirection('forward')
      setStep('quiz')
    }
  }

  const handleQuizBack = () => {
    setTransitionDirection('back')
    setExiting(true)
    setTimeout(() => {
      setExiting(false)
      if (quizIndex > 0) {
        setQuizIndex((prev) => prev - 1)
      } else {
        setStep('notifications')
      }
    }, 300)
  }

  const handleQuizAnswer = (value: string) => {
    const current = QUIZ_STEPS[quizIndex]
    setQuizAnswers(prev => ({ ...prev, [current.id]: value }))
    setTransitionDirection('forward')
    if (quizIndex < QUIZ_STEPS.length - 1) {
      setQuizIndex(prev => prev + 1)
    } else {
      setStep('done')
    }
  }

  const finishOnboarding = async () => {
    setRedirecting(true)
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { app_onboarding_completed_at: new Date().toISOString() },
      })
      router.replace('/planos?from=app')
    } catch {
      router.replace('/planos?from=app')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A]" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    )
  }

  // ——— Welcome: bem-vindo + pedido de notificações (layout clean, animado)
  if (step === 'welcome' || step === 'notifications') {
    const isWelcome = step === 'welcome'
    return (
      <div
        className="min-h-screen flex flex-col bg-[#0D1B2A] text-white"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className={`flex-1 flex flex-col items-center justify-center px-8 py-10 max-w-[360px] mx-auto ${step === 'notifications' && transitionDirection === 'back' ? 'onboarding-enter-left' : 'onboarding-enter-right'}`}>
          {/* Logo minimalista */}
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-12 ring-1 ring-white/10">
            <Image src="/logo-header.png" alt="PleniPay" width={80} height={30} className="h-8 w-auto object-contain opacity-95" priority />
          </div>
          <h1 className="text-[1.75rem] font-semibold text-center text-white tracking-tight mb-3">
            {isWelcome ? 'Bem-vindo ao PleniPay' : 'Ative as notificações'}
          </h1>
          <p className="text-[0.9375rem] text-white/70 text-center leading-relaxed mb-10">
            {isWelcome
              ? 'Controle suas finanças de forma simples e veja seu dinheiro crescer.'
              : 'Receba lembretes e avisos no seu celular e não perca o controle das suas metas.'}
          </p>
          {isWelcome ? (
            <button
              type="button"
              onClick={() => setStep('notifications')}
              className="w-full py-3.5 rounded-xl bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0a0f14] font-medium text-[0.9375rem] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] onboarding-btn-in-0"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={requestNotificationPermission}
                disabled={requestingPermission}
                className="w-full py-3.5 rounded-xl bg-[#00C2FF] hover:bg-[#00a8e0] disabled:opacity-70 text-[#0a0f14] font-medium text-[0.9375rem] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] onboarding-btn-in-0"
              >
                {requestingPermission ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" /> Ativar notificações
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setTransitionDirection('forward'); setStep('quiz') }}
                className="w-full py-3 text-white/50 text-[0.8125rem] hover:text-white/70 transition-colors onboarding-btn-in-1"
              >
                Agora não
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ——— Quiz: centralizado, botão voltar, animação entrada/saída e botões
  if (step === 'quiz') {
    const current = QUIZ_STEPS[quizIndex]
    const contentAnimation = exiting
      ? 'onboarding-exit-right'
      : transitionDirection === 'back'
        ? 'onboarding-enter-left'
        : 'onboarding-enter-right'
    return (
      <div className="min-h-screen flex flex-col bg-[#0D1B2A] text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header fixo: voltar + progresso */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3">
          <button
            type="button"
            onClick={handleQuizBack}
            disabled={exiting}
            className="flex items-center gap-1.5 py-2 pr-2 -ml-2 text-white/80 hover:text-white disabled:opacity-50 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[0.9375rem] font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00C2FF]" />
            <span className="text-white/60 text-[0.8125rem]">Pergunta {quizIndex + 1} de {QUIZ_STEPS.length}</span>
          </div>
        </div>
        {/* Conteúdo centralizado no meio da tela */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 w-full">
          <div key={quizIndex} className={`w-full max-w-[360px] ${contentAnimation}`}>
            <h2 className="text-[1.25rem] font-semibold mb-8 leading-snug text-white text-center">{current.title}</h2>
            <div className="space-y-2.5">
              {current.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQuizAnswer(opt)}
                  className={['onboarding-btn-in-0', 'onboarding-btn-in-1', 'onboarding-btn-in-2', 'onboarding-btn-in-3'][i] + ' w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-left text-[0.9375rem] text-white font-medium hover:bg-white/10 active:scale-[0.99] transition-colors'}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ——— Done: CTA para planos (animação de entrada)
  return (
    <div className="min-h-screen flex flex-col bg-[#0D1B2A] text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 max-w-[360px] mx-auto onboarding-enter-right">
        <div className="w-14 h-14 rounded-2xl bg-[#00C2FF]/15 flex items-center justify-center mb-8 ring-1 ring-[#00C2FF]/20">
          <Sparkles className="w-7 h-7 text-[#00C2FF]" />
        </div>
        <h1 className="text-[1.75rem] font-semibold text-center mb-3 tracking-tight">
          Tudo certo! Agora escolha seu plano
        </h1>
        <p className="text-white/70 text-center text-[0.9375rem] leading-relaxed mb-8">
          Com o método certo, em poucos meses você pode estar guardando bem mais.
        </p>
        <button
          type="button"
          onClick={finishOnboarding}
          disabled={redirecting}
          className="w-full py-3.5 rounded-xl bg-[#00C2FF] hover:bg-[#00a8e0] disabled:opacity-70 text-[#0a0f14] font-medium text-[0.9375rem] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] onboarding-btn-in-0"
        >
          {redirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ver planos <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}
