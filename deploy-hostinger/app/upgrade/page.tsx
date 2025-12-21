'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles, DollarSign, Loader2, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import Logo from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/components/NotificationBell'

const planos = [
  {
    id: 'gratuito' as const,
    nome: 'Plano Gratuito',
    preco: 'R$ 0',
    periodo: '',
    descricao: 'sempre grátis',
    features: [
      'Registros (50/mês)',
      'Dashboard básico',
      'Até 2 usuários',
      'Filtros básicos',
      'Acesso ao PLEN AI',
    ],
    corHeader: 'bg-gray-100',
    corTexto: 'text-[#0D1B2A]',
    corBotao: 'bg-gray-100 hover:bg-gray-200',
    corTextoBotao: 'text-[#0D1B2A]',
    destacado: false,
  },
  {
    id: 'basico' as const,
    nome: 'Plano Básico',
    preco: 'R$ 29,90',
    periodo: '/mês',
    descricao: '7 dias grátis',
    features: [
      'Tudo do Gratuito',
      'Registros ilimitados',
      'Gerenciar Dívidas',
      'Salário recorrente',
      'Calendário Financeiro',
      'Metas (até 3)',
      'Até 10 usuários',
      'Suporte prioritário',
    ],
    corHeader: 'bg-[#00C2FF]',
    corTexto: 'text-white',
    corBotao: 'bg-[#00C2FF] hover:bg-[#0099CC]',
    corTextoBotao: 'text-white',
    destacado: false,
  },
  {
    id: 'premium' as const,
    nome: 'Plano Premium',
    preco: 'R$ 49,90',
    periodo: '/mês',
    descricao: '7 dias grátis',
    features: [
      'Tudo do Básico',
      'Empréstimos',
      'Upload de documentos',
      'Game Juntar Dinheiro',
      'Metas ilimitadas',
      'Usuários ilimitados',
      'Dashboard avançado',
      'Suporte 24/7',
    ],
    corHeader: 'bg-white/20 backdrop-blur-sm border border-white/30',
    corTexto: 'text-white',
    corBotao: 'bg-white hover:bg-gray-100',
    corTextoBotao: 'text-[#00C2FF]',
    destacado: true,
    badge: 'MAIS POPULAR',
  },
  {
    id: 'anual' as const,
    nome: 'Plano Anual',
    preco: 'R$ 197,00',
    periodo: '/ano',
    descricao: 'Equivale a R$ 16,42/mês',
    desconto: 'R$ 120 DE DESCONTO',
    economia: 'Economia: R$ 120',
    features: [
      'Tudo do Premium',
      'Pagamento anual',
      'Melhor custo-benefício',
      'Suporte prioritário 24/7',
      'Acesso antecipado a novas features',
    ],
    corHeader: 'bg-white/20 backdrop-blur-sm border border-white/30',
    corTexto: 'text-white',
    corBotao: 'bg-white hover:bg-gray-100',
    corTextoBotao: 'text-[#0D1B2A]',
    destacado: true,
    badge: 'Economia: R$ 120',
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  const handleSelecionarPlano = (planoId: string) => {
    if (planoId === 'gratuito') {
      router.push('/home')
      return
    }
    router.push(`/checkout?plano=${planoId}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#00C2FF]" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen bg-white">
        {/* Header Mobile */}
        <div className="lg:hidden pt-6 pb-4 px-3 sm:px-4 bg-white border-b border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>
          <div className="flex items-center gap-3 px-3">
            <MenuButton />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0D1B2A] leading-none">
              Upgrade de Plano
            </h1>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <section className="bg-white py-10 md:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-[#0D1B2A] mb-3">
                Escolha o <span className="text-[#00C2FF]">Plano Ideal</span> para Você
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Planos que se adaptam às suas necessidades. Comece grátis e evolua conforme cresce.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`${
                    plano.destacado
                      ? plano.id === 'premium'
                        ? 'bg-gradient-to-br from-[#00C2FF] to-[#0099CC] rounded-2xl p-5 md:p-6 shadow-xl border-2 border-white relative transform scale-[1.02] hover:scale-[1.03] transition-all duration-300 z-10'
                        : 'bg-gradient-to-br from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] rounded-2xl p-5 md:p-6 shadow-xl border-2 border-white relative transform scale-[1.02] hover:scale-[1.03] transition-all duration-300 z-10'
                      : 'bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-all duration-300'
                  }`}
                >
                  {/* Badge destacado */}
                  {plano.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${
                      plano.id === 'premium'
                        ? 'bg-yellow-400 text-[#0D1B2A]'
                        : 'bg-yellow-400 text-[#0D1B2A]'
                    } text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 ${
                      plano.id === 'anual' ? 'px-4 py-1.5' : ''
                    }`}>
                      {plano.id === 'premium' && <Sparkles size={14} className="text-[#0D1B2A]" />}
                      {plano.id === 'anual' && <DollarSign size={14} className="text-[#0D1B2A] flex-shrink-0" />}
                      <span className={plano.id === 'anual' ? 'leading-tight whitespace-nowrap' : ''}>
                        {plano.badge}
                      </span>
                    </div>
                  )}

                  {/* Header do plano */}
                  <div className={`${plano.corHeader} ${plano.corTexto} rounded-xl py-2 px-3 mb-4 text-center ${
                    plano.destacado ? 'border border-white/30' : ''
                  }`}>
                    <h3 className="text-lg font-bold">{plano.nome}</h3>
                  </div>

                  {/* Preço */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl md:text-3xl font-bold ${
                        plano.destacado ? 'text-white' : 'text-[#0D1B2A]'
                      }`}>
                        {plano.preco}
                      </span>
                      {plano.periodo && (
                        <span className={`text-sm ${
                          plano.destacado ? 'text-white/80' : 'text-gray-600'
                        }`}>
                          {plano.periodo}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-2 ${
                      plano.destacado ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      {plano.descricao}
                    </p>
                    {plano.desconto && (
                      <div className="mt-2 inline-block bg-yellow-400 text-[#0D1B2A] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        {plano.desconto}
                      </div>
                    )}
                    {plano.id === 'premium' && (
                      <p className="text-xs text-white/90 font-semibold mt-2 bg-white/20 px-2 py-1 rounded-full inline-block">
                        7 dias grátis
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plano.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2
                          size={18}
                          className={`flex-shrink-0 ${
                            plano.destacado ? 'text-white' : 'text-[#00C2FF]'
                          }`}
                        />
                        <span className={`text-sm ${
                          plano.destacado ? 'text-white font-medium' : 'text-gray-700'
                        }`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botão */}
                  <button
                    onClick={() => handleSelecionarPlano(plano.id)}
                    disabled={loadingCheckout === plano.id}
                    className={`w-full text-center py-3 ${plano.corBotao} ${plano.corTextoBotao} rounded-xl font-bold transition-all duration-300 ${
                      plano.destacado
                        ? 'shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'shadow-lg'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loadingCheckout === plano.id ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        {plano.id === 'gratuito' ? 'Começar Grátis' : plano.id === 'anual' ? 'Assinar Anual' : 'Assinar Agora'}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção de Suporte WhatsApp */}
        <section className="bg-white py-10 md:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 text-center">
                <h2 className="text-xl md:text-2xl font-display font-bold text-[#0D1B2A] mb-3">
                  Ainda tem dúvidas?
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-base md:text-lg">
                  Nossa equipe está pronta para ajudar e responder a todas as suas perguntas.
                </p>
                <a
                  href="https://wa.me/message/PLHJUVZSV2B5O1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                  </svg>
                  <span>Fale com nossa equipe!</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
