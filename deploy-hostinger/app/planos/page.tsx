'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Zap, Crown, Star, Loader2, X, CreditCard, Smartphone, Receipt, Shield, TrendingUp, Users, BarChart3, DollarSign, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
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
    preco: 'R$ 29,90',
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#00C2FF] border-b border-[#0099CC] sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo branca.png" 
              alt="PLENIPAY" 
              width={300}
              height={75}
              className="h-14 sm:h-16 md:h-18 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 text-white bg-[#0099CC] hover:bg-[#007A99] rounded-lg font-semibold transition-all duration-300 shadow-md"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-6 py-2.5 text-white bg-[#0D1B2A] hover:bg-[#1B263B] rounded-lg font-semibold transition-all duration-300"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E6F7FF] border border-[#00C2FF] rounded-full mb-4">
            <DollarSign className="text-[#00C2FF]" size={16} />
            <span className="text-[#00C2FF] font-semibold text-xs sm:text-sm">Escolha o plano ideal para você</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#0D1B2A] mb-4 leading-tight">
            Planos que se adaptam
            <br />
            <span className="text-[#00C2FF]">às suas necessidades</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
                className="flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm"
              >
                <Icon className="text-[#00C2FF]" size={20} />
                <span className="text-gray-700 text-sm font-medium">{beneficio.texto}</span>
              </div>
            )
          })}
        </div>

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12 sm:mb-16">
          {/* Plano Gratuito */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="bg-gray-100 text-[#0D1B2A] rounded-xl py-3 px-4 mb-6 text-center">
              <h3 className="text-xl font-bold">Plano Gratuito</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#0D1B2A]">R$ 0</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">sempre grátis</p>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Registros (50/mês)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Dashboard básico</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Até 2 usuários</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Filtros básicos</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Acesso ao PLEN AI</span>
              </div>
            </div>
            <button
              onClick={() => handleSelecionarPlano('teste')}
              disabled={loadingCheckout === 'teste'}
              className="w-full text-center py-3 bg-gray-100 hover:bg-gray-200 text-[#0D1B2A] rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCheckout === 'teste' ? 'Processando...' : 'Começar Grátis'}
            </button>
          </div>

          {/* Plano Básico */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="bg-[#00C2FF] text-white rounded-xl py-3 px-4 mb-6 text-center">
              <h3 className="text-xl font-bold">Plano Básico</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#0D1B2A]">R$ 29,90</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <p className="text-xs text-[#00C2FF] font-semibold mt-2">7 dias grátis</p>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Tudo do Gratuito</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Registros ilimitados</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Gerenciar Dívidas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Salário recorrente</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Calendário Financeiro</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Metas (até 3)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Até 10 usuários</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Suporte prioritário</span>
              </div>
            </div>
            <button
              onClick={() => handleSelecionarPlano('basico')}
              disabled={loadingCheckout === 'basico'}
              className="w-full text-center py-3 bg-[#00C2FF] hover:bg-[#0099CC] text-white rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCheckout === 'basico' ? 'Processando...' : 'Assinar Agora'}
            </button>
          </div>

          {/* Plano Premium */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#00C2FF] relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#00C2FF] text-white text-xs font-bold px-3 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <div className="bg-[#00C2FF] text-white rounded-xl py-3 px-4 mb-6 text-center">
              <h3 className="text-xl font-bold">Plano Premium</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#0D1B2A]">R$ 49,90</span>
                <span className="text-gray-600">/mês</span>
              </div>
              <p className="text-xs text-[#00C2FF] font-semibold mt-2">7 dias grátis</p>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Tudo do Básico</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Empréstimos</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Upload de documentos</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Game Juntar Dinheiro</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Metas ilimitadas</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Usuários ilimitados</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Dashboard avançado</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Suporte 24/7</span>
              </div>
            </div>
            <button
              onClick={() => handleSelecionarPlano('premium')}
              disabled={loadingCheckout === 'premium'}
              className="w-full text-center py-3 bg-[#00C2FF] hover:bg-[#0099CC] text-white rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCheckout === 'premium' ? 'Processando...' : 'Assinar Agora'}
            </button>
          </div>

          {/* Plano Anual */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#0D1B2A] relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#0D1B2A] text-white text-xs font-bold px-3 py-1 rounded-full">
              Economia: R$ 120
            </div>
            <div className="bg-[#0D1B2A] text-white rounded-xl py-3 px-4 mb-6 text-center">
              <h3 className="text-xl font-bold">Plano Anual</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#0D1B2A]">R$ 197,00</span>
                <span className="text-gray-600">/ano</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Equivale a R$ 16,42/mês</p>
              <div className="mt-2 inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                R$ 120 DE DESCONTO
              </div>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Tudo do Premium</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Pagamento anual</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Melhor custo-benefício</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Suporte prioritário 24/7</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-sm text-gray-700">Acesso antecipado a novas features</span>
              </div>
            </div>
            <button
              onClick={() => handleSelecionarPlano('premium')}
              disabled={loadingCheckout === 'premium'}
              className="w-full text-center py-3 bg-[#0D1B2A] hover:bg-[#1B263B] text-white rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingCheckout === 'premium' ? 'Processando...' : 'Assinar Anual'}
            </button>
          </div>
        </div>

        {/* Seção de Depoimentos */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#0D1B2A] mb-3 sm:mb-4">
              Veja o que nossos <span className="text-[#00C2FF]">usuários</span> estão dizendo
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Mais de 10.000 pessoas já transformaram suas finanças com o PLENIPAY
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {depoimentos.map((depoimento, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-[#00C2FF]/50 transition-all hover:scale-105 hover:shadow-xl"
              >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
                <p className="text-gray-700 mb-4 leading-relaxed text-sm min-h-[60px]">
                  "{depoimento.texto}"
              </p>
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E6F7FF] flex items-center justify-center text-[#00C2FF] font-bold text-sm">
                    {depoimento.inicial}
                </div>
                <div>
                    <p className="text-[#0D1B2A] font-semibold text-sm">{depoimento.nome}</p>
                    <p className="text-gray-600 text-xs">{depoimento.plano}</p>
                </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Garantia */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-lg text-center mb-12 sm:mb-16">
          <Shield className="text-[#00C2FF] mx-auto mb-3 sm:mb-4" size={40} />
          <h3 className="text-xl sm:text-2xl font-display font-bold text-[#0D1B2A] mb-2 sm:mb-3">
            Garantia de Satisfação
          </h3>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Teste qualquer plano por 7 dias grátis. Se não ficar satisfeito, 
            devolvemos 100% do seu dinheiro. Sem perguntas, sem complicações.
          </p>
        </div>

        {/* Footer */}
        <footer className="bg-[#0D1B2A] text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <p>© 2025 PLENIPAY. Todos os direitos reservados.</p>
              <div className="flex flex-wrap gap-6 justify-center">
                <Link href="/termos" className="hover:text-[#00C2FF] transition-colors">Termos</Link>
                <Link href="/privacidade" className="hover:text-[#00C2FF] transition-colors">Privacidade</Link>
                <Link href="/suporte" className="hover:text-[#00C2FF] transition-colors">Suporte</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal de Seleção de Pagamento */}
      {showPaymentModal && planoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-[#0D1B2A]">
                Escolha o Método de Pagamento
              </h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPlanoSelecionado(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <X size={20} className="text-[#0D1B2A]" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Plano selecionado: <strong className="text-[#00C2FF]">{planos.find(p => p.id === planoSelecionado)?.nome}</strong>
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setMetodoPagamento('PIX')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'PIX'
                      ? 'border-[#00C2FF] bg-[#E6F7FF]'
                      : 'border-gray-200 hover:border-[#00C2FF]/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'PIX' ? 'bg-[#00C2FF]' : 'bg-gray-100'}`}>
                    <Smartphone size={24} className={metodoPagamento === 'PIX' ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#0D1B2A]">PIX</p>
                    <p className="text-xs text-gray-600">Aprovação imediata</p>
                  </div>
                  {metodoPagamento === 'PIX' && (
                    <Check size={20} className="text-[#00C2FF]" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('BOLETO')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'BOLETO'
                      ? 'border-[#00C2FF] bg-[#E6F7FF]'
                      : 'border-gray-200 hover:border-[#00C2FF]/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'BOLETO' ? 'bg-[#00C2FF]' : 'bg-gray-100'}`}>
                    <Receipt size={24} className={metodoPagamento === 'BOLETO' ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#0D1B2A]">Boleto</p>
                    <p className="text-xs text-gray-600">Vencimento em 3 dias úteis</p>
                  </div>
                  {metodoPagamento === 'BOLETO' && (
                    <Check size={20} className="text-[#00C2FF]" />
                  )}
                </button>

                <button
                  onClick={() => setMetodoPagamento('CREDIT_CARD')}
                  className={`w-full p-4 rounded-xl border-2 transition-smooth flex items-center gap-3 ${
                    metodoPagamento === 'CREDIT_CARD'
                      ? 'border-[#00C2FF] bg-[#E6F7FF]'
                      : 'border-gray-200 hover:border-[#00C2FF]/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${metodoPagamento === 'CREDIT_CARD' ? 'bg-[#00C2FF]' : 'bg-gray-100'}`}>
                    <CreditCard size={24} className={metodoPagamento === 'CREDIT_CARD' ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[#0D1B2A]">Cartão de Crédito</p>
                    <p className="text-xs text-gray-600">Aprovação imediata</p>
                  </div>
                  {metodoPagamento === 'CREDIT_CARD' && (
                    <Check size={20} className="text-[#00C2FF]" />
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
                className="flex-1 px-4 py-3 bg-gray-100 text-[#0D1B2A] rounded-xl font-medium hover:bg-gray-200 transition-smooth"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleProcessarPagamento()}
                disabled={loadingCheckout !== null}
                className="flex-1 px-4 py-3 bg-[#00C2FF] text-white rounded-xl font-semibold hover:bg-[#0099CC] transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-[#0D1B2A]">
                CPF Obrigatório
              </h3>
              <button
                onClick={() => {
                  setShowCpfModal(false)
                  setCpf('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <X size={20} className="text-[#0D1B2A]" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Para criar uma assinatura, precisamos do seu CPF. Por favor, informe seu CPF abaixo:
              </p>
              
              <div>
                <label className="block text-sm font-medium text-[#0D1B2A] mb-2">
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
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-[#0D1B2A] placeholder-gray-400 focus:outline-none focus:border-[#00C2FF] transition-smooth"
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
                className="flex-1 px-4 py-3 bg-gray-100 text-[#0D1B2A] rounded-xl font-semibold hover:bg-gray-200 transition-smooth"
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
                className="flex-1 px-4 py-3 bg-[#00C2FF] text-white rounded-xl font-semibold hover:bg-[#0099CC] transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
