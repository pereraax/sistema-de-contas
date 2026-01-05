'use client'

import { Lightbulb, HelpCircle, TrendingUp, AlertCircle, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const tips = [
  {
    icon: Lightbulb,
    title: 'Dica Rápida',
    content: 'Use etiquetas para organizar melhor seus gastos e facilitar a busca.',
    color: 'text-brand-aqua bg-brand-aqua/10'
  },
  {
    icon: TrendingUp,
    title: 'Economia',
    content: 'Acompanhe seu saldo diariamente para manter o controle financeiro.',
    color: 'text-brand-aqua bg-brand-aqua/10'
  },
  {
    icon: HelpCircle,
    title: 'Ajuda',
    content: 'Registre todas as entradas e saídas para ter uma visão completa das suas finanças.',
    color: 'text-brand-aqua bg-brand-aqua/10'
  }
]

export default function SupportPanel() {
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Buscar estatísticas e status do WhatsApp
    async function carregar() {
      try {
        // Verificar WhatsApp
        const whatsappResponse = await fetch('/api/whatsapp/setup')
        const whatsappData = await whatsappResponse.json()
        
        if (whatsappData.configured && whatsappData.whatsappUrl) {
          setWhatsappUrl(whatsappData.whatsappUrl)
        } else {
          // Usar número do .env se disponível (só funciona no servidor, então vamos usar uma variável pública)
          // Por enquanto, vamos deixar null e o botão só aparece se configurado
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }
    
    carregar()
  }, [])

  // Por enquanto, não vamos mostrar alertas de dívidas (precisa de server action)
  // Se precisar, podemos criar uma API route
  // const alert: { title: string; content: string; color: string } | null = null

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-3 mb-8 sm:mb-10 lg:mb-0" data-support-panel>
      {/* Alertas - só mostra se houver dívidas pendentes */}
      {/* TODO: Implementar alertas quando necessário */}

      {/* Dicas - Oculto no desktop para deixar mais compacto */}
      <div className="bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl lg:rounded-lg p-4 sm:p-5 lg:p-3 shadow-lg border border-brand-clean dark:border-white/10 lg:hidden">
        <h3 className="font-display font-bold text-base sm:text-lg text-brand-midnight dark:text-brand-clean mb-4 sm:mb-5 flex items-center gap-2">
          <Lightbulb size={18} className="sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
          Dicas e Suporte
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon
            return (
              <div
                key={index}
                className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${tip.color} dark:bg-brand-aqua/10 dark:border-white/10 border border-transparent`}
              >
                <div className="flex flex-col">
                  <div className="flex items-start gap-2 sm:gap-2.5 mb-2 sm:mb-2.5">
                    <Icon size={16} className="sm:w-[18px] sm:h-[18px] mt-0.5 flex-shrink-0 text-brand-aqua dark:text-brand-aqua" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-brand-midnight dark:text-brand-clean mb-1 sm:mb-1.5">
                        {tip.title}
                      </p>
                      <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/70 leading-snug">
                        {tip.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Links rápidos */}
      <div className="bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-3 shadow-lg border border-brand-clean dark:border-white/10">
        <h3 className="font-display font-bold text-sm sm:text-base lg:text-sm text-brand-midnight dark:text-brand-clean mb-2 sm:mb-3 lg:mb-2">
          Acesso Rápido
        </h3>
        <div className="space-y-1.5 sm:space-y-2 lg:space-y-1.5">
          {/* Botão Assistente PLEN no WhatsApp */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 sm:p-2.5 lg:p-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-smooth shadow-md hover:shadow-lg"
            >
              <MessageCircle size={14} className="lg:w-3.5 lg:h-3.5" />
              <span className="lg:text-[11px]">Assistente PLEN</span>
            </a>
          )}
          
          <a
            href="/registros"
            className="block p-2 sm:p-2.5 lg:p-1.5 text-xs lg:text-[11px] text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Ver todos os registros
          </a>
          <a
            href="/dividas"
            className="block p-2 sm:p-2.5 lg:p-1.5 text-xs lg:text-[11px] text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Gerenciar dívidas
          </a>
          <a
            href="/dashboard"
            className="block p-2 sm:p-2.5 lg:p-1.5 text-xs lg:text-[11px] text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Ver relatórios
          </a>
        </div>
      </div>
    </div>
  )
}

