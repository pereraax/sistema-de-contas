'use client'

import { useState, useMemo, useEffect } from 'react'
import { Registro, User } from '@/lib/types'
import { Edit, Trash2, Plus, Search, Repeat, Download, FileText, AlertCircle, TrendingUp, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { excluirRegistro, obterDividas } from '@/lib/actions'
import ModalConfirmacao from './ModalConfirmacao'
import ModalEditarRegistro from './ModalEditarRegistro'
import ModalPagarDivida from './ModalPagarDivida'
import ModalDivida from './ModalDivida'
import { useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'

interface DividasListaProps {
  dividas: Registro[]
  onDividasChange?: (dividas: Registro[]) => void
}

export default function DividasLista({ dividas: dividasIniciais, onDividasChange }: DividasListaProps) {
  const router = useRouter()
  const [dividas, setDividas] = useState<Registro[]>(dividasIniciais)
  const [registroEditando, setRegistroEditando] = useState<Registro | null>(null)
  const [dividaPagando, setDividaPagando] = useState<Registro | null>(null)
  const [showModalExcluir, setShowModalExcluir] = useState(false)
  const [dividaParaExcluir, setDividaParaExcluir] = useState<string | null>(null)
  const [showModalNovaDivida, setShowModalNovaDivida] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  // REMOVIDO: dividaTesteCriada - não criar dívidas automaticamente
  // const [dividaTesteCriada, setDividaTesteCriada] = useState(false)
  
  // Atualizar estado quando dividasIniciais mudarem
  useEffect(() => {
    setDividas(dividasIniciais)
  }, [dividasIniciais])

  // DESABILITADO: Criação automática de dívidas de teste
  // O sistema não deve criar dívidas automaticamente, pois isso causa problemas
  // quando o usuário exclui dívidas e elas são recriadas
  // useEffect(() => {
  //   async function criarDividaTesteSeNecessario() {
  //     // Verificar se já foi criada nesta sessão
  //     if (dividaTesteCriada) return
  //     
  //     // Verificar se já existe uma dívida de teste
  //     const temDividaTeste = dividas.some(d => d.nome === 'Dívida de Teste - Tutorial')
  //     if (temDividaTeste) {
  //       setDividaTesteCriada(true)
  //       return
  //     }

  //     // Verificar se não há dívidas (primeira vez) e se o usuário tem plano pago
  //     if (dividas.length === 0) {
  //       try {
  //         // Verificar se usuário tem plano pago antes de criar
  //         const { createClient } = await import('@/lib/supabase/client')
  //         const supabase = createClient()
  //         const { data: { user } } = await supabase.auth.getUser()
          
  //         if (user) {
  //           const { data: profile } = await supabase
  //             .from('profiles')
  //             .select('plano, plano_status, plano_data_fim')
  //             .eq('id', user.id)
  //             .single()

  //           const temPlanoPago = profile && (profile.plano === 'basico' || profile.plano === 'premium')
  //           const estaAtivo = profile && profile.plano_status === 'ativo'
  //           const naoExpirado = profile?.plano_data_fim 
  //             ? new Date(profile.plano_data_fim) > new Date()
  //             : false

  //           // Só criar se tiver plano pago, ativo e não expirado
  //           if (temPlanoPago && estaAtivo && naoExpirado) {
  //             const response = await fetch('/api/dividas/criar-teste', {
  //               method: 'POST',
  //               headers: { 'Content-Type': 'application/json' },
  //             })
              
  //             const data = await response.json()
              
  //             if (response.ok && data.data && !data.alreadyExists) {
  //               setDividaTesteCriada(true)
  //               // Recarregar a página para mostrar a dívida
  //               setTimeout(() => {
  //                 router.refresh()
  //               }, 500)
  //             }
  //           }
  //         }
  //       } catch (error) {
  //         console.error('Erro ao criar dívida de teste:', error)
  //       }
  //     }
  //   }

  //   criarDividaTesteSeNecessario()
  // }, [dividas.length, dividaTesteCriada, router])

  // Processar recorrências em background (não bloquear renderização)
  useEffect(() => {
    async function processarRecorrencias() {
      try {
        const response = await fetch('/api/dividas/processar-recorrencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (data.success && data.novasDividasCriadas > 0) {
          router.refresh() // Recarregar apenas se novas dívidas foram criadas
        }
      } catch (error) {
        console.error('Erro ao processar recorrências:', error)
      }
    }
    processarRecorrencias()
  }, [router])

  // Extrair histórico de pagamentos e calcular valor pago REAL
  const calcularValorPago = (divida: Registro): number => {
    try {
      if (divida.observacao) {
        const linhas = divida.observacao.split('\n')
        const ultimaLinha = linhas[linhas.length - 1]?.trim()
        
        if (ultimaLinha && ultimaLinha.startsWith('[') && ultimaLinha.endsWith(']')) {
          const historico = JSON.parse(ultimaLinha)
          if (Array.isArray(historico) && historico.length > 0) {
            const valorPago = historico.reduce((total: number, p: any) => {
              const valor = typeof p.valor === 'number' ? p.valor : parseFloat(p.valor.toString())
              return total + (isNaN(valor) ? 0 : valor)
            }, 0)
            // Se encontrou histórico e tem valores, retornar
            if (valorPago > 0) {
              return valorPago
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao calcular valor pago do histórico:', error)
    }
    
    // Fallback: se não houver histórico, calcular baseado em parcelas (para dívidas antigas)
    const valorTotal = divida.valor
    const valorParcela = divida.parcelas_totais > 0 ? valorTotal / divida.parcelas_totais : valorTotal
    return valorParcela * divida.parcelas_pagas
  }

  // Calcular se a dívida está quitada baseado no valor pago REAL (100% do valor total)
  const calcularProgresso = (divida: Registro) => {
    const valorTotal = divida.valor
    const valorPago = calcularValorPago(divida)
    return valorTotal > 0 ? (valorPago / valorTotal) * 100 : 0
  }

  const estaQuitada = (divida: Registro): boolean => {
    const valorTotal = divida.valor
    const valorPago = calcularValorPago(divida)
    
    // CRÍTICO: Só está quitada se o valor pago for >= valor total (com tolerância para erros de ponto flutuante)
    return valorPago >= valorTotal - 0.01
  }

  // Função para limpar observação removendo JSON do histórico
  const limparObservacao = (observacao: string | undefined): string => {
    if (!observacao) return ''
    
    // Remover JSON do histórico (última linha que começa com [)
    const linhas = observacao.split('\n')
    const linhasLimpas = linhas.filter(linha => {
      const linhaTrim = linha.trim()
      return !(linhaTrim.startsWith('[') && linhaTrim.endsWith(']'))
    })
    
    const observacaoLimpa = linhasLimpas.join('\n').trim()
    
    // Limitar tamanho para exibição
    if (observacaoLimpa.length > 80) {
      return observacaoLimpa.substring(0, 80) + '...'
    }
    
    return observacaoLimpa
  }

  // Filtrar dívidas por termo de busca
  const dividasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) {
      return dividas
    }
    
    const termo = searchTerm.toLowerCase().trim()
    return dividas.filter((d) => {
      const nome = d.nome?.toLowerCase() || ''
      const observacao = limparObservacao(d.observacao)?.toLowerCase() || ''
      const valor = d.valor?.toString() || ''
      const usuarioNome = d.user?.nome?.toLowerCase() || ''
      
      return (
        nome.includes(termo) ||
        observacao.includes(termo) ||
        valor.includes(termo) ||
        usuarioNome.includes(termo)
      )
    })
  }, [dividas, searchTerm])

  const dividasPendentes = dividasFiltradas.filter((d) => !estaQuitada(d))
  
  const dividasQuitadas = dividasFiltradas.filter((d) => estaQuitada(d))

  // Calcular totais baseado apenas nas dívidas PENDENTES filtradas
  let totalDividas = 0
  let totalPendente = 0

  // Calcular totais percorrendo apenas as dívidas PENDENTES filtradas
  dividasPendentes.forEach((divida) => {
    const valorTotal = parseFloat(divida.valor.toString())
    const valorPago = calcularValorPago(divida)
    const valorPendenteDivida = Math.max(0, valorTotal - valorPago)
    
    // Total de dívidas: soma apenas das dívidas PENDENTES (valor total original)
    totalDividas += valorTotal
    
    // Total pendente: valor que ainda falta pagar das dívidas pendentes
    totalPendente += valorPendenteDivida
  })
  
  // Garantir que os totais sejam válidos
  totalDividas = Math.max(0, totalDividas)
  totalPendente = Math.max(0, Math.min(totalPendente, totalDividas))


  const handleExcluir = async (id: string) => {
    setDividaParaExcluir(id)
    setShowModalExcluir(true)
  }

  const exportarDividas = () => {
    // Preparar dados para exportação
    const dadosCSV = dividasFiltradas.map((divida) => {
      const valorTotal = parseFloat(divida.valor.toString())
      const valorPago = calcularValorPago(divida)
      const valorPendente = Math.max(0, valorTotal - valorPago)
      const percentualPago = valorTotal > 0 ? ((valorPago / valorTotal) * 100).toFixed(2) : '0.00'
      const status = estaQuitada(divida) ? 'Quitada' : 'Pendente'
      
      return {
        Nome: divida.nome || '',
        Valor_Total: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal),
        Valor_Pago: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPago),
        Valor_Pendente: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPendente),
        Percentual_Pago: `${percentualPago}%`,
        Parcelas: `${divida.parcelas_pagas || 0}/${divida.parcelas_totais || 1}`,
        Status: status,
        Data_Registro: format(new Date(divida.data_registro), 'dd/MM/yyyy', { locale: ptBR }),
        Usuario: divida.user?.nome || 'Não informado',
        Observacao: divida.observacao || '',
        Categoria: divida.categoria || '',
        Metodo_Pagamento: divida.etiquetas?.find((e: string) => ['pix', 'cartao', 'dinheiro'].includes(e)) || 'Não informado',
      }
    })

    // Criar cabeçalho CSV
    const cabecalho = Object.keys(dadosCSV[0] || {}).join(';')
    
    // Criar linhas CSV
    const linhas = dadosCSV.map((linha) => {
      return Object.values(linha).map((valor) => {
        // Escapar valores que contêm ponto e vírgula ou aspas
        const valorStr = String(valor || '')
        if (valorStr.includes(';') || valorStr.includes('"') || valorStr.includes('\n')) {
          return `"${valorStr.replace(/"/g, '""')}"`
        }
        return valorStr
      }).join(';')
    })

    // Combinar cabeçalho e linhas
    const csvContent = [cabecalho, ...linhas].join('\n')

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF'
    const csvComBOM = BOM + csvContent

    // Criar blob e fazer download
    const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `dividas_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: ptBR })}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpar URL
    URL.revokeObjectURL(url)
  }

  const confirmarExcluir = async () => {
    if (!dividaParaExcluir) return
    
    const dividaId = dividaParaExcluir
    setShowModalExcluir(false)
    
    // Executar exclusão no servidor
    try {
      console.log('🗑️ [DividasLista] Excluindo dívida:', dividaId)
      const result = await excluirRegistro(dividaId)
      
      if (result.error) {
        console.error('❌ [DividasLista] Erro ao excluir dívida:', result.error)
        createNotification('Erro ao excluir dívida: ' + result.error, 'warning')
        setDividaParaExcluir(null)
        return
      }
      
      console.log('✅ [DividasLista] Dívida excluída com sucesso no servidor')
      
      // Remover do estado local imediatamente
      const novasDividas = dividas.filter(d => d.id !== dividaId)
      setDividas(novasDividas)
      
      // Atualizar o estado no componente pai se houver callback
      if (onDividasChange) {
        onDividasChange(novasDividas)
      }
      
      createNotification('Dívida excluída com sucesso!', 'success')
      setDividaParaExcluir(null)
      
      // Recarregar dados do servidor para garantir sincronização
      // Usar timestamp para evitar cache
      setTimeout(async () => {
        try {
          console.log('🔄 [DividasLista] Recarregando dívidas do servidor...')
          const result = await obterDividas()
          console.log('📊 [DividasLista] Dívidas recebidas:', result?.data?.length || 0)
          
          if (result?.data) {
            // Filtrar novamente para garantir que a dívida excluída não apareça
            const dividasAtualizadas = result.data.filter(d => d.id !== dividaId)
            console.log('✅ [DividasLista] Dívidas atualizadas:', dividasAtualizadas.length)
            
            setDividas(dividasAtualizadas)
            if (onDividasChange) {
              onDividasChange(dividasAtualizadas)
            }
          }
        } catch (error) {
          console.error('❌ [DividasLista] Erro ao recarregar dívidas:', error)
          // Se falhar ao recarregar, forçar reload da página
          window.location.reload()
        }
      }, 800)
      
    } catch (error: any) {
      console.error('❌ [DividasLista] Erro ao excluir dívida:', error)
      createNotification('Erro ao excluir dívida. Tente novamente.', 'warning')
      setDividaParaExcluir(null)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Header com botão de registrar e filtro */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-midnight/50 dark:text-brand-clean/50" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar dívidas por nome, valor, usuário..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-brand-royal border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-aqua transition-smooth text-brand-midnight dark:text-brand-clean placeholder-gray-400 dark:placeholder-brand-clean/50 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {dividasFiltradas.length > 0 && (
            <button
              onClick={exportarDividas}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-smooth flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm whitespace-nowrap"
            >
              <Download size={20} strokeWidth={2.5} />
              Exportar Dívidas
            </button>
          )}
          <button
            onClick={() => setShowModalNovaDivida(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            Registrar Dívida
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70">
              Total de Dívidas Pendentes ({dividasPendentes.length})
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-display text-brand-midnight dark:text-brand-clean" style={{ fontWeight: 900 }}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalDividas)}
          </p>
          <p className="text-xs text-brand-midnight/50 dark:text-brand-clean/50 mt-1">
            {dividasQuitadas.length} dívida{dividasQuitadas.length !== 1 ? 's' : ''} quitada{dividasQuitadas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70">Total Pendente</p>
          </div>
          <p className="text-xl sm:text-2xl font-display text-orange-600 dark:text-orange-400" style={{ fontWeight: 900 }}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(totalPendente)}
          </p>
        </div>
        <div className="bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <p className="text-xs sm:text-sm text-brand-midnight/70 dark:text-brand-clean/70">Progresso Geral</p>
          </div>
          <div className="mt-2">
            <div className="w-full bg-brand-clean dark:bg-brand-midnight rounded-full h-3">
              <div
                className="bg-brand-aqua h-3 rounded-full transition-all"
                style={{
                  width: `${dividas.length > 0 && totalDividas > 0 ? Math.min(100, Math.max(0, ((totalDividas - totalPendente) / totalDividas) * 100)) : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-brand-midnight/70 dark:text-brand-clean/70 mt-2">
              {dividas.length > 0 && totalDividas > 0
                ? `${Math.round(((totalDividas - totalPendente) / totalDividas) * 100)}% quitado`
                : '0% quitado'}
            </p>
          </div>
        </div>
      </div>

      {/* Dívidas Pendentes */}
      {dividasPendentes.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
            Dívidas Pendentes ({dividasPendentes.length})
          </h2>
          <div className="bg-brand-white dark:bg-brand-royal rounded-2xl shadow-lg border border-brand-clean dark:border-white/10 overflow-hidden animate-fade-in">
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-4 p-4">
              {dividasPendentes.map((divida) => (
                <div key={divida.id} className="bg-brand-royal dark:bg-brand-midnight rounded-xl p-4 border border-brand-clean/20 dark:border-white/10 relative">
                  {/* Botão de excluir no canto superior direito */}
                  <button
                    onClick={() => handleExcluir(divida.id)}
                    className="absolute top-3 right-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-smooth z-10"
                    title="Excluir"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                  
                  <div className="space-y-3 pr-8">
                    {/* Nome e Recorrente */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-brand-midnight dark:text-brand-clean">
                          {divida.nome}
                        </h3>
                        {divida.is_recorrente && divida.ativo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            <Repeat size={12} />
                            Recorrente
                          </span>
                        )}
                      </div>
                      {limparObservacao(divida.observacao) && (
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1">
                          {limparObservacao(divida.observacao)}
                        </p>
                      )}
                      {divida.is_recorrente && divida.proxima_recorrencia && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Próxima: {format(new Date(divida.proxima_recorrencia), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    {/* Grid de informações */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Valor</p>
                        <p className="font-semibold text-brand-midnight dark:text-brand-clean">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(divida.valor)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Usuário</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">👤 {divida.user?.nome || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Categoria</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">{divida.categoria || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Data</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">
                          {format(new Date(divida.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* Parcelas */}
                    {divida.parcelas_totais > 1 && (
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Parcelas</p>
                        <p className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                          {divida.parcelas_pagas}/{divida.parcelas_totais} - Faltam {divida.parcelas_totais - divida.parcelas_pagas}
                        </p>
                      </div>
                    )}

                    {/* Etiquetas */}
                    {divida.etiquetas && divida.etiquetas.length > 0 && (
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-1.5">Etiquetas</p>
                        <div className="flex flex-wrap gap-1">
                          {divida.etiquetas.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua dark:text-brand-aqua text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2 pt-2 border-t border-brand-clean/20 dark:border-white/10">
                      <button
                        onClick={() => setDividaPagando(divida)}
                        className="flex-1 px-4 py-2 bg-brand-aqua dark:bg-brand-aqua text-white dark:text-brand-midnight rounded-lg hover:bg-brand-aqua/90 dark:hover:bg-brand-aqua/80 transition-smooth font-medium text-sm shadow-sm"
                      >
                        Pagar Dívida
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRegistroEditando(divida)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-smooth"
                          title="Editar"
                        >
                          <Edit size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-royal dark:bg-brand-midnight border-b border-brand-midnight dark:border-white/10">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Etiquetas
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Parcelas
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean dark:text-brand-clean uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-brand-white dark:bg-brand-royal divide-y divide-brand-clean dark:divide-white/10">
                  {dividasPendentes.map((divida) => (
                    <tr key={divida.id} className="hover:bg-brand-clean/50 dark:hover:bg-white/5 transition-smooth">
                      <td className="px-4 py-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-brand-midnight dark:text-brand-clean">
                            {divida.nome}
                            {divida.is_recorrente && divida.ativo && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                                title={`Dívida recorrente: ${divida.recorrencia_tipo || 'recorrente'}`}
                              >
                                <Repeat size={12} />
                                Recorrente
                              </span>
                            )}
                          </div>
                          {limparObservacao(divida.observacao) && (
                            <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1 line-clamp-1">
                              {limparObservacao(divida.observacao)}
                            </div>
                          )}
                          {divida.is_recorrente && divida.proxima_recorrencia && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              Próxima: {format(new Date(divida.proxima_recorrencia), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-brand-midnight dark:text-brand-clean">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(divida.valor)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                          👤 {divida.user?.nome || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                          {divida.categoria || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {divida.etiquetas && divida.etiquetas.length > 0 ? (
                            divida.etiquetas.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua dark:text-brand-aqua text-xs rounded-lg"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-brand-midnight/40 dark:text-brand-clean/40">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {divida.parcelas_totais > 1 ? (
                          <div>
                            <div className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                              {divida.parcelas_pagas}/{divida.parcelas_totais}
                            </div>
                            <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                              Faltam {divida.parcelas_totais - divida.parcelas_pagas}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-brand-midnight/40 dark:text-brand-clean/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                          <div>{format(new Date(divida.data_registro), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}</div>
                          <div className="text-xs text-brand-midnight/60 dark:text-brand-clean/60">
                            {format(new Date(divida.data_registro), "HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDividaPagando(divida)}
                              className="px-4 py-2 bg-brand-aqua dark:bg-brand-aqua text-white dark:text-brand-midnight rounded-lg hover:bg-brand-aqua/90 dark:hover:bg-brand-aqua/80 transition-smooth font-medium text-sm shadow-sm"
                            >
                              Pagar Dívida
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRegistroEditando(divida)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-smooth"
                                title="Editar"
                              >
                                <Edit size={18} strokeWidth={2} />
                              </button>
                              <button
                                onClick={() => handleExcluir(divida.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-smooth"
                                title="Excluir"
                              >
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dívidas Quitadas */}
      {dividasQuitadas.length > 0 && (
        <div>
          <h2 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean mb-4">
            Dívidas Quitadas ({dividasQuitadas.length})
          </h2>
          <div className="bg-brand-white dark:bg-brand-royal rounded-2xl shadow-lg border border-brand-clean dark:border-white/10 overflow-hidden animate-fade-in opacity-75">
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-4 p-4">
              {dividasQuitadas.map((divida) => (
                <div key={divida.id} className="bg-brand-royal dark:bg-brand-midnight rounded-xl p-4 border border-brand-clean/20 dark:border-white/10">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-brand-midnight dark:text-brand-clean">
                        {divida.nome}
                      </h3>
                      {limparObservacao(divida.observacao) && (
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mt-1">
                          {limparObservacao(divida.observacao)}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Valor</p>
                        <p className="font-semibold text-brand-midnight dark:text-brand-clean">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(divida.valor)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Usuário</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">👤 {divida.user?.nome || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Categoria</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">{divida.categoria || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-0.5">Data</p>
                        <p className="text-brand-midnight/80 dark:text-brand-clean/80">
                          {format(new Date(divida.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {divida.etiquetas && divida.etiquetas.length > 0 && (
                      <div>
                        <p className="text-xs text-brand-midnight/60 dark:text-brand-clean/60 mb-1.5">Etiquetas</p>
                        <div className="flex flex-wrap gap-1">
                          {divida.etiquetas.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-brand-aqua/10 dark:bg-brand-aqua/20 text-brand-aqua dark:text-brand-aqua text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-brand-clean/20 dark:border-white/10">
                      <button
                        onClick={() => setRegistroEditando(divida)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-smooth"
                        title="Editar"
                      >
                        <Edit size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-royal dark:bg-brand-midnight border-b border-brand-midnight dark:border-white/10">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Etiquetas
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Parcelas
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-display text-brand-clean uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-brand-white divide-y divide-brand-clean">
                  {dividasQuitadas.map((divida) => (
                    <tr key={divida.id} className="hover:bg-brand-clean/50 transition-smooth">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-brand-midnight">
                            {divida.nome}
                          </div>
                          {limparObservacao(divida.observacao) && (
                            <div className="text-xs text-brand-midnight/60 mt-1 line-clamp-1">
                              {limparObservacao(divida.observacao)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-brand-midnight">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(divida.valor)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-brand-midnight/80">
                          👤 {divida.user?.nome || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-brand-midnight/80">
                          {divida.categoria || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {divida.etiquetas && divida.etiquetas.length > 0 ? (
                            divida.etiquetas.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-brand-aqua/10 text-brand-aqua text-xs rounded-lg"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-brand-midnight/40">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-green-600 font-medium">
                            {calcularProgresso(divida).toFixed(1)}%
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Quitado
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-brand-midnight/80">
                          <div>{format(new Date(divida.data_registro), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}</div>
                          <div className="text-xs text-brand-midnight/60">
                            {format(new Date(divida.data_registro), "HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRegistroEditando(divida)}
                            className="p-2 text-brand-aqua hover:bg-brand-aqua/10 rounded-lg transition-smooth"
                            title="Editar"
                          >
                            <Edit size={18} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleExcluir(divida.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
                            title="Excluir"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {dividasFiltradas.length === 0 && (
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-12 text-center shadow-lg border border-brand-clean dark:border-white/10">
          <p className="text-brand-midnight/60 dark:text-brand-clean/60 text-lg">
            {searchTerm.trim() ? 'Nenhuma dívida encontrada com o termo pesquisado' : 'Nenhuma dívida encontrada'}
          </p>
          {!searchTerm.trim() && (
            <button
              onClick={() => setShowModalNovaDivida(true)}
              className="mt-4 px-5 py-2.5 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth inline-flex items-center gap-2"
            >
              <Plus size={20} strokeWidth={2.5} />
              Registrar Primeira Dívida
            </button>
          )}
        </div>
      )}

      {registroEditando && (
        <ModalEditarRegistro
          registro={registroEditando}
          onClose={() => setRegistroEditando(null)}
        />
      )}

      {dividaPagando && (
        <ModalPagarDivida
          divida={dividaPagando}
          onClose={() => setDividaPagando(null)}
        />
      )}

      {/* Modal de Confirmação para Excluir Dívida */}
      {showModalExcluir && (
        <ModalConfirmacao
          titulo="Excluir Dívida"
          mensagem="Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita."
          onConfirmar={confirmarExcluir}
          onCancelar={() => {
            setShowModalExcluir(false)
            setDividaParaExcluir(null)
          }}
          textoConfirmar="Excluir"
          tipo="danger"
        />
      )}

      {/* Modal de Nova Dívida */}
      {showModalNovaDivida && (
        <ModalDivida
          onClose={() => {
            setShowModalNovaDivida(false)
            router.refresh()
          }}
        />
      )}

    </div>
  )
}
