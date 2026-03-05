'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Zap, Crown, Star, Loader2, Sparkles, TrendingUp, Target, Shield, Clock, MessageCircle, Smartphone, CreditCard, Receipt, X } from 'lucide-react'
import Image from 'next/image'
import AnimatedBackground from '@/components/AnimatedBackground'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'
import Sidebar from '@/components/Sidebar'
import MobileMenu from '@/components/MobileMenu'

const planos = [
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
      'Registrar Salário',
      'Calendário Financeiro',
      'Sistema de Metas (até 3 metas)',
      'Até 10 usuários/pessoas',
      'Filtros avançados',
      'Exportação de relatórios',
      'Suporte prioritário',
    ],
    cor: 'brand-aqua',
    icon: Zap,
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
      'Gráficos avançados',
      'Exportação avançada',
      'Suporte 24/7',
    ],
    cor: 'brand-aqua',
    icon: Crown,
    destacado: true,
  },
]

const beneficios = [
  {
    icon: Target,
    titulo: 'Realize Seus Sonhos',
    descricao: 'Transforme seus objetivos em metas alcançáveis. Cada economia te aproxima do seu sonho.',
  },
  {
    icon: TrendingUp,
    titulo: 'Cresça Financeiramente',
    descricao: 'Veja seu dinheiro crescer com organização e disciplina. O futuro começa hoje.',
  },
  {
    icon: Shield,
    titulo: 'Controle Total',
    descricao: 'Saiba exatamente para onde vai cada centavo. Tome decisões inteligentes.',
  },
  {
    icon: Clock,
    titulo: 'Economize Tempo',
    descricao: 'Automatize seus controles e foque no que realmente importa na sua vida.',
  },
]

const depoimentos = [
  {
    nome: 'Maria Silva',
    idade: 24,
    texto: 'Comecei a usar aos 22 e já consegui juntar para minha primeira viagem internacional!',
    plano: 'Básico',
  },
  {
    nome: 'João Santos',
    idade: 35,
    texto: 'Finalmente consegui organizar minhas dívidas e estou no caminho certo para ficar livre delas.',
    plano: 'Premium',
  },
  {
    nome: 'Ana Costa',
    idade: 28,
    texto: 'Em 6 meses consegui economizar mais do que em 2 anos tentando sozinha. Valeu cada centavo!',
    plano: 'Premium',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [planoSelecionado, setPlanoSelecionado] = useState<'basico' | 'premium' | null>(null)
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showCpfModal, setShowCpfModal] = useState(false)
  const [cpf, setCpf] = useState('')
  const [loadingCpf, setLoadingCpf] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      
      if (!user) {
        router.push('/login?redirect=/upgrade')
      }
    }
    checkAuth()
  }, [router])

  const handleSelecionarPlano = (planoId: 'basico' | 'premium') => {
    // Redirecionar diretamente para página de checkout
    router.push(`/checkout?plano=${planoId}`)
  }

  const handleProcessarPagamento = async (retry = false) => {
    if (!planoSelecionado) {
      console.error('❌ Nenhum plano selecionado')
      return
    }

    if (!retry) {
      setLoadingCheckout(planoSelecionado)
    } else {
      // Se for retry, garantir que o loading está ativo
      setLoadingCheckout(planoSelecionado)
    }
    
    console.log('💳 Iniciando processamento de pagamento...', { 
      plano: planoSelecionado, 
      metodo: metodoPagamento,
      retry 
    })
    
    try {
      console.log('Iniciando checkout...', { plano: planoSelecionado, metodoPagamento })
      
      const response = await fetch('/api/pagamento/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoSelecionado,
          metodoPagamento: metodoPagamento,
        }),
      })

      console.log('Resposta do checkout:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('Dados recebidos:', data)

      if (!response.ok) {
        // Se o erro for relacionado a CPF, mostrar modal para coletar CPF
        if (data.requiresCpf || data.error?.includes('CPF') || data.error?.includes('cpf')) {
          setLoadingCheckout(null)
          setShowPaymentModal(false)
          setShowCpfModal(true)
          return
        }
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      // Se for PIX, sempre redirecionar para página de pagamento (mesmo sem QR code ainda)
      if (data.metodoPagamento === 'PIX' || metodoPagamento === 'PIX') {
        console.log('✅ Redirecionando para página PIX...', {
          subscriptionId: data.subscriptionId,
          hasQrCode: !!data.pixQrCode,
          hasCopyPaste: !!data.pixCopyPaste,
          dataCompleta: data
        })
        
        if (!data.subscriptionId) {
          console.error('❌ Subscription ID não retornado!', data)
          throw new Error('Subscription ID não retornado. Tente novamente.')
        }
        
        const params = new URLSearchParams({
          subscriptionId: data.subscriptionId,
          plano: data.plano || planoSelecionado,
        })
        if (data.pixQrCode) params.set('pixQrCode', data.pixQrCode)
        if (data.pixCopyPaste) params.set('pixCopyPaste', data.pixCopyPaste)
        
        const url = `/pagamento/pix?${params.toString()}`
        console.log('🌐 URL de redirecionamento:', url)
        
        // Forçar redirecionamento
        window.location.href = url
        return // Não continuar após redirecionamento
      } else if (data.paymentUrl) {
        // Para Boleto e Cartão, redirecionar para URL de pagamento
        console.log('Redirecionando para URL de pagamento:', data.paymentUrl)
        window.location.href = data.paymentUrl
      } else {
        console.log('Nenhuma URL de pagamento encontrada')
        createNotification('Checkout criado com sucesso! Verifique seu email.', 'success')
        router.push('/home')
      }
    } catch (error: any) {
      console.error('❌ Erro no checkout:', error)
      console.error('Stack:', error.stack)
      createNotification('Erro ao processar pagamento: ' + (error.message || 'Erro desconhecido'), 'warning')
      setLoadingCheckout(null)
      setShowPaymentModal(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-aqua" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-midnight via-brand-royal to-brand-midnight">
      <MobileMenu />
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-aqua/10 via-transparent to-brand-royal/20"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-aqua/20 rounded-full mb-6">
                <Sparkles className="text-brand-aqua" size={20} />
                <span className="text-brand-aqua font-semibold">Transforme sua vida financeira hoje</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                Pare de Gastar Sem Controle.
                <br />
                <span className="text-brand-aqua">Comece a Viver Seus Sonhos.</span>
              </h1>
              
              <p className="text-xl text-brand-clean/80 max-w-3xl mx-auto mb-8 leading-relaxed">
                Você já tentou economizar sozinho e não conseguiu? <strong className="text-white">Não é culpa sua.</strong> 
                Você só precisa das ferramentas certas. Milhares de pessoas já transformaram suas finanças com o PLENIPAY.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-brand-clean/70 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="text-green-400" size={20} />
                  <span>7 dias grátis para testar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-green-400" size={20} />
                  <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-green-400" size={20} />
                  <span>Sem compromisso</span>
                </div>
              </div>
            </div>

            {/* Cards de Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {beneficios.map((beneficio, index) => {
                const Icon = beneficio.icon
                return (
                  <div
                    key={index}
                    className="bg-brand-royal/50 backdrop-blur-sm rounded-2xl p-6 border border-brand-aqua/20 hover:border-brand-aqua/50 transition-all hover:scale-105"
                  >
                    <div className="w-12 h-12 bg-brand-aqua/20 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="text-brand-aqua" size={24} />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{beneficio.titulo}</h3>
                    <p className="text-brand-clean/70 text-sm leading-relaxed">{beneficio.descricao}</p>
                  </div>
                )
              })}
            </div>

            {/* Planos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
              {planos.map((plano) => {
                const Icon = plano.icon
                return (
                  <div
                    key={plano.id}
                    className={`bg-brand-royal/80 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all hover:scale-105 ${
                      plano.destacado
                        ? 'border-brand-aqua shadow-2xl shadow-brand-aqua/20'
                        : 'border-brand-aqua/30 hover:border-brand-aqua/50'
                    }`}
                  >
                    {plano.destacado && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-aqua rounded-full mb-4">
                        <Star className="text-white fill-white" size={14} />
                        <span className="text-white font-bold text-sm">MAIS POPULAR</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        plano.destacado ? 'bg-brand-aqua' : 'bg-brand-aqua/20'
                      }`}>
                        <Icon size={32} className={plano.destacado ? 'text-white' : 'text-brand-aqua'} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-bold text-white mb-1">{plano.nome}</h3>
                        <p className="text-brand-clean/70 text-sm">{plano.descricao}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-white">{plano.preco}</span>
                        <span className="text-brand-clean/60 text-sm">{plano.periodo}</span>
                      </div>
                      {plano.testeGratis && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg mb-4">
                          <span className="text-green-400 font-semibold text-sm">{plano.testeGratis}</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plano.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="text-brand-aqua flex-shrink-0 mt-0.5" size={20} />
                          <span className="text-brand-clean/90 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelecionarPlano(plano.id)}
                      disabled={loadingCheckout === plano.id}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        plano.destacado
                          ? 'bg-gradient-to-r from-brand-aqua to-blue-500 text-white hover:shadow-2xl hover:shadow-brand-aqua/50'
                          : 'bg-brand-aqua text-white hover:bg-brand-aqua/90'
                      } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {loadingCheckout === plano.id ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <span>Assinar Agora</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Depoimentos */}
            <div className="mb-16">
              <h2 className="text-3xl font-display font-bold text-white text-center mb-8">
                Pessoas Reais. Resultados Reais.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {depoimentos.map((depoimento, index) => (
                  <div
                    key={index}
                    className="bg-brand-royal/50 backdrop-blur-sm rounded-2xl p-6 border border-brand-aqua/20"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-brand-clean/90 mb-4 leading-relaxed text-sm italic">
                      "{depoimento.texto}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-aqua/30 to-brand-royal flex items-center justify-center text-brand-aqua font-bold">
                        {depoimento.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{depoimento.nome}</p>
                        <p className="text-brand-clean/60 text-xs">{depoimento.idade} anos • {depoimento.plano}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Final */}
            <div className="bg-gradient-to-r from-brand-aqua/20 via-brand-royal/50 to-brand-aqua/20 rounded-3xl p-12 text-center border-2 border-brand-aqua/30">
              <h2 className="text-4xl font-display font-bold text-white mb-4">
                Não Deixe Seus Sonhos para Depois
              </h2>
              <p className="text-xl text-brand-clean/80 mb-8 max-w-2xl mx-auto">
                Cada dia que passa sem controle financeiro é um dia a mais longe dos seus objetivos. 
                Comece hoje. Seus sonhos não podem esperar.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="https://wa.me/5511999999999?text=Olá!%20Quero%20saber%20mais%20sobre%20os%20planos%20do%20PLENIPAY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-smooth"
                >
                  <MessageCircle size={20} />
                  Falar com Suporte
                </a>
                <button
                  onClick={() => router.push('/home')}
                  className="px-6 py-3 bg-brand-royal/50 text-white rounded-xl font-semibold hover:bg-brand-royal/70 transition-smooth border border-white/20"
                >
                  Voltar para Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Botão Flutuante WhatsApp */}
      <a
        href="https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20PLENIPAY"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-green-700 transition-all hover:scale-110 z-50"
        title="Falar com Suporte no WhatsApp"
      >
        <MessageCircle className="text-white" size={24} />
      </a>

      {/* Modal de Seleção de Pagamento */}
      {showPaymentModal && planoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-royal rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-brand-aqua/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold text-white">
                Escolha o Método de Pagamento
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPlanoSelecionado(null)
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-brand-clean/70 mb-4">
                Plano selecionado: <strong className="text-brand-aqua">{planos.find(p => p.id === planoSelecionado)?.nome}</strong>
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMetodoPagamento('PIX')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'PIX'
                      ? 'border-brand-aqua bg-brand-aqua/10'
                      : 'border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'PIX' ? 'bg-brand-aqua' : 'bg-white/10'}`}>
                    <Smartphone size={24} className={metodoPagamento === 'PIX' ? 'text-white' : 'text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">PIX</p>
                    <p className="text-xs text-brand-clean/70">Aprovação imediata</p>
                  </div>
                  {metodoPagamento === 'PIX' && (
                    <Check size={20} className="text-brand-aqua" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('BOLETO')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'BOLETO'
                      ? 'border-brand-aqua bg-brand-aqua/10'
                      : 'border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'BOLETO' ? 'bg-brand-aqua' : 'bg-white/10'}`}>
                    <Receipt size={24} className={metodoPagamento === 'BOLETO' ? 'text-white' : 'text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Boleto</p>
                    <p className="text-xs text-brand-clean/70">Vencimento em 3 dias úteis</p>
                  </div>
                  {metodoPagamento === 'BOLETO' && (
                    <Check size={20} className="text-brand-aqua" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('CREDIT_CARD')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'CREDIT_CARD'
                      ? 'border-brand-aqua bg-brand-aqua/10'
                      : 'border-white/10 hover:border-brand-aqua/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'CREDIT_CARD' ? 'bg-brand-aqua' : 'bg-white/10'}`}>
                    <CreditCard size={24} className={metodoPagamento === 'CREDIT_CARD' ? 'text-white' : 'text-brand-clean'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">Cartão de Crédito</p>
                    <p className="text-xs text-brand-clean/70">Aprovação imediata</p>
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
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-smooth"
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
          <div className="bg-brand-royal rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-brand-aqua/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display font-bold text-white">
                CPF Obrigatório
              </h3>
              <button
                onClick={() => {
                  setShowCpfModal(false)
                  setCpf('')
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-brand-clean/80 mb-4">
                Para criar uma assinatura, precisamos do seu CPF. Por favor, informe seu CPF abaixo:
              </p>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
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
                  className="w-full px-4 py-3 bg-brand-midnight border border-brand-aqua/30 rounded-xl text-white placeholder-brand-clean/40 focus:outline-none focus:border-brand-aqua transition-smooth"
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
                className="flex-1 px-4 py-3 bg-brand-midnight text-white rounded-xl font-semibold hover:bg-brand-midnight/80 transition-smooth"
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
                    const { data: { user }, error: userError } = await supabase.auth.getUser()
                    
                    console.log('💾 Salvando CPF...', { userId: user?.id, cpf: cpfLimpo })
                    
                    if (userError || !user) {
                      console.error('Erro ao buscar usuário:', userError)
                      createNotification('Erro: usuário não autenticado', 'warning')
                      setLoadingCpf(false)
                      return
                    }

                    const { data, error } = await supabase
                      .from('profiles')
                      .update({ cpf: cpfLimpo })
                      .eq('id', user.id)
                      .select()

                    console.log('Resultado do update:', { data, error })

                    if (error) {
                      console.error('Erro ao salvar CPF:', error)
                      // Se o erro for que a coluna não existe, informar o usuário
                      if (error.message?.includes('column') || error.code === '42703' || error.message?.includes('Could not find') || error.code === 'PGRST204') {
                        createNotification('ERRO: Cache do Supabase não atualizado! Execute FORCAR-REFRESH-CPF.sql e aguarde 30 segundos.', 'warning')
                        console.error('❌ ERRO DE CACHE DO SUPABASE! Execute FORCAR-REFRESH-CPF.sql:', error)
                        console.error('💡 O PostgREST precisa atualizar o cache. Aguarde 30 segundos após executar o script.')
                      } else {
                        createNotification('Erro ao salvar CPF: ' + error.message, 'warning')
                      }
                      setLoadingCpf(false)
                      return
                    }

                    console.log('✅ CPF salvo com sucesso!')
                    createNotification('CPF salvo com sucesso! Redirecionando para checkout...', 'success')
                    setShowCpfModal(false)
                    setCpf('')
                    
                    // Redirecionar para página de checkout completa
                    setTimeout(() => {
                      router.push(`/checkout?plano=${planoSelecionado}`)
                    }, 500)
                  } catch (error: any) {
                    console.error('Erro ao salvar CPF:', error)
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

