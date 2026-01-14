/**
 * API Route especial para WhatsApp
 * Aceita userId diretamente sem necessidade de autenticação via sessão
 * Usa a lógica completa do PLEN para processar mensagens e registrar pedidos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { criarRegistro } from '@/lib/actions'
import { obterPlanoUsuario, obterFeaturesUsuario, podeCriarRegistro } from '@/lib/plano'
import { format, startOfWeek, addDays, parse, setHours, setMinutes, setSeconds, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { addLog, interceptConsoleLogs } from '@/lib/server-logs'

// Interceptar console.log para capturar logs automaticamente
interceptConsoleLogs()

/**
 * Função para identificar se é familiar/pessoa
 * Retorna "pessoa" se for familiar/pessoa, ou null para usar categoria padrão
 */
async function identificarCategoriaComIA(nome: string): Promise<string | null> {
  // Lista completa de familiares conhecidos (fallback rápido e eficiente)
  const familiares = [
    'pai', 'mãe', 'mae', 'mamãe', 'mamae', 'papai', 'papai',
    'avô', 'avo', 'avó', 'avo', 'avôs', 'avos',
    'tio', 'tia', 'tios', 'tias',
    'primo', 'prima', 'primos', 'primas',
    'irmão', 'irmao', 'irmã', 'irma', 'irmãos', 'irmaos', 'irmãs', 'irmas',
    'filho', 'filha', 'filhos', 'filhas',
    'sobrinho', 'sobrinha', 'sobrinhos', 'sobrinhas',
    'cunhado', 'cunhada', 'cunhados', 'cunhadas',
    'sogro', 'sogra', 'sogros', 'sogras',
    'genro', 'nora', 'genros', 'noras',
    'esposa', 'esposo', 'marido', 'mulher',
    'namorado', 'namorada', 'namorados', 'namoradas',
    'neto', 'neta', 'netos', 'netas',
    'bisavô', 'bisavo', 'bisavó', 'bisavo',
  ]
  
  const nomeLower = nome.toLowerCase().trim()
  
  // Verificar se é familiar conhecido (busca exata ou parcial)
  const isFamiliar = familiares.some(f => {
    const fLower = f.toLowerCase()
    return nomeLower === fLower || nomeLower.includes(fLower) || fLower.includes(nomeLower)
  })
  
  if (isFamiliar) {
    console.log('👨‍👩‍👧‍👦 [PLEN WhatsApp] Familiar detectado:', nome, '→ categoria: pessoa')
    return 'pessoa'
  }
  
  // NOTA: Groq é usado APENAS para imagens e áudios, não para processamento de texto
  // Para identificar categoria de texto, usar lógica local ou outra IA se necessário
  
  return null
}

// Função auxiliar para obter ou criar usuário padrão na tabela users
async function obterOuCriarUsuarioPadrao(supabaseAdmin: any, authUserId: string): Promise<string | null> {
  try {
    // Buscar usuários existentes
    const { data: usuarios, error: buscaError } = await supabaseAdmin
      .from('users')
      .select('id, nome')
      .eq('account_owner_id', authUserId)
      .limit(1)
    
    if (buscaError) {
      console.error('❌ [PLEN WhatsApp] Erro ao buscar usuários:', buscaError)
      // Se a tabela não existe, retornar null
      if (buscaError.message?.includes('does not exist') || buscaError.code === '42P01') {
        console.warn('⚠️ [PLEN WhatsApp] Tabela users não existe')
        return null
      }
      return null
    }
    
    // Se encontrou usuário, retornar
    if (usuarios && usuarios.length > 0) {
      console.log('✅ [PLEN WhatsApp] Usuário encontrado:', usuarios[0].id)
      return usuarios[0].id
    }
    
    // Se não encontrou, criar usuário padrão automaticamente
    console.log('⚠️ [PLEN WhatsApp] Nenhum usuário encontrado. Criando usuário padrão...')
    
    // Buscar nome do perfil para usar como nome padrão
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome')
      .eq('id', authUserId)
      .single()
    
    const nomePadrao = profile?.nome || 'Usuário Principal'
    
    // Criar usuário padrão
    const { data: novoUsuario, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        account_owner_id: authUserId,
        nome: nomePadrao,
        email: null,
        telefone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    
    if (createError || !novoUsuario) {
      console.error('❌ [PLEN WhatsApp] Erro ao criar usuário padrão:', createError)
      console.error('❌ [PLEN WhatsApp] Detalhes do erro de criação:', {
        message: createError?.message,
        code: createError?.code,
        details: createError?.details,
        hint: createError?.hint,
      })
      // Mesmo com erro, tentar continuar (pode ser problema de RLS)
      // Mas retornar null para que o sistema informe ao usuário
      return null
    }
    
    console.log('✅ [PLEN WhatsApp] Usuário padrão criado automaticamente:', novoUsuario.id, 'Nome:', nomePadrao)
    return novoUsuario.id
  } catch (error: any) {
    console.error('❌ [PLEN WhatsApp] Erro ao obter/criar usuário:', error)
    return null
  }
}

// Função para processar múltiplos registros em uma única mensagem
async function processarMultiplosRegistros(
  linhas: string[],
  userId: string,
  supabaseAdmin: any,
  profile: any,
  registros: any[],
  features: any
): Promise<NextResponse> {
  console.log('📝 [PLEN WhatsApp] ==========================================')
  console.log('📝 [PLEN WhatsApp] 🔥🔥🔥 PROCESSANDO MÚLTIPLOS REGISTROS 🔥🔥🔥')
  console.log('📝 [PLEN WhatsApp] Total de linhas recebidas:', linhas.length)
  console.log('📝 [PLEN WhatsApp] Linhas:', JSON.stringify(linhas))
  console.log('📝 [PLEN WhatsApp] User ID:', userId?.substring(0, 8) + '...')
  console.log('📝 [PLEN WhatsApp] ==========================================')
  
  addLog('info', `🔥 [PLEN WhatsApp] INICIANDO processarMultiplosRegistros com ${linhas.length} linhas`)
  
  const resultados: Array<{ sucesso: boolean; mensagem: string; linha: string }> = []
  
  // Obter usuário padrão uma vez para todos os registros
  const user_id = await obterOuCriarUsuarioPadrao(supabaseAdmin, userId)
  if (!user_id) {
    return NextResponse.json({
      response: '❌ Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro.\n\n📱 Acesse: plenipay.com/configuracoes\n\nVá em "Usuários/Pessoas" e clique em "+ Novo Usuário".',
    })
  }
  
  // Processar cada linha como um registro separado
  console.log('📝 [PLEN WhatsApp] ==========================================')
  console.log('📝 [PLEN WhatsApp] INICIANDO PROCESSAMENTO DE MÚLTIPLOS REGISTROS')
  console.log('📝 [PLEN WhatsApp] Total de linhas recebidas:', linhas.length)
  console.log('📝 [PLEN WhatsApp] Linhas:', JSON.stringify(linhas))
  console.log('📝 [PLEN WhatsApp] ==========================================')
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    try {
      const linhaTrim = linha.trim()
      if (!linhaTrim || linhaTrim.length === 0) {
        console.log(`📝 [PLEN WhatsApp] Linha ${i + 1} vazia, ignorando`)
        continue
      }
      
      console.log('📝 [PLEN WhatsApp] ==========================================')
      console.log(`📝 [PLEN WhatsApp] Processando linha ${i + 1}/${linhas.length}:`, JSON.stringify(linhaTrim))
      
      // Processar comando da linha
      const comando = await processarComando(linhaTrim)
      
      console.log('📝 [PLEN WhatsApp] Comando detectado:', comando.tipo, comando.dados)
      
      // Verificar se é um registro válido
      if (comando.tipo !== 'registrar_gasto' && 
          comando.tipo !== 'registrar_entrada' && 
          comando.tipo !== 'registrar_divida') {
        console.log('📝 [PLEN WhatsApp] ⚠️ Linha não reconhecida como registro:', comando.tipo)
        resultados.push({
          sucesso: false,
          mensagem: `⚠️ "${linhaTrim}" não foi reconhecido como registro (tipo: ${comando.tipo})`,
          linha: linhaTrim
        })
        continue
      }
      
      console.log('📝 [PLEN WhatsApp] ✅ Linha reconhecida como registro válido!')
      
      // Verificar limite de registros mensais
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)
      
      const registrosMesAtual = registros.filter((r: any) => {
        let dataCriacao: Date
        if (r.created_at) {
          dataCriacao = new Date(r.created_at)
        } else if (r.data_registro) {
          dataCriacao = new Date(r.data_registro)
        } else {
          return false
        }
        return dataCriacao >= inicioMes && dataCriacao <= fimMes
      }).length
      
      const limite = features.limiteRegistrosMensais === null ? -1 : features.limiteRegistrosMensais
      const podeCriar = limite === -1 || registrosMesAtual < limite
      
      if (!podeCriar) {
        resultados.push({
          sucesso: false,
          mensagem: `❌ Limite de registros mensais atingido`,
          linha
        })
        continue
      }
      
      // Verificar se pode criar dívidas
      if (comando.tipo === 'registrar_divida' && !features.podeCriarDividas) {
        resultados.push({
          sucesso: false,
          mensagem: `❌ Plano não permite criar dívidas`,
          linha
        })
        continue
      }
      
      // Verificar limite de envios via WhatsApp
      // IMPORTANTE: Para múltiplos registros, verificar o limite uma vez no início
      // e depois apenas contar, não bloquear cada registro individualmente
      const { checkAndRegisterWhatsAppLimit } = await import('@/lib/whatsapp-limit-checker')
      const limitResult = await checkAndRegisterWhatsAppLimit(userId, comando.tipo)
      
      if (!limitResult.allowed) {
        resultados.push({
          sucesso: false,
          mensagem: `❌ Limite de envios via WhatsApp atingido (${limitResult.currentCount}/${limitResult.limit})`,
          linha
        })
        continue
      }
      
      // Criar registro
      const tipoRegistro = comando.dados.tipo === 'divida' ? 'saida' : comando.dados.tipo
      
      const { data: registro, error: registroError } = await supabaseAdmin
        .from('registros')
        .insert({
          user_id: user_id,
          nome: comando.dados.descricao,
          tipo: tipoRegistro,
          valor: comando.dados.valor,
          categoria: comando.dados.categoria || 'outros',
          data_registro: new Date().toISOString(),
          parcelas_totais: 1,
          parcelas_pagas: 0,
          etiquetas: comando.tipo === 'registrar_divida' ? ['dívida', 'dinheiro'] : ['dinheiro'],
        })
        .select()
        .single()
      
      if (registroError || !registro) {
        resultados.push({
          sucesso: false,
          mensagem: `❌ Erro: ${registroError?.message || 'Erro desconhecido'}`,
          linha
        })
        continue
      }
      
      // Sucesso - formatar igual à resposta individual
      const tipoNome = comando.tipo === 'registrar_entrada' ? 'entrada' : 
                      comando.tipo === 'registrar_divida' ? 'dívida' : 'gasto'
      
      // Extrair nome do item da descrição
      let nomeDoItem: string | null = null
      if (comando.dados.nomeExtraido) {
        nomeDoItem = comando.dados.nomeExtraido
      } else if (comando.dados.descricao) {
        const recebeuMatch = comando.dados.descricao.match(/Recebeu de (.+)/i)
        if (recebeuMatch && recebeuMatch[1]) {
          nomeDoItem = recebeuMatch[1].trim()
        } else {
          const gastoMatch = comando.dados.descricao.match(/Gasto em (.+)/i)
          if (gastoMatch && gastoMatch[1]) {
            nomeDoItem = gastoMatch[1].trim()
          } else if (comando.dados.descricao !== 'Entrada via WhatsApp' && 
                     comando.dados.descricao !== 'Gasto via WhatsApp' &&
                     comando.dados.descricao !== 'Dívida via WhatsApp') {
            nomeDoItem = comando.dados.descricao
          }
        }
      }
      
      const nomeFinal = nomeDoItem || comando.dados.categoria || 'Item'
      
      // Formatar data
      const dataRegistro = registro?.data_registro ? new Date(registro.data_registro) : new Date()
      const dataFormatada = format(dataRegistro, 'dd-MM-yyyy', { locale: ptBR })
      
      // Formatar valor
      const valorFormatado = comando.dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      
      // Emoji do valor
      const emojiValor = comando.tipo === 'registrar_entrada' ? '🟢' : '🔴'
      
      // Categoria com emoji
      const categoriaFinal = comando.dados.categoria || 'outros'
      const categoriaCapitalizada = categoriaFinal.charAt(0).toUpperCase() + categoriaFinal.slice(1).toLowerCase()
      const categoriaEmojis: { [key: string]: string } = {
        'moradia': '🏠',
        'casa': '🏠',
        'alimentação': '🍽️',
        'alimentacao': '🍽️',
        'transporte': '🚗',
        'saúde': '🏥',
        'saude': '🏥',
        'educação': '📚',
        'educacao': '📚',
        'lazer': '🎮',
        'compras': '🛍️',
        'vestuário': '👕',
        'vestuario': '👕',
        'pessoa': '👤',
        'extra': '⭐',
        'outros': '📦',
      }
      const emojiCategoria = categoriaEmojis[categoriaFinal.toLowerCase()] || '📦'
      
      // Formatar mensagem igual à resposta individual
      const mensagemFormatada = `📌 ${nomeFinal}\n${emojiValor} R$ ${valorFormatado}\n📅 ${dataFormatada}\n🗂️ Categoria: ${categoriaCapitalizada} ${emojiCategoria}\n\n✨ Seu ${tipoNome} foi registrado com sucesso!`
      
      resultados.push({
        sucesso: true,
        mensagem: mensagemFormatada,
        linha: linhaTrim,
        registro: registro
      })
      
      console.log(`✅ [PLEN WhatsApp] Linha ${i + 1}/${linhas.length} processada com SUCESSO!`)
      console.log(`✅ [PLEN WhatsApp] Total de sucessos até agora: ${resultados.filter(r => r.sucesso).length}`)
      
      // Atualizar contagem de registros para próxima iteração
      registros.push(registro)
      
    } catch (error: any) {
      console.error('❌ [PLEN WhatsApp] Erro ao processar linha:', linha, error)
      resultados.push({
        sucesso: false,
        mensagem: `❌ Erro: ${error.message || 'Erro desconhecido'}`,
        linha
      })
    }
  }
  
  // Montar resposta consolidada no mesmo formato visual
  const sucessos = resultados.filter(r => r.sucesso)
  const falhas = resultados.filter(r => !r.sucesso)
  
  console.log('📝 [PLEN WhatsApp] ==========================================')
  console.log('📝 [PLEN WhatsApp] RESULTADOS DO PROCESSAMENTO')
  console.log('📝 [PLEN WhatsApp] Total de linhas processadas:', resultados.length)
  console.log('📝 [PLEN WhatsApp] Sucessos:', sucessos.length)
  console.log('📝 [PLEN WhatsApp] Falhas:', falhas.length)
  console.log('📝 [PLEN WhatsApp] Detalhes dos sucessos:', sucessos.map(r => r.linha))
  console.log('📝 [PLEN WhatsApp] ==========================================')
  
  let resposta = ``
  
  // CRÍTICO: Mostrar TODOS os registros bem-sucedidos no mesmo formato visual
  if (sucessos.length > 0) {
    sucessos.forEach((r, i) => {
      resposta += r.mensagem
      // Adicionar separador entre registros (exceto no último se não houver falhas)
      if (i < sucessos.length - 1) {
        resposta += `\n\n${'─'.repeat(30)}\n\n`
      } else if (falhas.length > 0) {
        resposta += `\n\n${'─'.repeat(30)}\n\n`
      }
    })
  }
  
  // Se houver falhas, adicionar no final
  if (falhas.length > 0) {
    if (sucessos.length > 0) {
      resposta += `\n\n`
    }
    resposta += `❌ *${falhas.length} registro(s) com erro:*\n`
    falhas.forEach((r, i) => {
      resposta += `${i + 1}. ${r.mensagem}\n`
    })
  }
  
  // Se não houve sucessos nem falhas (não deveria acontecer, mas por segurança)
  if (sucessos.length === 0 && falhas.length === 0) {
    resposta = `⚠️ Nenhum registro foi processado. Verifique se as mensagens estão no formato correto:\n\n• "ganhei 20 extra"\n• "gastei 40 roupa"\n• "recebi 50 de João"`
  }
  
  console.log('📝 [PLEN WhatsApp] ==========================================')
  console.log('📝 [PLEN WhatsApp] RESPOSTA FINAL MONTADA')
  console.log('📝 [PLEN WhatsApp] Tamanho da resposta:', resposta.length, 'caracteres')
  console.log('📝 [PLEN WhatsApp] Primeiros 500 caracteres:', resposta.substring(0, 500))
  console.log('📝 [PLEN WhatsApp] ==========================================')
  
  return NextResponse.json({ response: resposta })
}

// Função para processar comandos em linguagem natural (versão simplificada para WhatsApp)
/**
 * Processar comando a partir de uma imagem usando Groq Vision (GRATUITO)
 */
async function processarComandoComImagemGroq(imageBase64: string) {
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ [PLEN WhatsApp] GROQ_API_KEY não configurada')
    return null
  }

  try {
    console.log('🔍 [PLEN WhatsApp] Tentando Groq Vision para analisar imagem...')
    
    const prompt = `Analise esta imagem de comprovante de pagamento PIX, boleto, ou comprovante de compra e extraia TODAS as informações disponíveis.

IMPORTANTE: Para comprovantes PIX, identifique:
- "Quem recebeu" / "Recebedor" = nome_beneficiario (para quem você PAGOU)
- "Quem pagou" / "Pagador" = nome_pagador (você ou quem pagou)
- "Valor" = valor da transação
- "Data" = data da transação

Para outros comprovantes, identifique:
- Valor pago/recebido
- Nome da pessoa/empresa
- Data
- Descrição do pagamento

Retorne APENAS um JSON válido com esta estrutura:
{
  "tipo": "pix" | "boleto" | "comprovante_compra" | "pagamento" | "recebimento" | "outro",
  "valor": número em reais (ex: 150.50),
  "data": "YYYY-MM-DD" ou null,
  "descricao": "descrição do pagamento",
  "nome_beneficiario": "nome de QUEM RECEBEU (se você pagou) ou quem você vai pagar",
  "nome_pagador": "nome de QUEM PAGOU (você ou outro pagador)",
  "observacoes": "outras informações relevantes"
}

Se for um PIX onde você PAGOU para alguém:
- tipo: "pix"
- nome_beneficiario: nome de quem recebeu
- valor: valor que você pagou

Se for um PIX onde você RECEBEU de alguém:
- tipo: "recebimento"  
- nome_pagador: nome de quem pagou para você
- valor: valor que você recebeu

Retorne APENAS o JSON válido, sem markdown, sem explicações, sem texto adicional.`

    // Tentar diferentes modelos Groq com visão (mais recentes primeiro)
    // NOTA: Modelos antigos foram descomissionados, usando modelos Llama 4 mais recentes
    // Os nomes completos dos modelos Llama 4 incluem o prefixo meta-llama/
    const groqVisionModels = [
      'meta-llama/llama-4-maverick-17b-128e-instruct',  // Modelo Llama 4 Maverick com visão
      'meta-llama/llama-4-scout-17b-16e-instruct',      // Modelo Llama 4 Scout com visão
      'llama-3.2-11b-vision-preview',                   // Tentar modelo antigo como último recurso
    ]

    for (const model of groqVisionModels) {
      try {
        console.log(`🔄 [PLEN WhatsApp] Tentando modelo Groq: ${model}`)
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.1,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [PLEN WhatsApp] Groq modelo ${model} falhou:`, response.status, errorText.substring(0, 200))
          continue // Tentar próximo modelo
        }

        const data = await response.json()
        const extractedText = data.choices?.[0]?.message?.content || ''
        
        if (!extractedText) {
          console.error(`❌ [PLEN WhatsApp] Groq modelo ${model} não retornou texto`)
          continue
        }
        
        console.log(`✅ [PLEN WhatsApp] Groq modelo ${model} respondeu:`, extractedText.substring(0, 200))
        
        // Tentar extrair JSON da resposta
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const jsonData = JSON.parse(jsonMatch[0])
            console.log('✅ [PLEN WhatsApp] JSON extraído da imagem (Groq):', jsonData)
            
            // Converter para formato de comando PLEN
            const tipo = jsonData.tipo === 'recebimento' ? 'registrar_entrada' : 
                         jsonData.tipo === 'pix' || jsonData.tipo === 'pagamento' ? 'registrar_gasto' : 
                         'registrar_gasto'
            
            const valor = parseFloat(jsonData.valor) || 0
            
            // Criar descrição
            let descricao = jsonData.descricao || ''
            if (jsonData.nome_beneficiario && tipo === 'registrar_gasto') {
              descricao = `Pago para ${jsonData.nome_beneficiario}`
            } else if (jsonData.nome_pagador && tipo === 'registrar_entrada') {
              descricao = `Recebido de ${jsonData.nome_pagador}`
            }
            
            // Para imagens de comprovantes, categoria sempre deve ser "comprovante"
            const categoria = 'comprovante'
            
            return {
              tipo,
              dados: {
                valor,
                descricao,
                tipo: tipo === 'registrar_entrada' ? 'entrada' : 'saida',
                categoria: categoria,
              },
            }
          } catch (parseError: any) {
            console.error('❌ [PLEN WhatsApp] Erro ao fazer parse do JSON (Groq):', parseError.message)
            continue
          }
        }
      } catch (error: any) {
        console.error(`❌ [PLEN WhatsApp] Erro ao chamar Groq modelo ${model}:`, error.message)
        continue
      }
    }
    
    console.error('❌ [PLEN WhatsApp] Todos os modelos Groq falharam')
    return null
  } catch (error: any) {
    console.error('❌ [PLEN WhatsApp] Erro geral ao processar imagem com Groq:', error.message)
    return null
  }
}

/**
 * Processar comando a partir de uma imagem usando OpenAI Vision ou Groq
 */
async function processarComandoComImagem(imageBase64: string) {
  // PRIORIDADE 1: Tentar Groq primeiro (GRATUITO)
  if (process.env.GROQ_API_KEY) {
    console.log('🔍 [PLEN WhatsApp] Tentando Groq Vision primeiro (gratuito)...')
    const resultadoGroq = await processarComandoComImagemGroq(imageBase64)
    if (resultadoGroq) {
      console.log('✅ [PLEN WhatsApp] Groq processou imagem com sucesso!')
      return resultadoGroq
    }
    console.log('⚠️ [PLEN WhatsApp] Groq falhou, tentando OpenAI...')
  }
  
  // PRIORIDADE 2: Tentar OpenAI como fallback (se tiver créditos)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🔍 [PLEN WhatsApp] Tentando OpenAI GPT-4o Vision para analisar imagem...')
    
    const prompt = `Analise esta imagem de comprovante de pagamento PIX, boleto, ou comprovante de compra e extraia TODAS as informações disponíveis.

IMPORTANTE: Para comprovantes PIX, identifique:
- "Quem recebeu" / "Recebedor" = nome_beneficiario (para quem você PAGOU)
- "Quem pagou" / "Pagador" = nome_pagador (você ou quem pagou)
- "Valor" = valor da transação
- "Data" = data da transação

Para outros comprovantes, identifique:
- Valor pago/recebido
- Nome da pessoa/empresa
- Data
- Descrição do pagamento

Retorne APENAS um JSON válido com esta estrutura:
{
  "tipo": "pix" | "boleto" | "comprovante_compra" | "pagamento" | "recebimento" | "outro",
  "valor": número em reais (ex: 150.50),
  "data": "YYYY-MM-DD" ou null,
  "descricao": "descrição do pagamento",
  "nome_beneficiario": "nome de QUEM RECEBEU (se você pagou) ou quem você vai pagar",
  "nome_pagador": "nome de QUEM PAGOU (você ou outro pagador)",
  "observacoes": "outras informações relevantes"
}

Se for um PIX onde você PAGOU para alguém:
- tipo: "pix"
- nome_beneficiario: nome de quem recebeu
- valor: valor que você pagou

Se for um PIX onde você RECEBEU de alguém:
- tipo: "recebimento"  
- nome_pagador: nome de quem pagou para você
- valor: valor que você recebeu

Retorne APENAS o JSON válido, sem markdown, sem explicações, sem texto adicional.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modelo com visão
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [PLEN WhatsApp] Erro ao chamar OpenAI Vision:', response.status, errorText.substring(0, 200))
      
      // Se erro 429 (quota excedida) ou outro erro
      if (response.status === 429) {
        console.error('❌ [PLEN WhatsApp] OpenAI sem quota (erro 429). Configure créditos ou outra IA.')
        return { tipo: 'geral', dados: null, error: 'OpenAI sem quota' }
      }
      
      return { tipo: 'geral', dados: null }
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content || ''
    
    if (!extractedText) {
      console.error('❌ [PLEN WhatsApp] OpenAI Vision não retornou texto')
      return { tipo: 'geral', dados: null }
    }
    
    console.log('📝 [PLEN WhatsApp] Resposta do OpenAI Vision:', extractedText.substring(0, 200))
    
    // Tentar extrair JSON da resposta
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0])
        console.log('✅ [PLEN WhatsApp] JSON extraído da imagem:', jsonData)
        
        // Converter para formato de comando PLEN
        const tipo = jsonData.tipo === 'recebimento' ? 'registrar_entrada' : 
                     jsonData.tipo === 'pix' || jsonData.tipo === 'pagamento' ? 'registrar_gasto' : 
                     'registrar_gasto'
        
        const valor = parseFloat(jsonData.valor) || 0
        
        // Criar descrição
        let descricao = jsonData.descricao || ''
        if (jsonData.nome_beneficiario && tipo === 'registrar_gasto') {
          descricao = `Pago para ${jsonData.nome_beneficiario}`
        } else if (jsonData.nome_pagador && tipo === 'registrar_entrada') {
          descricao = `Recebido de ${jsonData.nome_pagador}`
        }
        
        // Para imagens de comprovantes, categoria sempre deve ser "comprovante"
        const categoria = 'comprovante'
        
        return {
          tipo,
          dados: {
            valor,
            descricao,
            tipo: tipo === 'registrar_entrada' ? 'entrada' : 'saida',
            categoria: categoria,
          },
        }
      } catch (parseError: any) {
        console.error('❌ [PLEN WhatsApp] Erro ao fazer parse do JSON:', parseError.message)
        return { tipo: 'geral', dados: null }
      }
    }
    
    return { tipo: 'geral', dados: null }
  } catch (error: any) {
    console.error('❌ [PLEN WhatsApp] Erro ao processar imagem com OpenAI:', error.message)
    return { tipo: 'geral', dados: null, error: 'Erro ao processar imagem' }
  }
  } else {
    // Se nem Groq nem OpenAI estão configurados
    console.error('❌ [PLEN WhatsApp] Nenhuma IA configurada para processar imagens')
    console.error('❌ [PLEN WhatsApp] Configure GROQ_API_KEY (gratuito) ou OPENAI_API_KEY')
    return { 
      tipo: 'geral', 
      dados: null,
      error: 'Nenhuma IA configurada. Configure GROQ_API_KEY (gratuito) ou OPENAI_API_KEY.'
    }
  }
}


async function processarComando(mensagem: string) {
  const msgLower = mensagem.toLowerCase().trim()
  const msgOriginal = mensagem.trim() // Preservar mensagem original para extração de nomes
  
  // CRÍTICO: Verificar "verificar conta" PRIMEIRO, antes de qualquer outro processamento
  // Verificar se contém palavras-chave relacionadas a verificar conta
  const msgLowerTrim = msgLower.trim()
  const temVerificar = /verificar|ver/i.test(msgLowerTrim)
  const temConta = /conta|dados|informa[çc][õo]es/i.test(msgLowerTrim)
  const temMinhaConta = /minha\s+conta|meus\s+dados/i.test(msgLowerTrim)
  
  // Se tem "verificar conta" ou variações
  if ((temVerificar && temConta) || temMinhaConta || msgLowerTrim === 'verificar conta' || msgLowerTrim === 'ver conta') {
    console.log('✅ [PLEN WhatsApp] ==========================================')
    console.log('✅ [PLEN WhatsApp] COMANDO "VERIFICAR CONTA" DETECTADO!')
    console.log('✅ [PLEN WhatsApp] Mensagem original:', mensagem)
    console.log('✅ [PLEN WhatsApp] Mensagem lowercase:', msgLowerTrim)
    console.log('✅ [PLEN WhatsApp] ==========================================')
    return { tipo: 'verificar_conta', dados: {} }
  }
  
  // CRÍTICO: Verificar se é lembrete PRIMEIRO, antes de processar valores
  // Isso evita confundir "11 horas" com valor monetário
  const padraoLembrete = /(?:me\s+lembre|lembre-me|lembre\s+me|me\s+avise|avise-me|avise\s+me|lembrar|lembrete|compromisso|agendar|agenda)\s+(?:de|para)?\s*(.+)/i
  const isLembrete = padraoLembrete.test(msgLower)
  
  console.log('🔍 [PLEN WhatsApp] Verificando se é lembrete:', {
    mensagem: msgLower.substring(0, 50),
    isLembrete,
  })
  
  // Se é lembrete, processar imediatamente SEM extrair valores
  if (isLembrete) {
    const lembreteMatch = msgLower.match(padraoLembrete)
    console.log('🔍 [PLEN WhatsApp] Match do lembrete:', lembreteMatch)
    if (lembreteMatch && lembreteMatch[1]) {
      console.log('⏰ [PLEN WhatsApp] ✅ Detectado como LEMBRETE, ignorando extração de valores')
      console.log('⏰ [PLEN WhatsApp] Texto completo extraído:', lembreteMatch[1].trim())
      return { 
        tipo: 'criar_lembrete', 
        dados: { 
          textoCompleto: lembreteMatch[1].trim(),
          mensagemOriginal: mensagem
        } 
      }
    } else {
      console.log('⚠️ [PLEN WhatsApp] Padrão de lembrete detectado mas match falhou')
    }
  }
  
  // Padrões de comandos - MELHORADOS para capturar mais variações
  const padroes = {
    dividas: /(dividas?|dívidas?|quais.*dividas?|mostre.*dividas?|lista.*dividas?|qual.*total.*dividas?|quanto.*dividas?|quantas.*dividas?|qual.*divida|quanto.*devo|quanto.*tenho.*divida|total.*dividas?|divida.*total)(?!\s+[\d.,])/i,
    gastosSemana: /(gastos?.*semana|quanto.*gastou.*semana|gastou.*semana|despesas?.*semana)/i,
    gastosMes: /(gastos?.*m[eê]s|quanto.*gastou.*m[eê]s|gastou.*m[eê]s|despesas?.*m[eê]s)/i,
    relatorioDetalhado: /(relat[oó]rio.*detalhado|relat[oó]rio.*completo|relat[oó]rio.*detalhado.*\d+.*dias?|relat[oó]rio.*\d+.*dias?|relat[oó]rio.*dos.*\d+.*dias?|relat[oó]rio.*dos.*[uú]ltimos.*\d+.*dias?|relat[oó]rio.*hoje|relat[oó]rio.*de.*hoje)/i,
    criarLembrete: /(?:me\s+lembre|lembre-me|lembre\s+me|me\s+avise|avise-me|avise\s+me|lembrar|lembrete|compromisso|agendar|agenda)\s+(?:de|para)?\s*(.+)/i,
    totalEntradas: /(entradas?|receitas?|quanto.*recebeu|total.*entradas?)/i,
    totalSaidas: /(sa[ií]das?|despesas?|quanto.*gastou|total.*sa[ií]das?)/i,
    // MELHORADO: Detectar "paguei/gastei/comprei [valor]" diretamente (com ou sem "reais")
    pagamentoDireto: /(pago|paguei|pagar|pague|gastei|gastar|comprei|comprar)\s+.*?\d+/i,
    // MELHORADO: Detectar "recebi/recebeu/ganhei [valor]" diretamente (com ou sem "reais")
    registrarEntrada: /(recebi|recebeu|ganhei|ganhar|receber)\s+.*?\d+/i,
    // MELHORADO: Detectar dívidas de forma mais flexível (com ou sem "reais")
    registrarDivida: /(tenho|tenho uma|preciso|preciso registrar|devendo|devo|deve|tenho.*divida|tenho.*dívida|divida de|dívida de)\s+.*?[\d.,]+/i,
    // Mantido para compatibilidade
    registrarGasto: /(registrar|adicionar|inserir|cadastrar).*(gasto|despesa|sa[ií]da|compra|pagamento|conta|conta de)/i,
  }

  // Extrair valor - múltiplos padrões (MELHORADO para capturar valores sem "reais")
  const valorPatterns = [
    /r\$\s*([\d.,]+)/i,
    /\$\s*([\d.,]+)/i, // Adicionar suporte para "$" simples
    /([\d.,]+)\s*reais?/i,
    /valor\s*(?:de|de\s+)?([\d.,]+)/i,
    // Padrão melhorado: capturar número após palavras-chave (recebi, paguei, etc)
    /(?:recebi|recebeu|ganhei|ganhar|paguei|pague|gastei|gastar|comprei|comprar|tenho|devo|divida|dívida)\s+.*?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+[.,]?\d*)/i,
    /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|r\$|\$|de)?\b/i, // Adicionar "$" aqui também
    /(\d+[.,]?\d*)\s*(?:reais?|r\$|\$)/i, // Adicionar "$" aqui também
    /(\d+[.,]?\d*)(?!.*[.,]\d)/i, // Último número encontrado
  ]
  
  let valorMatch: RegExpMatchArray | null = null
  for (const pattern of valorPatterns) {
    valorMatch = msgLower.match(pattern)
    if (valorMatch) break
  }
  
  let valor: number | null = null
  if (valorMatch) {
    const valorStr = valorMatch[1] || valorMatch[0]
    // Limpar e converter valor
    const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.')
    valor = parseFloat(valorLimpo)
    if (isNaN(valor) || valor <= 0 || valor > 10000000) {
      valor = null
    } else {
      console.log('💰 [PLEN WhatsApp] Valor extraído:', valor, 'de:', valorStr)
    }
  } else {
    console.log('⚠️ [PLEN WhatsApp] Nenhum valor encontrado na mensagem:', msgLower)
  }

  // Detectar tipo de comando PRIMEIRO - ORDEM IMPORTANTE: verificar dívida primeiro, depois entrada, depois gasto
  const isRegistroDivida = padroes.registrarDivida.test(msgLower)
  console.log('🔍 [PLEN WhatsApp] Teste padrão registrarDivida:', {
    mensagem: msgLower,
    resultado: isRegistroDivida,
    padrao: padroes.registrarDivida.toString()
  })
  const isRegistroEntrada = padroes.registrarEntrada.test(msgLower)
  const isPagamentoDireto = padroes.pagamentoDireto.test(msgLower)
  const isRegistroGasto = padroes.registrarGasto.test(msgLower) || (isPagamentoDireto && !isRegistroDivida && !isRegistroEntrada)

  // Extrair descrição/categoria - MELHORADO para capturar melhor
  let categoria = 'outros'
  let descricao = ''
  let nomeExtraido: string | null = null // Variável para armazenar nome extraído
  
  // Para entradas: "recebi X de [nome]" ou "recebi X [nome]" ou "ganhei X da minha [nome]"
  if (isRegistroEntrada) {
    // Padrão 1: "ganhei X da minha [nome]" ou "recebi X da minha [nome]"
    const recebiDaMinhaMatch = msgLower.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?\d+\s*(?:reais?|r\$)?\s+da\s+minha\s+([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
    if (recebiDaMinhaMatch && recebiDaMinhaMatch[1]) {
      nomeExtraido = recebiDaMinhaMatch[1].trim()
    }
    
    // Padrão 2: "recebi X de [nome]" ou "ganhei X de [nome]" ou "ganhei X da [nome]"
    if (!nomeExtraido) {
      const recebiDeMatch = msgLower.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?\d+\s*(?:reais?|r\$)?\s+(?:de|da|do)\s+(?:a|o|minha|meu)?\s*([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
      if (recebiDeMatch && recebiDeMatch[1]) {
        nomeExtraido = recebiDeMatch[1].trim()
      }
    }
    
    // Padrão 3: "recebi X [nome]" ou "ganhei X [nome]" (sem "de")
    if (!nomeExtraido) {
      const recebiMatch = msgLower.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?\d+\s*(?:reais?|r\$)?\s+(?:da|do|de|a|o)?\s*([A-Za-zÀ-ÿ]+)(?:\s|$|,|\.)/i)
      if (recebiMatch && recebiMatch[1]) {
        const nome = recebiMatch[1].trim()
        // Ignorar palavras comuns
        if (!/(?:reais?|r\$|de|para|com|em|no|na|a|o|minha|meu|da|do)/i.test(nome) && nome.length > 1) {
          nomeExtraido = nome
        }
      }
    }
    
    // Padrão 4: "recebi 2000 salario" ou "ganhei 300 tia" - pegar palavra diretamente após valor
    if (!nomeExtraido && valor) {
      const valorStr = valor.toString()
      
      console.log('🔍 [PLEN WhatsApp] Tentando extrair nome de entrada após valor:', valorStr, 'da mensagem:', msgLower)
      
      // MÉTODO 1: Buscar palavra após o valor na mensagem original
      const regexValorENome = new RegExp(
        `(?:recebi|recebeu|ganhei|ganhar)\\s+${valorStr}\\s*(?:reais?|r\\$|\\$)?\\s+([A-Za-zÀ-ÿ]+(?:\\s+[A-Za-zÀ-ÿ]+)*?)(?:\\s|$|,|\\.|$)`,
        'i'
      )
      const matchValorENome = msgLower.match(regexValorENome)
      
      if (matchValorENome && matchValorENome[1]) {
        const nomeLower = matchValorENome[1].trim()
        console.log('🔍 [PLEN WhatsApp] Match encontrado (entrada método 1):', nomeLower)
        // Validar
        if (nomeLower.length >= 2 && 
            nomeLower.length < 50 && 
            !/^\d+$/.test(nomeLower) &&
            !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
          // Buscar na mensagem original para preservar capitalização
          const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
          if (nomeIndex >= 0) {
            const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
            nomeExtraido = nomeOriginal.trim()
            console.log('✅ [PLEN WhatsApp] Nome extraído (entrada método 1):', nomeExtraido)
          } else {
            nomeExtraido = nomeLower
            console.log('✅ [PLEN WhatsApp] Nome extraído (entrada método 1 - lowercase):', nomeExtraido)
          }
        }
      }
      
      // MÉTODO 2: Buscar diretamente após o valor na string
      if (!nomeExtraido) {
        const valorIndex = msgLower.indexOf(valorStr)
        if (valorIndex >= 0) {
          const depoisValor = msgLower.substring(valorIndex + valorStr.length).trim()
          const depoisValorLimpo = depoisValor.replace(/^\s*(?:reais?|r\$|\$)\s*/i, '').trim()
          
          console.log('🔍 [PLEN WhatsApp] Texto após valor (entrada):', depoisValorLimpo)
          
          // Pegar primeira palavra ou frase válida
          const palavrasMatch = depoisValorLimpo.match(/^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*?)(?:\s|$|,|\.|$)/i)
          if (palavrasMatch && palavrasMatch[1]) {
            const nomeLower = palavrasMatch[1].trim()
            console.log('🔍 [PLEN WhatsApp] Nome encontrado (entrada método 2):', nomeLower)
            if (nomeLower.length >= 2 && 
                nomeLower.length < 50 && 
                !/^\d+$/.test(nomeLower) &&
                !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
              // Buscar na mensagem original
              const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
              if (nomeIndex >= 0) {
                const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
                nomeExtraido = nomeOriginal.trim()
                console.log('✅ [PLEN WhatsApp] Nome extraído (entrada método 2):', nomeExtraido)
              } else {
                nomeExtraido = nomeLower
                console.log('✅ [PLEN WhatsApp] Nome extraído (entrada método 2 - lowercase):', nomeExtraido)
              }
            }
          }
        }
      }
    }
    
    if (nomeExtraido && nomeExtraido.length > 1 && nomeExtraido.length < 50) {
      // Limpar nome (remover palavras comuns)
      const nomeLimpo = nomeExtraido.replace(/\s+(?:reais?|r\$|de|para|com|em|no|na|a|o|minha|meu|da|do)\s+/gi, ' ').trim()
      if (nomeLimpo.length > 0) {
        const nomeFormatado = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1).toLowerCase()
        descricao = `Recebeu de ${nomeFormatado}`
        
        // INTELIGÊNCIA: Detectar se é familiar/pessoa usando IA
        const categoriaIdentificada = await identificarCategoriaComIA(nomeFormatado)
        
        if (categoriaIdentificada === 'pessoa') {
          // Se IA identificou como pessoa, usar categoria "pessoa"
          categoria = 'pessoa'
        } else {
          // Se não for pessoa, usar nome como categoria (fallback)
          categoria = nomeFormatado.toLowerCase()
        }
        
        nomeExtraido = nomeFormatado // Salvar nome formatado
      }
    }
    
    // Se não encontrou nome, usar descrição padrão
    if (!descricao) {
      // Tentar extrair categoria da mensagem (ex: "ganhei 20 extra" → categoria "extra")
      if (valor) {
        const valorStr = valor.toString()
        const valorIndex = msgLower.indexOf(valorStr)
        if (valorIndex >= 0) {
          const depoisValor = msgLower.substring(valorIndex + valorStr.length).trim()
          const depoisValorLimpo = depoisValor.replace(/^\s*(?:reais?|r\$|\$)\s*/i, '').trim()
          const palavrasMatch = depoisValorLimpo.match(/^([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.|$)/i)
          if (palavrasMatch && palavrasMatch[1]) {
            const palavra = palavrasMatch[1].trim()
            if (palavra.length >= 2 && palavra.length < 50 && 
                !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(palavra)) {
              categoria = palavra.toLowerCase()
              descricao = palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
              nomeExtraido = descricao
            }
          }
        }
      }
      
      if (!descricao) {
        descricao = 'Entrada via WhatsApp'
        categoria = 'entrada'
        nomeExtraido = null
      }
    }
  }
  
  // Para gastos: "paguei X no/em/de [lugar]" ou "gastei X [lugar]" ou "gastei X na [lugar]"
  if (isPagamentoDireto && !isRegistroEntrada) {
    let nomeGasto: string | null = null
    
    // Padrão 1: "gastei X na [lugar]" ou "paguei X no [lugar]"
    const gastoNaMatch = msgLower.match(/(?:paguei|pague|gastei|gastar|comprei|comprar)\s+.*?\d+\s*(?:reais?|r\$)?\s+(?:na|no|em|de|para|com)\s+([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
    if (gastoNaMatch && gastoNaMatch[1]) {
      nomeGasto = gastoNaMatch[1].trim()
    }
    
    // Padrão 2: "gastei X [lugar]" (sem preposição) - CRÍTICO para "gastei 500 shopping" ou "gastei 400$ casa"
    if (!nomeGasto && valor) {
      const valorStr = valor.toString()
      
      console.log('🔍 [PLEN WhatsApp] Tentando extrair nome após valor:', valorStr, 'da mensagem:', msgLower)
      
      // MÉTODO 1: Buscar palavra após o valor na mensagem original
      // Exemplo: "gastei 500 shopping" ou "gastei 400$ casa" → encontrar valor e pegar nome
      const regexValorENome = new RegExp(
        `(?:paguei|pague|gastei|gastar|comprei|comprar)\\s+${valorStr}\\s*(?:reais?|r\\$|\\$)?\\s+([A-Za-zÀ-ÿ]+(?:\\s+[A-Za-zÀ-ÿ]+)*?)(?:\\s|$|,|\\.|$)`,
        'i'
      )
      const matchValorENome = msgLower.match(regexValorENome)
      
      if (matchValorENome && matchValorENome[1]) {
        const nomeLower = matchValorENome[1].trim()
        console.log('🔍 [PLEN WhatsApp] Match encontrado (método 1):', nomeLower)
        // Validar
        if (nomeLower.length >= 2 && 
            nomeLower.length < 50 && 
            !/^\d+$/.test(nomeLower) &&
            !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
          // Buscar na mensagem original para preservar capitalização
          const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
          if (nomeIndex >= 0) {
            const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
            nomeGasto = nomeOriginal.trim()
            console.log('✅ [PLEN WhatsApp] Nome extraído (método 1 - valor+nome):', nomeGasto)
          } else {
            nomeGasto = nomeLower
            console.log('✅ [PLEN WhatsApp] Nome extraído (método 1 - lowercase):', nomeGasto)
          }
        }
      }
      
      // MÉTODO 1.5: Se não encontrou, tentar com "$" diretamente após o número (sem espaço)
      if (!nomeGasto) {
        const regexValorComDolar = new RegExp(
          `(?:paguei|pague|gastei|gastar|comprei|comprar)\\s+${valorStr}\\$\\s*([A-Za-zÀ-ÿ]+(?:\\s+[A-Za-zÀ-ÿ]+)*?)(?:\\s|$|,|\\.|$)`,
          'i'
        )
        const matchComDolar = msgLower.match(regexValorComDolar)
        if (matchComDolar && matchComDolar[1]) {
          const nomeLower = matchComDolar[1].trim()
          console.log('🔍 [PLEN WhatsApp] Match encontrado (método 1.5 - com $):', nomeLower)
          if (nomeLower.length >= 2 && 
              nomeLower.length < 50 && 
              !/^\d+$/.test(nomeLower) &&
              !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
            const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
            if (nomeIndex >= 0) {
              const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
              nomeGasto = nomeOriginal.trim()
              console.log('✅ [PLEN WhatsApp] Nome extraído (método 1.5 - com $):', nomeGasto)
            } else {
              nomeGasto = nomeLower
              console.log('✅ [PLEN WhatsApp] Nome extraído (método 1.5 - lowercase):', nomeGasto)
            }
          }
        }
      }
      if (matchValorENome && matchValorENome[1]) {
        const nomeLower = matchValorENome[1].trim()
        // Validar
        if (nomeLower.length >= 2 && 
            nomeLower.length < 50 && 
            !/^\d+$/.test(nomeLower) &&
            !/^(?:reais?|r\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
          // Buscar na mensagem original para preservar capitalização
          const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
          if (nomeIndex >= 0) {
            const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
            nomeGasto = nomeOriginal.trim()
            console.log('💰 [PLEN WhatsApp] Nome extraído (método 1 - valor+nome):', nomeGasto)
          } else {
            nomeGasto = nomeLower
            console.log('💰 [PLEN WhatsApp] Nome extraído (método 1 - lowercase):', nomeGasto)
          }
        }
      }
      
      // MÉTODO 2: Buscar diretamente após o valor na string
      if (!nomeGasto) {
        // Tentar encontrar o valor na mensagem (pode ter "$" ou não)
        let valorIndex = msgLower.indexOf(valorStr)
        
        // Se não encontrou, tentar com "$" após o número
        if (valorIndex < 0) {
          const valorComDolar = `${valorStr}$`
          valorIndex = msgLower.indexOf(valorComDolar)
          if (valorIndex >= 0) {
            // Ajustar para pegar após o "$"
            valorIndex += valorComDolar.length
          }
        } else {
          // Se encontrou o valor, verificar se tem "$" logo após
          const depoisValor = msgLower.substring(valorIndex + valorStr.length)
          if (depoisValor.startsWith('$')) {
            valorIndex += valorStr.length + 1 // Pular o "$"
          } else {
            valorIndex += valorStr.length
          }
        }
        
        if (valorIndex >= 0) {
          const depoisValor = msgLower.substring(valorIndex).trim()
          const depoisValorLimpo = depoisValor.replace(/^\s*(?:reais?|r\$|\$)\s*/i, '').trim()
          
          console.log('🔍 [PLEN WhatsApp] Texto após valor:', depoisValorLimpo)
          
          // Pegar primeira palavra ou frase válida
          const palavrasMatch = depoisValorLimpo.match(/^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*?)(?:\s|$|,|\.|$)/i)
          if (palavrasMatch && palavrasMatch[1]) {
            const nomeLower = palavrasMatch[1].trim()
            console.log('🔍 [PLEN WhatsApp] Nome encontrado (método 2):', nomeLower)
            if (nomeLower.length >= 2 && 
                nomeLower.length < 50 && 
                !/^\d+$/.test(nomeLower) &&
                !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nomeLower)) {
              // Buscar na mensagem original
              const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeLower)
              if (nomeIndex >= 0) {
                const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeLower.length)
                nomeGasto = nomeOriginal.trim()
                console.log('✅ [PLEN WhatsApp] Nome extraído (método 2 - após valor):', nomeGasto)
              } else {
                nomeGasto = nomeLower
                console.log('✅ [PLEN WhatsApp] Nome extraído (método 2 - lowercase):', nomeGasto)
              }
            }
          }
        }
      }
    }
    
    // Padrão 3: "gastei X de [lugar]" ou "paguei X em [lugar]"
    if (!nomeGasto) {
      const gastoDeMatch = msgLower.match(/(?:paguei|pague|gastei|gastar|comprei|comprar)\s+.*?\d+\s*(?:reais?|r\$)?\s+(?:de|em)\s+([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
      if (gastoDeMatch && gastoDeMatch[1]) {
        nomeGasto = gastoDeMatch[1].trim()
      }
    }
    
    if (nomeGasto && nomeGasto.length >= 2 && nomeGasto.length < 50) {
      // Limpar nome (remover palavras comuns)
      const nomeLimpo = nomeGasto.replace(/\s+(?:reais?|r\$|de|para|com|em|no|na|a|o)\s+/gi, ' ').trim()
      if (nomeLimpo.length > 0) {
        // Preservar capitalização original ou formatar
        const nomeFormatado = nomeLimpo.split(' ').map(palavra => 
          palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
        ).join(' ')
        descricao = `Gasto em ${nomeFormatado}`
        categoria = nomeFormatado.toLowerCase()
        nomeExtraido = nomeFormatado // Salvar nome para usar na resposta
        console.log('💰 [PLEN WhatsApp] Nome do gasto extraído:', nomeFormatado)
      }
    }
    
    // Se não encontrou nome, usar descrição padrão
    if (!descricao) {
      // Tentar extrair categoria da mensagem (ex: "gastei 40 roupa" → categoria "roupa")
      if (valor) {
        const valorStr = valor.toString()
        const valorIndex = msgLower.indexOf(valorStr)
        if (valorIndex >= 0) {
          const depoisValor = msgLower.substring(valorIndex + valorStr.length).trim()
          const depoisValorLimpo = depoisValor.replace(/^\s*(?:reais?|r\$|\$)\s*/i, '').trim()
          const palavrasMatch = depoisValorLimpo.match(/^([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.|$)/i)
          if (palavrasMatch && palavrasMatch[1]) {
            const palavra = palavrasMatch[1].trim()
            if (palavra.length >= 2 && palavra.length < 50 && 
                !/^(?:reais?|r\$|\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(palavra)) {
              categoria = palavra.toLowerCase()
              descricao = `Gasto em ${palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()}`
              nomeExtraido = palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
            }
          }
        }
      }
      
      if (!descricao) {
        descricao = 'Gasto via WhatsApp'
        categoria = 'outros'
        nomeExtraido = null
      }
    }
  }
  
  // Para dívidas: extrair descrição se houver
  if (isRegistroDivida) {
    let nomeDivida: string | null = null
    
    // Padrão 1: "divida de 200 de sofá" ou "divida de 200 sofá"
    const dividaDeMatch = msgLower.match(/(?:divida de|dívida de)\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+(?:de|com|para)?\s*([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
    if (dividaDeMatch && dividaDeMatch[1]) {
      nomeDivida = dividaDeMatch[1].trim()
    }
    
    // Padrão 2: "tenho divida de 200 de sofá" ou "tenho uma divida de 200 sofá"
    if (!nomeDivida) {
      const dividaTenhoMatch = msgLower.match(/(?:tenho|tenho uma|preciso|devendo|devo)\s+(?:divida|dívida)?\s*(?:de)?\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+(?:de|com|para)?\s*([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.)/i)
      if (dividaTenhoMatch && dividaTenhoMatch[1]) {
        nomeDivida = dividaTenhoMatch[1].trim()
      }
    }
    
    // Padrão 3: Buscar palavra após o valor (método inteligente)
    if (!nomeDivida && valor) {
      const valorStr = valor.toString()
      const valorIndex = msgLower.indexOf(valorStr)
      if (valorIndex >= 0) {
        const depoisValor = msgLower.substring(valorIndex + valorStr.length).trim()
        const depoisValorLimpo = depoisValor.replace(/^\s*(?:reais?|r\$)\s*/i, '').trim()
        
        // Remover "de" se houver
        const depoisDeLimpo = depoisValorLimpo.replace(/^\s*de\s+/i, '').trim()
        
        // Pegar primeira palavra válida
        const palavrasMatch = depoisDeLimpo.match(/^([A-Za-zÀ-ÿ]+?)(?:\s|$|,|\.|$)/i)
        if (palavrasMatch && palavrasMatch[1]) {
          const nome = palavrasMatch[1].trim()
          if (nome.length >= 2 && 
              nome.length < 50 && 
              !/^\d+$/.test(nome) &&
              !/^(?:reais?|r\$|de|para|com|em|no|na|a|o|via|whatsapp)$/i.test(nome)) {
            nomeDivida = nome
            console.log('💳 [PLEN WhatsApp] Nome da dívida extraído:', nome)
          }
        }
      }
    }
    
    if (nomeDivida && nomeDivida.length >= 2 && nomeDivida.length < 50) {
      // Buscar na mensagem original para preservar capitalização
      const nomeIndex = msgOriginal.toLowerCase().indexOf(nomeDivida.toLowerCase())
      if (nomeIndex >= 0) {
        const nomeOriginal = msgOriginal.substring(nomeIndex, nomeIndex + nomeDivida.length)
        const nomeFormatado = nomeOriginal.charAt(0).toUpperCase() + nomeOriginal.slice(1).toLowerCase()
        descricao = `Dívida de ${nomeFormatado}`
        categoria = nomeFormatado.toLowerCase()
        nomeExtraido = nomeFormatado
        console.log('💳 [PLEN WhatsApp] Nome da dívida formatado:', nomeFormatado)
      } else {
        const nomeFormatado = nomeDivida.charAt(0).toUpperCase() + nomeDivida.slice(1).toLowerCase()
        descricao = `Dívida de ${nomeFormatado}`
        categoria = nomeFormatado.toLowerCase()
        nomeExtraido = nomeFormatado
      }
    }
    
    if (!descricao) {
      descricao = 'Dívida via WhatsApp'
      categoria = 'dívida'
      nomeExtraido = null
    }
  }
  
  console.log('🔍 [PLEN WhatsApp] Detecção de comandos:', {
    isLembrete,
    isRegistroDivida,
    isRegistroEntrada,
    isPagamentoDireto,
    isRegistroGasto,
    valor,
    descricao,
    categoria,
    nomeExtraido,
    mensagem: msgLower.substring(0, 50),
  })
  
  // Se é registro e tem valor, processar
  if ((isRegistroGasto || isRegistroEntrada || isRegistroDivida) && valor) {
    let tipo: 'saida' | 'entrada' | 'divida' = 'saida'
    if (isRegistroEntrada) {
      tipo = 'entrada'
    } else if (isRegistroDivida) {
      tipo = 'divida'
    }

    return {
      tipo: tipo === 'entrada' ? 'registrar_entrada' : tipo === 'divida' ? 'registrar_divida' : 'registrar_gasto',
      dados: {
        valor,
        descricao: descricao || (categoria !== 'outros' ? categoria : `Registro via WhatsApp - ${tipo}`),
        tipo: tipo === 'divida' ? 'saida' : tipo,
        categoria: categoria !== 'outros' ? categoria : 'outros',
        nomeExtraido: nomeExtraido, // Nome extraído para usar na resposta
      }
    }
  }


  // Consultas - IMPORTANTE: só consultar se NÃO for um registro de dívida E não tiver valor
  // Se tem valor numérico, é sempre um registro, não uma consulta
  const temValor = valor !== null && valor > 0
  
  // Só consultar se:
  // 1. NÃO é um registro de dívida (isRegistroDivida = false)
  // 2. NÃO tem valor numérico OU tem palavras explícitas de consulta
  // 3. O padrão de consulta bate
  const temPalavrasConsulta = /(quais|mostre|lista|qual.*total|quanto.*dividas?|quantas.*dividas?|divida.*total)/i.test(msgLower)
  
  if (padroes.dividas.test(msgLower) && !isRegistroDivida && !temValor && temPalavrasConsulta) {
    return { tipo: 'consultar_dividas', dados: {} }
  }
  
  // Se tem valor mas não foi detectado como registro, pode ser uma consulta genérica
  // Mas se tem "divida de [valor]", deve ser registro
  if (padroes.dividas.test(msgLower) && !isRegistroDivida && !temValor && !temPalavrasConsulta) {
    // Verificar se é uma consulta simples como "dividas" ou "minhas dividas"
    const consultaSimples = /^(dividas?|dívidas?|minhas?\s+dividas?)$/i.test(msgLower.trim())
    if (consultaSimples) {
      return { tipo: 'consultar_dividas', dados: {} }
    }
  }
  
  if (padroes.gastosSemana.test(msgLower)) {
    return { tipo: 'gastos_semana', dados: {} }
  }
  
  if (padroes.gastosMes.test(msgLower)) {
    return { tipo: 'gastos_mes', dados: {} }
  }
  
  // Detectar relatório detalhado
  if (padroes.relatorioDetalhado.test(msgLower)) {
    // Extrair número de dias se mencionado
    const diasMatch = msgLower.match(/(\d+)\s*dias?/i)
    const dias = diasMatch ? parseInt(diasMatch[1]) : null
    
    // Verificar se é "hoje"
    const isHoje = /hoje/i.test(msgLower)
    
    return { 
      tipo: 'relatorio_detalhado', 
      dados: { 
        dias: dias || (isHoje ? 0 : 7), // Padrão: 7 dias ou hoje
        isHoje 
      } 
    }
  }
  
  if (padroes.totalEntradas.test(msgLower)) {
    return { tipo: 'total_entradas', dados: {} }
  }
  
  if (padroes.totalSaidas.test(msgLower)) {
    return { tipo: 'total_saidas', dados: {} }
  }

  return { tipo: 'conversa', dados: {} }
}

export async function POST(request: NextRequest) {
  // CRÍTICO: Log IMEDIATO no stdout ANTES de qualquer coisa
  const timestamp = new Date().toISOString()
  process.stdout.write('\n')
  process.stdout.write('='.repeat(80) + '\n')
  process.stdout.write('[PLEN WhatsApp] ENDPOINT CHAMADO!\n')
  process.stdout.write('[PLEN WhatsApp] Timestamp: ' + timestamp + '\n')
  process.stdout.write('[PLEN WhatsApp] URL: ' + request.url + '\n')
  process.stdout.write('='.repeat(80) + '\n')
  
  // Garantir que logs estão sendo capturados
  addLog('info', `📥 [PLEN WhatsApp] Nova requisição recebida`)
  
  // Logar no console E no sistema de logging
  const endpointMsg = `🚀🚀🚀 [PLEN WhatsApp] ENDPOINT CHAMADO! 🚀🚀🚀 Timestamp: ${timestamp}`
  console.log('='.repeat(80))
  console.log(endpointMsg)
  console.log('🚀 [PLEN WhatsApp] URL:', request.url)
  console.log('='.repeat(80))
  addLog('info', endpointMsg)
  addLog('info', `🚀 [PLEN WhatsApp] URL: ${request.url}`)
  
  // CRÍTICO: Capturar também os console.log para o sistema de logs
  // Interceptar console.log temporariamente para capturar logs do PLEN WhatsApp
  let originalConsoleLog: typeof console.log | undefined
  let originalConsoleError: typeof console.error | undefined
  let originalConsoleWarn: typeof console.warn | undefined
  
  try {
    originalConsoleLog = console.log.bind(console)
    originalConsoleError = console.error.bind(console)
    originalConsoleWarn = console.warn.bind(console)
    
    console.log = (...args: any[]) => {
      originalConsoleLog!(...args)
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (typeof arg === 'object') return JSON.stringify(arg)
        return String(arg)
      }).join(' ')
      // Capturar TODOS os logs que contêm [PLEN WhatsApp] ou PLEN WhatsApp
      if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
        addLog('log', message)
      }
    }
    
    console.error = (...args: any[]) => {
      originalConsoleError!(...args)
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (typeof arg === 'object') return JSON.stringify(arg)
        return String(arg)
      }).join(' ')
      // Capturar TODOS os logs que contêm [PLEN WhatsApp] ou PLEN WhatsApp
      if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
        addLog('error', message)
      }
    }
    
    console.warn = (...args: any[]) => {
      originalConsoleWarn!(...args)
      const message = args.map(arg => {
        if (typeof arg === 'string') return arg
        if (typeof arg === 'object') return JSON.stringify(arg)
        return String(arg)
      }).join(' ')
      // Capturar TODOS os logs que contêm [PLEN WhatsApp] ou PLEN WhatsApp
      if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
        addLog('warn', message)
      }
    }
  } catch (interceptError) {
    // Se falhar ao interceptar, continuar normalmente
    console.error('Erro ao interceptar console:', interceptError)
  }
  
  try {
    const { userId, message, imageBase64 } = await request.json()
    
    // CRÍTICO: Logar mensagem recebida IMEDIATAMENTE
    process.stdout.write('\n')
    process.stdout.write('='.repeat(80) + '\n')
    process.stdout.write('[PLEN WhatsApp] MENSAGEM RECEBIDA\n')
    process.stdout.write('[PLEN WhatsApp] Message: ' + (message || 'null') + '\n')
    process.stdout.write('[PLEN WhatsApp] UserId: ' + (userId?.substring(0, 8) || 'null') + '...\n')
    process.stdout.write('='.repeat(80) + '\n')
    
    const dadosLog = {
      userId: userId?.substring(0, 8) + '...',
      hasMessage: !!message,
      hasImage: !!imageBase64,
      messagePreview: message?.substring(0, 50) || 'N/A'
    }
    
    const dadosMsg = `📥 [PLEN WhatsApp] Dados recebidos: ${JSON.stringify(dadosLog)}`
    console.log(dadosMsg)
    addLog('info', dadosMsg)

    if (!userId || (!message && !imageBase64)) {
      console.error('❌ [PLEN WhatsApp] Parâmetros inválidos:', { userId, hasMessage: !!message, hasImage: !!imageBase64 })
      // CRÍTICO: Retornar resposta mesmo com erro, não apenas error
      return NextResponse.json({
        response: '❌ Parâmetros inválidos. Por favor, tente novamente.',
      })
    }

    // Criar cliente admin para buscar dados do usuário sem autenticação
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) {
      console.error('❌ [PLEN WhatsApp] Erro ao criar cliente Supabase Admin')
      console.error('❌ [PLEN WhatsApp] SUPABASE_SERVICE_ROLE_KEY não está configurada!')
      // CRÍTICO: Retornar resposta mesmo com erro, não apenas error
      return NextResponse.json({
        response: '❌ Erro ao conectar com banco de dados.\n\n💡 Verifique se a variável SUPABASE_SERVICE_ROLE_KEY está configurada no arquivo .env.local',
      })
    }
    
    // Verificar se service role key está configurada
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('🔍 [PLEN WhatsApp] Service Role Key configurada:', hasServiceKey)
    if (!hasServiceKey) {
      console.error('❌ [PLEN WhatsApp] SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local')
    }

    // Buscar dados do usuário usando Admin Client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ [PLEN WhatsApp] Erro ao buscar perfil:', profileError)
      // CRÍTICO: Retornar resposta mesmo com erro, não apenas error
      return NextResponse.json({
        response: '❌ Usuário não encontrado. Verifique se sua conta está ativa.',
      })
    }
    
    // Log detalhado do profile buscado
    console.log('👤 [PLEN WhatsApp] Profile buscado:', {
      id: profile.id,
      email: profile.email,
      plano: profile.plano,
      planoTipo: typeof profile.plano,
      planoRaw: JSON.stringify(profile.plano)
    })
    addLog('info', `👤 [PLEN WhatsApp] Profile encontrado - Email: ${profile.email}, Plano: ${profile.plano} (tipo: ${typeof profile.plano})`)

    // Buscar dados do usuário
    // CRÍTICO: A tabela registros NÃO tem account_owner_id, apenas user_id
    // Preciso buscar todos os usuários que pertencem a este account_owner
    // e então buscar registros desses usuários
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('account_owner_id', userId)
    
    if (usuariosError) {
      console.error('❌ [PLEN WhatsApp] Erro ao buscar usuários:', usuariosError)
    }
    
    const userIds = usuarios && usuarios.length > 0 ? usuarios.map((u: any) => u.id) : []
    
    // Buscar dívidas - as dívidas são registros com tipo='divida' na tabela registros
    // Não há tabela separada 'dividas', então vamos buscar depois dos registros
    const dividasData: any[] = [] // Será preenchido depois com registros do tipo 'divida'
    
    // Buscar registros onde user_id está na lista de usuários do account_owner
    let registrosQuery = supabaseAdmin
      .from('registros')
      .select('*')
      .order('data_registro', { ascending: false })
    
    if (userIds.length > 0) {
      registrosQuery = registrosQuery.in('user_id', userIds)
    } else {
      // Se não há usuários, retornar array vazio
      registrosQuery = registrosQuery.eq('user_id', '00000000-0000-0000-0000-000000000000') // ID inválido para retornar vazio
    }
    
    const { data: registrosData } = await registrosQuery

    const registros = registrosData || []
    // As dívidas são registros com tipo='divida'
    const dividas = registros.filter((r: any) => r.tipo === 'divida' || r.etiquetas?.includes('dívida'))

    // Calcular features baseado no plano (necessário para processar múltiplos registros)
    const planoRaw = profile.plano
    const planoNormalizado = typeof planoRaw === 'string' ? planoRaw.toLowerCase().trim() : null
    const plano = (planoNormalizado || 'teste') as 'teste' | 'basico' | 'premium'
    
    const features = {
      teste: {
        podeCriarRegistros: true,
        limiteRegistrosMensais: 10,
        podeCriarDividas: false,
        podeCriarEmprestimos: false,
        podeRegistrarSalario: false,
        podeUsarCalendario: false,
        podeUsarMetas: false,
        limiteMetas: 0,
        podeUsarDashboard: true,
        podeUsarDashboardAvancado: false,
        podeExportarRelatorios: false,
        podeExportarAvancado: false,
        podeCriarUsuarios: true,
        limiteUsuarios: 2,
        podeUploadDocumentos: false,
        podeUsarGameDinamico: false,
        podeUsarFiltrosAvancados: false,
      },
      basico: {
        podeCriarRegistros: true,
        limiteRegistrosMensais: null,
        podeCriarDividas: true,
        podeCriarEmprestimos: false,
        podeRegistrarSalario: true,
        podeUsarCalendario: true,
        podeUsarMetas: true,
        limiteMetas: 3,
        podeUsarDashboard: true,
        podeUsarDashboardAvancado: false,
        podeExportarRelatorios: true,
        podeExportarAvancado: false,
        podeCriarUsuarios: true,
        limiteUsuarios: 10,
        podeUploadDocumentos: false,
        podeUsarGameDinamico: false,
        podeUsarFiltrosAvancados: true,
      },
      premium: {
        podeCriarRegistros: true,
        limiteRegistrosMensais: null,
        podeCriarDividas: true,
        podeCriarEmprestimos: true,
        podeRegistrarSalario: true,
        podeUsarCalendario: true,
        podeUsarMetas: true,
        limiteMetas: null,
        podeUsarDashboard: true,
        podeUsarDashboardAvancado: true,
        podeExportarRelatorios: true,
        podeExportarAvancado: true,
        podeCriarUsuarios: true,
        limiteUsuarios: null,
        podeUploadDocumentos: true,
        podeUsarGameDinamico: true,
        podeUsarFiltrosAvancados: true,
      },
    }[plano]

    // Calcular estatísticas
    const hoje = new Date()
    const inicioSemana = startOfWeek(hoje, { locale: ptBR })
    
    console.log('📊 [PLEN WhatsApp] Cálculo de gastos da semana:', {
      hoje: hoje.toISOString(),
      inicioSemana: inicioSemana.toISOString(),
      totalRegistros: registros.length,
      registrosSaida: registros.filter((r: any) => r.tipo === 'saida').length
    })
    
    const registrosSemana = registros.filter((r: any) => {
      const dataRegistro = new Date(r.data_registro)
      const estaNaSemana = dataRegistro >= inicioSemana
      const eSaida = r.tipo === 'saida'
      
      if (estaNaSemana && eSaida) {
        console.log('📊 [PLEN WhatsApp] Registro da semana:', {
          nome: r.nome,
          valor: r.valor,
          tipo: r.tipo,
          data: dataRegistro.toISOString()
        })
      }
      
      return estaNaSemana && eSaida
    })
    
    const gastosSemana = registrosSemana.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)
    
    console.log('📊 [PLEN WhatsApp] Resultado:', {
      registrosSemana: registrosSemana.length,
      gastosSemana: gastosSemana
    })

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const registrosMes = registros.filter((r: any) => {
      const dataRegistro = new Date(r.data_registro)
      return dataRegistro >= inicioMes && r.tipo === 'saida'
    })
    const gastosMes = registrosMes.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)

    const totalDividas = dividas.reduce((sum: number, d: any) => sum + parseFloat(d.valor || 0), 0)
    const totalEntradas = registros
      .filter((r: any) => r.tipo === 'entrada')
      .reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)
    const totalSaidas = registros
      .filter((r: any) => r.tipo === 'saida')
      .reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)

    // Processar comando (agora é async para usar IA)
    // Se tem imagem, processar com IA Vision
    let comando: any
    // Variáveis para rastrear múltiplos registros (fora do objeto comando para garantir preservação)
    let temMultiplosRegistrosFlag = false
    let totalRegistrosFlag = 0
    if (imageBase64) {
      console.log('🖼️ [PLEN WhatsApp] Processando imagem...')
      comando = await processarComandoComImagem(imageBase64)
      
      // Verificar se comando é válido
      if (!comando || typeof comando !== 'object' || !comando.tipo) {
        console.error('❌ [PLEN WhatsApp] Erro ao processar imagem - comando inválido:', comando)
        addLog('error', `❌ [PLEN WhatsApp] Erro ao processar imagem: ${JSON.stringify(comando)}`)
        return NextResponse.json({
          response: '📸 Recebi uma imagem, mas não consegui processá-la.\n\n💡 Por favor, descreva o comprovante em texto:\n\n• "paguei 300 reais para Anderson"\n• "recebi 500 reais de Maria"\n• "gastei 80 reais na farmácia"\n\n✅ Com isso, registro automaticamente!',
        })
      }
      
      console.log('🔍 [PLEN WhatsApp] Comando detectado da imagem:', comando.tipo, comando.dados)
      
      // Se não conseguiu processar imagem, pedir descrição ao usuário
      if (comando.tipo === 'geral' && comando.error) {
        return NextResponse.json({
          response: '📸 Recebi uma imagem, mas não tenho acesso a uma IA para analisá-la no momento.\n\n💡 Por favor, descreva o comprovante em texto:\n\n• "paguei 300 reais para Anderson"\n• "recebi 500 reais de Maria"\n• "gastei 80 reais na farmácia"\n\n✅ Com isso, registro automaticamente!',
        })
      }
    } else {
      // NOVA SOLUÇÃO: Detectar múltiplos registros e registrar apenas o primeiro
      const mensagemOriginal = message.trim()
      
      // CRÍTICO: Logar ANTES de qualquer processamento
      process.stdout.write('\n')
      process.stdout.write('='.repeat(80) + '\n')
      process.stdout.write('[PLEN WhatsApp] INICIANDO DETECCAO DE MULTIPLOS REGISTROS\n')
      process.stdout.write('[PLEN WhatsApp] Mensagem recebida: "' + mensagemOriginal + '"\n')
      process.stdout.write('[PLEN WhatsApp] Tipo da mensagem: ' + typeof mensagemOriginal + '\n')
      process.stdout.write('[PLEN WhatsApp] Tamanho da mensagem: ' + mensagemOriginal.length + '\n')
      process.stdout.write('='.repeat(80) + '\n')
      
      // Contar quantos padrões de registro existem na mensagem
      const regexPadrao = /(ganhei|gastei|recebi|paguei|comprei|tenho|devo|divida|dívida)\s+\d+/gi
      const padroesEncontrados = mensagemOriginal.match(regexPadrao) || []
      
      // CRÍTICO: Logar no stdout para garantir que aparece no Render
      process.stdout.write('\n')
      process.stdout.write('='.repeat(80) + '\n')
      process.stdout.write('[PLEN WhatsApp] DETECCAO DE MULTIPLOS REGISTROS\n')
      process.stdout.write('[PLEN WhatsApp] Mensagem: "' + mensagemOriginal + '"\n')
      process.stdout.write('[PLEN WhatsApp] Padroes encontrados: ' + padroesEncontrados.length + '\n')
      process.stdout.write('[PLEN WhatsApp] Padroes: ' + JSON.stringify(padroesEncontrados) + '\n')
      process.stdout.write('[PLEN WhatsApp] Vai entrar no if? ' + (padroesEncontrados.length > 1) + '\n')
      process.stdout.write('='.repeat(80) + '\n')
      
      // Log também no console para debug
      console.log('[PLEN WhatsApp] ==========================================')
      console.log('[PLEN WhatsApp] DETECCAO DE MULTIPLOS REGISTROS')
      console.log('[PLEN WhatsApp] Mensagem:', mensagemOriginal)
      console.log('[PLEN WhatsApp] Padroes encontrados:', padroesEncontrados.length)
      console.log('[PLEN WhatsApp] Padroes:', padroesEncontrados)
      console.log('[PLEN WhatsApp] ==========================================')
      
      // Se encontrou mais de 1 padrão, processar apenas o primeiro e avisar
      if (padroesEncontrados.length > 1) {
        process.stdout.write('[PLEN WhatsApp] *** MULTIPLOS REGISTROS DETECTADOS: ' + padroesEncontrados.length + ' ***\n')
        console.log('[PLEN WhatsApp] Múltiplos registros detectados:', padroesEncontrados.length)
        addLog('info', `⚠️ [PLEN WhatsApp] Múltiplos registros detectados: ${padroesEncontrados.length}`)
        
        // Extrair o primeiro registro da mensagem
        let primeiroRegistro = mensagemOriginal
        
        // Tentar dividir por vírgula
        if (mensagemOriginal.includes(',')) {
          const partes = mensagemOriginal.split(/,/)
            .map(p => p.trim())
            .filter(p => {
              const pLower = p.toLowerCase()
              const temPalavraChave = /(ganhei|gastei|recebi|paguei|comprei|tenho|devo|divida|dívida)/i.test(pLower)
              const temValor = /\d+/.test(pLower)
              return temPalavraChave && temValor && p.length > 0
            })
          
          if (partes.length > 0) {
            primeiroRegistro = partes[0]
          }
        } else if (/\r\n|\r|\n/.test(mensagemOriginal)) {
          // Tentar dividir por quebra de linha
          const partes = mensagemOriginal.split(/\r\n|\r|\n/)
            .map(p => p.trim())
            .filter(p => {
              const pLower = p.toLowerCase()
              const temPalavraChave = /(ganhei|gastei|recebi|paguei|comprei|tenho|devo|divida|dívida)/i.test(pLower)
              const temValor = /\d+/.test(pLower)
              return temPalavraChave && temValor && p.length > 0
            })
          
          if (partes.length > 0) {
            primeiroRegistro = partes[0]
          }
        }
        
        console.log('[PLEN WhatsApp] Processando apenas o primeiro registro:', primeiroRegistro)
        addLog('info', `📝 [PLEN WhatsApp] Processando primeiro registro: "${primeiroRegistro}"`)
        
        // Processar apenas o primeiro registro
        comando = await processarComando(primeiroRegistro)
        
        // Log para debug
        console.log('[PLEN WhatsApp] Comando retornado após processar primeiro registro:', {
          tipo: typeof comando,
          isObject: typeof comando === 'object',
          comando: comando
        })
        
        // Adicionar flag ao comando para indicar que havia múltiplos
        // Verificação EXTRA para garantir que comando é um objeto válido
        if (comando && typeof comando === 'object' && comando !== null && !Array.isArray(comando)) {
          try {
            (comando as any).temMultiplosRegistros = true
            (comando as any).totalRegistros = padroesEncontrados.length
            // Também salvar em variáveis separadas para garantir preservação
            temMultiplosRegistrosFlag = true
            totalRegistrosFlag = padroesEncontrados.length
            
            // CRÍTICO: Logar no stdout
            process.stdout.write('[PLEN WhatsApp] FLAGS DEFINIDAS - temMultiplosRegistrosFlag: true, totalRegistrosFlag: ' + totalRegistrosFlag + '\n')
            
            console.log('[PLEN WhatsApp] Flags adicionadas ao comando:', {
              temMultiplosRegistros: (comando as any).temMultiplosRegistros,
              totalRegistros: (comando as any).totalRegistros,
              flagExterna: temMultiplosRegistrosFlag,
              totalExterno: totalRegistrosFlag
            })
          } catch (error: any) {
            console.error('[PLEN WhatsApp] Erro ao adicionar flags ao comando:', error)
            addLog('error', `❌ [PLEN WhatsApp] Erro ao adicionar flags: ${error.message}`)
          }
        } else {
          console.error('[PLEN WhatsApp] Comando inválido ao tentar adicionar flags:', {
            comando,
            tipo: typeof comando,
            isNull: comando === null,
            isArray: Array.isArray(comando)
          })
        }
      } else {
        // Processar comando único normalmente
        comando = await processarComando(message)
      }
    }

    // Verificar se comando é válido antes de acessar propriedades
    if (!comando || typeof comando !== 'object' || !comando.tipo) {
      console.error('❌ [PLEN WhatsApp] Comando inválido:', comando)
      addLog('error', `❌ [PLEN WhatsApp] Comando inválido recebido: ${JSON.stringify(comando)}`)
      return NextResponse.json({
        response: '❌ Não consegui entender sua mensagem. Por favor, tente novamente com um formato como:\n\n• "gastei 50 casa"\n• "ganhei 100 extra"\n• "devo 200 João"',
      })
    }

    // Executar ação se necessário
    if (comando.tipo === 'registrar_gasto' || comando.tipo === 'registrar_entrada' || comando.tipo === 'registrar_divida') {
      console.log('✅ [PLEN WhatsApp] Executando registro:', comando.dados)
      
      // Verificar permissões do plano (versão que aceita userId)
      // Como estamos usando Admin Client, vamos buscar o plano do profile diretamente
      
      // CRÍTICO: Normalizar o plano para garantir comparação correta
      const planoRaw = profile.plano
      const planoNormalizado = typeof planoRaw === 'string' ? planoRaw.toLowerCase().trim() : null
      const plano = (planoNormalizado || 'teste') as 'teste' | 'basico' | 'premium'
      
      // Log detalhado para debug
      console.log('🔍 [PLEN WhatsApp] ==========================================')
      console.log('🔍 [PLEN WhatsApp] DETECÇÃO DE PLANO - DEBUG COMPLETO')
      console.log('🔍 [PLEN WhatsApp] Profile.plano (raw):', profile.plano)
      console.log('🔍 [PLEN WhatsApp] Profile.plano (tipo):', typeof profile.plano)
      console.log('🔍 [PLEN WhatsApp] Plano normalizado:', planoNormalizado)
      console.log('🔍 [PLEN WhatsApp] Plano final:', plano)
      console.log('🔍 [PLEN WhatsApp] User ID:', userId?.substring(0, 8) + '...')
      console.log('🔍 [PLEN WhatsApp] É teste?', plano === 'teste')
      console.log('🔍 [PLEN WhatsApp] Comparação string:', `"${plano}" === "teste"`)
      console.log('🔍 [PLEN WhatsApp] ==========================================')
      
      const planoDetectadoMsg = `🔍 [PLEN WhatsApp] DETECÇÃO DE PLANO - Raw: ${profile.plano}, Normalizado: ${planoNormalizado}, Final: ${plano}, É teste? ${plano === 'teste'}`
      addLog('info', planoDetectadoMsg)
      
      // Obter features baseado no plano
      // IMPORTANTE: obterFeaturesUsuario precisa de autenticação, mas estamos usando Admin Client
      // Vamos usar as features diretamente do objeto featuresPorPlano
      const features = {
        teste: {
          podeCriarRegistros: true,
          limiteRegistrosMensais: 10,
          podeCriarDividas: false,
          podeCriarEmprestimos: false,
          podeRegistrarSalario: false,
          podeUsarCalendario: false,
          podeUsarMetas: false,
          limiteMetas: 0,
          podeUsarDashboard: true,
          podeUsarDashboardAvancado: false,
          podeExportarRelatorios: false,
          podeExportarAvancado: false,
          podeCriarUsuarios: true,
          limiteUsuarios: 2,
          podeUploadDocumentos: false,
          podeUsarGameDinamico: false,
          podeUsarFiltrosAvancados: false,
        },
        basico: {
          podeCriarRegistros: true,
          limiteRegistrosMensais: null,
          podeCriarDividas: true,
          podeCriarEmprestimos: false,
          podeRegistrarSalario: true,
          podeUsarCalendario: true,
          podeUsarMetas: true,
          limiteMetas: 3,
          podeUsarDashboard: true,
          podeUsarDashboardAvancado: false,
          podeExportarRelatorios: true,
          podeExportarAvancado: false,
          podeCriarUsuarios: true,
          limiteUsuarios: 10,
          podeUploadDocumentos: false,
          podeUsarGameDinamico: false,
          podeUsarFiltrosAvancados: true,
        },
        premium: {
          podeCriarRegistros: true,
          limiteRegistrosMensais: null,
          podeCriarDividas: true,
          podeCriarEmprestimos: true,
          podeRegistrarSalario: true,
          podeUsarCalendario: true,
          podeUsarMetas: true,
          limiteMetas: null,
          podeUsarDashboard: true,
          podeUsarDashboardAvancado: true,
          podeExportarRelatorios: true,
          podeExportarAvancado: true,
          podeCriarUsuarios: true,
          limiteUsuarios: null,
          podeUploadDocumentos: true,
          podeUsarGameDinamico: true,
          podeUsarFiltrosAvancados: true,
        },
      }[plano]
      
      // Verificar limite de registros (adaptado para funcionar sem sessão)
      // IMPORTANTE: Contar TODOS os registros do mês atual de TODOS os usuários do account_owner_id
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)
      
      // Contar registros do mês atual usando created_at (data de criação)
      // CRÍTICO: Contar TODOS os tipos de registros (entrada, saida, divida)
      const registrosMesAtual = registros.filter((r: any) => {
        // SEMPRE usar created_at para contar (quando o registro foi criado)
        // Se não tem created_at, usar data_registro como fallback
        let dataCriacao: Date
        if (r.created_at) {
          dataCriacao = new Date(r.created_at)
        } else if (r.data_registro) {
          dataCriacao = new Date(r.data_registro)
        } else {
          // Se não tem nenhuma data, não contar
          return false
        }
        // Verificar se está dentro do mês atual
        return dataCriacao >= inicioMes && dataCriacao <= fimMes
      }).length
      
      // Log detalhado dos registros do mês para debug
      const registrosMesDetalhados = registros.filter((r: any) => {
        let dataCriacao: Date
        if (r.created_at) {
          dataCriacao = new Date(r.created_at)
        } else if (r.data_registro) {
          dataCriacao = new Date(r.data_registro)
        } else {
          return false
        }
        return dataCriacao >= inicioMes && dataCriacao <= fimMes
      })
      
      console.log('📊 [PLEN WhatsApp] Detalhes dos registros do mês:')
      registrosMesDetalhados.forEach((r: any, index: number) => {
        console.log(`  ${index + 1}. Tipo: ${r.tipo}, Valor: ${r.valor}, Created: ${r.created_at}, Data: ${r.data_registro}`)
      })
      
      console.log('📊 [PLEN WhatsApp] ==========================================')
      console.log('📊 [PLEN WhatsApp] VERIFICAÇÃO DE LIMITE DE REGISTROS MENSAL')
      console.log('📊 [PLEN WhatsApp] Plano:', plano)
      console.log('📊 [PLEN WhatsApp] Limite configurado:', features.limiteRegistrosMensais)
      console.log('📊 [PLEN WhatsApp] Registros encontrados (total):', registros.length)
      console.log('📊 [PLEN WhatsApp] Registros do mês atual:', registrosMesAtual)
      console.log('📊 [PLEN WhatsApp] Início do mês:', inicioMes.toISOString())
      console.log('📊 [PLEN WhatsApp] Fim do mês:', fimMes.toISOString())
      console.log('📊 [PLEN WhatsApp] ==========================================')
      
      addLog('info', `📊 [PLEN WhatsApp] VERIFICAÇÃO DE LIMITE - Plano: ${plano}, Limite: ${features.limiteRegistrosMensais}, Registros do mês: ${registrosMesAtual}`)
      
      // Limite baseado no plano (usar features.limiteRegistrosMensais)
      const limite = features.limiteRegistrosMensais === null ? -1 : features.limiteRegistrosMensais
      
      // CRÍTICO: Verificar se atingiu ou EXCEDEU o limite
      // Se limite é 10, permite criar até 9 registros (0-9), bloqueia no 10º
      // IMPORTANTE: A verificação deve ser < limite, não <=
      // Exemplo: limite = 10, registrosMesAtual = 10 → 10 < 10 = false → BLOQUEIA ✓
      // Exemplo: limite = 10, registrosMesAtual = 9 → 9 < 10 = true → PERMITE ✓
      const podeCriar = limite === -1 || registrosMesAtual < limite
      
      console.log('📊 [PLEN WhatsApp] Limite:', limite, '| Registros atuais:', registrosMesAtual, '| Pode criar?', podeCriar)
      
      if (!podeCriar) {
        const mensagemLimite = `❌ Limite de registros mensais atingido para o plano ${plano.toUpperCase()}.\n\n📊 Você já criou ${registrosMesAtual} registro(s) este mês.\n📌 O limite é de ${limite} registro(s) por mês.\n\n💼 Assine um plano Básico ou Premium e tenha registros ilimitados:\n🔗 plenipay.com/planos\n\n✨ Conheça nossos planos e escolha o ideal para você!`
        
        console.log('❌ [PLEN WhatsApp] LIMITE ATINGIDO! Bloqueando criação de registro.')
        addLog('warn', `❌ [PLEN WhatsApp] LIMITE DE REGISTROS MENSAL ATINGIDO! Plano: ${plano}, Registros: ${registrosMesAtual}/${limite}`)
        
        return NextResponse.json({
          response: mensagemLimite,
        })
      }

      // Verificar se pode criar dívidas (apenas planos básico/premium)
      if (comando.tipo === 'registrar_divida' && !features.podeCriarDividas) {
        return NextResponse.json({
          response: `❌ Infelizmente, você não tem acesso à funcionalidade de criar dívidas no seu plano atual (${plano.toUpperCase()}).\n\n💼 Esta funcionalidade está disponível nos planos Básico ou Premium.\n\n📋 Conheça nossos planos e escolha o ideal para você:\n🔗 plenipay.com/planos\n\n✨ Assine um plano e tenha acesso completo ao controle financeiro!`,
        })
      }
      
      // Verificar se pode registrar salários (apenas planos básico/premium)
      // IMPORTANTE: Verificar apenas se pode criar registros em geral
      // "Registrar entrada" é diferente de "registrar salário"
      // O plano TESTE permite registrar entradas genéricas (podeCriarRegistros: true)
      // Mas não permite "salários" como categoria específica (podeRegistrarSalario: false)
      // Via WhatsApp, estamos registrando entradas genéricas, não salários específicos
      // Então verificamos apenas se pode criar registros em geral
      if (!features.podeCriarRegistros) {
        return NextResponse.json({
          response: `❌ Infelizmente, você não tem acesso à funcionalidade de criar registros no seu plano atual (${plano.toUpperCase()}).\n\n💼 Conheça nossos planos e escolha o ideal para você:\n🔗 plenipay.com/planos\n\n✨ Assine um plano e tenha acesso completo ao controle financeiro!`,
        })
      }
      
      // Verificar se é especificamente um "salário" (categoria específica) e se o plano permite
      // Mas entradas genéricas via WhatsApp devem ser permitidas no plano TESTE
      // A categoria "salario" só é bloqueada se o usuário explicitamente mencionar "salário"
      const categoriaLower = (comando.dados.categoria || '').toLowerCase()
      const descricaoLower = (comando.dados.descricao || '').toLowerCase()
      const isSalario = categoriaLower === 'salario' || 
                       descricaoLower.includes('salário') || 
                       descricaoLower.includes('salario')
      
      if (comando.tipo === 'registrar_entrada' && isSalario && !features.podeRegistrarSalario) {
        return NextResponse.json({
          response: `❌ Infelizmente, você não tem acesso à funcionalidade de registrar salários no seu plano atual (${plano.toUpperCase()}).\n\n💼 Esta funcionalidade está disponível nos planos Básico ou Premium.\n\n📋 Conheça nossos planos e escolha o ideal para você:\n🔗 plenipay.com/planos\n\n💡 Dica: Você pode registrar outras entradas normalmente, como "ganhei 500 reais" ou "recebi 300 de cliente".`,
        })
      }

      // ✅ NOVA IMPLEMENTAÇÃO: Verificar limite de envios via WhatsApp usando função dedicada
      // Esta função é mais robusta e isolada, garantindo que a verificação sempre funcione
      const { checkAndRegisterWhatsAppLimit } = await import('@/lib/whatsapp-limit-checker')
      
      console.log('🔥🔥🔥 [PLEN WhatsApp] VERIFICANDO LIMITE DE ENVIOS WHATSAPP 🔥🔥🔥')
      addLog('info', '🔥🔥🔥 [PLEN WhatsApp] VERIFICANDO LIMITE DE ENVIOS WHATSAPP 🔥🔥🔥')
      
      const limitResult = await checkAndRegisterWhatsAppLimit(userId, comando.tipo)
      
      // Se não permitir, retornar mensagem de bloqueio
      if (!limitResult.allowed) {
        console.log('❌ [PLEN WhatsApp] LIMITE BLOQUEADO:', limitResult.message)
        addLog('warn', `❌ [PLEN WhatsApp] LIMITE BLOQUEADO: ${limitResult.message?.substring(0, 100)}`)
        return NextResponse.json({
          response: limitResult.message || `❌ Limite de envios atingido. Você já enviou ${limitResult.currentCount} registro(s) via WhatsApp no plano gratuito.`,
        })
      }
      
      // Se permitir, continuar com o processamento
      console.log('✅ [PLEN WhatsApp] LIMITE OK - Pode continuar:', {
        currentCount: limitResult.currentCount,
        limit: limitResult.limit,
        hasError: !!limitResult.error
      })
      addLog('info', `✅ [PLEN WhatsApp] LIMITE OK - Total: ${limitResult.currentCount} / ${limitResult.limit === -1 ? 'ilimitado' : limitResult.limit}`)
      
      if (limitResult.error) {
        // Logar erro mas continuar (fail-open)
        console.warn('⚠️ [PLEN WhatsApp] Erro na verificação (permitindo):', limitResult.error)
        addLog('warn', `⚠️ [PLEN WhatsApp] Erro na verificação (permitindo): ${limitResult.error}`)
      }
      
      // CÓDIGO ANTIGO REMOVIDO - substituído pela função checkAndRegisterWhatsAppLimit
      // Mantido apenas para referência histórica (remover após testes)
      /*
      if (false && isPlanoTeste) {
        // LOG CLARO - SEMPRE EXECUTA (CONSOLE E MEMÓRIA)
        const logMsg1 = '🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥'
        console.log('\n' + '='.repeat(80))
        console.log(logMsg1)
        console.log('='.repeat(80))
        addLog('info', logMsg1)
        
        const LIMITE_ENVIOS_GRATUITO = 7
        
        try {
          // PASSO 1: Contar envios atuais
          const { data: enviosAtuais, error: errorContagem } = await supabaseAdmin
            .from('whatsapp_envios')
            .select('id')
            .eq('account_owner_id', userId)
          
          if (errorContagem) {
            const errorMsg = `❌ ERRO ao contar envios: ${errorContagem.message}`
            console.error(errorMsg)
            addLog('error', errorMsg)
          }
          
          const totalAtual = enviosAtuais?.length || 0
          const totalMsg = `📊 Total de envios: ${totalAtual} / ${LIMITE_ENVIOS_GRATUITO}`
          console.log(totalMsg)
          addLog('info', totalMsg)
          
          // PASSO 2: Se já atingiu o limite, BLOQUEAR
          if (totalAtual >= LIMITE_ENVIOS_GRATUITO) {
            const limiteMsg = `❌ LIMITE EXCEDIDO! Bloqueando... Total: ${totalAtual}`
            console.log(limiteMsg)
            addLog('warn', limiteMsg)
            return NextResponse.json({
              response: `❌ Você excedeu o limite de ${LIMITE_ENVIOS_GRATUITO} envios de registros via WhatsApp no plano gratuito.\n\n📊 Você já enviou ${totalAtual} registro(s) via WhatsApp.\n\n💼 Para continuar usando o assistente WhatsApp sem limites, assine um plano:\n\n🔗 plenipay.com/planos\n\n✨ Assine agora e tenha acesso ilimitado a todas as funcionalidades!`,
            })
          }
          
          // PASSO 3: INSERIR o novo envio ANTES de processar
          const tipoRegistroEnvio = comando.tipo === 'registrar_entrada' ? 'entrada' : 
                                   comando.tipo === 'registrar_divida' ? 'divida' : 'saida'
          
          const insertMsg = `📝 Inserindo envio: ${tipoRegistroEnvio}`
          console.log(insertMsg)
          addLog('info', insertMsg)
          
          const { data: envioInserido, error: envioError } = await supabaseAdmin
            .from('whatsapp_envios')
            .insert({
              account_owner_id: userId,
              tipo_registro: tipoRegistroEnvio,
              created_at: new Date().toISOString()
            })
            .select()
          
          if (envioError) {
            const errorInsertMsg = `❌ ERRO AO INSERIR! Código: ${envioError.code}, Mensagem: ${envioError.message}, Detalhes: ${envioError.details || 'N/A'}, Hint: ${envioError.hint || 'N/A'}`
            console.error('='.repeat(80))
            console.error('❌❌❌ ERRO CRÍTICO NA INSERÇÃO ❌❌❌')
            console.error(errorInsertMsg)
            console.error('User ID:', userId)
            console.error('Tipo registro:', tipoRegistroEnvio)
            console.error('Erro completo:', JSON.stringify(envioError, null, 2))
            console.error('='.repeat(80))
            addLog('error', errorInsertMsg)
            // CRÍTICO: Logar também com process.stdout.write para garantir que aparece
            process.stdout.write(`\n❌ ERRO AO INSERIR: ${envioError.message}\n`)
          } else {
            const successMsg = `✅ ENVIO REGISTRADO! ID: ${envioInserido?.[0]?.id}`
            console.log('='.repeat(80))
            console.log('✅✅✅ INSERÇÃO BEM-SUCEDIDA ✅✅✅')
            console.log(successMsg)
            console.log('='.repeat(80))
            addLog('info', successMsg)
            // CRÍTICO: Logar também com process.stdout.write
            process.stdout.write(`\n✅ ENVIO REGISTRADO: ID ${envioInserido?.[0]?.id}\n`)
            
            // Verificar total após inserção
            const { data: enviosApos } = await supabaseAdmin
              .from('whatsapp_envios')
              .select('id')
              .eq('account_owner_id', userId)
            
            const totalApos = enviosApos?.length || 0
            const totalAposMsg = `📊 Total após inserção: ${totalApos} / ${LIMITE_ENVIOS_GRATUITO}`
            console.log(totalAposMsg)
            addLog('info', totalAposMsg)
            process.stdout.write(`📊 Total: ${totalApos} / ${LIMITE_ENVIOS_GRATUITO}\n`)
          }
          
          console.log('='.repeat(80) + '\n')
        } catch (error: any) {
          const criticalErrorMsg = `❌ ERRO CRÍTICO no limite: ${error.message}`
          console.error(criticalErrorMsg)
          addLog('error', criticalErrorMsg)
        }
      }
      */

      // Obter usuário da tabela users
      console.log('👤 [PLEN WhatsApp] Buscando usuário para account_owner_id:', userId)
      const user_id = await obterOuCriarUsuarioPadrao(supabaseAdmin, userId)
      console.log('👤 [PLEN WhatsApp] user_id encontrado:', user_id)

      if (!user_id) {
        console.error('❌ [PLEN WhatsApp] Nenhum usuário encontrado na tabela users')
        return NextResponse.json({
          response: '❌ Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro.\n\n📱 Acesse: plenipay.com/configuracoes\n\nVá em "Usuários/Pessoas" e clique em "+ Novo Usuário".',
        })
      }
      
      console.log('📝 [PLEN WhatsApp] Criando registro com:', {
        user_id,
        nome: comando.dados.descricao,
        tipo: comando.dados.tipo,
        valor: comando.dados.valor,
        categoria: comando.dados.categoria || 'outros'
      })
      
      const formData = new FormData()
      formData.append('nome', comando.dados.descricao)
      formData.append('tipo', comando.dados.tipo)
      formData.append('valor', comando.dados.valor.toString())
      formData.append('categoria', comando.dados.categoria || 'outros')
      formData.append('data_registro', new Date().toISOString())
      formData.append('metodo_pagamento', 'dinheiro')
      formData.append('parcelas_totais', '1')
      formData.append('parcelas_pagas', '0')
      formData.append('user_id', user_id)
      
      // Para dívidas, adicionar etiquetas específicas
      if (comando.tipo === 'registrar_divida') {
        formData.append('etiquetas', JSON.stringify(['dívida', 'dinheiro']))
      } else {
        formData.append('etiquetas', JSON.stringify(['dinheiro']))
      }

      // Criar registro usando Admin Client
      // Como estamos no servidor e temos admin client, vamos criar diretamente
      const tipoRegistro = comando.dados.tipo === 'divida' ? 'saida' : comando.dados.tipo
      
      console.log('📝 [PLEN WhatsApp] Tentando criar registro com dados:', {
        user_id: user_id,
        nome: comando.dados.descricao,
        tipo: tipoRegistro,
        valor: comando.dados.valor,
        categoria: comando.dados.categoria || 'outros',
      })
      
      // CRÍTICO: A tabela registros NÃO tem account_owner_id, apenas user_id
      // O account_owner_id está na tabela users, não em registros
      // Também não tem metodo_pagamento - apenas os campos básicos
      const { data: registro, error: registroError } = await supabaseAdmin
        .from('registros')
        .insert({
          user_id: user_id,
          nome: comando.dados.descricao,
          tipo: tipoRegistro,
          valor: comando.dados.valor,
          categoria: comando.dados.categoria || 'outros',
          data_registro: new Date().toISOString(),
          parcelas_totais: 1,
          parcelas_pagas: 0,
          etiquetas: comando.tipo === 'registrar_divida' ? ['dívida', 'dinheiro'] : ['dinheiro'],
        })
        .select()
        .single()

      if (registroError || !registro) {
        console.error('❌ [PLEN WhatsApp] Erro ao criar registro:', registroError)
        console.error('❌ [PLEN WhatsApp] Detalhes do erro:', {
          message: registroError?.message,
          code: registroError?.code,
          details: registroError?.details,
          hint: registroError?.hint,
          dados: comando.dados,
          userId,
          user_id,
        })
        
        // Mensagem de erro mais específica
        let errorMessage = `❌ Erro ao registrar: ${registroError?.message || 'Erro desconhecido'}`
        if (registroError?.message?.includes('user_id') || registroError?.code === '23503') {
          errorMessage = '❌ Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro.\n\n📱 Acesse: plenipay.com/configuracoes\n\nVá em "Usuários/Pessoas" e clique em "+ Novo Usuário".'
        } else if (registroError?.message?.includes('permission') || registroError?.code === '42501') {
          errorMessage = '❌ Erro de permissão. Verifique se sua conta está ativa.'
        }
        
        // Lançar erro para ser capturado pelo catch geral
        throw new Error(errorMessage)
      }
      
      console.log('✅ [PLEN WhatsApp] Registro criado com sucesso:', registro.id)
      console.log('📋 [PLEN WhatsApp] Dados do registro criado:', {
        id: registro.id,
        user_id: registro.user_id,
        nome: registro.nome,
        tipo: registro.tipo,
        valor: registro.valor,
        created_at: registro.created_at,
        data_registro: registro.data_registro
      })
      console.log('🔗 [PLEN WhatsApp] Relação: account_owner_id (profile) -> user_id (users) -> registro.user_id:', {
        account_owner_id: userId.substring(0, 8) + '...',
        user_id_na_tabela_users: user_id?.substring(0, 8) + '...',
        registro_user_id: registro.user_id?.substring(0, 8) + '...'
      })

      const tipoNome = comando.tipo === 'registrar_entrada' ? 'entrada' : comando.tipo === 'registrar_divida' ? 'dívida' : 'gasto'
      
      // Extrair nome do item da descrição ou usar nomeExtraido
      let nomeDoItem: string | null = null
      
      if (comando.dados.nomeExtraido) {
        nomeDoItem = comando.dados.nomeExtraido
      } else if (comando.dados.descricao) {
        // Tentar extrair nome da descrição
        // Se descrição é "Recebeu de X", extrair "X"
        const recebeuMatch = comando.dados.descricao.match(/Recebeu de (.+)/i)
        if (recebeuMatch && recebeuMatch[1]) {
          nomeDoItem = recebeuMatch[1].trim()
        } 
        // Se descrição é "Gasto em X", extrair "X"
        else {
          const gastoMatch = comando.dados.descricao.match(/Gasto em (.+)/i)
          if (gastoMatch && gastoMatch[1]) {
            nomeDoItem = gastoMatch[1].trim()
          }
          // Se descrição não é padrão, usar ela como nome
          else if (comando.dados.descricao !== 'Entrada via WhatsApp' && 
                   comando.dados.descricao !== 'Gasto via WhatsApp' &&
                   comando.dados.descricao !== 'Dívida via WhatsApp') {
            nomeDoItem = comando.dados.descricao
          }
        }
      }
      
      // Usar nome do item ou fallback
      const nomeFinal = nomeDoItem || 'Item'
      
      // Obter data do registro
      const dataRegistro = registro?.data_registro ? new Date(registro.data_registro) : new Date()
      
      // Mapear categorias para emojis
      const categoriaEmojis: { [key: string]: string } = {
        'moradia': '🏠',
        'casa': '🏠',
        'alimentação': '🍽️',
        'alimentacao': '🍽️',
        'transporte': '🚗',
        'saúde': '🏥',
        'saude': '🏥',
        'educação': '📚',
        'educacao': '📚',
        'lazer': '🎮',
        'compras': '🛍️',
        'pessoa': '👤',
        'outros': '📦'
      }
      
      const categoriaFinal = comando.dados.categoria || 'outros'
      const categoriaCapitalizada = categoriaFinal.charAt(0).toUpperCase() + categoriaFinal.slice(1).toLowerCase()
      const emojiCategoria = categoriaEmojis[categoriaFinal.toLowerCase()] || '📦'
      
      // Formatar data como DD-MM-YYYY
      const dataFormatada = format(dataRegistro, 'dd-MM-yyyy', { locale: ptBR })
      
      // Formatar valor em reais
      const valorFormatado = comando.dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      
      // Escolher emoji baseado no tipo: 🟢 (verde) para entrada, 🔴 (vermelho) para saída
      const emojiValor = comando.tipo === 'registrar_entrada' ? '🟢' : '🔴'
      
      // Construir mensagem no formato solicitado
      let resposta = `📌 ${nomeFinal}\n${emojiValor} R$ ${valorFormatado}\n📅 ${dataFormatada}\n🗂️ Categoria: ${categoriaCapitalizada} ${emojiCategoria}\n\n✨ Seu ${tipoNome} foi registrado com sucesso!`
      
      // Verificar se detectou múltiplos registros (usando flag do comando OU variáveis externas)
      // Log detalhado para debug
      console.log('[PLEN WhatsApp] ==========================================')
      console.log('[PLEN WhatsApp] VERIFICANDO MÚLTIPLOS REGISTROS NA RESPOSTA')
      console.log('[PLEN WhatsApp] Comando:', JSON.stringify(comando, null, 2))
      console.log('[PLEN WhatsApp] temMultiplosRegistros (comando):', (comando as any)?.temMultiplosRegistros)
      console.log('[PLEN WhatsApp] totalRegistros (comando):', (comando as any)?.totalRegistros)
      console.log('[PLEN WhatsApp] temMultiplosRegistrosFlag (variável):', temMultiplosRegistrosFlag)
      console.log('[PLEN WhatsApp] totalRegistrosFlag (variável):', totalRegistrosFlag)
      console.log('[PLEN WhatsApp] ==========================================')
      
      // Verificação segura: usar variáveis externas como fallback se flags do comando não estiverem disponíveis
      const comandoObj = comando as any
      const temMultiplosDoComando = comandoObj && typeof comandoObj === 'object' && comandoObj.temMultiplosRegistros === true
      const totalRegistrosDoComando = comandoObj && typeof comandoObj === 'object' ? (comandoObj.totalRegistros || 0) : 0
      
      // Usar variáveis externas se disponíveis, senão usar do comando
      const temMultiplos = temMultiplosRegistrosFlag || temMultiplosDoComando
      const totalRegistros = totalRegistrosFlag > 0 ? totalRegistrosFlag : totalRegistrosDoComando
      
      console.log('[PLEN WhatsApp] Resultado da verificação:', {
        temMultiplos,
        totalRegistros,
        vaiAdicionarMensagem: temMultiplos && totalRegistros > 1
      })
      
      // CRÍTICO: Logar no stdout
      process.stdout.write('[PLEN WhatsApp] VERIFICACAO FINAL - temMultiplos: ' + temMultiplos + ', totalRegistros: ' + totalRegistros + '\n')
      process.stdout.write('[PLEN WhatsApp] Vai adicionar mensagem? ' + (temMultiplos && totalRegistros > 1) + '\n')
      
      if (temMultiplos && totalRegistros > 1) {
        process.stdout.write('[PLEN WhatsApp] *** ADICIONANDO MENSAGEM DE AVISO ***\n')
        console.log('[PLEN WhatsApp] ✅ ADICIONANDO MENSAGEM DE AVISO SOBRE MÚLTIPLOS REGISTROS')
        // Adicionar mensagem pedindo para enviar um registro de cada vez
        resposta += `\n\n⚠️ *Atenção:* Detectei ${totalRegistros} registros na sua mensagem, mas registrei apenas o primeiro.\n\n💡 *Para registrar todos os registros de forma organizada, envie um registro de cada vez:*\n\n• "gastei 30 casa"\n• "ganhei 50 carro"\n\n✅ Assim eu consigo registrar tudo corretamente!`
      } else {
        process.stdout.write('[PLEN WhatsApp] *** NAO ADICIONOU MENSAGEM - temMultiplos: ' + temMultiplos + ', totalRegistros: ' + totalRegistros + ' ***\n')
        console.log('[PLEN WhatsApp] ❌ NÃO ADICIONOU MENSAGEM - temMultiplos:', temMultiplos, 'totalRegistros:', totalRegistros)
      }
      
      // Adicionar log de sucesso
      addLog('info', `✨ [PLEN WhatsApp] Registro criado com sucesso! ${tipoNome}: R$ ${valorFormatado}, Categoria: ${categoriaCapitalizada}`)
      
      return NextResponse.json({
        response: resposta,
      })
    }

    // Consultas
    if (comando.tipo === 'consultar_dividas') {
      if (dividas.length === 0) {
        return NextResponse.json({
          response: '✅ Você não possui dívidas cadastradas.',
        })
      }
      
      const listaDividas = dividas.slice(0, 5).map((d: any) => 
        `• ${d.nome}: R$ ${parseFloat(d.valor).toFixed(2)}`
      ).join('\n')
      
      return NextResponse.json({
        response: `📋 Você possui ${dividas.length} dívida(s):\n\n${listaDividas}\n\n💰 Total: R$ ${totalDividas.toFixed(2)}`,
      })
    }

    if (comando.tipo === 'gastos_semana') {
      return NextResponse.json({
        response: `📊 Você gastou R$ ${gastosSemana.toFixed(2)} nesta semana.`,
      })
    }
    
    if (comando.tipo === 'gastos_mes') {
      return NextResponse.json({
        response: `📊 Você gastou R$ ${gastosMes.toFixed(2)} neste mês.`,
      })
    }
    
    if (comando.tipo === 'relatorio_detalhado') {
      const dias = comando.dados?.dias || 7
      const isHoje = comando.dados?.isHoje || false
      
      // Calcular data inicial
      const dataFim = new Date()
      dataFim.setHours(23, 59, 59, 999) // Fim do dia
      
      let dataInicio: Date
      if (isHoje) {
        // Apenas registros de hoje
        dataInicio = new Date()
        dataInicio.setHours(0, 0, 0, 0)
      } else {
        // Últimos N dias
        dataInicio = new Date(dataFim)
        dataInicio.setDate(dataInicio.getDate() - dias)
        dataInicio.setHours(0, 0, 0, 0)
      }
      
      // Filtrar registros do período (apenas saídas/gastos)
      const registrosPeriodo = registros.filter((r: any) => {
        const dataRegistro = new Date(r.data_registro)
        return dataRegistro >= dataInicio && 
               dataRegistro <= dataFim && 
               r.tipo === 'saida'
      })
      
      // Ordenar por data (mais recente primeiro)
      registrosPeriodo.sort((a: any, b: any) => {
        const dataA = new Date(a.data_registro).getTime()
        const dataB = new Date(b.data_registro).getTime()
        return dataB - dataA
      })
      
      if (registrosPeriodo.length === 0) {
        const periodoTexto = isHoje ? 'hoje' : `nos últimos ${dias} dias`
        return NextResponse.json({
          response: `📊 Você não teve gastos ${periodoTexto}.`,
        })
      }
      
      // Mapear categorias para emojis
      const categoriaEmojis: { [key: string]: string } = {
        'moradia': '🏠',
        'casa': '🏠',
        'alimentação': '🍔',
        'alimentacao': '🍔',
        'transporte': '🚗',
        'saúde': '🏥',
        'saude': '🏥',
        'educação': '📚',
        'educacao': '📚',
        'lazer': '🎮',
        'compras': '🛍️',
        'pessoa': '👤',
        'outros': '📦'
      }
      
      // Formatar data do período
      const dataFormatada = isHoje 
        ? format(dataFim, 'dd-MM-yyyy', { locale: ptBR })
        : `${format(dataInicio, 'dd-MM-yyyy', { locale: ptBR })} até ${format(dataFim, 'dd-MM-yyyy', { locale: ptBR })}`
      
      // Construir relatório no formato da imagem
      // Apenas título e subtítulo em negrito
      const dataFormatadaTitulo = isHoje 
        ? format(dataFim, 'dd-MM-yyyy', { locale: ptBR })
        : format(dataFim, 'dd-MM-yyyy', { locale: ptBR })
      
      let relatorio = `📈 *Relatório Financeiro*\n📊 *Relatório detalhado dos seus gastos ${isHoje ? 'de hoje' : `dos últimos ${dias} dias`} (${dataFormatadaTitulo}):*\n\n`
      
      // Listar cada registro no formato da imagem (sem negrito nos campos)
      registrosPeriodo.forEach((registro: any) => {
        const dataRegistro = new Date(registro.data_registro)
        const dataFormatadaRegistro = format(dataRegistro, 'dd-MM-yyyy', { locale: ptBR })
        const valorFormatado = parseFloat(registro.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const categoria = registro.categoria || 'outros'
        const categoriaCapitalizada = categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase()
        const emojiCategoria = categoriaEmojis[categoria.toLowerCase()] || '📦'
        
        // Formato exato da imagem (sem negrito nos campos):
        // 📅 Data: 01-05-2025
        // 📝 Descrição: Café
        // 🔴 Valor: R$12,00
        // 📁 Categoria: Alimentação 🍔
        relatorio += `📅 Data: ${dataFormatadaRegistro}\n`
        relatorio += `📝 Descrição: ${registro.nome || 'Sem descrição'}\n`
        relatorio += `🔴 Valor: R$ ${valorFormatado}\n`
        relatorio += `📁 Categoria: ${categoriaCapitalizada} ${emojiCategoria}\n\n`
      })
      
      return NextResponse.json({
        response: relatorio.trim(),
      })
    }
    
    if (comando.tipo === 'total_entradas') {
      return NextResponse.json({
        response: `💰 Total de entradas: R$ ${totalEntradas.toFixed(2)}`,
      })
    }
    
    if (comando.tipo === 'total_saidas') {
      return NextResponse.json({
        response: `💸 Total de saídas: R$ ${totalSaidas.toFixed(2)}`,
      })
    }

    // Verificar conta - mostrar email, key e data de ativação
    if (comando.tipo === 'verificar_conta') {
      console.log('✅ [PLEN WhatsApp] ==========================================')
      console.log('✅ [PLEN WhatsApp] PROCESSANDO COMANDO VERIFICAR CONTA')
      console.log('✅ [PLEN WhatsApp] User ID:', userId)
      console.log('✅ [PLEN WhatsApp] ==========================================')
      
      // Buscar dados do perfil (email e whatsapp_key)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email, whatsapp_key')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        console.error('❌ [PLEN WhatsApp] Erro ao buscar perfil:', profileError)
        return NextResponse.json({
          response: '❌ Erro ao buscar informações da conta. Tente novamente.',
        })
      }

      const email = profileData.email || 'Não informado'
      const whatsappKey = profileData.whatsapp_key || 'Não configurada'

      // Buscar data de ativação da sessão WhatsApp
      let dataAtivacao: string | null = null
      try {
        const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('whatsapp_sessions')
          .select('created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!sessionError && sessionData) {
          // Usar created_at como data de ativação (primeira vez que foi ativada)
          dataAtivacao = sessionData.created_at
        } else if (sessionError && sessionError.code !== 'PGRST116') {
          // PGRST116 = nenhum resultado encontrado (não é erro crítico)
          console.warn('⚠️ [PLEN WhatsApp] Erro ao buscar sessão:', sessionError)
        }
      } catch (error: any) {
        // Se a tabela não existe, continuar mesmo assim
        if (error?.message?.includes('does not exist') || error?.code === '42P01') {
          console.warn('⚠️ [PLEN WhatsApp] Tabela whatsapp_sessions não existe. Execute o SQL ADICIONAR-WHATSAPP-KEY.sql')
        } else {
          console.warn('⚠️ [PLEN WhatsApp] Erro ao buscar sessão:', error)
        }
        // Continuar mesmo sem data de ativação
      }

      // Formatar data de ativação
      let dataFormatada = 'Não disponível'
      if (dataAtivacao) {
        try {
          const data = new Date(dataAtivacao)
          dataFormatada = format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        } catch (error) {
          console.error('❌ [PLEN WhatsApp] Erro ao formatar data:', error)
        }
      }

      // Construir resposta
      const resposta = `📋 *Informações da sua conta:*\n\n` +
        `📧 *Email:*\n${email}\n\n` +
        `🔑 *Chave WhatsApp:*\n${whatsappKey}\n\n` +
        `📅 *Ativada em:*\n${dataFormatada}\n\n` +
        `💡 *Dica:* Guarde essas informações em local seguro!`

      return NextResponse.json({
        response: resposta,
      })
    }
    
    // Processar comando de lembrete
    if (comando.tipo === 'criar_lembrete') {
      console.log('⏰ [PLEN WhatsApp] ==========================================')
      console.log('⏰ [PLEN WhatsApp] PROCESSANDO LEMBRETE')
      console.log('⏰ [PLEN WhatsApp] Comando:', comando)
      console.log('⏰ [PLEN WhatsApp] ==========================================')
      
      const textoCompleto = comando.dados.textoCompleto || ''
      const mensagemOriginal = comando.dados.mensagemOriginal || message
      
      console.log('⏰ [PLEN WhatsApp] Texto completo:', textoCompleto)
      console.log('⏰ [PLEN WhatsApp] Mensagem original:', mensagemOriginal)
      
      // Extrair descrição do lembrete
      // Exemplo: "me lembre de pagar o cartão amanhã 10 horas"
      // Descrição: "pagar o cartão"
      
      let descricao = ''
      let dataLembrete: Date = new Date()
      let horario: string | null = null
      
      // Extrair descrição (tudo antes de palavras de tempo)
      // Padrões de tempo: amanhã, hoje, depois, em, às, as, horas, etc
      // Exemplo: "pagar o cartão amanhã 11 horas" -> descrição: "pagar o cartão"
      const palavrasTempo = /(?:amanhã|amanha|hoje|depois|em|às|as|as\s+\d+|às\s+\d+|\d+\s+horas?|\d+:\d+|\d+h|dia\s+\d+|dia\s+\d+\/\d+)/i
      const matchTempo = textoCompleto.match(palavrasTempo)
      
      if (matchTempo) {
        const indexTempo = textoCompleto.toLowerCase().indexOf(matchTempo[0].toLowerCase())
        descricao = textoCompleto.substring(0, indexTempo).trim()
      } else {
        // Se não tem palavra de tempo, usar tudo como descrição
        descricao = textoCompleto
      }
      
      // Limpar descrição (remover "de", "para", etc do início se houver)
      descricao = descricao.replace(/^(?:de|para|a|o|em|no|na)\s+/i, '').trim()
      
      console.log('⏰ [PLEN WhatsApp] Extração de lembrete:', {
        textoCompleto,
        descricao,
        matchTempo: matchTempo?.[0]
      })
      
      // Extrair data
      const hoje = new Date()
      const hojeLimpo = startOfDay(hoje)
      
      // Verificar "amanhã" ou "amanha"
      if (/amanh[ãa]/i.test(textoCompleto)) {
        dataLembrete = addDays(hojeLimpo, 1)
      } else if (/hoje/i.test(textoCompleto)) {
        dataLembrete = hojeLimpo
      } else {
        // Tentar extrair data específica (DD/MM/YYYY ou DD-MM-YYYY)
        const dataMatch = textoCompleto.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/)
        if (dataMatch) {
          try {
            const dia = parseInt(dataMatch[1])
            const mes = parseInt(dataMatch[2])
            const ano = dataMatch[3] ? parseInt(dataMatch[3]) : hoje.getFullYear()
            // Se ano tem 2 dígitos, assumir 20XX
            const anoCompleto = ano < 100 ? 2000 + ano : ano
            dataLembrete = new Date(anoCompleto, mes - 1, dia)
            
            // Se a data é no passado, assumir próximo ano
            if (dataLembrete < hoje) {
              dataLembrete = new Date(anoCompleto + 1, mes - 1, dia)
            }
          } catch {
            dataLembrete = addDays(hojeLimpo, 1) // Fallback: amanhã
          }
        } else {
          // Padrão: amanhã
          dataLembrete = addDays(hojeLimpo, 1)
        }
      }
      
      // Extrair horário
      // Padrões: "10 horas", "10:00", "10h", "às 10", "as 10", "10 horas da manhã", etc
      const horaMatch = textoCompleto.match(/(?:às|as|à|a)?\s*(\d{1,2})(?::(\d{2}))?(?:\s*horas?|h)?(?:\s*(?:da\s+)?(?:manhã|manha|tarde|noite))?/i)
      if (horaMatch) {
        let hora = parseInt(horaMatch[1])
        const minuto = horaMatch[2] ? parseInt(horaMatch[2]) : 0
        const segundo = 0
        
        // Verificar se é manhã/tarde/noite
        const periodo = textoCompleto.match(/(?:da\s+)?(manhã|manha|tarde|noite)/i)
        if (periodo) {
          const periodoLower = periodo[1].toLowerCase()
          if ((periodoLower === 'tarde' || periodoLower === 'noite') && hora < 12) {
            hora += 12 // Converter para 24h
          }
        }
        
        if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59) {
          dataLembrete = setHours(dataLembrete, hora)
          dataLembrete = setMinutes(dataLembrete, minuto)
          dataLembrete = setSeconds(dataLembrete, segundo)
          horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`
        }
      } else {
        // Se não especificou horário, usar 10:00:00 como padrão
        dataLembrete = setHours(dataLembrete, 10)
        dataLembrete = setMinutes(dataLembrete, 0)
        dataLembrete = setSeconds(dataLembrete, 0)
        horario = '10:00:00'
      }
      
      // Se descrição está vazia, usar padrão
      if (!descricao || descricao.trim() === '') {
        descricao = 'Lembrete'
      }
      
      console.log('⏰ [PLEN WhatsApp] Lembrete extraído:', {
        descricao,
        dataLembrete: dataLembrete.toISOString(),
        horario,
      })
      
      // IMPORTANTE: user_id na tabela lembretes deve referenciar auth.users(id)
      // O userId já é o auth.uid(), então podemos usá-lo diretamente
      // A tabela users é customizada e não tem relação direta com auth.users
      const user_id = userId // userId já é auth.uid(), que é o que a foreign key espera
      
      console.log('👤 [PLEN WhatsApp] Usando user_id (auth.uid()):', user_id)
      
      // Verificar se a tabela existe primeiro (teste simples)
      // NOTA: Ignorar erros de "nenhum resultado" (PGRST116) - isso é normal
      console.log('🔍 [PLEN WhatsApp] Verificando se tabela lembretes existe...')
      console.log('🔍 [PLEN WhatsApp] Usando supabaseAdmin:', !!supabaseAdmin)
      
      // Tentar uma query simples primeiro
      const { data: testTable, error: testError } = await supabaseAdmin
        .from('lembretes')
        .select('id')
        .limit(1)
      
      // Ignorar erro PGRST116 (nenhum resultado) - isso é normal quando a tabela está vazia
      if (testError && testError.code !== 'PGRST116') {
        console.error('❌ [PLEN WhatsApp] Erro ao verificar tabela lembretes:', testError)
        console.error('❌ [PLEN WhatsApp] Detalhes do erro de verificação:', {
          code: testError?.code,
          message: testError?.message,
          details: testError?.details,
          hint: testError?.hint,
          fullError: JSON.stringify(testError, null, 2),
        })
        
        // Verificar se é erro de tabela não encontrada (código específico)
        const isTableNotFound = testError?.code === '42P01'
        
        // Verificar se é erro de permissão (RLS bloqueando)
        const isPermissionError = testError?.code === '42501'
        
        if (isTableNotFound) {
          console.error('❌ [PLEN WhatsApp] Tabela de lembretes não encontrada!')
          return NextResponse.json({
            response: '❌ A tabela de lembretes ainda não foi criada.\n\n📋 Execute o script SQL: CRIAR-TABELA-LEMBRETES.sql no Supabase para criar a tabela.\n\n📱 Acesse: https://supabase.com/dashboard\n\n1. Vá em SQL Editor\n2. Cole o conteúdo do arquivo CRIAR-TABELA-LEMBRETES.sql\n3. Execute o script\n\n💡 Se já executou, aguarde alguns segundos e tente novamente.',
          })
        } else if (isPermissionError) {
          console.error('❌ [PLEN WhatsApp] Erro de permissão ao acessar tabela lembretes!')
          return NextResponse.json({
            response: '❌ Erro de permissão ao acessar tabela lembretes.\n\n💡 As políticas RLS podem estar bloqueando o acesso.\n\n📋 Execute o script SQL: CRIAR-TABELA-LEMBRETES.sql novamente no Supabase.\n\n💡 Se o problema persistir, desabilite temporariamente RLS:\n   ALTER TABLE lembretes DISABLE ROW LEVEL SECURITY;',
          })
        } else {
          // Outro tipo de erro - mas não bloquear, apenas logar
          console.warn('⚠️ [PLEN WhatsApp] Aviso ao verificar tabela (mas continuando):', testError?.code, testError?.message)
          // Continuar mesmo assim - pode ser um erro não crítico
        }
      } else {
        console.log('✅ [PLEN WhatsApp] Tabela lembretes existe e está acessível')
      }
      
      // Salvar lembrete no banco
      const { data: lembrete, error: lembreteError } = await supabaseAdmin
        .from('lembretes')
        .insert({
          user_id: user_id,
          account_owner_id: userId,
          descricao: descricao,
          data_lembrete: dataLembrete.toISOString(),
          horario: horario,
          status: 'pendente',
        })
        .select()
        .single()
      
      if (lembreteError || !lembrete) {
        console.error('❌ [PLEN WhatsApp] Erro ao criar lembrete:', lembreteError)
        console.error('❌ [PLEN WhatsApp] Detalhes do erro:', {
          code: lembreteError?.code,
          message: lembreteError?.message,
          details: lembreteError?.details,
          hint: lembreteError?.hint,
          fullError: JSON.stringify(lembreteError, null, 2),
        })
        
        // Verificar se é erro de tabela não encontrada (código específico)
        if (lembreteError?.code === '42P01') {
          console.error('❌ [PLEN WhatsApp] Tabela de lembretes não encontrada durante inserção!')
          return NextResponse.json({
            response: '❌ A tabela de lembretes ainda não foi criada.\n\n📋 Execute o script SQL: CRIAR-TABELA-LEMBRETES.sql no Supabase para criar a tabela.\n\n📱 Acesse: https://supabase.com/dashboard\n\n1. Vá em SQL Editor\n2. Cole o conteúdo do arquivo CRIAR-TABELA-LEMBRETES.sql\n3. Execute o script\n\n💡 Se já executou, aguarde alguns segundos e tente novamente.',
          })
        }
        
        // Verificar se é erro de permissão (RLS) - código específico
        if (lembreteError?.code === '42501') {
          console.error('❌ [PLEN WhatsApp] Erro de permissão ao criar lembrete!')
          return NextResponse.json({
            response: '❌ Erro de permissão ao criar lembrete.\n\n💡 Verifique se as políticas RLS da tabela lembretes estão configuradas corretamente no Supabase.\n\n📋 Execute novamente o script CRIAR-TABELA-LEMBRETES.sql para garantir que as políticas estão corretas.',
          })
        }
        
        // Verificar se é erro de foreign key (usuário não existe em auth.users)
        if (lembreteError?.code === '23503') {
          console.error('❌ [PLEN WhatsApp] Erro de foreign key - usuário não encontrado em auth.users!')
          console.error('❌ [PLEN WhatsApp] user_id usado:', user_id)
          return NextResponse.json({
            response: '❌ Erro ao criar lembrete: usuário não encontrado.\n\n💡 O sistema não conseguiu identificar seu usuário corretamente.\n\n📱 Tente novamente em alguns instantes ou entre em contato com o suporte.',
          })
        }
        
        // Retornar erro específico mas ainda responder
        return NextResponse.json({
          response: `❌ Erro ao criar lembrete: ${lembreteError?.message || 'Erro desconhecido'}\n\n💡 Código do erro: ${lembreteError?.code || 'N/A'}\n\n📋 Verifique se a tabela de lembretes foi criada no Supabase e se as políticas RLS estão corretas.`,
        })
      }
      
      console.log('✅ [PLEN WhatsApp] Lembrete criado:', lembrete.id)
      
      // Buscar profile para obter nome do usuário
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nome')
        .eq('id', userId)
        .single()
      
      // Formatar resposta no formato da imagem
      const nomeUsuario = profile?.nome || 'Usuário'
      const dataFormatada = format(dataLembrete, 'dd-MM-yyyy', { locale: ptBR })
      const horarioFormatado = horario || '10:00:00'
      
      const resposta = `Ei, ${nomeUsuario}! 💳\nQue ótimo que você está cuidando das suas finanças! 💸\n\n💳 Compromisso:\n📝 Descrição: ${descricao}\n📅 Data: ${dataFormatada}\n⏰ Horário: ${horarioFormatado}\n\nSeja responsável e o futuro você vai agradecer! 😉`
      
      console.log('✅ [PLEN WhatsApp] Resposta do lembrete criada:', resposta)
      console.log('✅ [PLEN WhatsApp] Retornando resposta...')
      
      return NextResponse.json({
        response: resposta,
      })
    }

    // CRÍTICO: Verificar se é "verificar conta" antes de retornar mensagem padrão
    // Isso garante que mesmo se o comando não foi detectado antes, ainda será processado aqui
    const msgLowerCheck = message.toLowerCase().trim()
    const isVerificarConta = (msgLowerCheck.includes('verificar') && msgLowerCheck.includes('conta')) ||
                            msgLowerCheck === 'verificar conta' ||
                            msgLowerCheck === 'ver conta' ||
                            msgLowerCheck.includes('minha conta') ||
                            msgLowerCheck.includes('dados da conta')
    
    // Verificar novamente se comando é válido antes de acessar propriedades
    if (!comando || typeof comando !== 'object' || !comando.tipo) {
      console.error('❌ [PLEN WhatsApp] Comando inválido antes de verificar conta:', comando)
      return NextResponse.json({
        response: '❌ Não consegui entender sua mensagem. Por favor, tente novamente com um formato como:\n\n• "gastei 50 casa"\n• "ganhei 100 extra"\n• "devo 200 João"',
      })
    }

    if (isVerificarConta && comando.tipo === 'conversa') {
      console.log('⚠️ [PLEN WhatsApp] Comando "verificar conta" detectado no fallback!')
      console.log('⚠️ [PLEN WhatsApp] Forçando tipo para verificar_conta')
      comando.tipo = 'verificar_conta'
      // Não retornar aqui, deixar o handler processar
    }

    // Resposta padrão/boas-vindas com mensagem melhorada
    const primeiraMensagem = message.toLowerCase().trim()
    const isBoasVindas = /^(oi|olá|olá!|oi!|hello|hi|bom dia|boa tarde|boa noite)$/i.test(primeiraMensagem)
    
    if (isBoasVindas) {
      return NextResponse.json({
        response: `👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\nComo posso ajudar você hoje? 🤗`,
      })
    }

    // Resposta padrão para mensagens não reconhecidas (apenas se não for verificar_conta)
    if (comando && typeof comando === 'object' && comando.tipo && comando.tipo !== 'verificar_conta') {
      return NextResponse.json({
        response: `🤔 Ops, não entendi muito bem o que você quis dizer. Mas não se preocupe, vou te ajudar! 😊\n\n📋 Você pode me pedir para:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n\n💡 Dica: Você pode falar de forma natural, como se estivesse conversando comigo! Por exemplo:\n• "gastei 30 reais de ônibus"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais"\n\nDigite "oi" para ver todas as opções disponíveis! 😊`,
      })
    }
  } catch (error: any) {
    console.error('❌ [PLEN WhatsApp] ==========================================')
    console.error('❌ [PLEN WhatsApp] ERRO GERAL NO PROCESSAMENTO')
    console.error('❌ [PLEN WhatsApp] Error:', error.message)
    console.error('❌ [PLEN WhatsApp] Stack:', error.stack?.substring(0, 500))
    console.error('❌ [PLEN WhatsApp] Detalhes:', {
      message: error.message,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    console.error('❌ [PLEN WhatsApp] ==========================================')
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao processar mensagem'
    let responseMessage = 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.'
    
    // Garantir que error.message seja uma string
    const errorMsg = error?.message ? String(error.message) : 'Erro desconhecido'
    
    if (errorMsg.includes('usuário') || errorMsg.includes('user') || error.code === '23503') {
      responseMessage = '❌ Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro.\n\n📱 Acesse: plenipay.com/configuracoes\n\nVá em "Usuários/Pessoas" e clique em "+ Novo Usuário".'
    } else if (errorMsg.includes('plano') || errorMsg.includes('limite')) {
      responseMessage = `❌ ${errorMsg}`
    } else if (errorMsg.includes('permission') || errorMsg.includes('permissão') || error.code === '42501') {
      responseMessage = '❌ Erro de permissão. Verifique se sua conta está ativa.'
    } else if (errorMsg && errorMsg !== 'true' && errorMsg !== 'false') {
      // Só mostrar a mensagem de erro se não for um booleano
      responseMessage = `❌ Erro: ${errorMsg}`
    }
    
    // CRÍTICO: Sempre retornar status 200 com resposta, mesmo em caso de erro
    // Isso garante que o cliente sempre receba uma resposta válida
    console.log('✅ [PLEN WhatsApp] Retornando resposta de erro:', responseMessage.substring(0, 100))
    
    // Restaurar console.log originais
    if (typeof originalConsoleLog !== 'undefined') {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
    
    return NextResponse.json({
      response: responseMessage,
    })
  } finally {
    // Garantir que os console.log originais sejam restaurados
    if (typeof originalConsoleLog !== 'undefined') {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }
}
