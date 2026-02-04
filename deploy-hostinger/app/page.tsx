'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Target, FolderTree, BarChart3, CheckCircle2, Star, ChevronDown, Users, TrendingUp, Calendar, FileText, MessageCircle, Smartphone, ChevronLeft, ChevronRight, Bot, Monitor, Sparkles, DollarSign, Instagram, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AnimateOnScroll from '@/components/AnimateOnScroll'

const ALL_TESTIMONIALS = [
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

const FUNCIONALIDADES_PLENIPAY = [
  { numero: 1, titulo: 'Comprovante', descricao: 'Envie uma foto do comprovante e deixe que o PLEN registra suas entradas e saídas.', img: '/WhatsApp Image 2025-12-13 at 18.56.42.jpeg', imgAlt: 'Exemplo de uso do Comprovante no WhatsApp' },
  { numero: 2, titulo: 'Mensagem', descricao: 'Basta enviar uma mensagem informando seus gastos, receitas, lembretes....', img: '/WhatsApp Image 2025-12-13 at 18.48.38 (1).jpeg', imgAlt: 'Exemplo de uso de Mensagem no WhatsApp' },
  { numero: 3, titulo: 'Lembrete', descricao: 'Envie um lembrete informando seu compromisso com: Descrição, Data e horário.', img: '/WhatsApp Image 2025-12-13 at 18.48.38.jpeg', imgAlt: 'Exemplo de uso de Lembrete no WhatsApp' },
  { numero: 4, titulo: 'Relatório', descricao: 'Peça um relatório detalhado dos últimos x dias de todos os seus gastos.', img: '/WhatsApp Image 2025-12-13 at 18.48.37 (1).jpeg', imgAlt: 'Exemplo de uso de Relatório no WhatsApp' },
  { numero: 5, titulo: 'Áudio', descricao: 'Envie um áudio informando o sua compra, seu compromisso ou seus pagamentos.', img: '/WhatsApp Image 2025-12-13 at 18.48.37.jpeg', imgAlt: 'Exemplo de uso de Áudio no WhatsApp' },
]

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const heroRef = useRef<HTMLElement>(null)

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = heroRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleHeroMouseLeave = useCallback(() => {
    setMousePos(null)
  }, [])

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
    
    // Verificar autenticação - com delay para não bloquear carregamento inicial
    const checkAuth = async () => {
      // Delay de 500ms para não bloquear renderização inicial
      await new Promise(resolve => setTimeout(resolve, 500))
      
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean, minimal, finlo-style */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image 
                src="/logo-header.png" 
                alt="PLENIPAY" 
                width={120}
                height={40}
                className="h-9 md:h-10 w-auto object-contain"
                priority
              />
            </Link>
            
            {/* Menu de Navegação - Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#funcionalidades"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-gray-500 hover:text-[#1e4976] transition-colors"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-gray-500 hover:text-[#1e4976] transition-colors"
              >
                Como funciona
              </a>
              <a
                href="#planos"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-gray-500 hover:text-[#1e4976] transition-colors"
              >
                Planos
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-gray-500 hover:text-[#1e4976] transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Botões de Ação */}
            {isAuthenticated ? (
              <Link
                href="/home"
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] rounded-lg transition-all duration-300 shadow-md"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-sm font-medium text-[#1e4976] hover:text-[#163a5f] transition-colors font-sans"
                >
                  Entrar
                </Link>
                <Link
                  href="#planos"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] rounded-lg transition-all duration-300 shadow-md"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Clean, finlo-style, light grey + grid on mouse */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden bg-neutral-50 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-20"
      >
        {/* Grade que aparece ao passar o mouse */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: mousePos ? 0.85 : 0,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.14) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.14) 1px, transparent 1px)
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
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="max-w-2xl mx-auto">
            {/* Conteúdo do hero */}
            <div className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <p className="text-xs font-medium text-[#1e4976] uppercase tracking-wider mb-4">Plataforma #1 em Controle Financeiro</p>
              <h1
                className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-[1.1] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-text"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #0a0a0a 0%, #2d2d2d 25%, #0a0a0a 50%, #404040 75%, #0a0a0a 100%)',
                }}
              >
                Controle financeiro simplificado no WhatsApp.
              </h1>
              <p className="text-base text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
                Gerencie finanças, dívidas e metas de forma inteligente. Tudo em um só lugar, via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-[220px] sm:max-w-none mx-auto">
                <a
                  href="#planos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] rounded-xl transition-all duration-300 shadow-md"
                >
                  Crie sua conta gratuita
                  <ArrowRight size={18} strokeWidth={2} />
                </a>
                <a
                  href="#funcionalidades"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-[#1e4976] border border-[#1e4976] rounded-xl hover:border-[#163a5f] transition-colors font-sans"
                >
                  Ver funcionalidades
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Blocos empilhados: 1º imagem esquerda / texto direita, 2º texto esquerda / imagem direita */}
      <section id="funcionalidades" className="bg-white py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs font-medium text-[#1e4976] uppercase tracking-[0.2em] mb-2">Funcionalidades</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] tracking-tight mb-2">Tudo em um só lugar.</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">Metas, categorias e relatórios integrados ao WhatsApp.</p>
          </div>

          {/* Bloco 1: Metas Financeiras — imagem à esquerda, texto à direita */}
          <AnimateOnScroll delay={0} direction="up">
            <div className="p-6 md:p-8 mb-10 md:mb-14">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
                <div className="order-2 md:order-1 rounded-xl overflow-hidden border border-gray-200/80 shadow-md">
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
                <div className="order-1 md:order-2 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center mb-4 shadow-lg shadow-[#1e4976]/20">
                    <Target size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#0D1B2A] mb-3 tracking-tight">
                    Metas Financeiras
                  </h3>
                  <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                    Crie e acompanhe suas metas de economia de forma simples e direta pelo WhatsApp. 
                    Defina objetivos, acompanhe o progresso e receba atualizações automáticas.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Criação rápida de metas por mensagem',
                      'Acompanhamento automático do progresso',
                      'Notificações de atualização em tempo real',
                      'Visualização do status das metas',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Bloco 2: Categorias Inteligentes — texto à esquerda, imagem à direita */}
          <AnimateOnScroll delay={150} direction="up">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
                <div className="order-1 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center mb-4 shadow-lg shadow-[#1e4976]/20">
                    <FolderTree size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#0D1B2A] mb-3 tracking-tight">
                    Categorias Inteligentes
                  </h3>
                  <p className="text-gray-600 mb-5 text-sm leading-relaxed">
                    Classificação automática dos seus gastos por categoria via WhatsApp. 
                    Organize suas despesas de forma inteligente e receba relatórios detalhados.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      'Classificação automática dos gastos',
                      'Categorias personalizáveis e ilimitadas',
                      'Relatórios por categoria direto no WhatsApp',
                      'Análise de padrões de gastos',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-2 rounded-xl overflow-hidden border border-gray-200/80 shadow-md">
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
          </AnimateOnScroll>
        </div>
      </section>

      {/* Seção Como Usar PLEN no WhatsApp */}
      <section id="como-funciona" className="bg-white py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
            {/* Imagem do Celular à Esquerda */}
            <AnimateOnScroll delay={0} direction="right">
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
            </AnimateOnScroll>

            {/* Texto Explicativo à Direita */}
            <AnimateOnScroll delay={200} direction="left">
              <div className="order-1 md:order-2 text-center md:text-left">
              <p className="text-xs font-medium text-[#1e4976] uppercase tracking-wider mb-3">WhatsApp</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] mb-8 leading-tight">
                Registre transações em poucos passos
              </h2>

              <div className="space-y-6 max-w-xl mx-auto md:mx-0">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-[#0D1B2A] mb-1">Fale com o PLEN</h3>
                    <p className="text-sm text-gray-500">Mensagem, foto, áudio ou PDF. O PLEN entende tudo.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-[#0D1B2A] mb-1">Interpretação automática</h3>
                    <p className="text-sm text-gray-500">Valor, tipo e categoria identificados na hora.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-[#0D1B2A] mb-1">Registro em tempo real</h3>
                    <p className="text-sm text-gray-500">Movimentação sincronizada no painel e relatórios.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center md:justify-start mt-8">
                <a
                  href="#planos"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] rounded-lg transition-all duration-300 shadow-md"
                >
                  Testar Agora
                  <ArrowRight size={18} strokeWidth={2} />
                </a>
              </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Seção O PLEN é para você que */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <AnimateOnScroll delay={0} direction="up">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] text-center mb-12">
              O PLEN é para você que:
            </h2>
          </AnimateOnScroll>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Bloco 1 */}
            <AnimateOnScroll delay={100} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm mb-3">1</div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">
                O dinheiro simplesmente some
              </h3>
              <p className="text-sm text-gray-500">
                Você trabalha, recebe... e continua no vermelho.
              </p>
              </div>
            </AnimateOnScroll>

            {/* Bloco 2 */}
            <AnimateOnScroll delay={200} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm mb-3">2</div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">
                Não sabe onde gastou
              </h3>
              <p className="text-sm text-gray-500">
                Perde o controle dos gastos e não consegue economizar.
              </p>
              </div>
            </AnimateOnScroll>

            {/* Bloco 3 */}
            <AnimateOnScroll delay={300} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm mb-3">3</div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">
                Quer simplificar sua vida
              </h3>
              <p className="text-sm text-gray-500">
                Busca uma forma prática e rápida de controlar suas finanças.
              </p>
              </div>
            </AnimateOnScroll>

            {/* Bloco 4 */}
            <AnimateOnScroll delay={400} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white flex items-center justify-center font-semibold text-sm mb-3">4</div>
              <h3 className="font-semibold text-[#0D1B2A] mb-2">
                Quer ter controle total
              </h3>
              <p className="text-sm text-gray-500">
                Deseja acompanhar receitas, despesas e metas em um só lugar.
              </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Seção Funcionalidades do PLENIPAY - Carrossel contínuo deslizando para a esquerda */}
      <section className="bg-white py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] mb-3">
              Funcionalidades do PLENIPAY
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              I.A que transforma sua vida financeira via WhatsApp
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Overlay translúcido esquerda */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgb(255 255 255) 0%, rgba(255,255,255,0.5) 70%, transparent 100%)',
              }}
              aria-hidden
            />
            {/* Overlay translúcido direita */}
            <div
              className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgb(255 255 255) 0%, rgba(255,255,255,0.5) 70%, transparent 100%)',
              }}
              aria-hidden
            />

            <div className="overflow-hidden">
              <div className="flex animate-slide-left w-max">
                {/* Primeira cópia dos cards */}
                <div className="flex gap-6 md:gap-8 pr-6 md:pr-8 flex-shrink-0">
                  {FUNCIONALIDADES_PLENIPAY.map((f) => (
                    <div
                      key={`a-${f.numero}`}
                      className="w-[300px] sm:w-[380px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{f.numero}</span>
                          </div>
                          <h3 className="text-white font-semibold text-lg">{f.titulo}</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-500 mb-4 leading-relaxed text-sm text-center">
                          {f.descricao}
                        </p>
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <Image
                            src={f.img}
                            alt={f.imgAlt}
                            width={600}
                            height={400}
                            className="w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Segunda cópia (loop infinito) */}
                <div className="flex gap-6 md:gap-8 pr-6 md:pr-8 flex-shrink-0">
                  {FUNCIONALIDADES_PLENIPAY.map((f) => (
                    <div
                      key={`b-${f.numero}`}
                      className="w-[300px] sm:w-[380px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{f.numero}</span>
                          </div>
                          <h3 className="text-white font-semibold text-lg">{f.titulo}</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-500 mb-4 leading-relaxed text-sm text-center">
                          {f.descricao}
                        </p>
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <Image
                            src={f.img}
                            alt={f.imgAlt}
                            width={600}
                            height={400}
                            className="w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Simples e Prático */}
      <section className="bg-neutral-50/80 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-[#1e4976] uppercase tracking-[0.2em] mb-2">
              Como funciona
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] tracking-tight">
              Simples e prático
            </h2>
          </div>

          {/* Grid de 3 Passos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Passo 1 */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-[#1e4976]/10 hover:-translate-y-1 transition-all duration-300">
              <span className="absolute top-5 right-5 text-2xl font-light text-gray-200 tabular-nums">01</span>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center mb-5 text-white shadow-lg shadow-[#1e4976]/20">
                  <MessageCircle size={24} strokeWidth={2} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0D1B2A] mb-3 tracking-tight">
                  Você envia uma mensagem
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm max-w-[260px]">
                  Simplesmente envie uma mensagem para o PLEN no WhatsApp com seus gastos ou receitas.
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-[#1e4976]/10 hover:-translate-y-1 transition-all duration-300">
              <span className="absolute top-5 right-5 text-2xl font-light text-gray-200 tabular-nums">02</span>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center mb-5 text-white shadow-lg shadow-[#1e4976]/20">
                  <Bot size={24} strokeWidth={2} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0D1B2A] mb-3 tracking-tight">
                  A inteligência artificial processa
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm max-w-[260px]">
                  O PLEN entende o que você diz, identifica se é um gasto, lembrete ou comprovante e já organiza tudo na categoria certa.
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-[#1e4976]/10 hover:-translate-y-1 transition-all duration-300">
              <span className="absolute top-5 right-5 text-2xl font-light text-gray-200 tabular-nums">03</span>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center mb-5 text-white shadow-lg shadow-[#1e4976]/20">
                  <Monitor size={24} strokeWidth={2} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0D1B2A] mb-3 tracking-tight">
                  Registra e envia para o seu dashboard
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm max-w-[260px]">
                  Em segundos, seu registro é sincronizado com o seu dashboard. Acesso pelo celular, tablet ou computador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relatórios Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="p-8 md:p-10 text-center">
            <div className="w-10 h-10 bg-[#1e4976]/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <BarChart3 size={20} className="text-[#1e4976]" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-[#0D1B2A] mb-3">
              Relatórios Detalhados
            </h3>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm max-w-xl mx-auto">
              Relatórios financeiros simples e diretos pelo WhatsApp. Visualize seus dados de forma clara e 
              organize suas informações financeiras sem complicação.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Relatórios automáticos por período</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Gráficos e resumos por categoria</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                <span className="text-gray-700 text-sm">Análise de receitas e despesas</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
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
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-lg transition-all duration-300 shadow-md"
              >
                Começar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos/Clientes - Carrossel contínuo deslizando para a esquerda */}
      <section className="bg-neutral-50 py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] mb-3">
              Transforme você também a sua relação com o dinheiro
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Veja o que nossos usuários dizem sobre o PLENIPAY
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Overlay translúcido esquerda */}
            <div
              className="absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgb(250 250 250) 0%, rgba(250,250,250,0.5) 70%, transparent 100%)',
              }}
              aria-hidden
            />
            {/* Overlay translúcido direita */}
            <div
              className="absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgb(250 250 250) 0%, rgba(250,250,250,0.5) 70%, transparent 100%)',
              }}
              aria-hidden
            />

            <div className="overflow-hidden">
              <div className="flex animate-slide-left w-max">
                {/* Primeira cópia dos cards */}
                <div className="flex gap-6 md:gap-8 pr-6 md:pr-8 flex-shrink-0">
                  {ALL_TESTIMONIALS.map((testimonial, index) => {
                    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(testimonial.name)}&size=112&mouth=smile&eyes=happy`
                    return (
                      <div
                        key={`a-${index}`}
                        className="w-[280px] sm:w-[320px] flex-shrink-0 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                      >
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-6 flex-1">
                          {testimonial.text}
                        </p>
                        <div className="flex flex-col items-center text-center pt-4 border-t border-gray-100">
                          <div className="w-14 h-14 rounded-full overflow-hidden shadow-md flex-shrink-0 mb-3 bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center">
                            <img
                              src={avatarUrl}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <h4 className="font-bold text-[#0D1B2A] text-base mb-0.5">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Segunda cópia (loop infinito) */}
                <div className="flex gap-6 md:gap-8 pr-6 md:pr-8 flex-shrink-0">
                  {ALL_TESTIMONIALS.map((testimonial, index) => {
                    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(testimonial.name)}&size=112&mouth=smile&eyes=happy`
                    return (
                      <div
                        key={`b-${index}`}
                        className="w-[280px] sm:w-[320px] flex-shrink-0 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                      >
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base mb-6 flex-1">
                          {testimonial.text}
                        </p>
                        <div className="flex flex-col items-center text-center pt-4 border-t border-gray-100">
                          <div className="w-14 h-14 rounded-full overflow-hidden shadow-md flex-shrink-0 mb-3 bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] flex items-center justify-center">
                            <img
                              src={avatarUrl}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <h4 className="font-bold text-[#0D1B2A] text-base mb-0.5">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-white py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <AnimateOnScroll delay={0} direction="up">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] mb-3">
                Escolha o plano ideal para sua jornada
              </h2>
              <p className="text-sm text-gray-500 max-w-xl mx-auto">
                Comece grátis e evolua conforme cresce
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto items-start">
            {/* Plano Gratuito */}
            <AnimateOnScroll delay={0} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Registros (50/mês)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Dashboard básico</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#1e4976] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Até 2 usuários</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Filtros básicos</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Acesso ao PLEN AI</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push('/cadastro?plano=teste')
                }}
                className="block w-full text-center py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-[#0D1B2A] rounded-xl font-bold transition-all duration-300"
              >
                Começar Grátis
              </button>
              </div>
            </AnimateOnScroll>

            {/* Plano Básico */}
            <AnimateOnScroll delay={150} direction="up">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] text-white rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 mb-3 sm:mb-4 text-center">
                <h3 className="text-base sm:text-lg font-bold">Plano Básico</h3>
              </div>
              <div className="mb-3 sm:mb-4">
                <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0D1B2A]">R$ 29,90</span>
                  <span className="text-gray-600 text-xs sm:text-sm">/mês</span>
                </div>
                <p className="text-xs text-[#1e4976] font-semibold mt-1 sm:mt-2">7 dias grátis</p>
              </div>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Tudo do Gratuito</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Registros ilimitados</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Gerenciar Dívidas</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Salário recorrente</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Calendário Financeiro</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Metas (até 3)</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Até 10 usuários</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 size={16} className="text-[#1e4976] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-gray-700">Suporte prioritário</span>
                </div>
              </div>
              <button
                onClick={() => handleSelecionarPlano('basico')}
                className="block w-full text-center py-3 text-sm sm:text-base bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#1e4976]/40 transform hover:scale-105 active:scale-100"
              >
                Assinar Agora
              </button>
              </div>
            </AnimateOnScroll>

            {/* Plano Premium - Destacado */}
            <AnimateOnScroll delay={300} direction="up">
              <div className="bg-gradient-to-br from-[#2c5aa0] via-[#1e4976] to-[#163a5f] rounded-2xl p-6 shadow-lg border border-[#163a5f]/50 relative z-10">
              <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-[#0D1B2A] text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <Sparkles size={12} className="text-[#0D1B2A] sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">MAIS POPULAR</span>
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
                className="block w-full text-center py-3 text-sm sm:text-base bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#1e4976]/40 transform hover:scale-105"
              >
                Assinar Agora
              </button>
              </div>
            </AnimateOnScroll>

            {/* Plano Anual - Destacado */}
            <AnimateOnScroll delay={450} direction="up">
              <div className="bg-gradient-to-br from-[#2c5aa0] via-[#1e4976] to-[#163a5f] rounded-2xl p-6 shadow-sm border border-[#163a5f]/50 relative z-10">
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
                className="block w-full text-center py-3 text-sm sm:text-base bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#1e4976]/40 transform hover:scale-105"
              >
                Assinar Anual
              </button>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Estatísticas - cards com animação recorrente */}
      <section className="bg-neutral-50 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-stats-float" style={{ animationDelay: '0s' }}>
              <div className="w-10 h-10 bg-[#1e4976]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-[#1e4976]" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+1,205</div>
              <div className="text-xs md:text-sm text-gray-600">Usuários ativos</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-stats-float" style={{ animationDelay: '0.4s' }}>
              <div className="w-10 h-10 bg-[#1e4976]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={20} className="text-[#1e4976]" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+36k</div>
              <div className="text-xs md:text-sm text-gray-600">Transações</div>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-stats-float" style={{ animationDelay: '0.8s' }}>
              <div className="w-10 h-10 bg-[#1e4976]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-[#1e4976]" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-[#0D1B2A] mb-1">+17k</div>
              <div className="text-xs md:text-sm text-gray-600">Lembretes</div>
            </div>
            <div className="bg-gradient-to-br from-[#2c5aa0] via-[#1e4976] to-[#163a5f] rounded-2xl p-6 text-center shadow-sm border border-[#163a5f]/50 animate-stats-float" style={{ animationDelay: '1.2s' }}>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star size={20} className="text-white fill-white" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white mb-1">4.9</div>
              <div className="text-xs md:text-sm text-gray-300 font-medium">Média de avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#0D1B2A] mb-2">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="space-y-3">
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
                className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors gap-3"
                >
                  <span className="flex-shrink-0 w-6 text-center text-gray-400 font-light text-xs tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium text-[#0D1B2A] text-sm flex-1 pr-3 text-left">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-300 ease-out flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: openFaq === index ? '400px' : '0',
                    opacity: openFaq === index ? 1 : 0,
                  }}
                >
                  <div className="px-4 py-3.5 pt-3 pl-9 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-gray-500 leading-relaxed text-sm">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Suporte WhatsApp */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <h2 className="text-xl font-semibold text-[#0D1B2A] mb-2">
                Ainda tem dúvidas?
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                Nossa equipe está pronta para ajudar
              </p>
              <a
                href="https://wa.me/message/PLHJUVZSV2B5O1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 text-sm"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                </svg>
                <span>Fale com nossa equipe!</span>
              </a>
            </div>
        </div>
      </section>

      {/* Footer - compacto no mobile, organizado e com espaço para o chat */}
      <footer className="bg-[#F5F5F5] border-t border-gray-200 py-4 md:py-8 pb-20 md:pb-8">
        <div className="container mx-auto px-4 max-w-3xl md:max-w-4xl">
          {/* Mobile: marca no topo, depois Produto + Legal lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start">
            {/* Coluna 1: Marca e redes */}
            <div className="space-y-1.5 md:space-y-2 flex flex-col items-center md:items-start text-center md:text-left md:col-span-1">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo-header.png"
                  alt="PLENIPAY"
                  width={96}
                  height={32}
                  className="h-6 md:h-7 w-auto object-contain"
                />
              </Link>
              <p className="text-[11px] md:text-xs text-gray-600 leading-snug max-w-[200px]">
                Gestão financeira pessoal em uma só plataforma.
              </p>
              <p className="text-[11px] md:text-xs text-gray-600 leading-snug max-w-[200px] -mt-0.5 hidden sm:block">
                Organize seu dinheiro com clareza e praticidade.
              </p>
              <div className="flex gap-1.5 md:gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 md:w-7 md:h-7 rounded-lg md:rounded border border-gray-700 flex items-center justify-center text-gray-700 hover:border-[#1e4976] hover:text-[#1e4976] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={14} strokeWidth={1.5} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 md:w-7 md:h-7 rounded-lg md:rounded border border-gray-700 flex items-center justify-center text-gray-700 hover:border-[#1e4976] hover:text-[#1e4976] transition-colors"
                  aria-label="Twitter/X"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="mailto:contato@plenipay.com"
                  className="w-8 h-8 md:w-7 md:h-7 rounded-lg md:rounded border border-gray-700 flex items-center justify-center text-gray-700 hover:border-[#1e4976] hover:text-[#1e4976] transition-colors"
                  aria-label="E-mail"
                >
                  <Mail size={14} strokeWidth={1.5} />
                </a>
              </div>
            </div>

            {/* Coluna 2 e 3: no mobile ficam lado a lado (Produto | Legal) */}
            <div className="grid grid-cols-2 md:contents gap-x-6 gap-y-4 md:gap-0">
              {/* Produto */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5 md:mb-2">Produto</h3>
                <ul className="space-y-0.5 md:space-y-1">
                  <li><Link href="#funcionalidades" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Recursos</Link></li>
                  <li><Link href="#planos" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Preços</Link></li>
                  <li><Link href="#faq" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">FAQ</Link></li>
                  <li><Link href="/home" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Dashboard</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5 md:mb-2">Legal</h3>
                <ul className="space-y-0.5 md:space-y-1">
                  <li><Link href="/privacidade" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Política de Privacidade</Link></li>
                  <li><Link href="/termos" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Termos de Uso</Link></li>
                  <li><Link href="/suporte" className="text-[11px] md:text-xs text-gray-600 hover:text-[#1e4976] transition-colors">Suporte</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-5 pt-3 md:pt-4 border-t border-gray-300 text-center">
            <p className="text-[10px] md:text-[11px] text-gray-500">© 2025 PLENIPAY. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
