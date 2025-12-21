'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  DollarSign, 
  Gift,
  Loader2,
  PartyPopper,
  TrendingDown
} from 'lucide-react'
import type { MetaCofrinho, BauMeta } from '@/lib/types'
import { criarDepositoCofrinho, obterBausMetaCofrinho, coletarBauMeta, criarBausAutomaticos } from '@/lib/actions'
import { formatarValorEmTempoReal, converterValorFormatadoParaNumero } from '@/lib/formatCurrency'

// Importar confetti apenas no cliente - sempre dinamicamente para evitar erro de webpack

interface BauTesouroProps {
  meta: MetaCofrinho
}

type Bau = {
  id: number
  valor: number
  cor: string
  gradiente: string
}

// Distribuir valor total da meta aleatoriamente entre N baús
const distribuirValorEmBaus = (valorTotal: number, valorMaxPorBau: number, numBaus: number): number[] => {
  const valores: number[] = []
  let restante = valorTotal
  
  // Garantir que temos valores válidos
  if (numBaus <= 0 || valorTotal <= 0 || valorMaxPorBau <= 0) {
    return [valorTotal] // Retornar tudo em um baú se parâmetros inválidos
  }
  
  // Calcular valor mínimo por baú (garantir que todos tenham pelo menos algo)
  const minPorBau = Math.max(1, Math.floor((valorTotal / numBaus) * 0.1)) // 10% da média ou mínimo 1
  
  // Gerar valores aleatórios para os primeiros N-1 baús
  for (let i = 0; i < numBaus - 1; i++) {
    // Calcular máximo possível respeitando o que sobra
    const bausRestantes = numBaus - i - 1
    const maxPossivel = Math.min(
      valorMaxPorBau, // Não pode ultrapassar o máximo definido
      restante - (bausRestantes * minPorBau) // Garantir que sobre para os próximos
    )
    
    // Garantir que max >= min
    const min = Math.max(minPorBau, Math.min(5, restante * 0.01))
    const max = Math.max(min, maxPossivel)
    
    // Se não há espaço suficiente, usar o mínimo
    if (max < min || restante <= minPorBau * bausRestantes) {
      valores.push(minPorBau)
      restante -= minPorBau
      continue
    }
    
    // Gerar valor aleatório entre min e max
    const valor = Math.random() * (max - min) + min
    const valorArredondado = Math.max(minPorBau, Math.round(valor * 100) / 100) // Garantir mínimo
    
    valores.push(valorArredondado)
    restante -= valorArredondado
    
    // Garantir que restante não fique negativo
    if (restante < 0) {
      restante = 0
      break
    }
  }
  
  // O último baú recebe o valor restante (garantir que seja positivo)
  const ultimoValor = Math.max(minPorBau, Math.round(restante * 100) / 100)
  valores.push(ultimoValor)
  
  // Recalcular para garantir que a soma seja exata
  const somaAtual = valores.reduce((a, b) => a + b, 0)
  const diferenca = valorTotal - somaAtual
  
  // Ajustar o último valor para compensar diferenças de arredondamento
  if (Math.abs(diferenca) > 0.01) {
    valores[valores.length - 1] = Math.max(minPorBau, valores[valores.length - 1] + diferenca)
  }
  
  // Embaralhar os valores para não ter padrão
  for (let i = valores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [valores[i], valores[j]] = [valores[j], valores[i]]
  }
  
  // Garantir que todos os valores sejam positivos
  return valores.map(v => Math.max(0.01, v))
}

// Função para determinar cor baseada no valor
const obterCorPorValor = (valor: number, valorMedio: number) => {
  const cores = [
    { cor: 'from-gray-400 to-gray-600', gradiente: 'from-gray-300/20 to-gray-500/20' }, // Baixo
    { cor: 'from-blue-400 to-blue-600', gradiente: 'from-blue-300/20 to-blue-500/20' }, // Médio-baixo
    { cor: 'from-purple-400 to-purple-600', gradiente: 'from-purple-300/20 to-purple-500/20' }, // Médio
    { cor: 'from-amber-400 to-amber-600', gradiente: 'from-amber-300/20 to-amber-500/20' }, // Médio-alto
    { cor: 'from-yellow-400 to-yellow-600', gradiente: 'from-yellow-300/20 to-yellow-500/20' }, // Alto
  ]
  
  if (valor < valorMedio * 0.5) return cores[0]
  if (valor < valorMedio * 0.8) return cores[1]
  if (valor < valorMedio * 1.2) return cores[2]
  if (valor < valorMedio * 1.5) return cores[3]
  return cores[4]
}

// Gerar baús com valores aleatórios baseados na meta
const gerarBausComMeta = (meta: MetaCofrinho, valorMaxPorBau: number, numBaus: number): Bau[] => {
  const baus: Bau[] = []
  const valoresAleatorios = distribuirValorEmBaus(meta.meta_total, valorMaxPorBau, numBaus)
  const valorMedio = meta.meta_total / numBaus
  
  valoresAleatorios.forEach((valor, index) => {
    const cor = obterCorPorValor(valor, valorMedio)
    baus.push({
      id: index + 1,
      valor: valor,
      ...cor
    })
  })
  
  return baus
}

// Determinar quais baús devem brilhar (30% deles, de forma consistente baseado em seed)
const gerarBausBrilhantes = (numBaus: number = 50, seed: string = ''): Set<number> => {
  const bausBrilhantes = new Set<number>()
  
  // Criar um gerador pseudo-aleatório baseado no seed para garantir consistência
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Função para gerar número pseudo-aleatório baseado no seed
  let seedValue = Math.abs(hash)
  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }
  
  for (let i = 1; i <= numBaus; i++) {
    if (random() < 0.3) { // 30% de chance de brilhar
      bausBrilhantes.add(i)
    }
  }
  
  // Garantir que pelo menos alguns baús brilhem
  if (bausBrilhantes.size < 10) {
    let tentativas = 0
    while (bausBrilhantes.size < 15 && tentativas < 100) {
      const numero = Math.floor(random() * numBaus) + 1
      bausBrilhantes.add(numero)
      tentativas++
    }
  }
  
  return bausBrilhantes
}

// Componente do Baú com Imagem PNG
const IconeBau = ({ aberto, deveBrilhar, coletado }: { aberto: boolean; deveBrilhar: boolean; coletado: boolean }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Aura brilhante pulsante ao redor do baú - APENAS para alguns baús especiais */}
      {!aberto && deveBrilhar && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-yellow-400/30 rounded-lg blur-xl animate-glow" />
        </div>
      )}
      
      {/* Imagem PNG do baú */}
      <img 
        src="/bau-fechado.png"
        alt="Baú de tesouro"
        className={`w-full h-full object-contain drop-shadow-xl relative z-10 transition-all duration-500 ${
          aberto ? 'scale-110 brightness-150' : ''
        } ${deveBrilhar && !aberto && !coletado ? 'drop-shadow-2xl' : ''} ${
          coletado ? 'grayscale opacity-50' : ''
        }`}
      />
      
      {/* Partículas brilhantes ao redor - APENAS para baús especiais e não coletados */}
      {!aberto && deveBrilhar && !coletado && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="sparkle sparkle-1" />
          <div className="sparkle sparkle-2" />
          <div className="sparkle sparkle-3" />
          <div className="sparkle sparkle-4" />
        </div>
      )}

      {/* Brilho dourado explodindo quando aberto */}
      {aberto && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute w-16 h-16 -top-8 -left-8 bg-yellow-400 rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="absolute w-12 h-12 -top-6 -left-6 bg-white rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="absolute w-8 h-8 -top-4 -left-4 bg-yellow-300 rounded-full blur-lg opacity-80 animate-pulse" />
            {/* Gemas brilhantes */}
            <div className="absolute w-3 h-3 -top-10 left-2 bg-green-400 rounded-full blur-sm opacity-90 animate-pulse" />
            <div className="absolute w-3 h-3 -top-8 left-6 bg-blue-400 rounded-full blur-sm opacity-90 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute w-3 h-3 -top-12 left-4 bg-pink-400 rounded-full blur-sm opacity-90 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Seta para indicar direção
const SetaDirecao = ({ direcao, ativo }: { direcao: 'right' | 'left' | 'down'; ativo: boolean }) => {
  const rotacao = direcao === 'right' ? 'rotate-0' : direcao === 'left' ? 'rotate-180' : 'rotate-90'
  
  return (
    <div className={`${ativo ? 'text-orange-500 opacity-100 animate-pulse' : 'text-orange-400 opacity-70'} ${rotacao} transition-all drop-shadow-lg`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-7 sm:h-7 md:w-8 md:h-8">
        <path d="M13 7L18 12L13 17M6 12H18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// Função helper para disparar confete de forma segura
const dispararConfete = async (config: any) => {
  try {
    if (typeof window === 'undefined') {
      console.log('⚠️ Window não disponível, pulando confete')
      return
    }
    
    console.log('🎉 Disparando confete com config:', config)
    
    // Garantir que useWorker está sempre desabilitado para evitar erro CSP
    const configSemWorker = { ...config, useWorker: false }
    
    // Carregar confetti dinamicamente sempre para evitar erro de webpack
    try {
      const confettiModule = await import('canvas-confetti')
      const confettiFunc = confettiModule.default
      
      if (typeof confettiFunc === 'function') {
        confettiFunc(configSemWorker)
        console.log('✅ Confete disparado com sucesso!')
      } else {
        console.error('❌ Confetti não é uma função:', typeof confettiFunc)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar canvas-confetti:', error)
    }
  } catch (error) {
    console.error('❌ Erro ao carregar/disparar confetti:', error)
  }
}

export default function BauTesouro({ meta }: BauTesouroProps) {
  const router = useRouter()
  const [bauAberto, setBauAberto] = useState<number | null>(null)
  const [descontoAplicado, setDescontoAplicado] = useState<number>(0)
  const [valorOriginal, setValorOriginal] = useState<number>(0)
  const [valorDepositadoStr, setValorDepositadoStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [animandoAbertura, setAnimandoAbertura] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [bausColetados, setBausColetados] = useState<Set<number>>(new Set())
  const [proximoBauDisponivel, setProximoBauDisponivel] = useState(1)
  const [baus, setBaus] = useState<Bau[]>([])
  const [bausBrilhantes, setBausBrilhantes] = useState<Set<number>>(new Set())
  const [bausDoBanco, setBausDoBanco] = useState<BauMeta[]>([]) // Armazenar baús do banco com IDs
  const [mounted, setMounted] = useState(false)
  
  // Buscar baús do banco de dados (FIXOS)
  useEffect(() => {
    const carregarBaus = async () => {
      try {
        console.log('🔍 Buscando baús do banco para meta:', meta.id)
        const resultadoBusca = await obterBausMetaCofrinho(meta.id)
        let bausDoBanco = resultadoBusca.data
        const error = resultadoBusca.error
        
        if (error) {
          console.error('❌ Erro ao buscar baús:', error)
          // NÃO gerar baús aleatórios - mostrar erro e esperar que sejam criados no banco
          console.error('⚠️ Baús devem ser criados no banco de dados. Não é possível gerar valores aleatórios.')
          setBaus([])
          setBausBrilhantes(new Set())
          setBausDoBanco([])
          setMounted(true)
          return
        }
        
        if (!bausDoBanco || bausDoBanco.length === 0) {
          console.log('⚠️ Nenhum baú encontrado. Criando baús automaticamente...')
          
          // Criar baús automaticamente com valores determinísticos
          const valorMaxPorBau = meta.valor_max_por_bau || 150
          const numBaus = meta.num_baus_total || Math.ceil(meta.meta_total / valorMaxPorBau)
          
          const resultado = await criarBausAutomaticos(
            meta.id,
            meta.user_id,
            meta.meta_total,
            valorMaxPorBau,
            numBaus
          )

          if (resultado.error) {
            console.error('❌ Erro ao criar baús automaticamente:', resultado.error)
            setBaus([])
            setBausBrilhantes(new Set())
            setBausDoBanco([])
            setMounted(true)
            return
          }

          // Recarregar baús após criação
          const resultadoRecarregar = await obterBausMetaCofrinho(meta.id)
          
          if (resultadoRecarregar.error || !resultadoRecarregar.data || resultadoRecarregar.data.length === 0) {
            console.error('❌ Erro ao recarregar baús após criação')
            setBaus([])
            setBausBrilhantes(new Set())
            setBausDoBanco([])
            setMounted(true)
            return
          }

          // Usar os baús criados
          bausDoBanco = resultadoRecarregar.data
          console.log('✅ Baús criados automaticamente:', bausDoBanco.length)
        }
        
        console.log('✅ Baús carregados do banco:', bausDoBanco.length)
        
        // Converter baús do banco para o formato do componente
        const bausFormatados: Bau[] = bausDoBanco.map((bau: BauMeta) => {
          const valorMedio = meta.meta_total / bausDoBanco.length
          const cor = obterCorPorValor(bau.valor_original, valorMedio)
          return {
            id: bau.numero_bau,
            valor: bau.valor_original,
            ...cor
          }
        })
        
        // Identificar baús coletados - IMPORTANTE: sempre carregar do banco
        const coletados = new Set<number>()
        let proximoDisponivel = 1

        bausDoBanco.forEach((bau: BauMeta) => {
          if (bau.coletado) {
            coletados.add(bau.numero_bau)
          }
        })

        // Encontrar o primeiro baú NÃO coletado na ordem correta
        const bausOrdenados = [...bausDoBanco].sort((a, b) => a.numero_bau - b.numero_bau)
        const primeiroNaoColetado = bausOrdenados.find((bau: BauMeta) => !bau.coletado)
        if (primeiroNaoColetado) {
          proximoDisponivel = primeiroNaoColetado.numero_bau
        } else {
          // Se todos foram coletados, usar o último + 1 (ou o total se não houver mais)
          const ultimoNumero = bausOrdenados.length > 0 ? bausOrdenados[bausOrdenados.length - 1].numero_bau : 1
          proximoDisponivel = ultimoNumero + 1
        }
        
        setBaus(bausFormatados)
        setBausDoBanco(bausDoBanco) // Armazenar baús do banco com IDs
        setBausColetados(coletados)
        setProximoBauDisponivel(proximoDisponivel)
        
        // Gerar brilhos (30% dos baús) - usar meta.id como seed para garantir consistência
        const brilhosGerados = gerarBausBrilhantes(bausDoBanco.length, meta.id)
        setBausBrilhantes(brilhosGerados)
        setMounted(true)
        
        console.log('✅ Baús carregados:', {
          total: bausFormatados.length,
          coletados: coletados.size,
          proximo: proximoDisponivel
        })
      } catch (error) {
        console.error('❌ Erro ao carregar baús:', error)
        setMounted(true)
      }
    }
    
    carregarBaus()
  }, [meta])

  // Calcular desconto aleatório (5% a 20% do valor)
  const calcularDesconto = (valor: number): number => {
    const percentualDesconto = Math.random() * (20 - 5) + 5 // Entre 5% e 20%
    const desconto = (valor * percentualDesconto) / 100
    return Math.round(desconto * 100) / 100 // Arredondar para 2 casas decimais
  }

  const abrirBau = (bauId: number, valorBau: number) => {
    // Verificar se é o próximo baú disponível
    if (bauId !== proximoBauDisponivel) {
      alert('Você precisa abrir os baús na ordem! Próximo baú disponível: #' + proximoBauDisponivel)
      return
    }

    // Verificar se já foi coletado
    if (bausColetados.has(bauId)) {
      return
    }

    // Animação de abertura
    setAnimandoAbertura(true)
    setBauAberto(bauId)
    
    // Calcular desconto após animação
    setTimeout(() => {
      const desconto = calcularDesconto(valorBau)
      setDescontoAplicado(desconto)
      setValorOriginal(valorBau)
      const valorFinal = valorBau - desconto
      setValorDepositadoStr(valorFinal.toFixed(2).replace('.', ','))
      setAnimandoAbertura(false)
      setModalAberto(true)
      
      // Efeitos de confete - explosão de celebração
      dispararConfete({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00C2FF', '#FF69B4']
      })
      
      // Confete lateral esquerda
      setTimeout(() => {
        dispararConfete({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#00C2FF']
        })
      }, 200)
      
      // Confete lateral direita
      setTimeout(() => {
        dispararConfete({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#00C2FF']
        })
      }, 400)
    }, 800)
  }

  const recolherBau = async () => {
    if (!bauAberto) return
    
    setLoading(true)

    try {
      const valorDeposito = converterValorFormatadoParaNumero(valorDepositadoStr)
      
      console.log('🎁 Tentando recolher baú:', {
        meta_id: meta.id,
        valor_original: valorOriginal,
        desconto: descontoAplicado,
        bau_tipo: Math.round(valorOriginal),
        valor_depositado: valorDeposito
      })
      
      const resultado = await criarDepositoCofrinho(
        meta.id,
        valorOriginal,
        descontoAplicado
      )

      console.log('📦 Resultado do servidor:', resultado)

      if (resultado.error) {
        console.error('❌ Erro ao guardar baú:', resultado.error)
        
        // Mensagem de erro mais clara para o usuário
        const mensagemErro = resultado.error.includes('bau_tipo_check') || resultado.error.includes('constraint')
          ? `⚠️ CONFIGURAÇÃO NECESSÁRIA NO BANCO DE DADOS\n\n` +
            `O baú não pôde ser guardado porque o banco de dados precisa ser atualizado.\n\n` +
            `📋 SOLUÇÃO RÁPIDA (2 minutos):\n` +
            `1. Abra: https://supabase.com/dashboard\n` +
            `2. Clique em "SQL Editor" no menu lateral\n` +
            `3. Clique em "+ New query"\n` +
            `4. Cole: ALTER TABLE depositos_cofrinho DROP CONSTRAINT IF EXISTS depositos_cofrinho_bau_tipo_check;\n` +
            `5. Clique em "RUN"\n` +
            `6. Volte aqui e tente novamente!\n\n` +
            `📖 Veja o guia completo em: PASSO-A-PASSO-SUPABASE.md`
          : `Erro ao guardar baú: ${resultado.error}\n\nSe o problema persistir, verifique o arquivo PASSO-A-PASSO-SUPABASE.md`
        
        alert(mensagemErro)
        setLoading(false)
        return
      }

      console.log('✅ Depósito criado com sucesso!')

      // Tentar encontrar o baú no banco pelo número
      const bauNoBanco = bausDoBanco.find(b => b.numero_bau === bauAberto)
      
      if (bauNoBanco && bauNoBanco.id) {
        // Se o baú existe no banco, marcar como coletado
        console.log('📝 Marcando baú como coletado no banco:', bauNoBanco.id)
        const resultadoColeta = await coletarBauMeta(
          bauNoBanco.id,
          valorDeposito,
        )

        if (resultadoColeta.error) {
          console.warn('⚠️ Erro ao marcar baú como coletado (mas depósito foi salvo):', resultadoColeta.error)
          // Não bloquear - o depósito já foi salvo
        } else {
          console.log('✅ Baú marcado como coletado no banco!')
        }
      } else {
        // Se não há baús no banco, apenas atualizar estado local
        console.warn('⚠️ Baú não encontrado no banco (usando apenas estado local):', bauAberto)
        console.warn('💡 Dica: Execute os scripts SQL para criar os baús no banco de dados')
      }

      // ATUALIZAR ESTADO IMEDIATAMENTE para o baú ficar cinza
      console.log('📝 Atualizando estado visual do baú...')
      
      // IMPORTANTE: Resetar estado de abertura PRIMEIRO
      setBauAberto(null) // Para o baú não ficar "aberto" visualmente
      
      // Marcar baú como coletado IMEDIATAMENTE
      const bauColetadoId = bauAberto // Salvar antes de resetar
      setBausColetados(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.add(bauColetadoId)
        console.log('✅ Baú marcado como coletado visualmente:', bauColetadoId)
        return newSet
      })
      
      // Encontrar próximo baú disponível - IMPORTANTE: atualizar estado do banco primeiro
      if (bausDoBanco.length > 0) {
        // Atualizar o estado local do baú coletado no array bausDoBanco
        const bausAtualizados = bausDoBanco.map(b => 
          b.numero_bau === bauColetadoId ? { ...b, coletado: true } : b
        )
        setBausDoBanco(bausAtualizados)
        
        // Se há baús no banco, usar eles - encontrar o primeiro NÃO coletado na ordem
        const bausOrdenados = [...bausAtualizados].sort((a, b) => a.numero_bau - b.numero_bau)
        const proximoBau = bausOrdenados.find(b => !b.coletado)
        if (proximoBau) {
          setProximoBauDisponivel(proximoBau.numero_bau)
          console.log('📝 Próximo baú disponível:', proximoBau.numero_bau)
        } else {
          console.log('🎉 Todos os baús foram coletados!')
        }
      } else {
        // Se não há baús no banco, usar lógica local
        const proximoNumero = bauColetadoId + 1
        const totalBaus = baus.length
        if (proximoNumero <= totalBaus) {
          setProximoBauDisponivel(proximoNumero)
          console.log('📝 Próximo baú disponível (local):', proximoNumero)
        } else {
          console.log('🎉 Todos os baús foram coletados!')
        }
      }
      
      // Fechar modal e atualizar estados
      setModalAberto(false)
      setSucesso(true)
      setLoading(false)
      
      // Forçar re-render para garantir que o baú fique cinza
      console.log('🔄 Estado atualizado, baú deve estar cinza agora!')
      
      // 🎉 ANIMAÇÃO DE CONFETE CELEBRATÓRIA 🎉
      console.log('🎊 Iniciando animação de confete...')
      
      // Disparar confetes usando a função helper existente
      // Explosão central grande IMEDIATA
      dispararConfete({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#00C2FF', '#FFD700', '#FF69B4', '#FFA500', '#32CD32', '#FF1493'],
        zIndex: 9999
      })
      
      // Explosões laterais
      setTimeout(() => {
        // Esquerda
        dispararConfete({
          particleCount: 150,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#00C2FF'],
          zIndex: 9999
        })
        
        // Direita
        dispararConfete({
          particleCount: 150,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#00C2FF'],
          zIndex: 9999
        })
      }, 200)
      
      // Explosão do topo
      setTimeout(() => {
        dispararConfete({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.2, x: 0.5 },
          colors: ['#FFD700', '#FF69B4', '#32CD32', '#00C2FF'],
          zIndex: 9999
        })
      }, 400)
      
      // Explosão de baixo
      setTimeout(() => {
        dispararConfete({
          particleCount: 180,
          spread: 80,
          origin: { y: 0.8, x: 0.5 },
          colors: ['#FFD700', '#00C2FF', '#FF69B4', '#FFA500'],
          zIndex: 9999
        })
      }, 600)
      
      // Explosão final em cascata
      setTimeout(() => {
        dispararConfete({
          particleCount: 250,
          spread: 110,
          origin: { y: 0.5, x: 0.5 },
          colors: ['#FFD700', '#00C2FF', '#FF69B4', '#32CD32', '#FFA500'],
          zIndex: 9999
        })
      }, 800)
      
      console.log('🎉 Todas as animações de confete agendadas!')

      // Recarregar os baús do banco para garantir sincronização antes de atualizar a página
      console.log('🔄 Recarregando baús do banco para sincronização...')
      try {
        const { data: bausAtualizados, error: erroAtualizacao } = await obterBausMetaCofrinho(meta.id)
        if (!erroAtualizacao && bausAtualizados && bausAtualizados.length > 0) {
          // Atualizar estado com dados frescos do banco
          const coletadosAtualizados = new Set<number>()
          bausAtualizados.forEach((bau: BauMeta) => {
            if (bau.coletado) {
              coletadosAtualizados.add(bau.numero_bau)
            }
          })
          
          const bausOrdenados = [...bausAtualizados].sort((a, b) => a.numero_bau - b.numero_bau)
          const proximoDisponivelAtualizado = bausOrdenados.find((bau: BauMeta) => !bau.coletado)?.numero_bau || (bausOrdenados.length > 0 ? bausOrdenados[bausOrdenados.length - 1].numero_bau + 1 : 1)
          
          setBausColetados(coletadosAtualizados)
          setProximoBauDisponivel(proximoDisponivelAtualizado)
          setBausDoBanco(bausAtualizados)
          
          console.log('✅ Estado sincronizado com banco de dados')
        }
      } catch (error) {
        console.warn('⚠️ Erro ao recarregar baús (continuando mesmo assim):', error)
      }
      
      // Aguardar 5 segundos para o usuário VER os confetes e o baú ficar cinza antes de recarregar
      console.log('⏱️ Aguardando 5 segundos para visualizar confetes e mudança antes do reload...')
      setTimeout(() => {
        console.log('🔄 Recarregando página para atualizar progresso!')
        router.refresh() // Usar router.refresh() em vez de window.location.reload() para melhor UX
      }, 5000) // Aumentado para 5 segundos para dar tempo dos confetes aparecerem
    } catch (error: any) {
      console.error('❌ Exceção ao recolher baú:', error)
      const mensagemErro = `⚠️ Erro inesperado ao recolher baú!\n\n` +
        `Detalhes: ${error.message || 'Erro desconhecido'}\n\n` +
        `📖 Consulte o guia: PASSO-A-PASSO-SUPABASE.md`
      alert(mensagemErro)
      setLoading(false)
    }
  }

  const abortarBau = () => {
    setModalAberto(false)
    setBauAberto(null)
    setDescontoAplicado(0)
    setValorDepositadoStr('')
  }


  // Aguardar montagem no cliente para evitar erros de hidratação
  if (!mounted || baus.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-aqua" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Título da seção */}
      <div className="text-center px-3 sm:px-4 mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl md:text-2xl font-display text-gray-900 dark:text-brand-white mb-1.5 sm:mb-2 flex items-center justify-center gap-2">
          <Gift className="text-yellow-400 sm:w-5 sm:h-5 md:w-6 md:h-6" size={20} />
          <span className="hidden sm:inline">Escolha seu Baú de Tesouro</span>
          <span className="sm:hidden">Baús de Tesouro</span>
        </h3>
        <p className="text-gray-600 dark:text-brand-clean text-xs sm:text-sm max-w-2xl mx-auto px-2 leading-relaxed">
          Clique em um baú para abrir e descobrir seu prêmio surpresa! 
          Cada baú oferece um desconto especial no seu depósito!
        </p>
      </div>

      {/* Grid de Baús - 3 colunas mobile fixas, organizadas com espaçamento profissional */}
      <div className="grid grid-cols-3 gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-16 sm:gap-y-20 lg:gap-y-24 max-w-4xl mx-auto pb-4 sm:pb-6 px-3 sm:px-4 md:px-0">
        {baus.map((bau, index) => {
          // Determinar direção da seta baseado na posição - trajeto em S (zig-zag)
          // Mobile: 3 colunas, Tablet: 4 colunas, Desktop: 5 colunas
          // Usar 3 colunas como base para mobile (mais comum)
          const colunasBase = 3
          
          // Calcular posição baseado no número de colunas
          const coluna = index % colunasBase
          const linha = Math.floor(index / colunasBase)
          const totalLinhas = Math.ceil(baus.length / colunasBase)
          const linhaEPar = linha % 2 === 0
          let direcaoSeta: 'right' | 'left' | 'down' | null = null
          
          // Trajeto em S: linhas pares (esquerda→direita), linhas ímpares (direita←esquerda)
          if (linhaEPar) {
            // Linha par: esquerda para direita
            if (coluna < (colunasBase - 1) && index < baus.length - 1) {
              // Não é a última coluna: seta para direita
              direcaoSeta = 'right'
            } else if (coluna === (colunasBase - 1) && linha < totalLinhas - 1) {
              // Última coluna mas não última linha: seta para baixo
              direcaoSeta = 'down'
            }
          } else {
            // Linha ímpar: direita para esquerda
            if (coluna > 0 && index < baus.length - 1) {
              // Não é a primeira coluna: seta para esquerda
              direcaoSeta = 'left'
            } else if (coluna === 0 && linha < totalLinhas - 1) {
              // Primeira coluna mas não última linha: seta para baixo
              direcaoSeta = 'down'
            }
          }

          const deveBrilhar = bausBrilhantes.has(bau.id)
          const foiColetado = bausColetados.has(bau.id)
          const eProximo = bau.id === proximoBauDisponivel
          const setaAtiva = bau.id === proximoBauDisponivel - 1 || bau.id === proximoBauDisponivel

          return (
            <div key={bau.id} className="relative flex items-center justify-center">
              <button
                onClick={() => abrirBau(bau.id, bau.valor)}
                disabled={loading || sucesso || foiColetado || bau.id !== proximoBauDisponivel}
                className={`
                  relative group
                  transition-all duration-300 
                  ${foiColetado ? 'opacity-50 cursor-not-allowed' : ''}
                  ${bau.id !== proximoBauDisponivel && !foiColetado ? 'opacity-40 cursor-not-allowed' : ''}
                  ${bauAberto === bau.id ? '' : 'hover:animate-shake'}
                  ${bauAberto === bau.id ? 'scale-110' : ''}
                  w-full
                `}
              >
                {/* Container sem fundo - apenas o baú - maior e mais visível */}
                <div className={`
                  relative
                  aspect-square
                  flex flex-col items-center justify-center
                  w-full max-w-[60px] sm:max-w-[70px] md:max-w-[80px] lg:max-w-[90px] mx-auto
                  ${animandoAbertura && bauAberto === bau.valor ? 'animate-bounce' : ''}
                `}>
                  {/* Ícone do baú de tesouro - maior */}
                  <div className={`
                    w-full h-auto
                    ${bauAberto === bau.id ? '' : 'group-hover:animate-shake-fast'}
                    ${bauAberto === bau.id ? 'animate-pulse' : ''}
                  `}>
                    <IconeBau aberto={bauAberto === bau.id} deveBrilhar={deveBrilhar} coletado={foiColetado} />
                  </div>
                  
                  {/* Valor e botão abaixo do baú - maior, legível e organizado */}
                  <div className="absolute -bottom-12 sm:-bottom-14 md:-bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full flex flex-col items-center gap-1.5 sm:gap-2">
                    <p className={`font-bold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white leading-tight whitespace-nowrap ${foiColetado ? 'opacity-50' : ''}`}>
                      R$ {bau.valor.toFixed(2).replace('.', ',')}
                    </p>
                    {foiColetado ? (
                      <div className="px-2 sm:px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300 rounded-full text-xs sm:text-sm font-semibold shadow-md whitespace-nowrap">
                        Coletado
                      </div>
                    ) : eProximo ? (
                      <div className="px-2 sm:px-3 py-1 bg-gradient-to-r from-[#00C2FF] to-[#0099CC] text-white rounded-full text-xs sm:text-sm font-semibold shadow-md whitespace-nowrap animate-pulse">
                        Abrir!
                      </div>
                    ) : (
                      <div className="px-2 sm:px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs sm:text-sm font-semibold shadow-md whitespace-nowrap">
                        Aguarde
                      </div>
                    )}
                  </div>
                  
                </div>
              </button>

              {/* Seta indicando direção - posicionada entre os baús, organizada e com espaço adequado */}
              {direcaoSeta && (
                <div className={`
                  absolute pointer-events-none z-10
                  ${direcaoSeta === 'right' ? 'right-[-16px] sm:right-[-18px] md:right-[-20px] top-1/2 -translate-y-1/2' : ''}
                  ${direcaoSeta === 'left' ? 'left-[-16px] sm:left-[-18px] md:left-[-20px] top-1/2 -translate-y-1/2' : ''}
                  ${direcaoSeta === 'down' ? 'bottom-[-68px] sm:bottom-[-90px] md:bottom-[-100px] left-1/2 -translate-x-1/2' : ''}
                `}>
                  <SetaDirecao direcao={direcaoSeta} ativo={setaAtiva} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Baú Aberto */}
      {modalAberto && bauAberto && (
        <>
          {/* Backdrop com blur leve - posicionamento fixo correto */}
          <div 
            className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={abortarBau}
            style={{ 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              position: 'fixed',
              margin: 0
            }}
          >
            {/* Modal vertical - baú acima */}
            <div 
              className="bg-transparent max-w-xl w-full animate-scale-up flex flex-col items-center gap-0 my-4 sm:my-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topo - Baú flutuando com confetes e brilho sutil */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-[-30px] z-20">
                {/* Brilho dourado sutil ao redor do baú */}
                <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 via-transparent to-transparent animate-pulse blur-2xl" />
                
                {/* Partículas ao redor do baú */}
                <div className="confetti-container absolute inset-0 overflow-visible pointer-events-none">
                  {/* Partícula 1 - Círculo dourado */}
                  <div className="particle particle-1" style={{ left: '5%', top: '15%' }}>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg"></div>
                  </div>
                  {/* Partícula 2 - Quadrado dourado */}
                  <div className="particle particle-2" style={{ left: '85%', top: '10%' }}>
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg"></div>
                  </div>
                  {/* Partícula 3 - Círculo pequeno */}
                  <div className="particle particle-3" style={{ left: '10%', top: '75%' }}>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"></div>
                  </div>
                  {/* Partícula 4 - Losango */}
                  <div className="particle particle-4" style={{ left: '90%', top: '70%' }}>
                    <div className="w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-lg transform rotate-45"></div>
                  </div>
                  {/* Partícula 5 - Estrela (usando clip-path) */}
                  <div className="particle particle-5" style={{ left: '50%', top: '5%' }}>
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-lg" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
                  </div>
                  {/* Partícula 6 - Hexágono */}
                  <div className="particle particle-6" style={{ left: '15%', top: '45%' }}>
                    <div className="w-3 h-3 bg-gradient-to-br from-amber-200 to-amber-400 shadow-lg" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }}></div>
                  </div>
                  {/* Partícula 7 - Círculo grande */}
                  <div className="particle particle-7" style={{ left: '80%', top: '50%' }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-lg"></div>
                  </div>
                  {/* Partícula 8 - Quadrado pequeno */}
                  <div className="particle particle-8" style={{ left: '50%', top: '85%' }}>
                    <div className="w-2 h-2 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"></div>
                  </div>
                </div>
                
                {/* Imagem do baú */}
                <img 
                  src="/bau-aberto.png" 
                  alt="Baú aberto"
                  className="w-full h-full object-contain animate-bounce drop-shadow-2xl relative z-10"
                />
              </div>

              {/* Conteúdo do popup - Clean e Compacto */}
              <div className="bg-white dark:bg-brand-royal rounded-2xl shadow-xl p-5 w-full z-10 max-w-sm relative border border-gray-200 dark:border-white/10">
                {/* Botão X minimalista */}
                <button
                  onClick={abortarBau}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-brand-clean hover:text-gray-700 dark:hover:text-brand-clean transition-colors z-20"
                  aria-label="Fechar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header Compacto */}
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-aqua rounded-xl mb-2">
                    <Gift size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-midnight dark:text-brand-clean mb-1">
                    Parabéns!
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-brand-clean/70">
                    Você ganhou um desconto
                  </p>
                </div>
                  
                {/* Cards Compactos */}
                <div className="space-y-2 mb-4">
                  {/* Valor Original */}
                  <div className="bg-gray-50 dark:bg-brand-midnight/50 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-brand-clean/70 mb-1">Valor original</p>
                    <p className="text-base font-bold text-gray-400 dark:text-brand-clean/60 line-through">
                      R$ {valorOriginal.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Desconto */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800/50">
                    <p className="text-xs text-gray-500 dark:text-brand-clean/70 mb-1">Desconto especial</p>
                    <p className="text-lg font-bold text-red-500 dark:text-red-400">
                      - R$ {descontoAplicado.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Valor Final */}
                  <div className="bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-xl p-3 border-2 border-brand-aqua">
                    <p className="text-xs text-gray-600 dark:text-brand-clean/80 mb-1">Você vai guardar</p>
                    <p className="text-xl font-bold text-brand-midnight dark:text-brand-clean">
                      R$ {valorDepositadoStr}
                    </p>
                  </div>
                </div>

                {/* Botões Compactos */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={recolherBau}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-brand-aqua hover:bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <PartyPopper size={16} />
                        <span>Recolher baú e guardar dinheiro</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={abortarBau}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-brand-clean rounded-xl font-medium disabled:opacity-50 text-sm transition-colors"
                  >
                    Abortar baú para depois
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* Animação de tremor suave (hover no botão) */
        @keyframes shake {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-2px) rotate(-1deg);
          }
          75% {
            transform: translateX(2px) rotate(1deg);
          }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }

        /* Animação de tremor rápido (hover no baú) */
        @keyframes shake-fast {
          0%, 100% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          10% {
            transform: translateX(-3px) translateY(-2px) rotate(-2deg);
          }
          20% {
            transform: translateX(3px) translateY(-1px) rotate(2deg);
          }
          30% {
            transform: translateX(-3px) translateY(1px) rotate(-2deg);
          }
          40% {
            transform: translateX(3px) translateY(-2px) rotate(2deg);
          }
          50% {
            transform: translateX(-2px) translateY(2px) rotate(-1deg);
          }
          60% {
            transform: translateX(2px) translateY(-1px) rotate(1deg);
          }
          70% {
            transform: translateX(-2px) translateY(1px) rotate(-1deg);
          }
          80% {
            transform: translateX(2px) translateY(-2px) rotate(1deg);
          }
          90% {
            transform: translateX(-1px) translateY(1px) rotate(-0.5deg);
          }
        }
        
        .animate-shake-fast {
          animation: shake-fast 0.4s ease-in-out infinite;
        }

        /* Animação de brilho pulsante */
        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        /* Partículas brilhantes ao redor do baú */
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #FFD700;
          border-radius: 50%;
          box-shadow: 0 0 10px #FFD700, 0 0 20px #FFA500;
          animation: sparkle-float 3s ease-in-out infinite;
        }

        .sparkle-1 {
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .sparkle-2 {
          top: 20%;
          right: 15%;
          animation-delay: 0.5s;
        }

        .sparkle-3 {
          bottom: 20%;
          left: 15%;
          animation-delay: 1s;
        }

        .sparkle-4 {
          bottom: 15%;
          right: 10%;
          animation-delay: 1.5s;
        }

        @keyframes sparkle-float {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1.5);
          }
        }

        /* Animações de partículas */
        .particle {
          position: absolute;
          animation: particle-float 3s ease-in-out infinite;
          opacity: 0;
        }

        .particle-1 { animation-delay: 0s; }
        .particle-2 { animation-delay: 0.3s; }
        .particle-3 { animation-delay: 0.6s; }
        .particle-4 { animation-delay: 0.9s; }
        .particle-5 { animation-delay: 1.2s; }
        .particle-6 { animation-delay: 1.5s; }
        .particle-7 { animation-delay: 1.8s; }
        .particle-8 { animation-delay: 2.1s; }

        @keyframes particle-float {
          0% {
            opacity: 0;
            transform: translateY(-10px) translateX(0) rotate(0deg) scale(0.3);
          }
          20% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
            transform: translateY(30px) translateX(5px) rotate(180deg) scale(1);
          }
          80% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateY(80px) translateX(-5px) rotate(360deg) scale(0.5);
          }
        }

        /* Gradiente radial para brilho */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}

