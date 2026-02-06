'use client'

import { useState, useEffect, useRef } from 'react'
import { criarRegistro, obterUsuarios } from '@/lib/actions'
import { User } from '@/lib/types'
import { X, Plus, User as UserIcon, CreditCard, Wallet, Smartphone, Clock } from 'lucide-react'
import DatePicker from './DatePicker'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'
import ModalSelecionarUsuario from './ModalSelecionarUsuario'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'
import { obterPlanoUsuario } from '@/lib/plano'
import UpgradeModal from './UpgradeModal'
import { useModalBodyLock } from '@/hooks/useModalBodyLock'

interface ModalSalarioProps {
  onClose: () => void
}

export default function ModalSalario({ onClose }: ModalSalarioProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [showModalUsuario, setShowModalUsuario] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(null)
  const usuarioButtonRef = useRef<HTMLButtonElement>(null)
  const [planoAtual, setPlanoAtual] = useState<'teste' | 'basico' | 'premium'>('teste')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    async function verificarPlano() {
      const plano = await obterPlanoUsuario()
      setPlanoAtual(plano)
      
      // Se for plano teste, mostrar modal de upgrade
      if (plano === 'teste') {
        setShowUpgradeModal(true)
      }
    }
    verificarPlano()
  }, [])
  const hoje = new Date()
  const [formData, setFormData] = useState({
    nome: 'Salário',
    valor: '',
    user_id: '',
    data: hoje.toISOString().slice(0, 10),
    hora_opcional: '',
    metodo_pagamento: 'dinheiro' as 'pix' | 'cartao' | 'dinheiro',
  })

  useModalBodyLock()

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    const result = await obterUsuarios()
    if (result.data) {
      setUsuarios(result.data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar plano antes de submeter
    if (planoAtual === 'teste') {
      createNotification('Registrar Salário está disponível apenas no Plano Básico ou Premium', 'warning')
      setShowUpgradeModal(true)
      return
    }
    
    setLoading(true)

    // Converter valor formatado para número
    const valorFinal = converterValorFormatadoParaNumero(formData.valor)

    if (isNaN(valorFinal)) {
      createNotification('Valor inválido', 'warning')
      setLoading(false)
      return
    }

    const form = new FormData()
    form.append('nome', formData.nome)
    form.append('observacao', 'Registro rápido de salário')
    form.append('user_id', formData.user_id)
    form.append('tipo', 'entrada')
    form.append('valor', valorFinal.toString())
    form.append('categoria', 'Salário')
    form.append('etiquetas', JSON.stringify(['salário', 'entrada', formData.metodo_pagamento]))
    form.append('parcelas_totais', '1')
    form.append('parcelas_pagas', '0')
    const dataFinal = formData.hora_opcional.trim()
      ? new Date(`${formData.data}T${formData.hora_opcional}`)
      : new Date(`${formData.data}T${hoje.toTimeString().slice(0, 5)}`)
    form.append('data_registro', dataFinal.toISOString())

    const result = await criarRegistro(form)

    if (result.error) {
      createNotification('Erro ao registrar salário: ' + result.error, 'warning')
    } else {
      createNotification(`Salário de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFinal)} registrado com sucesso!`, 'success')
      onClose()
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="bg-white dark:bg-brand-royal rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-gray-200 dark:border-white/10">
        <div className="flex-shrink-0 border-b border-brand-aqua/20 dark:border-white/10 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-brand-aqua to-blue-500 dark:from-brand-midnight dark:to-brand-royal">
          <h2 className="text-xl font-display font-bold text-white dark:text-brand-clean">Registrar Salário</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={20} className="text-white dark:text-brand-clean" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white dark:bg-brand-royal overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4 space-y-4" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Valor do Salário *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/70 dark:text-brand-clean/70 font-medium text-xs">
                R$
              </span>
              <input
                type="text"
                required
                value={formData.valor}
                onChange={(e) => {
                  const formatted = formatarValorEmTempoReal(e.target.value)
                  setFormData({ ...formData, valor: formatted })
                }}
                placeholder="0,00"
                className="w-full pl-10 pr-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-base placeholder-gray-400 dark:placeholder-brand-clean/50"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Usuário
            </label>
            <button
              ref={usuarioButtonRef}
              type="button"
              onClick={() => setShowModalUsuario(true)}
              className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                {usuarioSelecionado ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-brand-aqua/20 dark:bg-brand-aqua/30 flex items-center justify-center">
                      <span className="text-brand-aqua font-bold text-xs">
                        {usuarioSelecionado.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-brand-midnight dark:text-brand-clean text-sm">{usuarioSelecionado.nome}</span>
                  </>
                ) : (
                  <>
                    <UserIcon size={18} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                    <span className="text-brand-midnight/50 dark:text-brand-clean/50 text-sm">Selecione um usuário</span>
                  </>
                )}
              </div>
              <Plus size={18} className="text-brand-aqua" />
            </button>
            
            {/* Dropdown de seleção de usuário */}
            <ModalSelecionarUsuario
              isOpen={showModalUsuario}
              onClose={() => setShowModalUsuario(false)}
              onSelect={(user) => {
                setUsuarioSelecionado(user)
                setFormData({ ...formData, user_id: user.id })
              }}
              selectedUserId={formData.user_id}
              buttonRef={usuarioButtonRef}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                Data *
              </label>
              <DatePicker
                value={formData.data}
                onChange={(v) => setFormData({ ...formData, data: v })}
                required
                placeholder="Selecione a data"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                Horas <span className="text-gray-400 dark:text-brand-clean/50 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50 pointer-events-none" />
                <input
                  type="time"
                  value={formData.hora_opcional}
                  onChange={(e) => setFormData({ ...formData, hora_opcional: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-aqua/30 focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-base placeholder-gray-400 dark:placeholder-brand-clean/40"
                  style={{ fontSize: '16px' }}
                  placeholder="Hora atual"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-brand-clean/60 mt-1">
                Se não informar, usa a hora do registro
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Método de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, metodo_pagamento: 'pix' })}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg font-medium transition-smooth text-xs ${
                  formData.metodo_pagamento === 'pix'
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean border border-gray-300 dark:border-white/10'
                }`}
              >
                <Smartphone size={18} strokeWidth={2} />
                <span>PIX</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, metodo_pagamento: 'cartao' })}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg font-medium transition-smooth text-xs ${
                  formData.metodo_pagamento === 'cartao'
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean border border-gray-300 dark:border-white/10'
                }`}
              >
                <CreditCard size={18} strokeWidth={2} />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, metodo_pagamento: 'dinheiro' })}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg font-medium transition-smooth text-xs ${
                  formData.metodo_pagamento === 'dinheiro'
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean border border-gray-300 dark:border-white/10'
                }`}
              >
                <Wallet size={18} strokeWidth={2} />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>

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
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-brand-aqua text-white rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Registrando...' : 'REGISTRAR'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

