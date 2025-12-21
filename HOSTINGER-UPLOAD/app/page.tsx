'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Target, FolderTree, BarChart3, CheckCircle2, Star, ChevronDown, Users, TrendingUp, Calendar, FileText, MessageCircle, Smartphone, ChevronLeft, ChevronRight, Bot, Monitor, Sparkles, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFeaturePage, setCurrentFeaturePage] = useState(1)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Detectar modo escuro/claro
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    checkDarkMode()
    
    // Observar mudanças no tema
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Verificar autenticação
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        
        // Monitorar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setIsAuthenticated(!!session?.user)
        })
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
    
    return () => observer.disconnect()
  }, [])

  const handleSelecionarPlano = (planoId: 'teste' | 'basico' | 'premium' | 'anual') => {
    if (planoId === 'teste') {
      router.push('/cadastro?plano=teste')
      return
    }

    if (!isAuthenticated) {
      router.push(`/cadastro?plano=${planoId}`)
      return
    }

    // Redirecionar para checkout com o plano selecionado
    router.push(`/checkout?plano=${planoId}`)
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const totalPages = 5
  const testimonialsPerPage = 3

  // Array com todos os depoimentos (15 depoimentos para 5 páginas)
  const allTestimonials = [
    { name: 'Gabriela Bispo', role: 'Advogada', text: '"Consegui organizar minhas finanças de forma incrível! O PLENIPAY me ajudou a economizar mais de R$ 3.000 em apenas 2 meses. Recomendo para todos!"' },
    { name: 'Vitória Assis', role: 'Coach', text: '"Como coach financeiro, recomendo o PLENIPAY para todos os meus clientes. A interface é intuitiva e os relatórios são excelentes para análise."' },
    { name: 'Dilma Menezes', role: 'Vendedora', text: '"Nunca imaginei que seria tão fácil controlar minhas finanças! O sistema de metas me motiva todos os dias. Já alcancei minha primeira meta de R$ 5.000!"' },
    { name: 'Rafael Costa', role: 'Empresário', text: '"O PLENIPAY transformou como eu gerencio o dinheiro da minha empresa. Os relatórios são completos e me ajudam a tomar decisões mais inteligentes."' },
    { name: 'Mariana Silva', role: 'Designer', text: '"Finalmente encontrei uma ferramenta que realmente funciona! O controle de dívidas é perfeito e me ajudou a quitar várias pendências."' },
    { name: 'Pedro Alves', role: 'Estudante', text: '"Como estudante, preciso controlar cada centavo. O PLENIPAY é gratuito e me ajuda muito a manter minhas finanças organizadas!"' },
    { name: 'Julia Santos', role: 'Médica', text: '"A melhor plataforma de controle financeiro que já usei! Simples, eficiente e muito útil para quem tem uma vida corrida."' },
    { name: 'Lucas Oliveira', role: 'Freelancer', text: '"Controle total das minhas receitas e despesas. O PLENIPAY é essencial para qualquer freelancer que quer organizar suas finanças."' },
    { name: 'Ana Paula', role: 'Profissional de TI', text: '"A interface é linda e intuitiva. Conseguir organizar tudo pelo WhatsApp é um diferencial incrível!"' },
    { name: 'Carlos Mendes', role: 'Comerciante', text: '"Excelente ferramenta! Me ajuda a controlar tanto as finanças pessoais quanto do meu negócio. Recomendo!"' },
    { name: 'Fernanda Lima', role: 'Arquiteta', text: '"O sistema de metas é genial! Consegui economizar para uma viagem dos sonhos em apenas 6 meses usando o PLENIPAY."' },
    { name: 'Roberto Souza', role: 'Aposentado', text: '"Mesmo aposentado, preciso controlar bem meu dinheiro. O PLENIPAY me ajuda muito e é super fácil de usar!"' },
    { name: 'Beatriz Rocha', role: 'Enfermeira', text: '"Uma plataforma completa! Consigo ver todos meus gastos e receitas em um só lugar. Perfeito!"' },
    { name: 'Thiago Barbosa', role: 'Advogado', text: '"O melhor investimento que fiz este ano! O PLENIPAY me ajuda a manter minhas finanças sempre organizadas."' },
    { name: 'Camila Ferreira', role: 'Psicóloga', text: '"Incrível como uma ferramenta pode fazer tanta diferença! Minha vida financeira está completamente organizada agora."' },
  ]

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    } else {
      setCurrentPage(1) // Loop infinito
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    } else {
      setCurrentPage(totalPages) // Loop infinito
    }
  }

  // Calcular quais depoimentos mostrar na página atual
  const { startIndex, currentTestimonials } = useMemo(() => {
    const start = (currentPage - 1) * testimonialsPerPage
    const end = start + testimonialsPerPage
    const testimonials = allTestimonials.slice(start, end)
    return { startIndex: start, currentTestimonials: testimonials }
  }, [currentPage, testimonialsPerPage, allTestimonials])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/2 cores.png" 
              alt="PLENIPAY" 
              width={300}
              height={75}
              className="h-8 sm:h-10 md:h-14 w-auto object-contain"
              style={{ width: 'auto', height: '100%' }}
              priority
            />
          </div>
          {isAuthenticated ? (
            <Link
              href="/home"
              className="px-3 py-1.5 text-xs sm:text-sm md:text-base text-white bg-[#00C2FF] hover:bg-[#0099CC] rounded-lg font-semibold transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs sm:text-sm md:text-base text-white bg-[#00C2FF] hover:bg-[#0099CC] rounded-lg font-semibold transition-all duration-300 shadow-md"
              >
                Entrar
              </Link>
              <Link
                href="/#planos"
                className="px-3 py-1.5 text-xs sm:text-sm md:text-base text-white bg-[#0099CC] hover:bg-[#007A99] rounded-lg font-semibold transition-all duration-300"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section com Imagem da Mulher */}
      <section className="bg-white pt-3 sm:pt-6 md:pt-8 pb-6 sm:pb-10 md:pb-12 relative overflow-hidden">
        {/* Cofrinhos e WhatsApp flutuantes na frente - quantidade reduzida */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* Cofrinho 1 - Superior esquerdo */}
          <Image
            src="/cofrinho.png"
            alt=""
            width={80}
            height={80}
            className="absolute top-20 left-12 md:top-28 md:left-20 opacity-40 md:opacity-50 animate-float-1"
            style={{ width: '50px', height: 'auto' }}
            unoptimized
          />
          {/* Cofrinho 2 - Inferior direito */}
          <Image
            src="/cofrinho.png"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-24 right-16 md:bottom-32 md:right-24 opacity-45 md:opacity-55 animate-float-2"
            style={{ width: '55px', height: 'auto' }}
            unoptimized
          />
          {/* WhatsApp - Centro direito */}
          <Image
            src="/wpp azul.png"
            alt=""
            width={80}
            height={80}
            className="absolute top-1/2 right-12 md:top-1/2 md:right-20 opacity-40 md:opacity-50 animate-float-3"
            style={{ width: '60px', height: 'auto', transform: 'translateY(-50%)' }}
            unoptimized
          />
          {/* WhatsApp - Inferior centro */}
          <Image
            src="/wpp azul.png"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-28 left-1/2 md:bottom-36 md:left-1/2 opacity-35 md:opacity-45 animate-float-1"
            style={{ width: '55px', height: 'auto', transform: 'translateX(-50%)' }}
            unoptimized
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Texto à esquerda */}
            <div className={`text-center md:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#E6F7FF] border border-[#00C2FF] rounded-full mb-4 sm:mb-6">
                <TrendingUp size={14} className="text-[#00C2FF] sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium text-[#00C2FF]">Plataforma #1 em Controle Financeiro</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-[#0D1B2A] mb-3 sm:mb-4 leading-tight">
                Controle Financeiro
                <br />
                <span className="text-[#00C2FF]">Simplificado</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                Gerencie suas finanças pessoais, dívidas e empréstimos de forma inteligente e organizada. 
                <span className="text-[#00C2FF] font-semibold"> Tudo em um só lugar</span>, com design moderno e intuitivo.
              </p>
              <div className="flex justify-center md:justify-start">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gradient-to-r from-[#00C2FF] to-[#0099CC] text-white rounded-xl font-bold hover:shadow-xl hover:shadow-[#00C2FF]/30 transition-all duration-300 transform hover:scale-105"
                >
                  Testar Agora Grátis
                  <ArrowRight size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                </a>
              </div>
            </div>
            
            {/* Imagem à direita */}
            <div className="relative z-10">
              <div className="relative">
                <Image
                  src="/foto png mulher inicial.png"
                  alt="PLENIPAY - Controle Financeiro Simplificado"
                  width={600}
                  height={800}
                  className="w-full h-auto relative z-10"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - 2 Cards lado a lado */}
      <section className="bg-gray-50 py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: Metas Financeiras */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Target size={20} className="text-[#00C2FF] sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-[#0D1B2A] mb-2 sm:mb-3 text-center">
                Metas Financeiras
              </h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                Crie e acompanhe suas metas de economia de forma simples e direta pelo WhatsApp. 
                Defina objetivos, acompanhe o progresso e receba atualizações automáticas.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Criação rápida de metas por mensagem</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Acompanhamento automático do progresso</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Notificações de atualização em tempo real</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Visualização do status das metas</span>
                </div>
              </div>
              {/* Imagem de Metas Financeiras */}
              <div className="mt-4 sm:mt-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="/SCR-20251214-qhrs.png"
                  alt="Metas Financeiras no PLENIPAY"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  unoptimized
                />
              </div>
            </div>

            {/* Card 2: Categorias */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <FolderTree size={20} className="text-[#00C2FF] sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-[#0D1B2A] mb-2 sm:mb-3 text-center">
                Categorias Inteligentes
              </h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                Classificação automática dos seus gastos por categoria via WhatsApp. 
                Organize suas despesas de forma inteligente e receba relatórios detalhados.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Classificação automática dos gastos</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Categorias personalizáveis e ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Relatórios por categoria direto no WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm text-gray-700">Análise de padrões de gastos</span>
                </div>
              </div>
              {/* Imagem de Categorias Inteligentes */}
              <div className="mt-4 sm:mt-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <Image
                  src="/SCR-20251214-lzqy.png"
                  alt="Categorias Inteligentes no PLENIPAY"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Como Usar PLEN no WhatsApp */}
      <section className="bg-white py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
            {/* Imagem do Celular à Esquerda */}
            <div className="relative order-2 md:order-1">
              <div className="relative flex justify-center items-center">
                <Image
                  src="/WhatsApp Image 2025-12-12 at 22.20.47-portrait.png"
                  alt="PLEN no WhatsApp"
                  width={400}
                  height={800}
                  className="w-full max-w-xs h-auto"
                  style={{ imageRendering: 'auto' }}
                  unoptimized
                />
              </div>
            </div>

            {/* Texto Explicativo à Direita */}
            <div className="order-1 md:order-2 text-center md:text-left">
              <div className="inline-block px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#E6F7FF] border border-[#00C2FF] rounded-full mb-3 sm:mb-4">
                <span className="text-[#00C2FF] font-semibold text-[10px] sm:text-xs">FUNCIONALIDADES DO WHATSAPP</span>
              </div>
              
              <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-[#0D1B2A] mb-2 sm:mb-3 leading-tight">
                Veja como é fácil registrar transações pelo WhatsApp
              </h2>

              <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {/* Item 1 */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0D1B2A] mb-1">Fale com o PLEN!</h3>
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                      Pode mandar uma mensagem de texto, uma foto do comprovante, um áudio ou até um PDF — 
                      o PLEN entende tudo.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0D1B2A] mb-1">Interpretação automática</h3>
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                      Ele identifica na hora o valor, o tipo da transação e a categoria correta, 
                      sem você precisar fazer nada.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0D1B2A] mb-1">Registro em tempo real</h3>
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                      Sua movimentação já aparece no painel de controle e nos relatórios financeiros, 
                      prontinha pra você acompanhar.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mt-4 sm:mt-6 mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm">
                Faça o teste e veja como o PLEN pode te ajudar no dia a dia de forma inteligente 
                e sem precisar de planilhas.
              </p>

              <div className="flex justify-center md:justify-start">
                <a
                  href="#planos"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-[#00C2FF] hover:bg-[#0099CC] text-white rounded-xl font-bold transition-all duration-300 shadow-md transform hover:scale-105"
                >
                  Testar Agora
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção O PLEN é para você que */}
      <section className="bg-white py-6 sm:py-8 md:py-10">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-[#0D1B2A] text-center mb-4 sm:mb-6 md:mb-8">
            O <span className="text-[#00C2FF]">PLEN</span> é para você que:
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Bloco 1 */}
            <div className="relative">
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm sm:text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-1">
                    O dinheiro simplesmente some
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    Você trabalha, recebe... e continua no vermelho.
                  </p>
                </div>
              </div>
              <div className="ml-12 mt-4 relative flex items-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
                <div className="mx-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF]/50 blur-[1px]"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
              </div>
            </div>

            {/* Bloco 2 */}
            <div className="relative">
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm sm:text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-1">
                    Não sabe onde gastou
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    Perde o controle dos gastos e não consegue economizar.
                  </p>
                </div>
              </div>
              <div className="ml-10 sm:ml-12 mt-3 sm:mt-4 relative flex items-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
                <div className="mx-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF]/50 blur-[1px]"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
              </div>
            </div>

            {/* Bloco 3 */}
            <div className="relative">
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm sm:text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-1">
                    Quer simplificar sua vida
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    Busca uma forma prática e rápida de controlar suas finanças.
                  </p>
                </div>
              </div>
              <div className="ml-10 sm:ml-12 mt-3 sm:mt-4 relative flex items-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
                <div className="mx-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF]/50 blur-[1px]"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
              </div>
            </div>

            {/* Bloco 4 */}
            <div className="relative">
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm sm:text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-1">
                    Quer ter controle total
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                    Deseja acompanhar receitas, despesas e metas em um só lugar.
                  </p>
                </div>
              </div>
              <div className="ml-10 sm:ml-12 mt-3 sm:mt-4 relative flex items-center">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
                <div className="mx-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF]/50 blur-[1px]"></div>
                <div className="flex-1 h-[2px] bg-gradient-to-r from-[#00C2FF]/0 via-[#00C2FF]/30 to-[#00C2FF]/0 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Funcionalidades do PLENIPAY */}
      <section className="bg-gray-50 py-6 sm:py-8 md:py-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-[#0D1B2A] mb-2">
              Funcionalidades do <span className="text-[#00C2FF]">PLENIPAY</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Veja como nossa I.A vai transformar sua vida financeira de forma simples e prática no WhatsApp
            </p>
          </div>

          {/* Array de funcionalidades */}
          {(() => {
            const funcionalidades = [
              {
                numero: 1,
                titulo: 'Comprovante',
                descricao: 'Envie uma foto do comprovante e deixe que o PLEN registra suas entradas e saídas.'
              },
              {
                numero: 2,
                titulo: 'Mensagem',
                descricao: 'Basta enviar uma mensagem informando seus gastos, receitas, lembretes....'
              },
              {
                numero: 3,
                titulo: 'Lembrete',
                descricao: 'Envie um lembrete informando seu compromisso com: Descrição, Data e horário.'
              },
              {
                numero: 4,
                titulo: 'Relatório',
                descricao: 'Peça um relatório detalhado dos últimos x dias de todos os seus gastos.'
              },
              {
                numero: 5,
                titulo: 'Áudio',
                descricao: 'Envie um áudio informando o sua compra, seu compromisso ou seus pagamentos.'
              }
            ]

            const totalFeaturePages = Math.ceil(funcionalidades.length / 3)
            
            // Função para navegar para a próxima página (loop infinito)
            const nextPage = () => {
              setCurrentFeaturePage((prev) => (prev >= totalFeaturePages ? 1 : prev + 1))
            }
            
            // Função para navegar para a página anterior (loop infinito)
            const prevPage = () => {
              setCurrentFeaturePage((prev) => (prev <= 1 ? totalFeaturePages : prev - 1))
            }

            // Lógica para mostrar os cards corretos com loop
            let currentFeatures: typeof funcionalidades = []
            if (currentFeaturePage === 1) {
              // Página 1: mostra 1, 2, 3
              currentFeatures = funcionalidades.slice(0, 3)
            } else if (currentFeaturePage === 2) {
              // Página 2: mostra 4, 5, 1 (loop)
              currentFeatures = [
                funcionalidades[3], // 4
                funcionalidades[4], // 5
                funcionalidades[0]  // 1 (volta para o início)
              ]
            }

            return (
              <div className="relative max-w-6xl mx-auto">
                {/* Botão Anterior - Sempre visível */}
                <button
                  onClick={prevPage}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 md:-translate-x-6 z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center shadow-md hover:bg-[#0099CC] transition-all duration-300 hover:scale-105"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>

                {/* Grid de 3 Cards com animação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 relative">
                  <div 
                    key={currentFeaturePage}
                    className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-slide-fade"
                  >
                    {currentFeatures.map((feature) => (
                      <div key={`${currentFeaturePage}-${feature.numero}`} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        {/* Header Verde */}
                        <div className="bg-[#00C2FF] px-3 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center">
                              <span className="text-[#00C2FF] font-bold text-xs sm:text-sm">{feature.numero}</span>
                            </div>
                            <h3 className="text-white font-black text-sm sm:text-base md:text-lg text-center">{feature.titulo}</h3>
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="p-3 sm:p-4">
                          <p className="text-gray-600 mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm">
                            {feature.descricao}
                          </p>
                          {/* Imagem do WhatsApp */}
                          {feature.numero === 1 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src="/WhatsApp Image 2025-12-13 at 18.56.42.jpeg"
                                alt="Exemplo de uso do Comprovante no WhatsApp"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain"
                                unoptimized
                              />
                            </div>
                          ) : feature.numero === 2 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src="/WhatsApp Image 2025-12-13 at 18.48.38 (1).jpeg"
                                alt="Exemplo de uso de Mensagem no WhatsApp"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain"
                                unoptimized
                              />
                            </div>
                          ) : feature.numero === 3 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src="/WhatsApp Image 2025-12-13 at 18.48.38.jpeg"
                                alt="Exemplo de uso de Lembrete no WhatsApp"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain"
                                unoptimized
                              />
                            </div>
                          ) : feature.numero === 4 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src="/WhatsApp Image 2025-12-13 at 18.48.37 (1).jpeg"
                                alt="Exemplo de uso de Relatório no WhatsApp"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain"
                                unoptimized
                              />
                            </div>
                          ) : feature.numero === 5 ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                              <Image
                                src="/WhatsApp Image 2025-12-13 at 18.48.37.jpeg"
                                alt="Exemplo de uso de Áudio no WhatsApp"
                                width={600}
                                height={400}
                                className="w-full h-auto object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-gray-300">
                              <span className="text-gray-400 text-xs text-center px-4">Imagem do WhatsApp<br/>será adicionada aqui</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão Próximo - Sempre visível */}
                <button
                  onClick={nextPage}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 md:translate-x-6 z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-[#00C2FF] text-white flex items-center justify-center shadow-md hover:bg-[#0099CC] transition-all duration-300 hover:scale-105"
                  aria-label="Próximo"
                >
                  <ChevronRight size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>

                {/* Indicador de Página */}
                <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
                  <span className="text-xs text-gray-600">{currentFeaturePage}/{totalFeaturePages}</span>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* Seção Simples e Prático */}
      <section className="bg-white py-8 md:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-display font-bold text-[#0D1B2A] mb-2">
              Simples e <span className="text-[#00C2FF]">prático</span>:
            </h2>
          </div>

          {/* Grid de 3 Passos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {/* Passo 1: Você envia uma mensagem */}
            <div className="bg-[#E6F7FF] rounded-xl p-4 md:p-5 shadow-md border-2 border-[#00C2FF]/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#00C2FF] flex items-center justify-center mb-3 shadow-md">
                  <MessageCircle className="text-white" size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-2">
                  Você envia uma mensagem
                </h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  Simplesmente envie uma mensagem para o PLEN no WhatsApp com seus gastos ou receitas.
                </p>
              </div>
            </div>

            {/* Passo 2: A inteligência artificial processa */}
            <div className="bg-[#E6F7FF] rounded-xl p-4 md:p-5 shadow-md border-2 border-[#00C2FF]/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#00C2FF] flex items-center justify-center mb-3 shadow-md">
                  <Bot className="text-white" size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-2">
                  A inteligência artificial processa
                </h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  O PLEN entende o que você diz, identifica se é um gasto, lembrete ou comprovante e já organiza tudo na categoria certa.
                </p>
              </div>
            </div>

            {/* Passo 3: Registra e envia para o seu dashboard */}
            <div className="bg-[#E6F7FF] rounded-xl p-4 md:p-5 shadow-md border-2 border-[#00C2FF]/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#00C2FF] flex items-center justify-center mb-3 shadow-md">
                  <Monitor className="text-white" size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-base md:text-lg font-display font-bold text-[#0D1B2A] mb-2">
                  Registra e envia para o seu dashboard
                </h3>
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  Em segundos, seu registro é sincronizado com o seu dashboard. Com direito de acesso através do celular, tablet ou computador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relatórios Section */}
      <section className="bg-white py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-100 max-w-4xl mx-auto text-center">
            <div className="w-12 h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mb-4 mx-auto">
              <BarChart3 size={24} className="text-[#00C2FF]" />
            </div>
            <h3 className="text-xl md:text-2xl font-display font-bold text-[#0D1B2A] mb-3">
              Relatórios Detalhados
            </h3>
            <p className="text-gray-600 mb-5 leading-relaxed text-sm md:text-base max-w-2xl mx-auto">
              Relatórios financeiros simples e diretos pelo WhatsApp. Visualize seus dados de forma clara e 
              organize suas informações financeiras sem complicação.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Relatórios automáticos por período</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Gráficos e resumos por categoria</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Análise de receitas e despesas</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Exportação de dados em formato simples</span>
              </div>
            </div>
            {/* Imagem do relatório */}
            <div className="rounded-xl overflow-hidden mb-6 shadow-lg border border-gray-200">
              <Image
                src="/SCR-20251214-lzon.png"
                alt="Relatório financeiro detalhado do PLENIPAY mostrando receitas, despesas e gráficos"
                width={800}
                height={600}
                className="w-full h-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
                unoptimized
              />
            </div>
            <div className="text-center">
              <a
                href="#planos"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm bg-[#00C2FF] hover:bg-[#0099CC] text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Começar Agora!
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos/Clientes */}
      <section className="bg-gray-50 py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-[#0D1B2A] mb-3">
              Clientes que <span className="text-[#00C2FF]">Transformaram</span> suas vidas com PLENIPAY
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Veja como nossos usuários estão alcançando suas metas financeiras
            </p>
          </div>
          
          {/* Carrossel de depoimentos */}
          <div className="relative max-w-7xl mx-auto px-8 md:px-12">
            {/* Botão Anterior - Sempre visível */}
            <button
              onClick={prevPage}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#00C2FF] text-white flex items-center justify-center shadow-lg hover:bg-[#0099CC] transition-all duration-300 hover:scale-110"
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Grid de depoimentos */}
            <div key={currentPage} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {currentTestimonials.map((testimonial, index) => {
                // Gerar iniciais do nome para o avatar
                const initials = testimonial.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
                
                // Cores de gradiente para avatares (baseado no índice)
                const avatarColors = [
                  'from-[#00C2FF] to-[#0099CC]',
                  'from-[#00C2FF] to-[#00B8E6]',
                  'from-[#0099CC] to-[#00C2FF]',
                ]
                const avatarColor = avatarColors[index % avatarColors.length]
                
                return (
                  <div 
                    key={`${currentPage}-${index}`} 
                    className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-smooth"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {/* Header com Avatar */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <span className="text-white font-bold text-base">{initials}</span>
                    </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#0D1B2A] text-base mb-1">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                    
                    {/* Estrelas */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                    
                    {/* Texto do depoimento */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-4xl text-[#00C2FF]/20 font-serif leading-none">"</div>
                      <p className="text-gray-700 leading-relaxed relative z-10 text-sm md:text-base">
                    {testimonial.text}
                  </p>
                      <div className="absolute -bottom-2 -right-2 text-4xl text-[#00C2FF]/20 font-serif leading-none">"</div>
                  </div>
                </div>
                )
              })}
            </div>

            {/* Botão Próximo - Sempre visível */}
                <button
                  onClick={nextPage}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#00C2FF] text-white flex items-center justify-center shadow-lg hover:bg-[#0099CC] transition-all duration-300 hover:scale-110"
              aria-label="Próximo"
            >
              <ChevronRight size={24} />
                </button>

            {/* Indicador de página */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <span className="text-sm text-gray-600">{currentPage}/{totalPages}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
              <section id="planos" className="bg-white py-6 sm:py-8 md:py-12 scroll-mt-20">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-[#0D1B2A] mb-2 sm:mb-3">
              Escolha o <span className="text-[#00C2FF]">Plano Ideal</span> para Você
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Planos que se adaptam às suas necessidades. Comece grátis e evolua conforme cresce.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto items-start">
            {/* Plano Gratuito */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-all duration-300">
              <div className="bg-gray-100 text-[#0D1B2A] rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 mb-3 sm:mb-4 text-center">
                <h3 className="text-base sm:text-lg font-bold">Plano Gratuito</h3>
              </div>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0D1B2A]">R$ 0</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">sempre grátis</p>
              </div>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Registros (50/mês)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Dashboard básico</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#00C2FF] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Até 2 usuários</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Filtros básicos</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Acesso ao PLEN AI</span>
                </div>
              </div>
              <button
                onClick={() => handleSelecionarPlano('teste')}
                className="block w-full text-center py-2 sm:py-3 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-[#0D1B2A] rounded-xl font-bold transition-all duration-300"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Básico */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-all duration-300">
              <div className="bg-[#00C2FF] text-white rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 mb-3 sm:mb-4 text-center">
                <h3 className="text-base sm:text-lg font-bold">Plano Básico</h3>
              </div>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0D1B2A]">R$ 29,90</span>
                  <span className="text-gray-600 text-xs sm:text-sm">/mês</span>
                </div>
                <p className="text-xs text-[#00C2FF] font-semibold mt-1 sm:mt-2">7 dias grátis</p>
              </div>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Tudo do Gratuito</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Registros ilimitados</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Gerenciar Dívidas</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Salário recorrente</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Calendário Financeiro</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Metas (até 3)</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Até 10 usuários</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#00C2FF] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Suporte prioritário</span>
                </div>
              </div>
              <button
                onClick={() => handleSelecionarPlano('basico')}
                className="block w-full text-center py-2 sm:py-3 text-xs sm:text-sm bg-[#00C2FF] hover:bg-[#0099CC] text-white rounded-xl font-bold transition-all duration-300 shadow-lg"
              >
                Assinar Agora
              </button>
            </div>

            {/* Plano Premium - Destacado */}
            <div className="bg-gradient-to-br from-[#00C2FF] to-[#0099CC] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl border-2 border-white relative transform scale-[1.02] hover:scale-[1.03] transition-all duration-300 z-10">
              <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-[#0D1B2A] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1 sm:gap-1.5">
                <Sparkles size={12} className="text-[#0D1B2A] sm:w-3.5 sm:h-3.5" />
                <span>MAIS POPULAR</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 mb-4 sm:mb-5 text-center border border-white/30">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Plano Premium</h3>
              </div>
              <div className="mb-4 sm:mb-5">
                <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">R$ 49,90</span>
                  <span className="text-white/80 text-xs sm:text-sm">/mês</span>
                </div>
                <p className="text-xs text-white/90 font-semibold mt-1 sm:mt-2 bg-white/20 px-2 py-1 rounded-full inline-block">7 dias grátis</p>
              </div>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Tudo do Básico</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Empréstimos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Upload de documentos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Game Juntar Dinheiro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Metas ilimitadas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Usuários ilimitados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Dashboard avançado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-white flex-shrink-0" />
                  <span className="text-sm text-white font-medium">Suporte 24/7</span>
                </div>
              </div>
              <button
                onClick={() => handleSelecionarPlano('premium')}
                className="block w-full text-center py-3 bg-white hover:bg-gray-100 text-[#00C2FF] rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Assinar Agora
              </button>
            </div>

            {/* Plano Anual - Destacado */}
            <div className="bg-gradient-to-br from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl border-2 border-white relative transform scale-[1.02] hover:scale-[1.03] transition-all duration-300 z-10">
              <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-[#0D1B2A] text-[10px] sm:text-xs font-bold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full shadow-md flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <DollarSign size={12} className="text-[#0D1B2A] flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                <span className="leading-tight">Economia: R$ 120</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 mb-4 sm:mb-5 text-center border border-white/30">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Plano Anual</h3>
              </div>
              <div className="mb-4 sm:mb-5">
                <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">R$ 197,00</span>
                  <span className="text-white/80 text-xs sm:text-sm">/ano</span>
                </div>
                <p className="text-xs text-white/90 font-semibold mt-1 sm:mt-2">Equivale a R$ 16,42/mês</p>
                <div className="mt-1.5 sm:mt-2 inline-block bg-yellow-400 text-[#0D1B2A] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                  R$ 120 DE DESCONTO
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Tudo do Premium</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Pagamento anual</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Melhor custo-benefício</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Suporte prioritário 24/7</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-white flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-white font-medium">Acesso antecipado a novas features</span>
                </div>
              </div>
              <button
                onClick={() => handleSelecionarPlano('anual')}
                className="block w-full text-center py-2 sm:py-3 text-xs sm:text-sm bg-white hover:bg-gray-100 text-[#0D1B2A] rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Assinar Anual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-[#00C2FF]" />
            </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+1,205</div>
              <div className="text-xs md:text-sm text-gray-600">Usuários ativos</div>
            </div>
            <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-[#00C2FF]" />
            </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+36k</div>
              <div className="text-xs md:text-sm text-gray-600">Transações</div>
            </div>
            <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#E6F7FF] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-[#00C2FF]" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+17k</div>
              <div className="text-xs md:text-sm text-gray-600">Lembretes</div>
            </div>
            <div className="bg-gradient-to-br from-[#00C2FF] to-[#0099CC] rounded-xl p-5 md:p-6 text-center shadow-xl border-2 border-[#00C2FF] hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 relative overflow-hidden">
              {/* Efeito de brilho animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star size={24} className="text-white fill-white" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white mb-1">4.9</div>
                <div className="text-xs md:text-sm text-white/90 font-medium">Média de avaliação</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-8 sm:py-12 md:py-20">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-[#0D1B2A] mb-3 sm:mb-4">
              Perguntas <span className="text-[#00C2FF]">Frequentes</span>
            </h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {[
              {
                question: 'Como o PLENIPAY se conecta ao WhatsApp?',
                answer: 'Basta enviar uma mensagem com seus gastos ou comprovantes pelo WhatsApp. Nossa IA processa automaticamente e registra tudo para você. Não precisa instalar nada, funciona direto no WhatsApp que você já usa.'
              },
              {
                question: 'Quais são as formas de pagamento aceitas?',
                answer: 'Aceitamos pagamento via PIX e cartão de crédito. O pagamento é processado de forma segura e você recebe acesso imediato após a confirmação.'
              },
              {
                question: 'Posso cancelar minha assinatura a qualquer momento?',
                answer: 'Sim, você pode cancelar sua assinatura a qualquer momento sem nenhuma multa ou taxa adicional. Seu acesso continuará até o fim do período pago.'
              },
              {
                question: 'Meus dados estão seguros?',
                answer: 'Sim, utilizamos criptografia de ponta a ponta e seguimos todas as normas de segurança de dados. Seus dados financeiros nunca são compartilhados com terceiros.'
              },
              {
                question: 'Como funciona o período de teste grátis?',
                answer: 'Oferecemos um período de teste gratuito para você conhecer todas as funcionalidades. Não é necessário cartão de crédito para começar o teste.'
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-[#00C2FF] to-[#0099CC] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <button
                  onClick={() => toggleFaq(index)}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-[#00B8E6]/20 transition-all duration-300 rounded-xl"
                >
                  <span className="font-bold text-white text-sm sm:text-base md:text-lg flex-1 pr-3 sm:pr-4">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-white transition-transform duration-300 flex-shrink-0 sm:w-6 sm:h-6 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white/95 backdrop-blur-sm border-t border-white/30">
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base">{faq.answer}</p>
                  </div>
                )}
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
  )
}
