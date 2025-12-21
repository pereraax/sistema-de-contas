'use client'

import { useState } from 'react'
import { Lock, ArrowRight, Eye } from 'lucide-react'
import Link from 'next/link'
import UpgradeModal from './UpgradeModal'
import ModalExplicacaoFuncionalidade from './ModalExplicacaoFuncionalidade'

interface PlanoBloqueadoProps {
  feature: string
  planoNecessario: 'basico' | 'premium'
  planoAtual: 'teste' | 'basico' | 'premium'
  children?: React.ReactNode
}

export default function PlanoBloqueado({
  feature,
  planoNecessario,
  planoAtual,
  children,
}: PlanoBloqueadoProps) {
  const [showModal, setShowModal] = useState(false)
  const [showExplicacao, setShowExplicacao] = useState(false)
  
  // Slides de explicação baseados na funcionalidade
  // ORDEM DAS IMAGENS (ajuste conforme necessário):
  // 1. SCR-20251124-lmab.jpeg = Lista de Metas
  // 2. SCR-20251124-lmgj.png = ?
  // 3. SCR-20251124-lmiz.png = ?
  // 4. SCR-20251124-lmnn.png = ?
  // 5. SCR-20251124-lmpd.png = ?
  // 6. SCR-20251124-lmsy.png = ?
  const getSlides = (): Array<{ imagem: string; titulo: string; descricao: string }> => {
    if (feature.toLowerCase().includes('meta')) {
      // Mapeamento das imagens - AJUSTE A ORDEM CONFORME O CONTEÚDO REAL DE CADA IMAGEM
      const imagens = {
        listaMetas: '/explicacoes/metas/SCR-20251124-lmab.jpeg',
        detalhesMeta: '/explicacoes/metas/SCR-20251124-lmgj.png',
        bausTesouro: '/explicacoes/metas/SCR-20251124-lmiz.png',
        escolherBau: '/explicacoes/metas/SCR-20251124-lmnn.png',
        popupDesconto: '/explicacoes/metas/SCR-20251124-lmpd.png',
        progressoAtualizado: '/explicacoes/metas/SCR-20251124-lmsy.png',
      }

      return [
        {
          imagem: imagens.listaMetas,
          titulo: 'Lista de Metas Ativas',
          descricao: 'Visualize todas as suas metas de economia em um só lugar. Cada card mostra o nome da meta (como "Carro" ou "Viagem"), periodicidade (semanal, quinzenal ou mensal), barra de progresso e valores guardados. Gerencie múltiplas metas simultaneamente!',
        },
        {
          imagem: imagens.detalhesMeta,
          titulo: 'Detalhes e Progresso da Meta',
          descricao: 'Acompanhe em tempo real o progresso detalhado da sua meta! Veja a barra de progresso, quanto já foi guardado, quanto falta para atingir o objetivo e a porcentagem de conclusão. Informações completas sobre sua meta de economia.',
        },
        {
          imagem: imagens.bausTesouro,
          titulo: 'Sistema de Baús de Tesouro',
          descricao: 'Sistema gamificado único com baús de tesouro! Veja vários baús organizados em grid, cada um com um valor diferente. Os baús estão em sequência - você precisa abrir um para desbloquear o próximo. Torne a economia divertida e recompensadora!',
        },
        {
          imagem: imagens.escolherBau,
          titulo: 'Escolher e Abrir Baú',
          descricao: 'Clique em um baú disponível (com botão "Abrir agora!") para descobrir seu prêmio surpresa! Cada baú oferece um desconto especial no valor do seu depósito. Veja o valor do baú e clique para revelar o desconto que você ganhará.',
        },
        {
          imagem: imagens.popupDesconto,
          titulo: 'Desconto Especial Revelado',
          descricao: 'Parabéns! Você ganhou um desconto especial! O popup mostra o valor original do depósito, o desconto aplicado e o valor final que você vai guardar. É uma forma divertida de economizar mais e alcançar suas metas mais rápido!',
        },
        {
          imagem: imagens.progressoAtualizado,
          titulo: 'Progresso Atualizado',
          descricao: 'Após abrir um baú e fazer o depósito, seu progresso é atualizado automaticamente! Veja os valores atualizados: quanto falta guardar, quanto já foi guardado e a nova porcentagem de conclusão. O baú coletado fica marcado e o próximo fica disponível.',
        },
      ]
    }
    // Adicionar outras funcionalidades aqui no futuro
    return []
  }

  // Se já tem o plano necessário, mostrar conteúdo normalmente
  if (
    (planoNecessario === 'basico' && (planoAtual === 'basico' || planoAtual === 'premium')) ||
    (planoNecessario === 'premium' && planoAtual === 'premium')
  ) {
    return <>{children}</>
  }

  // Mostrar bloqueio
  return (
    <>
      <div className="relative">
        {/* Overlay de bloqueio - menos desfocado para deixar curioso */}
        {/* Overlay cobre apenas o conteúdo dentro deste container, não elementos fora */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/40 dark:bg-brand-midnight/40 backdrop-blur-[2px] rounded-xl z-[1] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/20" style={{ pointerEvents: 'none' }}>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-brand-aqua/20 dark:bg-brand-aqua/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-brand-aqua" />
            </div>
            <h3 className="text-lg font-semibold text-brand-midnight dark:text-brand-clean mb-2">
              Funcionalidade Bloqueada
            </h3>
            <p className="text-sm text-gray-600 dark:text-brand-clean/70 mb-4">
              {feature} está disponível apenas no{' '}
              <strong>
                {planoNecessario === 'basico' ? 'Plano Básico' : 'Plano Premium'}
              </strong>
            </p>
            <div className="flex flex-col gap-3 pointer-events-auto">
              <button
                onClick={() => setShowExplicacao(true)}
                className="px-6 py-2.5 bg-brand-royal/80 hover:bg-brand-royal border border-brand-aqua/30 text-white rounded-lg font-semibold transition-smooth flex items-center gap-2 mx-auto"
              >
                <Eye size={18} strokeWidth={2.5} />
                <span>Ver como funciona</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth flex items-center gap-2 mx-auto"
              >
                <span>Fazer Upgrade</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo bloqueado (opacidade reduzida mas visível) */}
        <div className="opacity-60 pointer-events-none">
          {children}
        </div>
      </div>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        planoNecessario={planoNecessario}
        planoAtual={planoAtual}
      />

      {/* Modal de Explicação */}
      {getSlides().length > 0 && (
        <ModalExplicacaoFuncionalidade
          isOpen={showExplicacao}
          onClose={() => setShowExplicacao(false)}
          feature={feature}
          slides={getSlides()}
        />
      )}
    </>
  )
}




