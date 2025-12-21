'use client'

import { useState } from 'react'
import { X, Crown, Zap, ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  planoNecessario: 'basico' | 'premium'
  planoAtual: 'teste' | 'basico' | 'premium'
}

const planos = {
  basico: {
    nome: 'Plano Básico',
    preco: 'R$ 29,90',
    periodo: 'por mês',
    features: [
      'Registros ilimitados',
      'Criar e gerenciar Dívidas',
      'Registrar Salário',
      'Calendário Financeiro',
      'Sistema de Metas (até 3)',
      'Até 10 usuários/pessoas',
      'Filtros avançados',
      'Exportação de relatórios',
    ],
    icon: Zap,
  },
  premium: {
    nome: 'Plano Premium',
    preco: 'R$ 49,90',
    periodo: 'por mês',
    features: [
      'Tudo do plano Básico',
      'Criar e gerenciar Empréstimos',
      'Upload de documentos',
      'Game dinâmico em Juntar Dinheiro',
      'Metas ilimitadas',
      'Usuários/Pessoas ilimitados',
      'Dashboard avançado',
      'Suporte 24/7',
    ],
    icon: Crown,
  },
}

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  planoNecessario,
  planoAtual,
}: UpgradeModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const plano = planos[planoNecessario]
  const Icon = plano.icon

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // Redirecionar para página de upgrade
      router.push('/upgrade')
    } catch (error) {
      console.error('Erro ao redirecionar:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-brand-royal rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-aqua/10 to-brand-royal/10 dark:from-brand-midnight dark:to-brand-royal/50 px-5 py-4 rounded-t-2xl border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-xl flex items-center justify-center">
              <Icon size={24} className="text-brand-aqua" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-brand-midnight dark:text-brand-clean">
                Upgrade Necessário
              </h3>
              <p className="text-xs text-gray-600 dark:text-brand-clean/70">
                {feature} requer {plano.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={18} className="text-brand-midnight dark:text-brand-clean" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          <div className="bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg p-3 border border-brand-aqua/20">
            <p className="text-sm text-brand-midnight dark:text-brand-clean">
              <strong>{feature}</strong> está disponível apenas no{' '}
              <strong>{plano.nome}</strong>.
            </p>
          </div>

          {/* Plano Card */}
          <div className="bg-gradient-to-br from-brand-aqua/5 to-brand-royal/5 dark:from-brand-midnight/50 dark:to-brand-royal/30 rounded-xl p-4 border-2 border-brand-aqua/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-xl flex items-center justify-center">
                <Icon size={28} className="text-brand-aqua" />
              </div>
              <div>
                <h4 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
                  {plano.nome}
                </h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-brand-aqua">
                    {plano.preco}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-brand-clean/70">
                    {plano.periodo}
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-2 mt-4">
              {plano.features.slice(0, 4).map((feat, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-brand-midnight dark:text-brand-clean">
                  <Check size={16} className="text-brand-aqua flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth text-sm"
          >
            Cancelar
          </button>
          <Link
            href="/upgrade"
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></div>
                <span>Redirecionando...</span>
              </>
            ) : (
              <>
                <span>Fazer Upgrade</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}




