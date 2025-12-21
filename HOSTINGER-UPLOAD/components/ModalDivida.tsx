'use client'

import { useState, useEffect } from 'react'
import { criarRegistro, obterUsuarios } from '@/lib/actions'
import type { User } from '@/lib/types'
import { X, CreditCard, Wallet, Smartphone, Plus, User as UserIcon, Trash2, UtensilsCrossed, Car, Home, ShoppingBag, Heart, GraduationCap, Briefcase, Gamepad2, Dumbbell, Plane } from 'lucide-react'
import CheckboxModerno from './CheckboxModerno'
import InputDiaMes from './InputDiaMes'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'
import ModalSelecionarUsuario from './ModalSelecionarUsuario'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'
import { obterPlanoUsuario } from '@/lib/plano'
import UpgradeModal from './UpgradeModal'

interface ModalDividaProps {
  onClose: () => void
}

export default function ModalDivida({ onClose }: ModalDividaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [showModalUsuario, setShowModalUsuario] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(null)
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
  const [temParcelas, setTemParcelas] = useState(true) // Se a dívida tem parcelas ou é única
  const [valorDivida, setValorDivida] = useState('') // Valor da dívida (comum para ambos os modos)
  const [dividaUnica, setDividaUnica] = useState({ data: '' }) // Para dívida sem parcelas (data opcional)
  const [parcelas, setParcelas] = useState<Array<{ data: string; quantidade: string }>>([
    { data: '', quantidade: '1' }
  ])
  const [formData, setFormData] = useState({
    nome: '',
    observacao: '',
    user_id: '',
    data_registro: new Date().toISOString().slice(0, 16),
    categoria: '',
    metodo_pagamento: 'dinheiro' as 'pix' | 'cartao' | 'dinheiro',
  })
  const [isRecorrente, setIsRecorrente] = useState(false)
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensal')
  const [recorrenciaDia, setRecorrenciaDia] = useState<number>(1) // Dia do mês (1-31)
  const [recorrenciaDiaSemana, setRecorrenciaDiaSemana] = useState<number>(1) // Dia da semana (0-6, 0=domingo)

  const categorias = [
    { id: 'alimentacao', nome: 'Alimentação', icon: UtensilsCrossed },
    { id: 'transporte', nome: 'Transporte', icon: Car },
    { id: 'moradia', nome: 'Moradia', icon: Home },
    { id: 'compras', nome: 'Compras', icon: ShoppingBag },
    { id: 'saude', nome: 'Saúde', icon: Heart },
    { id: 'educacao', nome: 'Educação', icon: GraduationCap },
    { id: 'trabalho', nome: 'Trabalho', icon: Briefcase },
    { id: 'entretenimento', nome: 'Entretenimento', icon: Gamepad2 },
    { id: 'fitness', nome: 'Fitness', icon: Dumbbell },
    { id: 'viagem', nome: 'Viagem', icon: Plane },
  ]

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    const result = await obterUsuarios()
    if (result.data) {
      setUsuarios(result.data)
    }
  }

  const adicionarParcela = () => {
    setParcelas([...parcelas, { data: '', quantidade: '1' }])
  }

  const removerParcela = (index: number) => {
    if (parcelas.length > 1) {
      setParcelas(parcelas.filter((_, i) => i !== index))
    }
  }

  const atualizarParcela = (index: number, campo: 'data' | 'quantidade', valor: string) => {
    const novasParcelas = [...parcelas]
    novasParcelas[index][campo] = valor
    setParcelas(novasParcelas)
  }

  const calcularValorTotal = () => {
    if (!temParcelas) {
      return converterValorFormatadoParaNumero(valorDivida)
    }
    // Se tem parcelas, usar o valor comum dividido pelo número de parcelas
    const parcelasValidas = parcelas.filter(p => p.data && p.data.trim() !== '')
    if (parcelasValidas.length === 0) return 0
    const valorComum = converterValorFormatadoParaNumero(valorDivida)
    return valorComum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('handleSubmit chamado')
    
    // Verificar plano antes de submeter
    if (planoAtual === 'teste') {
      createNotification('Criar Dívidas está disponível apenas no Plano Básico ou Premium', 'warning')
      setShowUpgradeModal(true)
      return
    }
    
    setLoading(true)

    try {
      console.log('Iniciando validações...', { temParcelas, valorDivida, nome: formData.nome })
      // Validações
      if (!formData.nome.trim()) {
        createNotification('Informe o nome da dívida', 'warning')
        setLoading(false)
        return
      }

      if (!usuarioSelecionado) {
        createNotification('Selecione um usuário', 'warning')
        setLoading(false)
        return
      }

      // Validar valor comum (obrigatório para ambos os modos)
      const valorComum = converterValorFormatadoParaNumero(valorDivida)
      if (!valorDivida || valorDivida.trim() === '' || isNaN(valorComum) || valorComum <= 0) {
        createNotification('Informe um valor válido para a dívida', 'warning')
        setLoading(false)
        return
      }

      // Validar baseado no tipo (com ou sem parcelas)
      if (temParcelas) {
        // Validar parcelas - verificar se têm data e quantidade
        const parcelasValidas = parcelas.filter(p => {
          return p.data && p.data.trim() !== '' && 
                 p.quantidade && parseInt(p.quantidade) > 0
        })
        
        if (parcelasValidas.length === 0) {
          createNotification('Adicione pelo menos uma parcela válida com data e quantidade', 'warning')
          setLoading(false)
          return
        }
      } else {
        // Validar: se tem recorrência, não pode ter data (conflito)
        if (isRecorrente && dividaUnica.data && dividaUnica.data.trim() !== '') {
          createNotification('Não é possível definir data quando a dívida é recorrente. A data será calculada automaticamente pela recorrência.', 'warning')
          setLoading(false)
          return
        }
      }

      // Criar registro(s) baseado no tipo
      let sucesso = true
      let erros: string[] = []
      let registrosCriados = 0

      if (temParcelas) {
        // Processar parcelas
        const parcelasValidas = parcelas.filter(p => {
          return p.data && p.data.trim() !== '' && 
                 p.quantidade && parseInt(p.quantidade) > 0
        })

        if (parcelasValidas.length === 0) {
          createNotification('Adicione pelo menos uma parcela válida com data e quantidade', 'warning')
          setLoading(false)
          return
        }

        // Calcular valor por parcela (dividir o valor total pelo número de parcelas)
        const valorPorParcela = valorComum / parcelasValidas.length
        console.log('Valor por parcela calculado:', valorPorParcela, 'Total parcelas:', parcelasValidas.length)

        for (let i = 0; i < parcelasValidas.length; i++) {
        const parcela = parcelasValidas[i]
        const quantidade = parseInt(parcela.quantidade) || 1

        if (!parcela.data || parcela.data.trim() === '') {
          erros.push(`Parcela ${i + 1}: data inválida`)
          sucesso = false
          continue
        }

        const valorTotalParcela = valorPorParcela * quantidade

        const form = new FormData()
        form.append('nome', `${formData.nome.trim()}${parcelasValidas.length > 1 ? ` - Parcela ${i + 1}` : ''}`)
        form.append('observacao', formData.observacao || `Dívida - ${quantidade} parcela(s) de R$ ${valorPorParcela.toFixed(2)}`)
        form.append('user_id', usuarioSelecionado.id)
        form.append('tipo', 'divida')
        form.append('valor', valorTotalParcela.toFixed(2))
        form.append('categoria', formData.categoria || `Dívida - ${formData.metodo_pagamento}`)
        form.append('etiquetas', JSON.stringify(['dívida', formData.metodo_pagamento]))
        form.append('parcelas_totais', quantidade.toString())
        form.append('parcelas_pagas', '0')
        form.append('data_registro', new Date(parcela.data).toISOString())
        
        // Adicionar campos de recorrência se for recorrente
        if (isRecorrente && i === 0) { // Apenas na primeira parcela
          form.append('is_recorrente', 'true')
          form.append('recorrencia_tipo', recorrenciaTipo)
          if (recorrenciaTipo === 'semanal') {
            form.append('recorrencia_dia_semana', recorrenciaDiaSemana.toString())
          } else if (['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(recorrenciaTipo)) {
            form.append('recorrencia_dia', recorrenciaDia.toString())
          }
          
          // Calcular próxima recorrência
          const dataInicial = new Date(parcela.data)
          let proximaData = new Date(dataInicial)
          
          switch (recorrenciaTipo) {
            case 'diaria':
              proximaData.setDate(proximaData.getDate() + 1)
              break
            case 'semanal':
              const diasParaProximaSemana = (recorrenciaDiaSemana - dataInicial.getDay() + 7) % 7 || 7
              proximaData.setDate(proximaData.getDate() + diasParaProximaSemana)
              break
            case 'quinzenal':
              proximaData.setDate(proximaData.getDate() + 15)
              break
            case 'mensal':
              proximaData.setMonth(proximaData.getMonth() + 1)
              proximaData.setDate(recorrenciaDia)
              break
            case 'bimestral':
              proximaData.setMonth(proximaData.getMonth() + 2)
              proximaData.setDate(recorrenciaDia)
              break
            case 'trimestral':
              proximaData.setMonth(proximaData.getMonth() + 3)
              proximaData.setDate(recorrenciaDia)
              break
            case 'semestral':
              proximaData.setMonth(proximaData.getMonth() + 6)
              proximaData.setDate(recorrenciaDia)
              break
            case 'anual':
              proximaData.setFullYear(proximaData.getFullYear() + 1)
              proximaData.setDate(recorrenciaDia)
              break
          }
          
          form.append('proxima_recorrencia', proximaData.toISOString())
          form.append('ativo', 'true')
        }

        try {
          console.log(`Criando parcela ${i + 1}...`, { valorTotalParcela, data: parcela.data })
          const result = await criarRegistro(form)
          console.log(`Resultado criarRegistro (parcela ${i + 1}):`, result)
          
          if (result.error) {
            sucesso = false
            erros.push(`Parcela ${i + 1}: ${result.error}`)
            console.error(`Erro ao criar parcela ${i + 1}:`, result.error)
          } else {
            registrosCriados++
            console.log(`Parcela ${i + 1} criada com sucesso!`)
          }
        } catch (error: any) {
          sucesso = false
          erros.push(`Parcela ${i + 1}: ${error.message || 'Erro desconhecido'}`)
          console.error(`Erro ao criar parcela ${i + 1}:`, error)
        }
      }
      } else {
        // Criar dívida única (sem parcelas)
        const valorUnico = converterValorFormatadoParaNumero(valorDivida)

        // Determinar data: se não fornecida, usar data atual; se recorrente, usar data atual também
        let dataRegistro: Date
        if (isRecorrente) {
          // Se recorrente, usar data atual (a recorrência define a próxima data)
          dataRegistro = new Date()
        } else if (dividaUnica.data && dividaUnica.data.trim() !== '') {
          // Se forneceu data e não é recorrente, usar a data fornecida
          dataRegistro = new Date(dividaUnica.data)
        } else {
          // Se não forneceu data, usar data atual
          dataRegistro = new Date()
        }

        const form = new FormData()
        form.append('nome', formData.nome.trim())
        form.append('observacao', formData.observacao || 'Dívida única')
        form.append('user_id', usuarioSelecionado.id)
        form.append('tipo', 'divida')
        form.append('valor', valorUnico.toFixed(2))
        form.append('categoria', formData.categoria || `Dívida - ${formData.metodo_pagamento}`)
        form.append('etiquetas', JSON.stringify(['dívida', formData.metodo_pagamento]))
        form.append('parcelas_totais', '1')
        form.append('parcelas_pagas', '0')
        form.append('data_registro', dataRegistro.toISOString())

        // Adicionar campos de recorrência se for recorrente
        if (isRecorrente) {
          form.append('is_recorrente', 'true')
          form.append('recorrencia_tipo', recorrenciaTipo)
          if (recorrenciaTipo === 'semanal') {
            form.append('recorrencia_dia_semana', recorrenciaDiaSemana.toString())
          } else if (['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'].includes(recorrenciaTipo)) {
            form.append('recorrencia_dia', recorrenciaDia.toString())
          }
          
          // Calcular próxima recorrência baseada na data atual
          let proximaData = new Date(dataRegistro)
          
          switch (recorrenciaTipo) {
            case 'diaria':
              proximaData.setDate(proximaData.getDate() + 1)
              break
            case 'semanal':
              const diasParaProximaSemana = (recorrenciaDiaSemana - dataRegistro.getDay() + 7) % 7 || 7
              proximaData.setDate(proximaData.getDate() + diasParaProximaSemana)
              break
            case 'quinzenal':
              proximaData.setDate(proximaData.getDate() + 15)
              break
            case 'mensal':
              proximaData.setMonth(proximaData.getMonth() + 1)
              proximaData.setDate(recorrenciaDia)
              break
            case 'bimestral':
              proximaData.setMonth(proximaData.getMonth() + 2)
              proximaData.setDate(recorrenciaDia)
              break
            case 'trimestral':
              proximaData.setMonth(proximaData.getMonth() + 3)
              proximaData.setDate(recorrenciaDia)
              break
            case 'semestral':
              proximaData.setMonth(proximaData.getMonth() + 6)
              proximaData.setDate(recorrenciaDia)
              break
            case 'anual':
              proximaData.setFullYear(proximaData.getFullYear() + 1)
              proximaData.setDate(recorrenciaDia)
              break
          }
          
          form.append('proxima_recorrencia', proximaData.toISOString())
          form.append('ativo', 'true')
        }

        try {
          console.log('Criando dívida única...', { valorUnico, dataRegistro })
          const result = await criarRegistro(form)
          console.log('Resultado criarRegistro:', result)
          
          if (result.error) {
            sucesso = false
            erros.push(result.error)
            console.error('Erro ao criar dívida única:', result.error)
          } else {
            registrosCriados++
            console.log('Dívida única criada com sucesso!')
          }
        } catch (error: any) {
          sucesso = false
          erros.push(error.message || 'Erro desconhecido')
          console.error('Erro ao criar dívida única:', error)
        }
      }

      console.log('Registros criados:', registrosCriados, 'Erros:', erros)

      if (registrosCriados > 0) {
        if (temParcelas) {
          const parcelasValidas = parcelas.filter(p => {
            return p.data && p.data.trim() !== '' && 
                   p.quantidade && parseInt(p.quantidade) > 0
          })
          const totalParcelas = parcelasValidas.reduce((sum, p) => sum + (parseInt(p.quantidade) || 1), 0)
          if (erros.length > 0) {
            createNotification(`${registrosCriados} parcela(s) registrada(s), mas ${erros.length} falharam: ${erros.join('; ')}`, 'warning')
          } else {
            createNotification(`${registrosCriados} parcela(s) da dívida "${formData.nome}" registrada(s) com sucesso!`, 'success')
          }
        } else {
          if (erros.length > 0) {
            createNotification(`Erro ao registrar dívida: ${erros.join('; ')}`, 'warning')
          } else {
            createNotification(`Dívida "${formData.nome}" registrada com sucesso!`, 'success')
          }
        }
        // Reset form
        setFormData({
          nome: '',
          observacao: '',
          user_id: '',
          data_registro: new Date().toISOString().slice(0, 16),
          categoria: '',
          metodo_pagamento: 'dinheiro',
        })
        setParcelas([{ data: '', quantidade: '1' }])
        setValorDivida('')
        setDividaUnica({ data: '' })
        setTemParcelas(true)
        setUsuarioSelecionado(null)
        setIsRecorrente(false)
        setRecorrenciaTipo('mensal')
        setRecorrenciaDia(1)
        setRecorrenciaDiaSemana(1)
        onClose()
        router.refresh()
      } else {
        const mensagemErro = temParcelas 
          ? 'Erro ao registrar parcelas: ' + erros.join('; ')
          : 'Erro ao registrar dívida: ' + erros.join('; ')
        createNotification(mensagemErro, 'warning')
        console.error('Erros ao criar registros:', erros)
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error)
      createNotification('Erro inesperado ao registrar dívida. Tente novamente.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden border-2 border-brand-aqua/30 dark:border-brand-aqua/40 my-4 sm:my-0">
        <div className="flex-shrink-0 border-b-2 border-brand-aqua/20 dark:border-brand-aqua/30 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-gradient-to-r from-brand-aqua/10 via-brand-aqua/5 to-transparent dark:from-brand-aqua/20 dark:via-brand-aqua/10">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean">
            Registrar Dívida
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-smooth"
          >
            <X size={22} className="text-brand-midnight dark:text-brand-clean" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white/50 dark:bg-brand-midnight/60 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                  Usuário/Envolvido *
                </label>
                <button
                  type="button"
                  onClick={() => setShowModalUsuario(true)}
                  className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:border-brand-aqua transition-smooth flex items-center justify-between text-left text-sm"
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
                <p className="mt-1 text-[10px] text-brand-midnight/60 dark:text-brand-clean/60">
                  Selecione a pessoa responsável ou envolvida nesta dívida. Ex: Você mesmo, Cônjuge, Filho, etc.
                </p>
              </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Nome da Dívida *
            </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm placeholder-gray-400 dark:placeholder-brand-clean/50"
                  placeholder="Ex: Conta de luz, Cartão de crédito, Financiamento, Empréstimo..."
                />
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
              placeholder="Observações sobre a dívida..."
            />
          </div>

          {/* Campo de Valor (comum para ambos os modos) */}
          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
              Valor da Dívida *
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50 text-xs">
                R$
              </span>
              <input
                type="text"
                required
                value={valorDivida}
                onChange={(e) => {
                  const formatted = formatarValorEmTempoReal(e.target.value)
                  setValorDivida(formatted)
                }}
                placeholder="0,00"
                className="w-full pl-7 pr-2 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50"
              />
            </div>
          </div>

          {/* Opção: Dívida com ou sem parcelas */}
          <div>
            <CheckboxModerno
              id="temParcelas"
              checked={temParcelas}
              onChange={setTemParcelas}
              label="Esta dívida tem parcelas?"
              size="md"
              className="mb-3"
            />

            {temParcelas ? (
              <>
                <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-2">
                  Parcelas da Dívida *
                </label>
                <div className="space-y-3">
              {parcelas.map((parcela, index) => (
                <div key={index} className="bg-gray-50 dark:bg-brand-midnight/50 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-midnight dark:text-brand-clean">
                      Parcela {index + 1}
                    </span>
                    {parcelas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerParcela(index)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-smooth"
                        title="Remover parcela"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight/70 dark:text-brand-clean/70 mb-1">
                        Data *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={parcela.data}
                        onChange={(e) => atualizarParcela(index, 'data', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-brand-royal border border-gray-300 dark:border-white/10 rounded focus:outline-none focus:border-brand-aqua transition-smooth text-xs text-brand-midnight dark:text-brand-clean"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight/70 dark:text-brand-clean/70 mb-1">
                        Qtd *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={parcela.quantidade}
                        onChange={(e) => atualizarParcela(index, 'quantidade', e.target.value)}
                        placeholder="1"
                        className="w-full px-2 py-1.5 bg-white dark:bg-brand-royal border border-gray-300 dark:border-white/10 rounded focus:outline-none focus:border-brand-aqua transition-smooth text-xs text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                    Valor será dividido igualmente entre as parcelas
                  </div>
                </div>
              ))}
              
              {/* Botão Adicionar Nova Parcela */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={adicionarParcela}
                  className="px-3 py-2 bg-brand-aqua/20 dark:bg-brand-aqua/30 text-brand-aqua rounded-lg font-medium hover:bg-brand-aqua/30 dark:hover:bg-brand-aqua/40 transition-smooth flex items-center gap-1.5 border border-brand-aqua/30 text-xs"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Adicionar Parcela
                </button>
              </div>
              
              {/* Resumo do Total */}
              {calcularValorTotal() > 0 && (
                <div className="bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg p-2.5 border border-brand-aqua/20 dark:border-brand-aqua/30">
                  <p className="text-xs font-medium text-brand-midnight dark:text-brand-clean text-center">
                    Total: <span className="text-brand-aqua font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(calcularValorTotal())}
                    </span>
                  </p>
                </div>
              )}
                </div>
              </>
            ) : (
              <>
                <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-2">
                  Dívida Única
                </label>
                <div className="bg-gray-50 dark:bg-brand-midnight/50 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight/70 dark:text-brand-clean/70 mb-1">
                      Data (Opcional)
                      {isRecorrente && (
                        <span className="ml-2 text-orange-500 dark:text-orange-400 text-[10px]">
                          (Desabilitado - recorrência define a data)
                        </span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      value={dividaUnica.data}
                      onChange={(e) => setDividaUnica({ ...dividaUnica, data: e.target.value })}
                      disabled={isRecorrente}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-royal border border-gray-300 dark:border-white/10 rounded focus:outline-none focus:border-brand-aqua transition-smooth text-sm text-brand-midnight dark:text-brand-clean disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!isRecorrente && (
                      <p className="text-xs text-brand-midnight/50 dark:text-brand-clean/60 mt-1">
                        Se não informar, será usada a data atual
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categorias.map((cat) => {
                const Icon = cat.icon
                const isSelected = formData.categoria === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, categoria: isSelected ? '' : cat.id })}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg font-medium transition-smooth text-xs overflow-hidden ${
                      isSelected
                        ? 'bg-brand-aqua text-brand-midnight shadow-md'
                        : 'bg-gray-100 dark:bg-brand-midnight/50 text-brand-midnight dark:text-brand-clean border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                    title={cat.nome}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span className="text-[10px] leading-tight text-center break-words max-w-full px-1">{cat.nome}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-2">
              Método de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, metodo_pagamento: 'pix' })}
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg font-medium transition-smooth text-xs ${
                  formData.metodo_pagamento === 'pix'
                    ? 'bg-brand-aqua text-brand-midnight shadow-md'
                    : 'bg-gray-100 dark:bg-brand-midnight/50 text-brand-midnight dark:text-brand-clean border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
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
                    ? 'bg-brand-aqua text-brand-midnight shadow-md'
                    : 'bg-gray-100 dark:bg-brand-midnight/50 text-brand-midnight dark:text-brand-clean border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
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
                    ? 'bg-brand-aqua text-brand-midnight shadow-md'
                    : 'bg-gray-100 dark:bg-brand-midnight/50 text-brand-midnight dark:text-brand-clean border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <Wallet size={18} strokeWidth={2} />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>

          {/* Seção de Recorrência */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-4">
            <CheckboxModerno
              id="isRecorrente"
              checked={isRecorrente}
              onChange={setIsRecorrente}
              label="Esta dívida é recorrente?"
              size="md"
            />

            {isRecorrente && (
              <div className="space-y-3 bg-gray-50 dark:bg-brand-midnight/50 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                <div>
                  <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                    Repete de quanto em quanto tempo? *
                  </label>
                  <select
                    value={recorrenciaTipo}
                    onChange={(e) => setRecorrenciaTipo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm"
                  >
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal (a cada 15 dias)</option>
                    <option value="mensal">Mensal</option>
                    <option value="bimestral">Bimestral (a cada 2 meses)</option>
                    <option value="trimestral">Trimestral (a cada 3 meses)</option>
                    <option value="semestral">Semestral (a cada 6 meses)</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                {recorrenciaTipo === 'semanal' && (
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Dia da semana *
                    </label>
                    <select
                      value={recorrenciaDiaSemana}
                      onChange={(e) => setRecorrenciaDiaSemana(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-brand-midnight border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean text-sm"
                    >
                      <option value="0">Domingo</option>
                      <option value="1">Segunda-feira</option>
                      <option value="2">Terça-feira</option>
                      <option value="3">Quarta-feira</option>
                      <option value="4">Quinta-feira</option>
                      <option value="5">Sexta-feira</option>
                      <option value="6">Sábado</option>
                    </select>
                  </div>
                )}

                {(recorrenciaTipo === 'mensal' || recorrenciaTipo === 'bimestral' || recorrenciaTipo === 'trimestral' || recorrenciaTipo === 'semestral' || recorrenciaTipo === 'anual') && (
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight dark:text-brand-clean mb-1.5">
                      Dia do mês (1-31) *
                    </label>
                    <InputDiaMes
                      value={recorrenciaDia}
                      onChange={setRecorrenciaDia}
                      min={1}
                      max={31}
                    />
                    <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1">
                      A dívida será criada automaticamente neste dia do mês
                    </p>
                  </div>
                )}

                {recorrenciaTipo === 'diaria' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      A dívida será criada automaticamente todos os dias
                    </p>
                  </div>
                )}

                {recorrenciaTipo === 'quinzenal' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      A dívida será criada automaticamente a cada 15 dias, a partir da data inicial
                    </p>
                  </div>
                )}
              </div>
            )}
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
                {loading ? 'Registrando...' : 'REGISTRAR DÍVIDA'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ModalSelecionarUsuario
        isOpen={showModalUsuario}
        onClose={() => setShowModalUsuario(false)}
        onSelect={(user) => {
          setUsuarioSelecionado(user)
          setFormData({ ...formData, user_id: user.id })
        }}
        selectedUserId={formData.user_id}
      />
      
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false)
            onClose()
          }}
          feature="Criar Dívidas"
          planoNecessario="basico"
          planoAtual={planoAtual}
        />
      )}
    </div>
  )
}

