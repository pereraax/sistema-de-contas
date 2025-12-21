'use client'

import { useState } from 'react'
import { Registro } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { X, Edit, Trash2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { excluirRegistro, marcarParcelaPaga } from '@/lib/actions'
import ModalConfirmacao from './ModalConfirmacao'
import ModalEditarRegistro from './ModalEditarRegistro'
import { createNotification } from './NotificationBell'

interface ModalRegistrosDiaProps {
  data: Date
  registros: Registro[]
  onClose: () => void
}

export default function ModalRegistrosDia({ data, registros, onClose }: ModalRegistrosDiaProps) {
  const router = useRouter()
  const [registroEditando, setRegistroEditando] = useState<Registro | null>(null)
  const [showModalExcluir, setShowModalExcluir] = useState(false)
  const [registroParaExcluir, setRegistroParaExcluir] = useState<{ id: string; nome: string } | null>(null)

  const tipoColors = {
    entrada: 'bg-green-100 text-green-700 border-green-300',
    saida: 'bg-red-100 text-red-700 border-red-300',
    divida: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const tipoLabels = {
    entrada: 'Entrada',
    saida: 'Saída',
    divida: 'Dívida',
  }

  // Função para limpar observação removendo JSON do histórico
  const limparObservacao = (observacao: string | undefined): string => {
    if (!observacao) return ''
    
    const linhas = observacao.split('\n')
    const linhasLimpas = linhas.filter(linha => {
      const linhaTrim = linha.trim()
      return !(linhaTrim.startsWith('[') && linhaTrim.endsWith(']'))
    })
    
    const observacaoLimpa = linhasLimpas.join('\n').trim()
    
    if (observacaoLimpa.length > 80) {
      return observacaoLimpa.substring(0, 80) + '...'
    }
    
    return observacaoLimpa
  }

  const handleExcluir = async (id: string, nome: string) => {
    setRegistroParaExcluir({ id, nome })
    setShowModalExcluir(true)
  }

  const confirmarExcluir = async () => {
    if (registroParaExcluir) {
      const result = await excluirRegistro(registroParaExcluir.id)
      if (result.error) {
        createNotification('Erro ao excluir registro', 'warning')
      } else {
        createNotification(`Registro "${registroParaExcluir.nome}" excluído com sucesso!`, 'success')
        router.refresh()
      }
      setShowModalExcluir(false)
      setRegistroParaExcluir(null)
    }
  }

  const handleMarcarPago = async (id: string, nome: string) => {
    const result = await marcarParcelaPaga(id)
    if (result.error) {
      createNotification('Erro ao marcar parcela como paga', 'warning')
    } else {
      createNotification(`Parcela de "${nome}" marcada como paga!`, 'success')
      router.refresh()
    }
  }

  const totalEntradas = registros
    .filter(r => r.tipo === 'entrada')
    .reduce((sum, r) => sum + parseFloat(r.valor.toString()), 0)

  const totalSaidas = registros
    .filter(r => r.tipo === 'saida')
    .reduce((sum, r) => sum + parseFloat(r.valor.toString()), 0)

  const totalDividas = registros
    .filter(r => r.tipo === 'divida')
    .reduce((sum, r) => sum + parseFloat(r.valor.toString()), 0)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-brand-royal rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-gray-200 dark:border-white/10">
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 px-5 py-4 flex items-center justify-between bg-white dark:bg-brand-midnight">
            <div>
              <h2 className="text-xl font-display text-brand-midnight dark:text-brand-clean">
                Registros do Dia
              </h2>
              <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/70 mt-1">
                {format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
            >
              <X size={20} className="text-brand-midnight dark:text-brand-clean" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white dark:bg-brand-royal">
            {/* Resumo do dia */}
            {(totalEntradas > 0 || totalSaidas > 0 || totalDividas > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {totalEntradas > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">Total Entradas</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalEntradas)}
                    </p>
                  </div>
                )}
                {totalSaidas > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-700 dark:text-red-400 mb-1">Total Saídas</p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalSaidas)}
                    </p>
                  </div>
                )}
                {totalDividas > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">Total Dívidas</p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalDividas)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Lista de registros */}
            {registros.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-sm">Nenhum registro neste dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="bg-white dark:bg-brand-midnight rounded-lg p-3 border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base font-semibold text-brand-midnight dark:text-brand-clean">
                            {registro.nome}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tipoColors[registro.tipo]}`}
                          >
                            {tipoLabels[registro.tipo]}
                          </span>
                        </div>
                        {limparObservacao(registro.observacao) && (
                          <p className="text-xs text-brand-midnight/70 dark:text-brand-clean/70 mb-1.5">
                            {limparObservacao(registro.observacao)}
                          </p>
                        )}
                      </div>
                      <span className="text-base font-bold text-brand-midnight dark:text-brand-clean">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(registro.valor)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 text-xs">
                      {registro.user && (
                        <div>
                          <span className="text-brand-midnight/60 dark:text-brand-clean/60">Usuário: </span>
                          <span className="text-brand-midnight dark:text-brand-clean font-medium">
                            {registro.user.nome}
                          </span>
                        </div>
                      )}
                      {registro.categoria && (
                        <div>
                          <span className="text-brand-midnight/60 dark:text-brand-clean/60">Categoria: </span>
                          <span className="text-brand-midnight dark:text-brand-clean font-medium">
                            {registro.categoria}
                          </span>
                        </div>
                      )}
                      {registro.parcelas_totais > 1 && (
                        <div>
                          <span className="text-brand-midnight/60 dark:text-brand-clean/60">Parcelas: </span>
                          <span className="text-brand-midnight dark:text-brand-clean font-medium">
                            {registro.parcelas_pagas}/{registro.parcelas_totais}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-brand-midnight/60 dark:text-brand-clean/60">Horário: </span>
                        <span className="text-brand-midnight dark:text-brand-clean font-medium">
                          {format(new Date(registro.data_registro), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {registro.etiquetas && registro.etiquetas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {registro.etiquetas.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua text-xs rounded border border-brand-aqua/30 dark:border-brand-aqua/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                      <span className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                        {format(new Date(registro.data_registro), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                      <div className="flex gap-1.5">
                        {registro.tipo === 'divida' &&
                          registro.parcelas_pagas < registro.parcelas_totais && (
                            <button
                              onClick={() => handleMarcarPago(registro.id, registro.nome)}
                              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Marcar parcela como paga"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        <button
                          onClick={() => setRegistroEditando(registro)}
                          className="p-1.5 text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20 rounded transition-smooth"
                          title="Editar"
                        >
                          <Edit size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleExcluir(registro.id, registro.nome)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-smooth"
                          title="Excluir"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {registroEditando && (
        <ModalEditarRegistro
          registro={registroEditando}
          onClose={() => setRegistroEditando(null)}
        />
      )}

      {/* Modal de Confirmação para Excluir Registro */}
      {showModalExcluir && registroParaExcluir && (
        <ModalConfirmacao
          titulo="Excluir Registro"
          mensagem={`Tem certeza que deseja excluir o registro "${registroParaExcluir.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={confirmarExcluir}
          onCancelar={() => {
            setShowModalExcluir(false)
            setRegistroParaExcluir(null)
          }}
          textoConfirmar="Excluir"
          tipo="danger"
        />
      )}
    </>
  )
}

