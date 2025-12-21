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
    <div className="space-y-4">
      {/* Alertas - só mostra se houver dívidas pendentes */}
      {/* TODO: Implementar alertas quando necessário */}

      {/* Dicas */}
      <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-4 shadow-lg border border-brand-clean dark:border-white/10">
        <h3 className="font-display font-bold text-brand-midnight dark:text-brand-clean mb-3 flex items-center gap-2">
          <Lightbulb size={20} className="text-yellow-600 dark:text-yellow-400" />
          Dicas e Suporte
        </h3>
        <div className="space-y-3">
          {tips.map((tip, index) => {
            const Icon = tip.icon
            return (
              <div
                key={index}
                className={`p-3 rounded-xl ${tip.color} dark:bg-brand-aqua/10 dark:border-white/10 border border-transparent`}
              >
                <div className="flex items-start gap-2">
                  <Icon size={18} className="mt-0.5 flex-shrink-0 text-brand-aqua dark:text-brand-aqua" />
                  <div>
                    <p className="text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1">
                      {tip.title}
                    </p>
                    <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/70">
                      {tip.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Links rápidos */}
      <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-4 shadow-lg border border-brand-clean dark:border-white/10">
        <h3 className="font-display font-bold text-brand-midnight dark:text-brand-clean mb-3">
          Acesso Rápido
        </h3>
        <div className="space-y-2">
          {/* Botão Assistente PLEN no WhatsApp */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 text-sm font-medium text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-smooth shadow-md hover:shadow-lg"
            >
              <MessageCircle size={18} />
              <span>Assistente PLEN no WhatsApp</span>
            </a>
          )}
          
          <a
            href="/registros"
            className="block p-2 text-sm text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Ver todos os registros
          </a>
          <a
            href="/dividas"
            className="block p-2 text-sm text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Gerenciar dívidas
          </a>
          <a
            href="/dashboard"
            className="block p-2 text-sm text-brand-aqua dark:text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded-lg transition-smooth"
          >
            → Ver relatórios
          </a>
        </div>
      </div>
    </div>
  )
}

