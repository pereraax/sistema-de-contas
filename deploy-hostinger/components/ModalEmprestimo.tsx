'use client'

import { useState, useEffect } from 'react'
import { criarEmprestimo } from '@/lib/actions'
import { X, Upload, FileText, Plus, Trash2, CreditCard, Wallet, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'
import { obterPlanoUsuario } from '@/lib/plano'
import UpgradeModal from './UpgradeModal'

interface ModalEmprestimoProps {
  onClose: () => void
}

export default function ModalEmprestimo({ onClose }: ModalEmprestimoProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null)
  const [planoAtual, setPlanoAtual] = useState<'teste' | 'basico' | 'premium'>('teste')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    async function verificarPlano() {
      const plano = await obterPlanoUsuario()
      setPlanoAtual(plano)
      
      // Se não for premium, mostrar modal de upgrade
      if (plano !== 'premium') {
        setShowUpgradeModal(true)
      }
    }
    verificarPlano()
  }, [])
  const [parcelas, setParcelas] = useState<Array<{ valor: string; data: string }>>([
    { valor: '', data: '' }
  ])
  const [formData, setFormData] = useState({
    nome_pessoa: '',
    valor: '',
    observacao: '',
    cpf: '',
    celular: '',
    data_emprestimo: new Date().toISOString().slice(0, 16),
    metodo_pagamento: 'dinheiro' as 'pix' | 'cartao' | 'dinheiro',
  })

  const formatarCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    if (cpf.length <= 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatarCelular = (value: string) => {
    const celular = value.replace(/\D/g, '')
    if (celular.length <= 11) {
      return celular.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'emprestimos')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setArquivoUrl(data.url)
        createNotification('Arquivo enviado com sucesso!', 'success')
      } else {
        createNotification('Erro ao enviar arquivo', 'warning')
      }
    } catch (error) {
      createNotification('Erro ao enviar arquivo', 'warning')
    } finally {
      setUploading(false)
    }
  }

  const adicionarParcela = () => {
    setParcelas([...parcelas, { valor: '', data: '' }])
  }

  const removerParcela = (index: number) => {
    if (parcelas.length > 1) {
      setParcelas(parcelas.filter((_, i) => i !== index))
    }
  }


  const atualizarParcela = (index: number, campo: 'valor' | 'data', valor: string) => {
    const novasParcelas = [...parcelas]
    novasParcelas[index][campo] = valor
    setParcelas(novasParcelas)
  }

  const calcularValorTotal = () => {
    return parcelas.reduce((total, parcela) => {
      const valor = converterValorFormatadoParaNumero(parcela.valor)
      return total + valor
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar plano antes de submeter
    if (planoAtual !== 'premium') {
      createNotification('Criar Empréstimos está disponível apenas no Plano Premium', 'warning')
      setShowUpgradeModal(true)
      return
    }
    
    setLoading(true)

    // Validar parcelas
    const parcelasValidas = parcelas.filter(p => p.valor && p.data)
    if (parcelasValidas.length === 0) {
      createNotification('Adicione pelo menos uma parcela com valor e data', 'warning')
      setLoading(false)
      return
    }

    const valorTotal = calcularValorTotal()
    const dataPrimeiraParcela = parcelasValidas[0].data
    const dataUltimaParcela = parcelasValidas[parcelasValidas.length - 1].data

    const form = new FormData()
    form.append('nome_pessoa', formData.nome_pessoa)
    form.append('valor', valorTotal.toString())
    form.append('observacao', formData.observacao)
    form.append('cpf', formData.cpf.replace(/\D/g, ''))
    form.append('celular', formData.celular.replace(/\D/g, ''))
    form.append('data_emprestimo', new Date(formData.data_emprestimo).toISOString())
    form.append('data_pagamento', new Date(dataUltimaParcela).toISOString())
    form.append('parcelas_totais', parcelasValidas.length.toString())
    form.append('parcelas', JSON.stringify(parcelasValidas.map(p => ({
      valor: converterValorFormatadoParaNumero(p.valor),
      data: new Date(p.data).toISOString()
    }))))
    if (arquivoUrl) form.append('arquivo_url', arquivoUrl)

    const result = await criarEmprestimo(form)

    if (result.error) {
      createNotification('Erro ao registrar empréstimo: ' + result.error, 'warning')
    } else {
      createNotification(`Empréstimo para "${formData.nome_pessoa}" registrado com sucesso!`, 'success')
      onClose()
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-brand-royal rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-gray-200 dark:border-white/10">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-white/10 px-5 py-4 flex items-center justify-between bg-white dark:bg-brand-midnight">
          <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean">
            Registrar Empréstimo
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
          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Nome da Pessoa *
            </label>
            <input
              type="text"
              required
              value={formData.nome_pessoa}
              onChange={(e) => setFormData({ ...formData, nome_pessoa: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50"
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => {
                  const formatted = formatarCPF(e.target.value)
                  if (formatted.replace(/\D/g, '').length <= 11) {
                    setFormData({ ...formData, cpf: formatted })
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                Celular
              </label>
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => {
                  const formatted = formatarCelular(e.target.value)
                  if (formatted.replace(/\D/g, '').length <= 11) {
                    setFormData({ ...formData, celular: formatted })
                  }
                }}
                className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>


          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Observação
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50 resize-none"
              placeholder="Observações sobre o empréstimo..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Data do Empréstimo *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.data_emprestimo}
              onChange={(e) => setFormData({ ...formData, data_emprestimo: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm"
            />
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
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-brand-midnight shadow-lg'
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
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-brand-midnight shadow-lg'
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
                    ? 'bg-brand-aqua/90 dark:bg-brand-aqua text-brand-midnight shadow-lg'
                    : 'bg-gray-50 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean border border-gray-300 dark:border-white/10'
                }`}
              >
                <Wallet size={18} strokeWidth={2} />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Parcelas *
            </label>
            <div className="space-y-2">
              {parcelas.map((parcela, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-brand-midnight/70 dark:text-brand-clean/70 font-medium text-xs">
                        R$
                      </span>
                      <input
                        type="text"
                        required
                        value={parcela.valor}
                        onChange={(e) => {
                          const formatted = formatarValorEmTempoReal(e.target.value)
                          atualizarParcela(index, 'valor', formatted)
                        }}
                        placeholder="0,00"
                        className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-xs placeholder-gray-400 dark:placeholder-brand-clean/50"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="datetime-local"
                      required
                      value={parcela.data}
                      onChange={(e) => atualizarParcela(index, 'data', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-xs"
                    />
                  </div>
                  {parcelas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerParcela(index)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-smooth"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={adicionarParcela}
                className="flex items-center gap-2 px-4 py-2 bg-brand-aqua/90 dark:bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua shadow-lg hover:shadow-xl transition-smooth text-xs"
              >
                <Plus size={16} />
                Adicionar Parcela
              </button>
            </div>
            {parcelas.some(p => p.valor && p.data) && (
              <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-2 text-center">
                Valor total: <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(calcularValorTotal())}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Documento/Imagem (Opcional)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg cursor-pointer hover:border-brand-aqua transition-smooth bg-gray-50 dark:bg-brand-midnight/50 hover:bg-gray-100 dark:hover:bg-brand-midnight/70">
                <div className="flex flex-col items-center gap-1.5">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-aqua"></div>
                      <span className="text-xs text-brand-midnight/70 dark:text-brand-clean/70">Enviando...</span>
                    </>
                  ) : arquivoUrl ? (
                    <>
                      <FileText size={24} className="text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Arquivo enviado!</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-brand-midnight/50 dark:text-brand-clean/50" />
                      <span className="text-xs text-brand-midnight/70 dark:text-brand-clean/70">Clique para fazer upload</span>
                      <span className="text-[10px] text-brand-midnight/50 dark:text-brand-clean/50">PNG, JPG, PDF até 10MB</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        createNotification('Arquivo muito grande. Máximo 10MB', 'warning')
                        return
                      }
                      handleFileUpload(file)
                    }
                  }}
                  disabled={uploading}
                />
              </label>
              {arquivoUrl && (
                <button
                  type="button"
                  onClick={() => setArquivoUrl(null)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                >
                  <X size={14} />
                  Remover arquivo
                </button>
              )}
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
                className="flex-1 px-4 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Registrando...' : 'REGISTRAR EMPRÉSTIMO'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            onClose()
          }}
          feature="Criar Empréstimos"
          planoNecessario="premium"
          planoAtual={planoAtual}
        />
      )}
    </div>
  )
}

