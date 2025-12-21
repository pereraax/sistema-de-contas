import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { obterPlanoUsuario, obterFeaturesUsuario } from '@/lib/plano'
import { criarRegistro } from '@/lib/actions'

interface ConversaState {
  etapa: 'inicio' | 'tipo' | 'valor' | 'categoria' | 'data' | 'usuario' | 'confirmacao' | 'completo'
  dados: {
    tipo?: 'entrada' | 'saida'
    valor?: number
    categoria?: string
    data?: string
    usuario?: string
    nome?: string
  }
}

// Função para processar resposta do usuário
function processarResposta(mensagem: string, estado: ConversaState, features: any): { proximaEtapa: ConversaState['etapa'], pergunta: string, dados?: any } {
  const msgLower = mensagem.toLowerCase().trim()

  switch (estado.etapa) {
    case 'inicio':
      // Verificar se o usuário quer criar um registro
      if (msgLower.includes('registrar') || msgLower.includes('criar') || msgLower.includes('adicionar')) {
        return {
          proximaEtapa: 'tipo',
          pergunta: 'Perfeito! Vamos criar um registro. É uma entrada ou uma saída?'
        }
      }
      return {
        proximaEtapa: 'inicio',
        pergunta: 'Olá! Como posso ajudar? Você pode me pedir para registrar um gasto ou uma entrada.'
      }

    case 'tipo':
      if (msgLower.includes('entrada') || msgLower.includes('receita') || msgLower.includes('recebido') || msgLower.includes('ganho')) {
        return {
          proximaEtapa: 'valor',
          pergunta: 'Ótimo! Qual é o valor dessa entrada?',
          dados: { tipo: 'entrada' }
        }
      }
      if (msgLower.includes('saida') || msgLower.includes('gasto') || msgLower.includes('despesa') || msgLower.includes('pago')) {
        return {
          proximaEtapa: 'valor',
          pergunta: 'Entendi! Qual é o valor desse gasto?',
          dados: { tipo: 'saida' }
        }
      }
      return {
        proximaEtapa: 'tipo',
        pergunta: 'Por favor, me diga se é uma entrada (dinheiro recebido) ou uma saída (gasto).'
      }

    case 'valor':
      // Extrair valor
      const valorPatterns = [
        /r\$\s*([\d.,]+)/i,
        /([\d.,]+)\s*reais?/i,
        /([\d.,]+)\s*r\$/i,
        /([\d.,]+)/i
      ]
      
      let valor: number | null = null
      for (const pattern of valorPatterns) {
        const match = mensagem.match(pattern)
        if (match) {
          const valorStr = match[1] || match[0]
          const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.')
          const valorNum = parseFloat(valorLimpo)
          if (!isNaN(valorNum) && valorNum > 0) {
            valor = valorNum
            break
          }
        }
      }

      if (valor) {
        // Verificar se pode criar salário (apenas básico/premium)
        if (estado.dados.tipo === 'entrada' && !features.podeRegistrarSalario) {
          return {
            proximaEtapa: 'tipo',
            pergunta: 'Desculpe, registrar entradas requer um plano básico ou premium. Você pode registrar apenas saídas no plano teste. Vamos registrar uma saída?'
          }
        }

        const categoriasDisponiveis = estado.dados.tipo === 'entrada' 
          ? 'salário, venda, presente, outros'
          : 'alimentação, transporte, moradia, compras, saúde, educação, trabalho, entretenimento, fitness, viagem, outros'
        
        return {
          proximaEtapa: 'categoria',
          pergunta: `Valor de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado! Qual é a categoria? Opções: ${categoriasDisponiveis}`,
          dados: { valor }
        }
      }
      return {
        proximaEtapa: 'valor',
        pergunta: 'Não entendi o valor. Por favor, diga o valor em reais, por exemplo: cinquenta reais ou R$ 50,00.'
      }

    case 'categoria':
      const categoriasEntrada = ['salário', 'salario', 'venda', 'presente', 'outros']
      const categoriasSaida = ['alimentação', 'alimentacao', 'transporte', 'moradia', 'compras', 'saúde', 'saude', 'educação', 'educacao', 'trabalho', 'entretenimento', 'fitness', 'viagem', 'outros']
      
      const categorias = estado.dados.tipo === 'entrada' ? categoriasEntrada : categoriasSaida
      let categoriaEncontrada = 'outros'
      
      for (const cat of categorias) {
        if (msgLower.includes(cat)) {
          categoriaEncontrada = cat === 'salario' ? 'salário' : cat === 'alimentacao' ? 'alimentação' : cat === 'saude' ? 'saúde' : cat === 'educacao' ? 'educação' : cat
          break
        }
      }

      return {
        proximaEtapa: 'data',
        pergunta: `Categoria "${categoriaEncontrada}" registrada! Qual é a data? Você pode dizer "hoje", "ontem" ou uma data específica.`,
        dados: { categoria: categoriaEncontrada }
      }

    case 'data':
      let dataRegistro = new Date()
      
      if (msgLower.includes('hoje') || msgLower.includes('agora')) {
        dataRegistro = new Date()
      } else if (msgLower.includes('ontem')) {
        dataRegistro = new Date()
        dataRegistro.setDate(dataRegistro.getDate() - 1)
      } else {
        // Tentar extrair data
        const dataMatch = mensagem.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
        if (dataMatch) {
          const dia = parseInt(dataMatch[1])
          const mes = parseInt(dataMatch[2]) - 1
          const ano = dataMatch[3] ? parseInt(dataMatch[3]) : new Date().getFullYear()
          dataRegistro = new Date(ano, mes, dia)
        }
      }

      return {
        proximaEtapa: 'confirmacao',
        pergunta: `Data registrada! Vou criar um ${estado.dados.tipo === 'entrada' ? 'registro de entrada' : 'registro de gasto'} de R$ ${estado.dados.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na categoria "${estado.dados.categoria}" para ${dataRegistro.toLocaleDateString('pt-BR')}. Posso confirmar?`,
        dados: { data: dataRegistro.toISOString() }
      }

    case 'confirmacao':
      if (msgLower.includes('sim') || msgLower.includes('confirmar') || msgLower.includes('pode') || msgLower.includes('ok')) {
        return {
          proximaEtapa: 'completo',
          pergunta: 'Perfeito! Registro criado com sucesso! Mais alguma coisa?'
        }
      }
      if (msgLower.includes('não') || msgLower.includes('nao') || msgLower.includes('cancelar')) {
        return {
          proximaEtapa: 'inicio',
          pergunta: 'Entendido, registro cancelado. Como posso ajudar?'
        }
      }
      return {
        proximaEtapa: 'confirmacao',
        pergunta: 'Por favor, confirme dizendo "sim" para criar o registro ou "não" para cancelar.'
      }

    default:
      return {
        proximaEtapa: 'inicio',
        pergunta: 'Como posso ajudar?'
      }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { mensagem, estadoAtual } = await request.json()

    if (!mensagem || typeof mensagem !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }

    // Obter plano e features
    const plano = await obterPlanoUsuario()
    const features = await obterFeaturesUsuario()

    // Processar resposta
    const estado: ConversaState = estadoAtual || { etapa: 'inicio', dados: {} }
    const resultado = processarResposta(mensagem, estado, features)

    // Atualizar estado
    const novoEstado: ConversaState = {
      etapa: resultado.proximaEtapa,
      dados: {
        ...estado.dados,
        ...resultado.dados
      }
    }

    // Se completou, criar registro
    let registroCriado = false
    if (resultado.proximaEtapa === 'completo' && novoEstado.dados.tipo && novoEstado.dados.valor) {
      const formData = new FormData()
      formData.append('nome', novoEstado.dados.nome || `Registro via PLEN - ${novoEstado.dados.categoria || 'outros'}`)
      formData.append('tipo', novoEstado.dados.tipo)
      formData.append('valor', novoEstado.dados.valor.toString())
      formData.append('categoria', novoEstado.dados.categoria || 'outros')
      formData.append('data_registro', novoEstado.dados.data || new Date().toISOString())
      formData.append('metodo_pagamento', 'dinheiro')
      formData.append('parcelas_totais', '1')
      formData.append('parcelas_pagas', '0')

      const resultadoRegistro = await criarRegistro(formData)
      
      if (resultadoRegistro.error) {
        return NextResponse.json({
          resposta: `Desculpe, ocorreu um erro ao criar o registro: ${resultadoRegistro.error}`,
          estado: novoEstado,
          erro: true
        })
      }

      registroCriado = true
    }

    return NextResponse.json({
      resposta: resultado.pergunta,
      estado: novoEstado,
      registroCriado
    })
  } catch (error: any) {
    console.error('Erro na conversa interativa:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}

