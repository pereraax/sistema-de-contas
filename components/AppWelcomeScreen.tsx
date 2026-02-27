'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Eye, EyeOff, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const PLANOS = [
  { id: 'teste' as const, nome: 'Gratuito', preco: 'R$ 0', periodo: 'sempre grátis', destaque: false },
  { id: 'basico' as const, nome: 'Básico', preco: 'R$ 19,90', periodo: '/mês', testeGratis: '7 dias grátis', destaque: false },
  { id: 'premium' as const, nome: 'Premium', preco: 'R$ 49,90', periodo: '/mês', destaque: true },
]

const SLIDES = [
  { title: 'Controle suas finanças', subtitle: 'Tudo em um só lugar: receitas, despesas, metas e relatórios.' },
  { title: 'Acompanhe seu saldo', subtitle: 'Receitas, despesas e contas organizadas na palma da mão.', showPreview: true },
  { title: 'Metas e planejamento', subtitle: 'Defina metas e acompanhe sua evolução financeira.' },
  { title: 'Relatórios completos', subtitle: 'Tenha uma visão clara de onde vai seu dinheiro.' },
  { title: 'O jeito mais fácil de controlar suas finanças', subtitle: 'Cadastre-se, crie planejamentos, controle todos os seus gastos e muito mais!' },
]

export default function AppWelcomeScreen() {
  const router = useRouter()
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'welcome' | 'login'>('splash')
  const [slideIndex, setSlideIndex] = useState(0)
  const [showPlanos, setShowPlanos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', senha: '' })
  const scrollRef = useRef<HTMLDivElement>(null)

  // Splash: logo 2s depois vai para onboarding
  useEffect(() => {
    if (phase !== 'splash') return
    const t = setTimeout(() => setPhase('onboarding'), 2200)
    return () => clearTimeout(t)
  }, [phase])

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
    router.push(`/cadastro?plano=${planoId}`)
  }

  const goToSlide = (index: number) => {
    const next = Math.max(0, Math.min(index, SLIDES.length - 1))
    setSlideIndex(next)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: next * scrollRef.current.offsetWidth, behavior: 'smooth' })
    }
  }

  const skipOnboarding = () => {
    setPhase('welcome')
  }

  const isLastSlide = slideIndex === SLIDES.length - 1
  const onLastSlideCta = () => {
    if (isLastSlide) setPhase('welcome')
    else goToSlide(slideIndex + 1)
  }

  // Barra fixa inferior — fundo próprio atrás de Cadastrar e Já sou cadastrado
  const BottomBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-[101] px-5 pt-5 border-t border-[#00C2FF]/20 bg-[#0a1628]"
      style={{ paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 16px))' }}
    >
      <Link
        href="/cadastro?plano=teste"
        className="block w-full py-4 rounded-2xl bg-[#007A99] hover:bg-[#006688] text-white font-semibold text-center text-base transition-colors"
      >
        Cadastrar
      </Link>
      <button
        type="button"
        onClick={() => setPhase('login')}
        className="block w-full mt-3 text-[#00C2FF] text-sm font-medium text-center"
      >
        Já sou cadastrado
      </button>
    </div>
  )

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

  // ——— Onboarding: fundo azul escuro Plenipay, card com brilho azul, 5 dots, botões embaixo
  if (phase === 'onboarding') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#0D1B2A] overflow-hidden">
        <div
          ref={scrollRef}
          className="app-onboarding-scroll flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.offsetWidth)
            if (i !== slideIndex) setSlideIndex(i)
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full flex flex-col items-center px-5 pt-6 pb-4 snap-center min-h-full"
              style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
            >
              {/* Conteúdo logo acima da barra: card + título + descrição + dots */}
              <div className="mt-auto w-full flex flex-col items-center">
              {/* Card tipo tela de celular — branco com brilho azul Plenipay */}
              {slide.showPreview ? (
                <div
                  className="w-full max-w-[300px] rounded-[28px] bg-white p-5 mb-8 flex flex-col"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px -15px rgba(0, 194, 255, 0.2)' }}
                >
                  <div className="flex items-center justify-between text-gray-500 text-xs mb-3">
                    <span>Março</span>
                    <span>🪙 28</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-0.5">Saldo em contas</p>
                  <p className="text-2xl font-bold text-[#0D1B2A] mb-3">R$ 870,50</p>
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <TrendingUp size={14} />
                      <span>R$ 3.877,60</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <TrendingDown size={14} />
                      <span>R$ 3.200,43</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Contas</p>
                  <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">S</div>
                      <span className="text-sm font-medium">Santander</span>
                    </div>
                    <span className="text-sm font-semibold">R$ 550,00</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">N</div>
                      <span className="text-sm font-medium">NuConta</span>
                    </div>
                    <span className="text-sm font-semibold">R$ 120,50</span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full max-w-[260px] h-[320px] rounded-[28px] bg-[#E6F7FF] flex items-center justify-center mb-8 border border-[#00C2FF]/20"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 60px -15px rgba(0, 194, 255, 0.2)' }}
                >
                  <Wallet className="text-[#007A99]" size={48} />
                </div>
              )}

              {/* Título — grande, branco, negrito, centralizado */}
              <h2 className="text-xl font-bold text-white text-center max-w-[320px] mb-2 leading-tight px-1">
                {slide.title}
              </h2>
              {/* Descrição — menor, branco, centralizado */}
              <p className="text-white/90 text-sm text-center max-w-[300px] mb-6 leading-snug">
                {slide.subtitle}
              </p>
              {/* 5 dots — ativo em azul claro Plenipay */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {SLIDES.map((_, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => goToSlide(j)}
                    className={`rounded-full transition-all ${
                      j === slideIndex
                        ? 'w-6 h-2 bg-[#00C2FF]'
                        : 'w-2 h-2 bg-white/40'
                    }`}
                    aria-label={`Slide ${j + 1}`}
                  />
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>

        <BottomBar />
      </div>
    )
  }

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

  // ——— Login (fundo azul escuro Plenipay)
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0D1B2A] overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="app-glass w-full max-w-[320px] p-6">
          <button
            type="button"
            onClick={() => { setPhase('welcome'); setErrorMessage(null); }}
            className="text-white/80 text-sm mb-4 flex items-center gap-1"
          >
            ← Voltar
          </button>
          <h2 className="text-xl font-semibold text-white mb-1">Entrar</h2>
          <p className="text-white/70 text-sm mb-5">Acesse sua conta</p>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <p className="text-sm text-red-300 bg-red-500/20 rounded-xl px-3 py-2">{errorMessage}</p>
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-base"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={formData.senha}
                onChange={e => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 pr-11 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link href="/auth/redefinir-senha" className="block text-sm text-white/80 text-right">
              Esqueceu a senha?
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#007A99] hover:bg-[#006688] text-white font-semibold text-base disabled:opacity-70 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Entrando...</> : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-white/80 text-sm mt-4">
            Não tem conta?{' '}
            <Link href="/cadastro?plano=teste" className="text-[#00C2FF] font-medium underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
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
