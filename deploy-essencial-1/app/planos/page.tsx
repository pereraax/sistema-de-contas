'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Zap, Crown, Star, Loader2, X, CreditCard, Smartphone, Receipt, Shield, TrendingUp, Users, BarChart3, DollarSign } from 'lucide-react'
import Image from 'next/image'
import AnimatedBackground from '@/components/AnimatedBackground'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'

const planos = [
  {
    id: 'teste' as const,
    nome: 'Plano Gratuito',
    descricao: 'Perfeito para começar',
    preco: 'R$ 0',
    periodo: 'sempre grátis',
    features: [
      'Criar registros de entrada e saída (50/mês)',
      'Dashboard básico com estatísticas',
      'Até 2 usuários/pessoas',
      'Filtros básicos de busca',
      'Conta gratuita permanente',
      'Acesso ao PLEN AI',
    ],
    cor: 'from-blue-500 to-cyan-500',
    icon: Zap,
    popular: false,
  },
  {
    id: 'basico' as const,
    nome: 'Plano Básico',
    descricao: 'Ideal para uso pessoal',
    preco: 'R$ 9,90',
    periodo: 'por mês',
    testeGratis: '7 dias grátis',
    features: [
      'Tudo do plano Gratuito',
      'Registros ilimitados',
      'Criar e gerenciar Dívidas',
      'Registrar Salário recorrente',
      'Calendário Financeiro completo',
      'Sistema de Metas (até 3 metas)',
      'Até 10 usuários/pessoas',
      'Filtros avançados',
      'Exportação de relatórios',
      'Suporte prioritário',
    ],
    cor: 'from-brand-aqua to-blue-500',
    icon: TrendingUp,
    popular: false,
  },
  {
    id: 'premium' as const,
    nome: 'Plano Premium',
    descricao: 'Para quem precisa do máximo',
    preco: 'R$ 49,90',
    periodo: 'por mês',
    features: [
      'Tudo do plano Básico',
      'Criar e gerenciar Empréstimos',
      'Upload de documentos',
      'Game dinâmico em Juntar Dinheiro',
      'Metas ilimitadas',
      'Usuários/Pessoas ilimitados',
      'Dashboard avançado com projeções',
      'Gráficos avançados e análises',
      'Exportação avançada (PDF, Excel)',
      'Suporte 24/7',
      'Acesso antecipado a novas features',
    ],
    cor: 'from-purple-500 to-pink-500',
    icon: Crown,
    popular: true,
  },
]

const beneficios = [
  { icon: Shield, texto: '100% Seguro e Confiável' },
  { icon: Users, texto: 'Mais de 10.000 usuários' },
  { icon: BarChart3, texto: 'Controle total das finanças' },
  { icon: DollarSign, texto: 'Atualizações constantes' },
]

const depoimentos = [
  {
    nome: 'Maria Clara',
    plano: 'Premium',
    texto: 'Economizei R$ 2.500 em 3 meses usando o sistema de controle de dívidas!',
    inicial: 'MC',
  },
  {
    nome: 'Rafael Silva',
    plano: 'Básico',
    texto: 'Perfeito para freelancers! Controle total das entradas e saídas.',
    inicial: 'RS',
  },
  {
    nome: 'Ana Santos',
    plano: 'Premium',
    texto: 'Quitei 3 cartões de crédito usando o sistema de parcelas. Incrível!',
    inicial: 'AS',
  },
  {
    nome: 'João Oliveira',
    plano: 'Básico',
    texto: 'Interface linda e super intuitiva. Minha família toda usa agora!',
    inicial: 'JO',
  },
]

export default function PlanosPage() {
  const router = useRouter()
  const [planoSelecionado, setPlanoSelecionado] = useState<'teste' | 'basico' | 'premium' | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [showCpfModal, setShowCpfModal] = useState(false)
  const [cpf, setCpf] = useState('')
  const [loadingCpf, setLoadingCpf] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  const handleSelecionarPlano = async (planoId: 'teste' | 'basico' | 'premium') => {
    if (planoId === 'teste') {
      router.push(`/cadastro?plano=${planoId}`)
      return
    }

    if (!isAuthenticated) {
      router.push(`/cadastro?plano=${planoId}`)
      return
    }

    router.push(`/checkout?plano=${planoId}`)
  }

  const handleProcessarPagamento = async (retry = false) => {
    if (!planoSelecionado) return

    setLoadingCheckout(planoSelecionado)
    try {
      const response = await fetch('/api/pagamento/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoSelecionado,
          metodoPagamento: metodoPagamento,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresCpf || data.error?.includes('CPF') || data.error?.includes('cpf')) {
          setLoadingCheckout(null)
          setShowPaymentModal(false)
          setShowCpfModal(true)
          return
        }
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      if (data.metodoPagamento === 'PIX') {
        const params = new URLSearchParams({
          subscriptionId: data.subscriptionId || '',
          plano: data.plano || '',
          pixQrCode: data.pixQrCode || '',
          pixCopyPaste: data.pixCopyPaste || '',
        })
        router.push(`/pagamento/pix?${params.toString()}`)
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        createNotification('Checkout criado com sucesso! Verifique seu email.', 'success')
        router.push('/home')
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error)
      createNotification('Erro ao processar pagamento: ' + error.message, 'warning')
    } finally {
      setLoadingCheckout(null)
      setShowPaymentModal(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="container mx-auto px-6 pt-8 pb-4 sm:pt-12 sm:pb-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <Image 
            src="/logo.png" 
            alt="PLENIPAY" 
            width={140}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
        <Link
          href="/login"
          className="text-sm sm:text-base text-brand-clean hover:text-brand-aqua transition-smooth font-medium"
        >
          <span className="hidden sm:inline">Já tem conta? </span>
          <span className="text-brand-aqua font-semibold hover:underline">Entrar</span>
        </Link>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-8 sm:py-12 relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-aqua/10 rounded-full mb-4">
            <DollarSign className="text-brand-aqua" size={16} />
            <span className="text-brand-aqua font-semibold text-xs sm:text-sm">Escolha o plano ideal para você</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-brand-white mb-4 leading-tight">
            Planos que se adaptam
            <br />
            <span className="text-brand-aqua">às suas necessidades</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-brand-clean/80 max-w-2xl mx-auto leading-relaxed">
            Controle financeiro completo, do básico ao avançado. 
            Comece grátis e evolua conforme sua necessidade.
          </p>
        </div>

        {/* Benefícios Rápidos */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12">
          {beneficios.map((beneficio, index) => {
            const Icon = beneficio.icon
            return (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-2 bg-brand-royal/30 backdrop-blur-sm rounded-full border border-brand-aqua/20"
              >
                <Icon className="text-brand-aqua" size={20} />
                <span className="text-brand-clean/90 text-sm font-medium">{beneficio.texto}</span>
              </div>
            )
          })}
        </div>

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto mb-12 sm:mb-16">
          {planos.map((plano, index) => {
            const Icon = plano.icon
            return (
              <div
                key={plano.id}
                className={`relative bg-brand-royal/60 backdrop-blur-md rounded-2xl p-5 sm:p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  plano.popular
                    ? 'border-brand-aqua shadow-2xl shadow-brand-aqua/30 lg:-mt-4 lg:mb-4'
                    : 'border-brand-aqua/20 hover:border-brand-aqua/50'
                }`}
              >
                {plano.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-brand-aqua to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <Star className="fill-white" size={12} />
                      <span>MAIS POPULAR</span>
                    </div>
                  </div>
                )}
                
                {/* Header do Card */}
                <div className="mb-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${plano.cor} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon size={24} className="sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-white mb-1">
                      {plano.nome}
                    </h3>
                  <p className="text-brand-clean/70 text-xs sm:text-sm">{plano.descricao}</p>
                </div>

                {/* Preço */}
                <div className="mb-4 pb-4 border-b border-brand-aqua/20">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl sm:text-5xl font-display font-bold text-brand-white">
                      {plano.preco}
                    </span>
                    {plano.preco !== 'R$ 0' && (
                      <span className="text-brand-clean/60 text-base sm:text-lg">/mês</span>
                    )}
                  </div>
                  <p className="text-brand-clean/60 text-xs sm:text-sm mb-2">{plano.periodo}</p>
                  {plano.testeGratis && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-aqua/20 text-brand-aqua rounded-full text-xs font-semibold">
                      <DollarSign size={11} />
                      <span>{plano.testeGratis}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {plano.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <Check size={16} className="text-brand-aqua flex-shrink-0" strokeWidth={2.5} />
                      </div>
                      <span className="text-brand-clean/90 text-xs sm:text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão */}
                <button
                  onClick={() => handleSelecionarPlano(plano.id)}
                  disabled={loadingCheckout === plano.id}
                  className={`w-full px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    plano.popular
                      ? 'bg-gradient-to-r from-brand-aqua to-blue-500 text-white hover:shadow-lg hover:shadow-brand-aqua/50 hover:scale-105'
                      : 'bg-brand-aqua/20 text-brand-aqua border-2 border-brand-aqua hover:bg-brand-aqua/30 hover:scale-105'
                  }`}
                >
                  {loadingCheckout === plano.id ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      {plano.id === 'teste' ? 'Começar Grátis' : isAuthenticated ? 'Assinar Agora' : 'Selecionar Plano'}
                      <ArrowRight size={20} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Seção de Depoimentos */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-brand-white mb-3 sm:mb-4">
              Veja o que nossos usuários estão dizendo
            </h2>
            <p className="text-base sm:text-lg text-brand-clean/70 max-w-2xl mx-auto">
              Mais de 10.000 pessoas já transformaram suas finanças com o PLENIPAY
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {depoimentos.map((depoimento, index) => (
              <div
                key={index}
                className="bg-brand-royal/50 backdrop-blur-sm rounded-2xl p-6 border border-brand-aqua/20 hover:border-brand-aqua/50 transition-all hover:scale-105 hover:shadow-xl"
              >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
                <p className="text-brand-clean/90 mb-4 leading-relaxed text-sm min-h-[60px]">
                  "{depoimento.texto}"
              </p>
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-aqua/30 to-brand-royal flex items-center justify-center text-brand-aqua font-bold text-sm">
                    {depoimento.inicial}
                </div>
                <div>
                    <p className="text-brand-white font-semibold text-sm">{depoimento.nome}</p>
                    <p className="text-brand-clean/60 text-xs">{depoimento.plano}</p>
                </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Garantia */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-brand-aqua/10 to-blue-500/10 rounded-2xl p-6 sm:p-8 border border-brand-aqua/30 text-center mb-12 sm:mb-16">
          <Shield className="text-brand-aqua mx-auto mb-3 sm:mb-4" size={40} />
          <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-white mb-2 sm:mb-3">
            Garantia de Satisfação
          </h3>
          <p className="text-brand-clean/80 text-base sm:text-lg max-w-2xl mx-auto">
            Teste qualquer plano por 7 dias grátis. Se não ficar satisfeito, 
            devolvemos 100% do seu dinheiro. Sem perguntas, sem complicações.
          </p>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-brand-aqua/20 relative z-10">
          <div className="flex flex-col items-center text-center text-brand-clean/60 text-sm space-y-4">
            <p>© 2025 PLENIPAY. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/termos" className="hover:text-brand-aqua transition-smooth">Termos</Link>
              <Link href="/privacidade" className="hover:text-brand-aqua transition-smooth">Privacidade</Link>
              <Link href="/suporte" className="hover:text-brand-aqua transition-smooth">Suporte</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal de Seleção de Pagamento */}
      {showPaymentModal && planoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-royal rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-brand-midnight dark:text-brand-clean">
                Escolha o Método de Pagamento
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPlanoSelecionado(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={20} className="text-brand-midnight dark:text-brand-clean" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-brand-clean/70 mb-4">
                Plano selecionado: <strong className="text-brand-aqua">{planos.find(p => p.id === planoSelecionado)?.nome}</strong>
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMetodoPagamento('PIX')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'PIX'
                      ? 'border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'PIX' ? 'bg-brand-aqua' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <Smartphone size={24} className={metodoPagamento === 'PIX' ? 'text-white' : 'text-gray-600 dark:text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-brand-midnight dark:text-brand-clean">PIX</p>
                    <p className="text-xs text-gray-600 dark:text-brand-clean/70">Aprovação imediata</p>
                  </div>
                  {metodoPagamento === 'PIX' && (
                    <Check size={20} className="text-brand-aqua" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('BOLETO')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'BOLETO'
                      ? 'border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'BOLETO' ? 'bg-brand-aqua' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <Receipt size={24} className={metodoPagamento === 'BOLETO' ? 'text-white' : 'text-gray-600 dark:text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-brand-midnight dark:text-brand-clean">Boleto</p>
                    <p className="text-xs text-gray-600 dark:text-brand-clean/70">Vencimento em 3 dias úteis</p>
                  </div>
                  {metodoPagamento === 'BOLETO' && (
                    <Check size={20} className="text-brand-aqua" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('CREDIT_CARD')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'CREDIT_CARD'
                      ? 'border-brand-aqua bg-brand-aqua/10 dark:bg-brand-aqua/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'CREDIT_CARD' ? 'bg-brand-aqua' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <CreditCard size={24} className={metodoPagamento === 'CREDIT_CARD' ? 'text-white' : 'text-gray-600 dark:text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-brand-midnight dark:text-brand-clean">Cartão de Crédito</p>
                    <p className="text-xs text-gray-600 dark:text-brand-clean/70">Aprovação imediata</p>
                  </div>
                  {metodoPagamento === 'CREDIT_CARD' && (
                    <Check size={20} className="text-brand-aqua" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPlanoSelecionado(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleProcessarPagamento()}
                disabled={loadingCheckout !== null}
                className="flex-1 px-4 py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de CPF */}
      {showCpfModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-royal rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-brand-midnight dark:text-brand-clean">
                CPF Obrigatório
              </h3>
              <button
                onClick={() => {
                  setShowCpfModal(false)
                  setCpf('')
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={20} className="text-brand-midnight dark:text-brand-clean" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-brand-clean/70 mb-4">
                Para criar uma assinatura, precisamos do seu CPF. Por favor, informe seu CPF abaixo:
              </p>
              
              <div>
                <label className="block text-sm font-medium text-brand-midnight dark:text-brand-clean mb-2">
                  CPF *
                </label>
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
                  className="w-full px-4 py-3 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-xl text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 focus:outline-none focus:border-brand-aqua transition-smooth"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCpfModal(false)
                  setCpf('')
                  window.location.href = '/configuracoes?tab=perfil'
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth"
              >
                Ir para Configurações
              </button>
              <button
                onClick={async () => {
                  const cpfLimpo = cpf.replace(/\D/g, '')
                  if (cpfLimpo.length !== 11) {
                    createNotification('CPF inválido. Digite um CPF com 11 dígitos.', 'warning')
                    return
                  }

                  setLoadingCpf(true)
                  try {
                    const supabase = createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    
                    if (!user) {
                      createNotification('Erro: usuário não autenticado', 'warning')
                      return
                    }

                    const { data, error } = await supabase
                      .from('profiles')
                      .update({ cpf: cpfLimpo })
                      .eq('id', user.id)
                      .select()

                    if (error) {
                      if (error.message?.includes('column') || error.code === '42703' || error.message?.includes('Could not find') || error.code === 'PGRST204') {
                        createNotification('ERRO: Cache do Supabase não atualizado! Execute o script FORCAR-REFRESH-CPF.sql e aguarde 30 segundos.', 'warning')
                      } else {
                        createNotification('Erro ao salvar CPF: ' + error.message, 'warning')
                      }
                      setLoadingCpf(false)
                      return
                    }

                    createNotification('CPF salvo com sucesso! Redirecionando para checkout...', 'success')
                    setShowCpfModal(false)
                    setCpf('')
                    
                    setTimeout(() => {
                      router.push(`/checkout?plano=${planoSelecionado}`)
                    }, 500)
                  } catch (error: any) {
                    createNotification('Erro ao salvar CPF: ' + error.message, 'warning')
                  } finally {
                    setLoadingCpf(false)
                  }
                }}
                disabled={loadingCpf || !cpf.replace(/\D/g, '').match(/^\d{11}$/)}
                className="flex-1 px-4 py-3 bg-brand-aqua text-white rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingCpf ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <span>Salvar e Continuar</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
