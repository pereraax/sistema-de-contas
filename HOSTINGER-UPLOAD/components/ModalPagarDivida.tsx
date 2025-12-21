'use client'

import { useState } from 'react'
import { Registro } from '@/lib/types'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'
import { pagarDivida } from '@/lib/actions'

interface ModalPagarDividaProps {
  divida: Registro
  onClose: () => void
}

interface PagamentoHistorico {
  valor: number
  data: string
  dataFormatada: string
}

export default function ModalPagarDivida({ divida, onClose }: ModalPagarDividaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [valorPagamento, setValorPagamento] = useState('')
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 16))

  // Função para limpar observação removendo JSON do histórico
  const limparObservacao = (observacao: string | undefined): string => {
    if (!observacao) return ''
    
    // Remover JSON do histórico (última linha que começa com [)
    const linhas = observacao.split('\n')
    const linhasLimpas = linhas.filter(linha => {
      const linhaTrim = linha.trim()
      return !(linhaTrim.startsWith('[') && linhaTrim.endsWith(']'))
    })
    
    return linhasLimpas.join('\n').trim()
  }

  // Extrair histórico de pagamentos da observação
  const extrairHistoricoPagamentos = (): PagamentoHistorico[] => {
    try {
      if (!divida.observacao) return []
      
      // Procurar por JSON no formato: [{"valor":100,"data":"2025-11-19T21:00:00"}]
      // O JSON pode estar no final da observação
      const linhas = divida.observacao.split('\n')
      const ultimaLinha = linhas[linhas.length - 1]?.trim()
      
      if (ultimaLinha && ultimaLinha.startsWith('[') && ultimaLinha.endsWith(']')) {
        const historico = JSON.parse(ultimaLinha)
        if (Array.isArray(historico)) {
          return historico.map((p: any) => ({
            valor: typeof p.valor === 'number' ? p.valor : parseFloat(p.valor),
            data: p.data,
            dataFormatada: new Date(p.data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          })).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Mais recente primeiro
        }
      }
    } catch (error) {
      console.error('Erro ao extrair histórico:', error)
    }
    return []
  }

  const historicoPagamentos = extrairHistoricoPagamentos()

  // Calcular valores baseado no histórico de pagamentos REAL
  const valorTotal = divida.valor
  const valorParcela = divida.parcelas_totais > 0 ? valorTotal / divida.parcelas_totais : valorTotal
  
  // CRÍTICO: Calcular valor pago somando todos os pagamentos do histórico
  const valorJaPago = historicoPagamentos.reduce((total, pagamento) => total + pagamento.valor, 0)
  
  const valorPendente = valorTotal - valorJaPago
  const progressoAtual = valorTotal > 0 ? (valorJaPago / valorTotal) * 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!valorPagamento || valorPagamento.trim() === '') {
        createNotification('Informe o valor do pagamento', 'warning')
        setLoading(false)
        return
      }

      if (!dataPagamento) {
        createNotification('Informe a data do pagamento', 'warning')
        setLoading(false)
        return
      }

      const valorPagar = converterValorFormatadoParaNumero(valorPagamento)

      if (isNaN(valorPagar) || valorPagar <= 0) {
        createNotification('Valor inválido. Informe um valor maior que zero.', 'warning')
        setLoading(false)
        return
      }

      // Validar se o valor não excede o pendente
      if (valorPagar > valorPendente + 0.01) { // Tolerância de 1 centavo
        createNotification(`O valor não pode ser maior que o pendente (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPendente)})`, 'warning')
        setLoading(false)
        return
      }

      // Enviar valor e data do pagamento
      const result = await pagarDivida(divida.id, valorPagar, dataPagamento)

      if (result.error) {
        createNotification('Erro ao processar pagamento: ' + result.error, 'warning')
      } else {
        const novoValorPago = valorJaPago + valorPagar
        const novoProgresso = (novoValorPago / valorTotal) * 100
        const estaQuitada = novoValorPago >= valorTotal - 0.01 // Tolerância de 1 centavo
        
        // Apenas criar notificação se for dívida quitada 100% ou novo registro
        if (estaQuitada) {
          // Dívida quitada 100% - criar notificação especial
          createNotification(
            `🎉 Dívida "${divida.nome}" foi quitada completamente!`,
            'success'
          )
        } else {
          // Não criar notificação para pagamentos parciais (conforme requisito)
          // Apenas atualizar a interface
        }
        onClose()
        router.refresh()
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      createNotification('Erro inesperado ao processar pagamento. Tente novamente.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const calcularProgressoFuturo = (valor: number) => {
    if (!valor || valor <= 0) return progressoAtual
    const novoValorPago = valorJaPago + valor
    return Math.min((novoValorPago / valorTotal) * 100, 100)
  }

  const progressoFuturo = calcularProgressoFuturo(converterValorFormatadoParaNumero(valorPagamento))

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-brand-royal rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-gray-200 dark:border-white/10">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 px-5 py-4 flex items-center justify-between bg-white dark:bg-brand-midnight">
          <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
            Pagar Dívida
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={20} className="text-brand-midnight dark:text-brand-clean" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-brand-royal overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Informações da Dívida */}
          <div className="bg-gray-50 dark:bg-brand-midnight/50 rounded-lg p-3 space-y-2">
            <div>
              <h3 className="text-base font-display text-brand-midnight dark:text-brand-clean mb-1">
                {divida.nome}
              </h3>
              {limparObservacao(divida.observacao) && (
                <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/70">{limparObservacao(divida.observacao)}</p>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-brand-midnight rounded-lg p-3 border border-gray-200 dark:border-white/10">
              <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-1">Total</p>
              <p className="text-sm font-display text-brand-midnight dark:text-brand-clean">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(valorTotal)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1">Pago</p>
              <p className="text-sm font-display text-green-700 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(valorJaPago)}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">Pendente</p>
              <p className="text-sm font-display text-orange-700 dark:text-orange-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(valorPendente)}
              </p>
            </div>
          </div>

          {/* Barra de Progresso Atual - Melhorada */}
          <div className="bg-gradient-to-br from-brand-aqua/10 via-brand-aqua/5 to-brand-blue/10 dark:from-brand-aqua/20 dark:via-brand-aqua/10 dark:to-brand-blue/20 rounded-xl p-4 border-2 border-brand-aqua/30 dark:border-brand-aqua/40 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-display text-brand-midnight dark:text-brand-clean">
                Progresso Atual
              </span>
              <span className="text-2xl font-display text-brand-aqua dark:text-brand-aqua drop-shadow-sm">
                {progressoAtual.toFixed(1)}%
              </span>
            </div>
            
            {/* Barra de Progresso Robusta */}
            <div className="w-full bg-gray-200 dark:bg-brand-midnight/70 rounded-full h-6 overflow-hidden border-2 border-brand-aqua/20 dark:border-brand-aqua/30 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-brand-aqua via-brand-blue to-brand-aqua rounded-full transition-all duration-700 ease-out shadow-lg shadow-brand-aqua/50 relative overflow-hidden"
                style={{
                  width: `${Math.min(progressoAtual, 100)}%`,
                }}
              >
                {/* Efeito de brilho animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                
                {/* Indicador de porcentagem dentro da barra (se houver progresso) */}
                {progressoAtual > 15 && (
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {progressoAtual.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campo de Pagamento */}
          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Quanto você pode pagar hoje? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/70 dark:text-brand-clean/70 font-medium text-sm">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={valorPagamento}
                  onChange={(e) => {
                    const formatted = formatarValorEmTempoReal(e.target.value)
                    setValorPagamento(formatted)
                  }}
                  placeholder="0,00"
                  maxLength={15}
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50"
                />
              </div>
              <div>
                <input
                  type="datetime-local"
                  required
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1.5">
              Valor máximo: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(valorPendente)}
            </p>
          </div>

          {/* Barra de Progresso Futuro (Preview) */}
          {valorPagamento && converterValorFormatadoParaNumero(valorPagamento) > 0 && (
            <div className="bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg p-3 border border-brand-aqua/20 dark:border-brand-aqua/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-brand-midnight dark:text-brand-clean">Progresso Após Pagamento</span>
                <span className="text-xs font-semibold text-brand-aqua">
                  {progressoFuturo.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-brand-midnight rounded-full h-2.5 mb-2">
                <div
                  className="bg-brand-aqua h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressoFuturo}%`,
                  }}
                />
              </div>
              <div className="text-xs text-brand-midnight/70 dark:text-brand-clean/70">
                Após este pagamento, restará:{' '}
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Math.max(0, valorPendente - converterValorFormatadoParaNumero(valorPagamento)))}
                </span>
              </div>
            </div>
          )}

          {/* Histórico de Pagamentos */}
          {historicoPagamentos.length > 0 && (
            <div className="bg-white dark:bg-brand-midnight rounded-lg p-3 border border-gray-200 dark:border-white/10">
              <h4 className="text-xs font-display text-brand-midnight dark:text-brand-clean mb-2">
                Histórico de Pagamentos
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {historicoPagamentos.map((pagamento, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-brand-midnight/50 rounded border border-gray-200 dark:border-white/10"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-brand-midnight dark:text-brand-clean">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(pagamento.valor)}
                      </div>
                      <div className="text-[10px] text-brand-midnight/60 dark:text-brand-clean/60 mt-0.5">
                        {pagamento.dataFormatada}
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Pago
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações de Parcelas */}
          {divida.parcelas_totais > 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                <strong>Parcelas:</strong> {divida.parcelas_pagas}/{divida.parcelas_totais} pagas
                {divida.parcelas_totais - divida.parcelas_pagas > 0 && (
                  <span> • Faltam {divida.parcelas_totais - divida.parcelas_pagas} parcelas</span>
                )}
              </p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">
                Valor por parcela: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(valorParcela)}
              </p>
            </div>
          )}

          </div>
          
          <div className="flex-shrink-0 bg-white dark:bg-brand-midnight border-t border-gray-200 dark:border-white/10 px-5 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-smooth text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !valorPagamento || converterValorFormatadoParaNumero(valorPagamento) <= 0}
                className="flex-1 px-4 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Processando...' : 'CONFIRMAR PAGAMENTO'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

