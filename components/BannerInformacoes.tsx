'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Lightbulb, Info, TrendingUp, DollarSign } from 'lucide-react'

interface BannerItem {
  id: string
  titulo: string
  descricao: string
  tipo: 'info' | 'dica' | 'promocao'
  cor: 'blue' | 'green' | 'orange' | 'purple'
}

const banners: BannerItem[] = [
  {
    id: '1',
    titulo: 'Dica de Economia',
    descricao: 'Registre todas as suas despesas diárias para ter um controle financeiro mais preciso e identificar onde você pode economizar.',
    tipo: 'dica',
    cor: 'green'
  },
  {
    id: '2',
    titulo: 'Organize suas Dívidas',
    descricao: 'Use a seção de Dívidas para acompanhar o progresso de pagamento e nunca mais perder uma data de vencimento.',
    tipo: 'info',
    cor: 'blue'
  },
  {
    id: '3',
    titulo: 'Acompanhe seu Saldo',
    descricao: 'O dashboard mostra em tempo real seu saldo atual, total recebido e gasto. Monitore sua saúde financeira!',
    tipo: 'dica',
    cor: 'purple'
  },
  {
    id: '4',
    titulo: 'Use o Calendário',
    descricao: 'Visualize todos os seus registros financeiros no calendário mensal e planeje melhor seus gastos futuros.',
    tipo: 'info',
    cor: 'orange'
  }
]

const cores = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/30',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/30',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-900 dark:text-green-100'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800/30',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-900 dark:text-orange-100'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/30',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-900 dark:text-purple-100'
  }
}

const icones = {
  info: Info,
  dica: Lightbulb,
  promocao: TrendingUp
}

export default function BannerInformacoes() {
  const [bannerAtual, setBannerAtual] = useState(0)
  const [bannersVisiveis, setBannersVisiveis] = useState<BannerItem[]>([])
  const [bannerFechado, setBannerFechado] = useState<string[]>([])

  useEffect(() => {
    // Carregar banners fechados do localStorage
    const fechados = localStorage.getItem('bannersFechados')
    if (fechados) {
      setBannerFechado(JSON.parse(fechados))
    }
  }, [])

  useEffect(() => {
    // Filtrar banners que não foram fechados
    const visiveis = banners.filter(b => !bannerFechado.includes(b.id))
    setBannersVisiveis(visiveis)
    
    // Se o banner atual foi fechado, ir para o próximo
    if (visiveis.length > 0 && !visiveis.find(b => b.id === banners[bannerAtual]?.id)) {
      setBannerAtual(0)
    }
  }, [bannerFechado, bannerAtual])

  const fecharBanner = (id: string) => {
    const novosFechados = [...bannerFechado, id]
    setBannerFechado(novosFechados)
    localStorage.setItem('bannersFechados', JSON.stringify(novosFechados))
    
    // Se fechou o banner atual, ir para o próximo
    if (bannersVisiveis.length > 1) {
      const proximoIndex = (bannerAtual + 1) % bannersVisiveis.length
      setBannerAtual(proximoIndex)
    }
  }

  const proximoBanner = () => {
    if (bannersVisiveis.length > 0) {
      setBannerAtual((bannerAtual + 1) % bannersVisiveis.length)
    }
  }

  const bannerAnterior = () => {
    if (bannersVisiveis.length > 0) {
      setBannerAtual((bannerAtual - 1 + bannersVisiveis.length) % bannersVisiveis.length)
    }

  }

  if (bannersVisiveis.length === 0) {
    return null
  }

  const banner = bannersVisiveis[bannerAtual]
  const cor = cores[banner.cor]
  const Icone = icones[banner.tipo]

  return (
    <div className="mb-6">
      <div 
        className={`${cor.bg} border-2 ${cor.border} rounded-xl sm:rounded-2xl shadow-lg relative overflow-hidden animate-fade-in w-full`}
      >
        {/* Botão de fechar */}
        <button
          onClick={() => fecharBanner(banner.id)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-white/20 rounded-lg transition-smooth z-10"
          aria-label="Fechar banner"
        >
          <X size={18} className={cor.icon} />
        </button>

        {/* Conteúdo do banner */}
        <div className="flex items-center p-4 sm:p-5 md:p-6 pr-10 sm:pr-12 md:pr-16">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-5 w-full">
            {/* Ícone */}
            <div className={`${cor.iconBg} p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl flex-shrink-0`}>
              <Icone size={32} className={`${cor.icon} sm:w-10 sm:h-10 md:w-12 md:h-12`} strokeWidth={2} />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg sm:text-xl md:text-2xl font-display font-bold ${cor.text} mb-1.5 sm:mb-2 md:mb-3`}>
                {banner.titulo}
              </h3>
              <p className={`text-sm sm:text-base ${cor.text}/80 leading-snug sm:leading-relaxed`}>
                {banner.descricao}
              </p>
            </div>
          </div>
        </div>

        {/* Navegação (se houver mais de um banner) */}
        {bannersVisiveis.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-1.5 sm:gap-2">
            <button
              onClick={bannerAnterior}
              className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-white/20 rounded-lg transition-smooth"
              aria-label="Banner anterior"
            >
              <ChevronLeft size={18} className={cor.icon} />
            </button>
            
            {/* Indicadores */}
            <div className="flex gap-1.5 sm:gap-2">
              {bannersVisiveis.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setBannerAtual(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-smooth ${
                    index === bannerAtual
                      ? `w-6 sm:w-8 ${cor.icon} bg-current`
                      : 'w-1.5 sm:w-2 bg-white/50 dark:bg-white/30'
                  }`}
                  aria-label={`Ir para banner ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={proximoBanner}
              className="p-1.5 sm:p-2 hover:bg-white/50 dark:hover:bg-white/20 rounded-lg transition-smooth"
              aria-label="Próximo banner"
            >
              <ChevronRight size={18} className={cor.icon} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


