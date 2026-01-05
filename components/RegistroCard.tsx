'use client'

import { useState } from 'react'
import { Registro } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Edit, Trash2, CheckCircle } from 'lucide-react'
import { marcarParcelaPaga, excluirRegistro } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import ModalEditarRegistro from './ModalEditarRegistro'
import ModalConfirmacao from './ModalConfirmacao'
import { createNotification } from './NotificationBell'

interface RegistroCardProps {
  registro: Registro
  onEdit?: (registro: Registro) => void
}

export default function RegistroCard({ registro, onEdit }: RegistroCardProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showModalExcluir, setShowModalExcluir] = useState(false)

  const tipoColors = {
    entrada: 'bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-700',
    saida: 'bg-red-500 text-white border-red-600 dark:bg-red-600 dark:border-red-700',
    divida: 'bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-700',
  }

  const tipoLabels = {
    entrada: 'Entrada',
    saida: 'Saída',
    divida: 'Dívida',
  }

  const handleMarcarPago = async () => {
    const result = await marcarParcelaPaga(registro.id)
    if (result.error) {
      createNotification('Erro ao marcar parcela como paga', 'warning')
    } else {
      createNotification(`Parcela de "${registro.nome}" marcada como paga!`, 'success')
    }
    router.refresh()
  }

  const handleExcluir = async () => {
    setShowModalExcluir(true)
  }

  const confirmarExcluir = async () => {
    const result = await excluirRegistro(registro.id)
    if (result.error) {
      createNotification('Erro ao excluir registro', 'warning')
    } else {
      createNotification(`Registro "${registro.nome}" excluído com sucesso!`, 'info')
    }
    router.refresh()
    setShowModalExcluir(false)
  }

  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(registro.valor)

  const dataFormatada = format(new Date(registro.data_registro), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  })

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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {registro.nome}
          </h3>
          {limparObservacao(registro.observacao) && (
            <p className="text-sm text-gray-600 mb-2">{limparObservacao(registro.observacao)}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${tipoColors[registro.tipo]}`}
        >
          {tipoLabels[registro.tipo]}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-gray-900">{valorFormatado}</span>
        {registro.user && (
          <div className="flex items-center gap-2">
            {registro.user.imagem_url ? (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-aqua/20 flex items-center justify-center border border-brand-aqua/30">
                <img 
                  src={registro.user.imagem_url} 
                  alt={registro.user.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-brand-aqua font-bold text-xs">${registro.user?.nome?.charAt(0).toUpperCase() || '?'}</span>`
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand-aqua/20 flex items-center justify-center border border-brand-aqua/30">
                <span className="text-brand-aqua font-bold text-xs">
                  {registro.user.nome?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">{registro.user.nome}</span>
          </div>
        )}
      </div>

      {registro.etiquetas && registro.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {registro.etiquetas.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-lg"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {registro.categoria && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Categoria: </span>
          <span className="text-sm font-medium text-gray-700">{registro.categoria}</span>
        </div>
      )}

      {registro.parcelas_totais > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Parcelas: {registro.parcelas_pagas}/{registro.parcelas_totais}
            </span>
            <span className="text-sm text-gray-500">
              Faltam {registro.parcelas_totais - registro.parcelas_pagas} parcelas
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${(registro.parcelas_pagas / registro.parcelas_totais) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">{dataFormatada}</span>
        <div className="flex gap-2">
          {registro.tipo === 'divida' && registro.parcelas_pagas < registro.parcelas_totais && (
            <button
              onClick={handleMarcarPago}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar parcela como paga"
            >
              <CheckCircle size={18} />
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={handleExcluir}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {showModal && (
        <ModalEditarRegistro
          registro={registro}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Modal de Confirmação para Excluir Registro */}
      {showModalExcluir && (
        <ModalConfirmacao
          titulo="Excluir Registro"
          mensagem={`Tem certeza que deseja excluir o registro "${registro.nome}"? Esta ação não pode ser desfeita.`}
          onConfirmar={confirmarExcluir}
          onCancelar={() => setShowModalExcluir(false)}
          textoConfirmar="Excluir"
          tipo="danger"
        />
      )}
    </div>
  )
}

