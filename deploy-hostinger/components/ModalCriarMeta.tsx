'use client'

import { useState, useEffect } from 'react'
import { 
  X, Target, Calendar, DollarSign, Loader2, 
  Plane, Car, Home, Smartphone, Heart, 
  GraduationCap, ShoppingBag, Gamepad2, 
  Camera, Music, Dumbbell, Briefcase, 
  Gift, PiggyBank, Wallet, CreditCard
} from 'lucide-react'
import { criarMetaCofrinho, editarMetaCofrinho } from '@/lib/actions'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'
import type { MetaCofrinho } from '@/lib/types'

interface ModalCriarMetaProps {
  onClose: () => void
  onMetaCriada: (meta: MetaCofrinho) => void
  metaParaEditar?: MetaCofrinho | null
}

// Ícones disponíveis para categorias (todos azuis)
const iconesCategorias = [
  { nome: 'Plane', icon: Plane },
  { nome: 'Car', icon: Car },
  { nome: 'Home', icon: Home },
  { nome: 'Smartphone', icon: Smartphone },
  { nome: 'Heart', icon: Heart },
  { nome: 'GraduationCap', icon: GraduationCap },
  { nome: 'ShoppingCart', icon: ShoppingBag },
  { nome: 'Gamepad', icon: Gamepad2 },
  { nome: 'Camera', icon: Camera },
  { nome: 'Music', icon: Music },
  { nome: 'Dumbbell', icon: Dumbbell },
  { nome: 'Briefcase', icon: Briefcase },
  { nome: 'Gift', icon: Gift },
  { nome: 'PiggyBank', icon: PiggyBank },
  { nome: 'Wallet', icon: Wallet },
  { nome: 'CreditCard', icon: CreditCard },
]

export default function ModalCriarMeta({ onClose, onMetaCriada, metaParaEditar }: ModalCriarMetaProps) {
  const [nome, setNome] = useState(metaParaEditar?.nome || '')
  const [metaTotalStr, setMetaTotalStr] = useState(metaParaEditar ? metaParaEditar.meta_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
  const [valorMaxPorBauStr, setValorMaxPorBauStr] = useState(metaParaEditar?.valor_max_por_bau ? metaParaEditar.valor_max_por_bau.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
  const [periodicidade, setPeriodicidade] = useState<'diario' | 'semanal' | 'mensal'>(metaParaEditar?.periodicidade || 'semanal')
  const [iconeSelecionado, setIconeSelecionado] = useState<string>(metaParaEditar?.icone || 'Plane')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [numBausCalculado, setNumBausCalculado] = useState<number | null>(null)

  // Recalcular quando os valores mudarem
  useEffect(() => {
    const metaTotal = converterValorFormatadoParaNumero(metaTotalStr)
    const valorMaxPorBau = converterValorFormatadoParaNumero(valorMaxPorBauStr)
    
    if (metaTotal > 0 && valorMaxPorBau > 0) {
      const numBaus = Math.ceil(metaTotal / valorMaxPorBau)
      setNumBausCalculado(numBaus)
    } else {
      setNumBausCalculado(null)
    }
  }, [metaTotalStr, valorMaxPorBauStr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!nome.trim()) {
      setErro('Por favor, dê um nome para sua meta')
      return
    }

    const metaTotal = converterValorFormatadoParaNumero(metaTotalStr)
    
    if (!metaTotal || metaTotal <= 0) {
      setErro('Por favor, informe um valor válido para a meta')
      return
    }

    const valorMaxPorBau = converterValorFormatadoParaNumero(valorMaxPorBauStr)
    
    if (!valorMaxPorBau || valorMaxPorBau <= 0) {
      setErro('Por favor, informe quanto você pode guardar por baú')
      return
    }

    setLoading(true)

    try {
      // Salvar ícone no localStorage para uso futuro
      localStorage.setItem(`meta_icone_${nome}`, iconeSelecionado)

      // Converter para FormData
      const formData = new FormData()
      formData.append('nome', nome)
      formData.append('valor_objetivo', metaTotal.toString())
      formData.append('periodicidade', periodicidade)

      const resultado = metaParaEditar
        ? await editarMetaCofrinho(metaParaEditar.id, formData)
        : await criarMetaCofrinho(formData)

      if (resultado.error) {
        setErro(resultado.error)
        setLoading(false)
        return
      }

      if (resultado.data) {
        setLoading(false)
        onMetaCriada(resultado.data)
      } else {
        // Se não retornou dados mas não há erro, recarregar a página
        setLoading(false)
        if (!resultado.error) {
          setTimeout(() => {
            window.location.href = '/minhas-metas'
          }, 500)
        }
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar meta')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        {/* Modal - Compacto e Organizado */}
        <div 
          className="bg-white dark:bg-brand-royal rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 animate-slide-up max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Fixo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-brand-midnight">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-aqua rounded-lg">
                <Target size={16} className="text-brand-midnight" />
              </div>
              <h2 className="text-lg font-display font-bold text-brand-midnight dark:text-brand-clean">
                {metaParaEditar ? 'Editar Meta' : 'Criar Nova Meta'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-smooth"
            >
              <X size={18} className="text-brand-midnight dark:text-brand-clean" />
            </button>
          </div>

          {/* Form Completo */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Conteúdo Scrollável */}
            <div className="overflow-y-auto scrollbar-hide flex-1">
              <div className="px-5 py-4">
                {erro && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
                    {erro}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Nome da Meta */}
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                    Nome da Meta
                  </label>
                  <div className="relative">
                    <Target className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-brand-clean/50" size={14} />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Viagem, Novo celular..."
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50"
                      maxLength={50}
                    />
                  </div>
                </div>

                {/* Seleção de Ícone */}
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                    Escolha um ícone
                  </label>
                  <div className="border border-gray-300 dark:border-white/10 rounded-lg overflow-hidden bg-gray-50 dark:bg-brand-midnight/50">
                    <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1.5 scrollbar-hide">
                      {iconesCategorias.map((item) => {
                        const IconComponent = item.icon
                        const isSelected = iconeSelecionado === item.nome
                        return (
                          <button
                            key={item.nome}
                            type="button"
                            onClick={() => setIconeSelecionado(item.nome)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-brand-aqua border-brand-aqua shadow-sm'
                                : 'bg-white dark:bg-brand-royal border-gray-300 dark:border-white/10 hover:border-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                            }`}
                            title={item.nome}
                          >
                            <IconComponent 
                              size={16} 
                              className={`mx-auto ${
                                isSelected ? 'text-white' : 'text-blue-500'
                              }`} 
                            />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Valor da Meta */}
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-white mb-1">
                    Valor total da meta
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/70" size={14} />
                    <input
                      type="text"
                      value={metaTotalStr}
                      onChange={(e) => {
                        setMetaTotalStr(formatarValorEmTempoReal(e.target.value))
                      }}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm font-semibold text-brand-midnight dark:text-white placeholder-gray-400 dark:placeholder-white/50"
                    />
                  </div>
                </div>

                {/* Valor Máximo por Baú */}
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                    Valor máximo por baú
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-brand-clean/50" size={14} />
                    <input
                      type="text"
                      value={valorMaxPorBauStr}
                      onChange={(e) => {
                        setValorMaxPorBauStr(formatarValorEmTempoReal(e.target.value))
                      }}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm font-semibold text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50"
                    />
                  </div>
                  {numBausCalculado !== null && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-brand-clean/60">
                      {numBausCalculado} baús serão criados
                    </p>
                  )}
                </div>

                {/* Periodicidade */}
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                    Frequência
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPeriodicidade('diario')}
                      className={`p-1.5 rounded-lg border transition-smooth ${
                        periodicidade === 'diario'
                          ? 'bg-brand-aqua border-brand-aqua text-brand-midnight shadow-sm'
                          : 'bg-white dark:bg-brand-royal border-gray-300 dark:border-white/10 text-brand-midnight dark:text-brand-clean hover:border-brand-aqua'
                      }`}
                    >
                      <Calendar size={14} className="mx-auto mb-0.5" />
                      <span className="font-semibold block text-[10px]">Diário</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPeriodicidade('semanal')}
                      className={`p-1.5 rounded-lg border transition-smooth ${
                        periodicidade === 'semanal'
                          ? 'bg-brand-aqua border-brand-aqua text-brand-midnight shadow-sm'
                          : 'bg-white dark:bg-brand-royal border-gray-300 dark:border-white/10 text-brand-midnight dark:text-brand-clean hover:border-brand-aqua'
                      }`}
                    >
                      <Calendar size={14} className="mx-auto mb-0.5" />
                      <span className="font-semibold block text-[10px]">Semanal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPeriodicidade('mensal')}
                      className={`p-1.5 rounded-lg border transition-smooth ${
                        periodicidade === 'mensal'
                          ? 'bg-brand-aqua border-brand-aqua text-brand-midnight shadow-sm'
                          : 'bg-white dark:bg-brand-royal border-gray-300 dark:border-white/10 text-brand-midnight dark:text-brand-clean hover:border-brand-aqua'
                      }`}
                    >
                      <Calendar size={14} className="mx-auto mb-0.5" />
                      <span className="font-semibold block text-[10px]">Mensal</span>
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Botões Fixos */}
            <div className="flex gap-2 px-5 py-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-brand-midnight">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-brand-royal text-brand-midnight dark:text-brand-clean rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth font-medium text-sm disabled:opacity-50 border border-gray-200 dark:border-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg hover:bg-brand-aqua/90 transition-smooth font-bold text-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </span>
                ) : (
                  metaParaEditar ? 'Salvar Alterações' : 'Criar Meta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

