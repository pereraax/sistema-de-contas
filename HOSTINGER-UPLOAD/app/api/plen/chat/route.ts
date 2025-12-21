import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { obterDividas, obterRegistros, obterEstatisticas, criarRegistro, obterUsuarios } from '@/lib/actions'
import { obterPlanoUsuario, obterFeaturesUsuario, podeCriarRegistro } from '@/lib/plano'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

// Função auxiliar para formatar resposta de registro no novo formato
function formatarRespostaRegistro(nome: string, valor: number, data: Date, categoria: string, tipo: string): string {
  try {
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
      'outros': '📦'
    }
    
    // Validar e tratar valores nulos/undefined
    const nomeFinal = nome || 'Item'
    const valorFinal = valor || 0
    const dataFinal = data || new Date()
    const categoriaFinal = categoria || 'outros'
    const tipoFinal = tipo || 'registro'
    
    const categoriaCapitalizada = categoriaFinal.charAt(0).toUpperCase() + categoriaFinal.slice(1).toLowerCase()
    const emojiCategoria = categoriaEmojis[categoriaFinal.toLowerCase()] || '📦'
    
    // Formatar data como DD-MM-YYYY
    const dataFormatada = format(dataFinal, 'dd-MM-yyyy', { locale: ptBR })
    
    // Formatar valor em reais
    const valorFormatado = valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    
    // Construir mensagem no novo formato
    const mensagem = `📌 ${nomeFinal}\n🔴 R$ ${valorFormatado}\n📅 ${dataFormatada}\n🗂️ Categoria: ${categoriaCapitalizada} ${emojiCategoria}\n\n✨ Seu ${tipoFinal.toLowerCase()} foi registrado com sucesso!`
    
    return mensagem
  } catch (error) {
    console.error('❌ [PLEN] Erro ao formatar resposta de registro:', error)
    // Fallback para mensagem simples em caso de erro
    const valorFinal = valor || 0
    return `✅ Registro de R$ ${valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi criado com sucesso!`
  }
}

// Função auxiliar para obter ou criar usuário padrão na tabela users
async function obterOuCriarUsuarioPadrao(supabase: any, authUserId: string, authUserEmail: string): Promise<string | null> {
  try {
    // Buscar usuários da tabela users onde account_owner_id = authUserId
    const { data: usuarios, error: usuariosError } = await supabase
      .from('users')
      .select('id')
      .eq('account_owner_id', authUserId)
      .limit(1)
    
    if (usuariosError) {
      console.error('❌ [PLEN] Erro ao buscar usuários:', usuariosError)
      return null
    }
    
    // Se encontrou um usuário, usar o ID
    if (usuarios && usuarios.length > 0) {
      console.log('✅ [PLEN] Usuário encontrado na tabela users:', usuarios[0].id)
      return usuarios[0].id
    }
    
    // CRÍTICO: NÃO criar usuário automaticamente!
    // O sistema deve exigir que o usuário crie manualmente os usuários/pessoas
    // Se não houver usuários, retornar null e o PLEN deve informar que precisa criar um usuário primeiro
    console.log('⚠️ [PLEN] Nenhum usuário encontrado na tabela users. Usuário precisa criar manualmente em Configurações → Usuários/Pessoas.')
    return null
  } catch (error: any) {
    console.error('❌ [PLEN] Exceção ao obter usuário:', error)
    return null
  }
}

// Função para verificar se email está confirmado
async function verificarEmailConfirmado(user: any): Promise<boolean> {
  if (!user || !user.id) {
    console.error('❌ PLEN - Usuário ou ID não fornecido')
    return false
  }
  
  // PRIMEIRO: Tentar buscar diretamente do banco usando Admin Client (mais confiável)
  const supabaseAdmin = createAdminClient()
  if (supabaseAdmin) {
    try {
      // Buscar usuário diretamente do banco de dados usando Admin Client
      // Isso bypassa qualquer cache da sessão e pega o estado REAL do banco
      const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.getUserById(user.id)
      
      if (!adminError && adminUser?.user) {
        const emailConfirmedAt = adminUser.user.email_confirmed_at
        const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
        
        console.log('🔍 PLEN - Verificando email confirmado (via Admin):', {
          email: adminUser.user.email,
          email_confirmed_at: emailConfirmedAt,
          isConfirmed,
          userId: adminUser.user.id,
          tipo: typeof emailConfirmedAt
        })
        
        return isConfirmed
      } else {
        console.warn('⚠️ PLEN - Erro ao buscar via Admin, tentando método alternativo:', adminError?.message)
      }
    } catch (adminException: any) {
      console.warn('⚠️ PLEN - Exceção ao buscar via Admin:', adminException?.message)
    }
  }
  
  // FALLBACK: Buscar usuário atualizado do Supabase via cliente normal
  const supabase = await createClient()
  
  // CRÍTICO: Forçar refresh da sessão primeiro para garantir estado atualizado
  try {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      console.warn('⚠️ PLEN - Erro ao fazer refresh da sessão:', refreshError.message)
    } else {
      console.log('✅ PLEN - Sessão atualizada com sucesso')
    }
  } catch (refreshException: any) {
    console.warn('⚠️ PLEN - Exceção ao fazer refresh da sessão:', refreshException?.message)
  }
  
  // Aguardar um pouco para garantir que o refresh foi processado
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Forçar refresh do usuário para garantir estado mais recente
  const { data: { user: updatedUser }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !updatedUser) {
    console.error('❌ PLEN - Erro ao buscar usuário atualizado:', userError)
    // Se não conseguir buscar atualizado, usar o que temos
    const emailConfirmedAt = user?.email_confirmed_at
    const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
    console.log('🔍 PLEN - Usando dados do usuário original:', {
      email: user?.email,
      email_confirmed_at: emailConfirmedAt,
      isConfirmed
    })
    return isConfirmed
  }
  
  // Verificar se email_confirmed_at existe e não é null
  // Se existe, foi confirmado via link do email - simples assim!
  const emailConfirmedAt = updatedUser.email_confirmed_at
  
  const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
  
  console.log('🔍 PLEN - Verificando email confirmado (via Client):', {
    email: updatedUser.email,
    email_confirmed_at: emailConfirmedAt,
    isConfirmed,
    userId: updatedUser.id,
    tipo: typeof emailConfirmedAt
  })
  
  return isConfirmed
}

// Função para verificar permissões antes de executar comando
// IMPORTANTE: Verifica em sequência:
// 1. Primeiro: Email confirmado (obrigatório para TODAS as funcionalidades)
// 2. Depois: Plano do usuário (verifica se a funcionalidade específica está disponível no plano)
async function verificarPermissoes(
  user: any,
  tipoComando: string,
  descricao?: string
): Promise<{ permitido: boolean; motivo?: string; upgradeRequired?: boolean; featureName?: string; requiredPlan?: string }> {
  // ===== ETAPA 1: VERIFICAR SE EMAIL ESTÁ CONFIRMADO =====
  // Esta é a verificação PRIMÁRIA - sem email confirmado, nenhuma funcionalidade funciona
  const emailConfirmado = await verificarEmailConfirmado(user)
  
  if (!emailConfirmado) {
    // Determinar tipo de registro para mensagem mais específica
    let tipoRegistro = 'o registro'
    if (tipoComando === 'registrar_divida') {
      tipoRegistro = 'a dívida'
    } else if (tipoComando === 'registrar_entrada') {
      tipoRegistro = 'a entrada'
    } else if (tipoComando === 'registrar_gasto') {
      tipoRegistro = 'o gasto'
    }
    
    return {
      permitido: false,
      motivo: `❌ **Não foi possível criar ${tipoRegistro}.** Seu email ainda não foi confirmado. Você precisa confirmar seu email antes de criar qualquer registro. Acesse **Configurações → Perfil** e clique em "Verificar agora" para confirmar seu email.`
    }
  }
  
  // ===== ETAPA 2: VERIFICAR PLANO E FEATURES =====
  // Se chegou aqui, o email está confirmado. Agora verifica se o plano permite a funcionalidade
  const features = await obterFeaturesUsuario()
  const plano = await obterPlanoUsuario()
  
  // Verificar criação de dívidas
  // IMPORTANTE: Mesmo com email confirmado, verifica se o plano permite criar dívidas
  if (tipoComando === 'registrar_divida') {
    if (!features.podeCriarDividas) {
      return {
        permitido: false,
        motivo: `Infelizmente, você não tem acesso à funcionalidade de criar dívidas no seu plano atual (${plano.toUpperCase()}). Esta funcionalidade está disponível nos planos Básico ou Premium.`,
        upgradeRequired: true,
        featureName: 'Criar Dívidas',
        requiredPlan: 'Básico ou Premium'
      }
    }
  }
  
  // Verificar criação de salário
  // IMPORTANTE: Mesmo com email confirmado, verifica se o plano permite registrar salários
  if (tipoComando === 'registrar_entrada') {
    const descricaoLower = (descricao || '').toLowerCase()
    if (descricaoLower.includes('salário') || descricaoLower.includes('salario') || descricaoLower.includes('salá')) {
      if (!features.podeRegistrarSalario) {
        return {
          permitido: false,
          motivo: `Infelizmente, você não tem acesso à funcionalidade de registrar salários no seu plano atual (${plano.toUpperCase()}). Esta funcionalidade está disponível nos planos Básico ou Premium.`,
          upgradeRequired: true,
          featureName: 'Registrar Salários',
          requiredPlan: 'Básico ou Premium'
        }
      }
    }
  }
  
  // Verificar criação de empréstimos
  // IMPORTANTE: Mesmo com email confirmado, verifica se o plano permite criar empréstimos
  if (tipoComando === 'registrar_emprestimo') {
    if (!features.podeCriarEmprestimos) {
      return {
        permitido: false,
        motivo: `Infelizmente, você não tem acesso à funcionalidade de criar empréstimos no seu plano atual (${plano.toUpperCase()}). Esta funcionalidade está disponível apenas no plano Premium.`,
        upgradeRequired: true,
        featureName: 'Criar Empréstimos',
        requiredPlan: 'Premium'
      }
    }
  }
  
  // Se chegou até aqui, passou por TODAS as verificações:
  // ✅ Email confirmado
  // ✅ Plano permite a funcionalidade
  return { permitido: true }
}

// Função para processar comandos em linguagem natural
function processarComando(mensagem: string, dados: any) {
  const msgLower = mensagem.toLowerCase().trim()
  
  // Padrões de comandos
  const padroes = {
    // Consultas - Melhorado para capturar mais variações de perguntas sobre dívidas
    // IMPORTANTE: NÃO capturar "divida [número]" como consulta - isso é registro!
    dividas: /(dividas?|dívidas?|quais.*dividas?|mostre.*dividas?|lista.*dividas?|qual.*total.*dividas?|quanto.*dividas?|quantas.*dividas?|qual.*divida|quanto.*devo|quanto.*tenho.*divida|total.*dividas?|divida.*total)(?!\s+[\d.,])/i,
    gastosSemana: /(gastos?.*semana|quanto.*gastou.*semana|gastou.*semana|despesas?.*semana)/i,
    gastosMes: /(gastos?.*m[eê]s|quanto.*gastou.*m[eê]s|gastou.*m[eê]s|despesas?.*m[eê]s)/i,
    totalEntradas: /(entradas?|receitas?|quanto.*recebeu|total.*entradas?)/i,
    totalSaidas: /(sa[ií]das?|despesas?|quanto.*gastou|total.*sa[ií]das?)/i,
    
    // Registros - Padrões mais flexíveis
    registrarGasto: /(registrar|adicionar|inserir|cadastrar|pago|paguei|pagar|gastei|gastar|comprei|comprar).*(gasto|despesa|sa[ií]da|compra|pagamento|conta|conta de)/i,
    pagamentoDireto: /(pago|paguei|pagar|pague)\s+.*[\d.,]+\s*(reais?|r\$)?|[\d.,]+\s*(reais?|r\$)?.*(pago|paguei|pagar|conta)/i,
    registrarEntrada: /(registrar|adicionar|inserir|cadastrar|recebi|receber).*(entrada|receita|sal[aá]rio|dinheiro.*recebido)/i,
    registrarDivida: /(registrar|adicionar|inserir|cadastrar|criar|tenho|tenho uma|preciso|preciso registrar|devendo|devo|deve).*(divida|dívida|deve|devo|devendo|pagar|pago)/i,
  }

    // CRÍTICO: Verificar comandos de REGISTRO ANTES de consultas
    // Isso evita que "registrar dívida" seja interpretado como "consultar dívidas"
    
    // CRÍTICO: Se é comando de REGISTRO de dívida, marcar para não tratar como consulta
    // A extração de valor e descrição acontecerá mais abaixo
    // Padrões de registro: "divida 30 tia", "divida de 30", "divida de 20 reais josin", etc
    const isRegistroDivida = padroes.registrarDivida.test(msgLower) ||
                              /(divida|dívida)\s+(?:de\s+)?[\d.,]+\s*(?:reais?|r\$)?/i.test(msgLower) || // "divida de 20 reais" ou "divida 20"
                              /^(divida|dívida)\s+[\d.,]+/i.test(msgLower) || // "divida 30" no início
                              /\b(divida|dívida)\s+[\d.,]+\s+\w+/i.test(msgLower) // "divida 30 tia"
    
    // Verificar outros comandos de registro ANTES de consultas
    if (padroes.registrarGasto.test(msgLower) || padroes.pagamentoDireto.test(msgLower)) {
      // Processar registro de gasto (lógica existente continuará abaixo)
    }
    
    if (padroes.registrarEntrada.test(msgLower)) {
      // Processar registro de entrada (lógica existente continuará abaixo)
    }
    
    // Só depois verificar consultas (mas NÃO se for comando de registro)
    // CRÍTICO: Se tem número após "divida", é registro, não consulta!
    const temNumeroAposDivida = /(divida|dívida)\s+(?:de\s+)?[\d.,]+/i.test(msgLower)
    if (padroes.dividas.test(msgLower) && !isRegistroDivida && !temNumeroAposDivida) {
      return { tipo: 'consultar_dividas', dados }
    }
    
    if (padroes.gastosSemana.test(msgLower)) {
      return { tipo: 'gastos_semana', dados }
    }
    
    if (padroes.gastosMes.test(msgLower)) {
      return { tipo: 'gastos_mes', dados }
    }
    
    if (padroes.totalEntradas.test(msgLower)) {
      return { tipo: 'total_entradas', dados }
    }
    
    if (padroes.totalSaidas.test(msgLower)) {
      return { tipo: 'total_saidas', dados }
    }

  // Extrair valor - padrões mais flexíveis (captura valores em qualquer posição)
  const valorPatterns = [
    /r\$\s*([\d.,]+)/i,
    /([\d.,]+)\s*reais?/i,
    /([\d.,]+)\s*r\$/i,
    /valor\s*(?:de|de\s+)?([\d.,]+)/i,
    /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|r\$|de)?\b/i, // Números soltos seguidos de "reais" ou "de"
  ]
  
  let valor: number | null = null
  let todosValores: number[] = []
  
  // Primeiro, tentar padrões específicos
  for (const pattern of valorPatterns) {
    const matches = Array.from(mensagem.matchAll(new RegExp(pattern, 'gi')))
    for (const match of matches) {
      const valorStr = match[1] || match[0]
      const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.')
      const valorNum = parseFloat(valorLimpo)
      if (!isNaN(valorNum) && valorNum > 0 && valorNum < 10000000) {
        todosValores.push(valorNum)
      }
    }
  }
  
  // Se não encontrou com padrões específicos, procurar qualquer número no texto
  if (todosValores.length === 0) {
    // Padrão mais simples: qualquer número de 1 a 6 dígitos
    const numeroPattern = /\b(\d{1,6})\b/g
    const matches = Array.from(mensagem.matchAll(numeroPattern))
    for (const match of matches) {
      const valorStr = match[1]
      const valorNum = parseFloat(valorStr)
      if (!isNaN(valorNum) && valorNum > 0 && valorNum < 10000000) {
        todosValores.push(valorNum)
      }
    }
  }
  
  // Pegar o maior valor encontrado (provavelmente é o valor da transação)
  if (todosValores.length > 0) {
    valor = Math.max(...todosValores)
    console.log('💰 [PLEN] Valor extraído:', valor, 'de:', todosValores)
  } else {
    console.log('⚠️ [PLEN] Nenhum valor encontrado na mensagem:', mensagem)
  }

  // Detectar se é gasto/pagamento (palavras-chave mais amplas)
  // Primeiro verificar se tem valor, depois verificar palavras-chave
  const temPalavraPagamento = /(pago|paguei|pagar|pague|gastei|gastar|comprei|comprar|conta de|paguei a|paguei o|pagamento|conta)/i.test(msgLower)
  const isGasto = padroes.registrarGasto.test(msgLower) || 
                  padroes.pagamentoDireto.test(msgLower) ||
                  temPalavraPagamento

  // Detectar se é entrada (palavras-chave) - padrão mais flexível
  const isEntrada = padroes.registrarEntrada.test(msgLower) ||
                    /(recebi|receber|ganhei|ganhar|salário|entrada de|receita)/i.test(msgLower) ||
                    /^(ganhei|recebi|ganhar|receber)/i.test(msgLower) // Início da frase

  // Detectar se é dívida ANTES de entrada/gasto (prioridade)
  // Padrões mais flexíveis: "divida 30 tia", "divida de 30 tia", "divida de 20 reais josin", etc
  const isDivida = padroes.registrarDivida.test(msgLower) ||
                   /(tenho|tenho uma|preciso|preciso registrar|devendo|devo|deve).*(divida|dívida|pagar|pago)/i.test(msgLower) ||
                   /(divida|dívida)\s+(?:de\s+)?[\d.,]+\s*(?:reais?|r\$)?/i.test(msgLower) || // "divida de 20 reais" ou "divida 20"
                   /^(divida|dívida)\s+[\d.,]+/i.test(msgLower) || // "divida 30" no início
                   /\b(divida|dívida)\s+[\d.,]+\s+\w+/i.test(msgLower) // "divida 30 tia"
  
  // Se encontrou valor E é dívida, tratar como registro de dívida (PRIORIDADE)
  // OU se é dívida mesmo sem valor explícito (ex: "divida 30 tia", "divida de 20 reais josin")
  if (isDivida) {
    console.log('🔍 [PLEN] Detectado como dívida. Valor atual:', valor, 'Mensagem:', mensagem)
    
    // Se não tem valor ainda mas tem número após "divida", extrair
    if (!valor) {
      // Tentar padrão: "divida de 20 reais" ou "divida 20"
      const valorMatch = msgLower.match(/(?:divida|dívida)\s+(?:de\s+)?([\d.,]+)/i)
      if (valorMatch && valorMatch[1]) {
        const valorStr = valorMatch[1].replace(/\./g, '').replace(',', '.')
        valor = parseFloat(valorStr)
        if (isNaN(valor) || valor <= 0) {
          valor = null
        } else {
          console.log('✅ [PLEN] Valor extraído da dívida:', valor)
        }
      }
    }
    
    // Se ainda não tem valor válido, não processar como registro
    if (!valor) {
      console.log('⚠️ [PLEN] Dívida detectada mas sem valor válido. Tratando como consulta.')
      // Mas ainda pode ser uma consulta, então deixar passar
      return { tipo: 'nenhum', dados: {} }
    }
    // Extrair descrição da dívida
    let descricao = ''
    
    // Padrão 1: "divida 30 tia", "divida de 30 tia", "divida de 20 reais josin" (mais simples primeiro)
    // Captura tudo após o valor (e opcionalmente "reais")
    const dividaSimplesMatch = mensagem.match(/(?:divida|dívida)\s+(?:de\s+)?[\d.,]+\s*(?:reais?|r\$)?\s+(.+)/i)
    if (dividaSimplesMatch && dividaSimplesMatch[1]) {
      descricao = dividaSimplesMatch[1].trim()
      // Limpar palavras comuns no início
      descricao = descricao.replace(/^(?:com|de|para|para\s+o|para\s+a)\s+/i, '')
    } else {
      // Padrão 2: "tenho uma dívida de X de [descrição]"
      const dividaDeMatch = mensagem.match(/(?:divida|dívida|deve|devendo|tenho|preciso).*?[\d.,]+\s*(?:reais?|r\$)?\s+de\s+([^,\.]+)/i)
      if (dividaDeMatch && dividaDeMatch[1]) {
        descricao = dividaDeMatch[1].trim()
      } else {
        // Padrão 3: "tenho uma dívida de X para [descrição]"
        const dividaParaMatch = mensagem.match(/(?:divida|dívida|deve|devendo|tenho|preciso).*?[\d.,]+\s*(?:reais?|r\$)?\s+para\s+([^,\.]+)/i)
        if (dividaParaMatch && dividaParaMatch[1]) {
          descricao = dividaParaMatch[1].trim()
        } else {
          // Padrão 4: "tenho uma dívida de X com [descrição]"
          const dividaComMatch = mensagem.match(/(?:divida|dívida|deve|devendo|tenho|preciso).*?[\d.,]+\s*(?:reais?|r\$)?\s+com\s+([^,\.]+)/i)
          if (dividaComMatch && dividaComMatch[1]) {
            descricao = dividaComMatch[1].trim()
          } else {
            // Padrão 5: pegar tudo após o número
            const partes = mensagem.split(/[\d.,]+\s*(?:reais?|r\$)?/i)
            if (partes.length > 1) {
              descricao = partes[1].trim()
              descricao = descricao.replace(/^(?:registrar|adicionar|inserir|cadastrar|criar|divida|dívida|deve|devendo|tenho|tenho uma|preciso|preciso registrar|de|para|com|com\s+)\s*/i, '')
            }
          }
        }
      }
    }
    
    // Se não encontrou descrição, criar uma genérica
    if (!descricao || descricao.length < 3) {
      descricao = `Dívida de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    } else {
      descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1)
    }
    
    return {
      tipo: 'registrar_divida',
      dados: {
        valor,
        descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao,
        tipo: 'divida'
      }
    }
  }

  // Logs de debug para detecção
  console.log('🔍 [PLEN] Detecção:', {
    valor,
    isEntrada,
    temPalavraPagamento,
    isDivida,
    mensagem
  })
  
  // Se encontrou valor E é entrada (recebi/recebeu), tratar como registro de entrada
  if (valor && isEntrada && !temPalavraPagamento && !isDivida) {
    console.log('✅ [PLEN] Detectado como REGISTRO DE ENTRADA')
    // Extrair nome da pessoa - múltiplos padrões para "recebi X de [nome]"
    let descricao = ''
    
    // Padrão 1: "recebi X de [nome]" ou "recebeu X de [nome]"
    const recebiDeMatch = mensagem.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+de\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|,|\.)/i)
    if (recebiDeMatch && recebiDeMatch[1]) {
      const nome = recebiDeMatch[1].trim()
      // Limpar o nome (remover palavras desnecessárias)
      const nomeLimpo = nome.replace(/\s+(?:reais?|r\$|de|para|com|em|no|na|a|o)\s+/gi, ' ').trim()
      if (nomeLimpo.length > 0 && nomeLimpo.length < 50) {
        // Capitalizar primeira letra
        const nomeFormatado = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1).toLowerCase()
        descricao = `Recebeu de ${nomeFormatado}`
      }
    }
    
    // Padrão 2: "recebi X [nome]" (sem "de")
    if (!descricao) {
      const recebiMatch = mensagem.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+([A-Za-zÀ-ÿ]+)(?:\s|$|,|\.)/i)
      if (recebiMatch && recebiMatch[1]) {
        const nome = recebiMatch[1].trim()
        if (nome.length > 1 && nome.length < 50 && !/(?:reais?|r\$|de|para|com|em|no|na|a|o)/i.test(nome)) {
          const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
          descricao = `Recebeu de ${nomeFormatado}`
        }
      }
    }
    
    // Padrão 3: "de [nome]" genérico (fallback)
    if (!descricao) {
      const deMatch = mensagem.match(/(?:de|para|com)\s+([A-Za-zÀ-ÿ]+)(?:\s|$|,|\.)/i)
      if (deMatch && deMatch[1]) {
        const nome = deMatch[1].trim()
        if (nome.length > 1 && nome.length < 50 && !/(?:reais?|r\$|de|para|com|em|no|na|a|o)/i.test(nome)) {
          const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
          descricao = `Recebeu de ${nomeFormatado}`
        }
      }
    }
    
    // Se não encontrou nome, criar descrição genérica
    if (!descricao || descricao.length < 3) {
      descricao = `Entrada de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
    
    return {
      tipo: 'registrar_entrada',
      dados: {
        valor,
        descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao,
        tipo: 'entrada'
      }
    }
  }

  // Se encontrou valor E tem palavra de pagamento/gasto, tratar como registro de gasto
  if (valor && temPalavraPagamento && !isEntrada && !isDivida) {
    // Extrair categoria com base em palavras-chave
    const categoriaMap: { [key: string]: string } = {
      'luz': 'moradia',
      'energia': 'moradia',
      'água': 'moradia',
      'agua': 'moradia',
      'internet': 'moradia',
      'telefone': 'moradia',
      'aluguel': 'moradia',
      'condomínio': 'moradia',
      'supermercado': 'alimentação',
      'mercado': 'alimentação',
      'comida': 'alimentação',
      'alimentação': 'alimentação',
      'alimentacao': 'alimentação',
      'restaurante': 'alimentação',
      'combustível': 'transporte',
      'combustivel': 'transporte',
      'gasolina': 'transporte',
      'uber': 'transporte',
      'táxi': 'transporte',
      'farmacia': 'saúde',
      'farmácia': 'saúde',
      'remédio': 'saúde',
      'remedio': 'saúde',
      'médico': 'saúde',
      'medico': 'saúde',
      'hospital': 'saúde',
      'conta de': 'moradia',
      'conta': 'moradia',
    }
    
    let categoria = 'outros'
    for (const [palavra, cat] of Object.entries(categoriaMap)) {
      if (msgLower.includes(palavra)) {
        categoria = cat
        break
      }
    }
    
    // Extrair descrição - padrões mais flexíveis
    let descricao = ''
    
    // Remover palavras de ação e valores para pegar apenas a descrição
    let mensagemLimpa = msgLower
      .replace(/(?:pago|paguei|pagar|pague|gastei|gastar|comprei|comprar|registrar|adicionar|cadastrar)\s*/gi, '')
      .replace(/[\d.,]+\s*(?:reais?|r\$)?/gi, '')
      .replace(/\s+(?:de|para|com|em|no|na|a|o)\s+/gi, ' ')
      .trim()
    
    // Extrair descrição de forma mais simples e direta
    // Padrão 1: "conta de [algo]" - mais comum
    if (msgLower.includes('conta')) {
      const contaMatch = mensagem.match(/conta\s+(?:de|da|do)?\s*([a-záàâãéêíóôõúç\s]+?)(?:\s+\d|$|,|\.|reais?)/i)
      if (contaMatch && contaMatch[1]) {
        descricao = `Conta de ${contaMatch[1].trim()}`
      } else {
        // Tentar pegar tudo após "conta"
        const idxConta = msgLower.indexOf('conta')
        const depoisConta = msgLower.substring(idxConta + 5).trim()
        // Remover números e palavras desnecessárias
        const limpo = depoisConta.replace(/\d+/g, '').replace(/\s*(?:reais?|r\$|de|para|com)\s*/gi, ' ').trim()
        if (limpo.length > 0) {
          descricao = `Conta de ${limpo.split(/\s+/).slice(0, 3).join(' ')}`
        } else {
          descricao = 'Conta'
        }
      }
    } else {
      // Padrão 2: pegar tudo após o número (caso não seja conta)
      // Exemplo: "pago 300 mercado" -> "mercado"
      const partes = mensagem.split(/\s+(\d+)\s+/i)
      if (partes.length > 2) {
        // Pegar a parte após o número
        descricao = partes[2].trim()
        // Remover palavras de ação e limpar
        descricao = descricao.replace(/^(?:pago|paguei|pagar|pague|gastei|gastar|comprei|comprar|registrar|adicionar|cadastrar|de|para|com|em|no|na|a|o)\s+/i, '')
      } else {
        // Tentar pegar tudo após a palavra de ação
        const match = mensagem.match(/(?:pago|paguei|pagar|pague|gastei|gastar|comprei|comprar)\s+\d+\s*(.+)/i)
        if (match && match[1]) {
          descricao = match[1].trim().split(/\s+/).slice(0, 4).join(' ')
        } else {
          // Último recurso: usar a mensagem limpa
          descricao = mensagemLimpa.split(/\s+/).slice(0, 5).join(' ') || `Gasto de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      }
    }
    
    // Limpar e formatar descrição
    if (descricao) {
      descricao = descricao.replace(/\s+/g, ' ').trim()
      // Remover pontuação final
      descricao = descricao.replace(/[.,;:!?]+$/, '')
      // Capitalizar primeira letra
      if (descricao.length > 0) {
        descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1)
      }
    }
    
    // Se ainda não tem descrição válida, criar uma genérica
    if (!descricao || descricao.length < 3) {
      descricao = `Gasto de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
    
    return {
      tipo: 'registrar_gasto',
      dados: {
        valor,
        categoria,
        descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao,
        tipo: 'saida'
      }
    }
  }

  if (padroes.registrarEntrada.test(msgLower) && valor) {
    // Extrair nome da pessoa - múltiplos padrões para "recebi X de [nome]"
    let descricao = ''
    
    // Padrão 1: "recebi X de [nome]" ou "recebeu X de [nome]"
    const recebiDeMatch = mensagem.match(/(?:recebi|recebeu|ganhei|ganhar)\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+de\s+([A-Za-zÀ-ÿ\s]+?)(?:\s|$|,|\.)/i)
    if (recebiDeMatch && recebiDeMatch[1]) {
      const nome = recebiDeMatch[1].trim()
      // Limpar o nome (remover palavras desnecessárias)
      const nomeLimpo = nome.replace(/\s+(?:reais?|r\$|de|para|com|em|no|na|a|o)\s+/gi, ' ').trim()
      if (nomeLimpo.length > 0 && nomeLimpo.length < 50) {
        // Capitalizar primeira letra
        const nomeFormatado = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1).toLowerCase()
        descricao = `Recebeu de ${nomeFormatado}`
      }
    }
    
    // Padrão 2: "recebi X [nome]" (sem "de")
    if (!descricao) {
      const recebiMatch = mensagem.match(/(?:recebi|recebeu|ganhei)\s+.*?[\d.,]+\s*(?:reais?|r\$)?\s+([A-Za-zÀ-ÿ]+)(?:\s|$|,|\.)/i)
      if (recebiMatch && recebiMatch[1]) {
        const nome = recebiMatch[1].trim()
        if (nome.length > 1 && nome.length < 50 && !/(?:reais?|r\$|de|para|com|em|no|na|a|o)/i.test(nome)) {
          const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
          descricao = `Recebeu de ${nomeFormatado}`
        }
      }
    }
    
    // Padrão 3: "de [nome]" genérico (fallback)
    if (!descricao) {
      const deMatch = mensagem.match(/(?:de|para|com)\s+([A-Za-zÀ-ÿ]+)(?:\s|$|,|\.)/i)
      if (deMatch && deMatch[1]) {
        const nome = deMatch[1].trim()
        if (nome.length > 1 && nome.length < 50 && !/(?:reais?|r\$|de|para|com|em|no|na|a|o)/i.test(nome)) {
          const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
          descricao = `Recebeu de ${nomeFormatado}`
        }
      }
    }
    
    // Se não encontrou nome, criar descrição genérica
    if (!descricao || descricao.length < 3) {
      descricao = `Entrada de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }
    
    return {
      tipo: 'registrar_entrada',
      dados: {
        valor,
        descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao,
        tipo: 'entrada'
      }
    }
  }


  console.log('⚠️ [PLEN] Nenhum comando específico detectado, retornando tipo geral')
  return { tipo: 'geral', dados: null }
}

// Função para criar o prompt do sistema
function criarSystemPrompt(contexto: any): string {
  // Formatar informações de dívidas de forma clara
  const infoDividas = contexto.quantidadeDividas > 0 
    ? `Você possui ${contexto.quantidadeDividas} dívida(s) cadastrada(s), sendo ${contexto.quantidadePendentes} pendente(s).\n- Total de dívidas: R$ ${contexto.totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n- Total pendente: R$ ${contexto.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'Você não possui dívidas cadastradas no momento.'

  return `Você é PLEN, um assistente financeiro inteligente e moderno. Você ajuda usuários a gerenciar suas finanças pessoais.

CONTEXTO DO USUÁRIO:
- Dívidas: ${infoDividas}
- Gastos da semana: R$ ${contexto.gastosSemana?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
- Gastos do mês: R$ ${contexto.gastosMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
- Total de entradas: R$ ${contexto.totalEntradas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
- Total de saídas: R$ ${contexto.totalSaidas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}

FUNCIONALIDADES DISPONÍVEIS:
1. Registrar gastos/entradas: "Registre um gasto de R$ 50,00 com alimentação"
2. Consultar dívidas: "Quais são minhas dívidas?", "Qual o total de dívidas que tenho?", "Quanto devo?"
3. Consultar gastos: "Quanto gastei na semana/mês?"
4. Consultar saldo: "Qual é meu saldo atual?"

INSTRUÇÕES IMPORTANTES:
- Se o usuário perguntar sobre dívidas, use SEMPRE os dados do CONTEXTO acima
- Se houver dívidas, informe a quantidade e o valor total
- Se não houver dívidas, diga claramente que não há dívidas cadastradas
- Seja direto, amigável e profissional
- Use linguagem natural e moderna
- Se o usuário pedir para registrar algo, confirme os dados
- Se for uma consulta, forneça informações claras e organizadas
- Responda sempre em português brasileiro
- Seja conciso mas completo`
}

// Função para chamar Claude (Anthropic)
async function chamarClaude(mensagem: string, contexto: any, historico: any[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  try {
    const systemPrompt = criarSystemPrompt(contexto)
    const messages = [
      ...historico.slice(-5).map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'user' as const, content: mensagem }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao chamar Claude:', error)
      return null
    }

    const data = await response.json()
    if (data.content?.[0]?.text) {
      return data.content[0].text
    }
  } catch (error) {
    console.error('Erro ao chamar Claude:', error)
  }
  return null
}

// Função para chamar Groq (rápida e gratuita)
async function chamarGroq(mensagem: string, contexto: any, historico: any[]): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null

  try {
    const systemPrompt = criarSystemPrompt(contexto)
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...historico.slice(-5).map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      })),
      {
        role: 'user',
        content: mensagem
      }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao chamar Groq:', error)
      return null
    }

    const data = await response.json()
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content
    }
  } catch (error) {
    console.error('Erro ao chamar Groq:', error)
  }
  return null
}

// Função para chamar Google Gemini
async function chamarGemini(mensagem: string, contexto: any, historico: any[]): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null

  try {
    // Gemini desabilitado - use Groq ou outro provedor
    // const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    const model = 'gemini-1.5-pro' // Não será usado pois Gemini está desabilitado
    const systemPrompt = criarSystemPrompt(contexto)
    const fullPrompt = `${systemPrompt}

HISTÓRICO DA CONVERSA (últimas 5 mensagens):
${historico.slice(-5).map((h: any) => `${h.role}: ${h.content}`).join('\n')}

MENSAGEM DO USUÁRIO: ${mensagem}

RESPOSTA:`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
            text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao chamar Gemini:', error)
      return null
    }

      const data = await response.json()
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      }
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error)
  }
  return null
}

// Função para chamar OpenAI
async function chamarOpenAI(mensagem: string, contexto: any, historico: any[]): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const systemPrompt = criarSystemPrompt(contexto)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
            content: systemPrompt
            },
          ...historico.slice(-5).map((h: any) => ({
              role: h.role,
              content: h.content
            })),
            {
              role: 'user',
              content: mensagem
            }
          ],
        max_tokens: 1024,
          temperature: 0.7,
        }),
      })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao chamar OpenAI:', error)
      return null
    }

      const data = await response.json()
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content
    }
  } catch (error) {
    console.error('Erro ao chamar OpenAI:', error)
  }
  return null
}

// Função para gerar resposta usando IA (suporta múltiplos provedores)
async function gerarRespostaIA(mensagem: string, contexto: any, historico: any[]) {
  // Determinar qual provedor usar baseado na variável de ambiente
  // Ordem padrão: Groq (gratuito) > Gemini (gratuito) > Claude > OpenAI
  // Se não especificado, detecta automaticamente qual API key está disponível
  const aiProvider = process.env.AI_PROVIDER?.toLowerCase() || 'auto'
  
  // Lista de provedores para tentar em ordem de prioridade
  const providers: Array<() => Promise<string | null>> = []
  
  // Modo automático: detecta qual API key está disponível e prioriza
  // Gemini DESABILITADO (modelos instáveis, causam erros 404)
  if (aiProvider === 'auto') {
    // Ordem: Groq (gratuito e estável) > Claude > OpenAI
    if (process.env.GROQ_API_KEY) {
      providers.push(() => chamarGroq(mensagem, contexto, historico))
    }
    // Gemini removido - causa erros 404 constantes
    // if (process.env.GEMINI_API_KEY) {
    //   providers.push(() => chamarGemini(mensagem, contexto, historico))
    // }
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push(() => chamarClaude(mensagem, contexto, historico))
    }
    if (process.env.OPENAI_API_KEY) {
      providers.push(() => chamarOpenAI(mensagem, contexto, historico))
    }
  } 
  // Modo específico: usar apenas o provedor escolhido
  else if (aiProvider === 'groq') {
    providers.push(() => chamarGroq(mensagem, contexto, historico))
  } 
  // Gemini desabilitado - use Groq ou outro provedor
  // else if (aiProvider === 'gemini') {
  //   providers.push(() => chamarGemini(mensagem, contexto, historico))
  // }
  else if (aiProvider === 'claude') {
    providers.push(() => chamarClaude(mensagem, contexto, historico))
  } else if (aiProvider === 'openai') {
    providers.push(() => chamarOpenAI(mensagem, contexto, historico))
  }

  // Tentar cada provedor até conseguir uma resposta
  for (const provider of providers) {
    try {
      const resposta = await provider()
      if (resposta) {
        return resposta
      }
    } catch (error) {
      console.error('Erro ao tentar provedor de IA:', error)
      continue
    }
  }

  // Fallback: processamento local se nenhuma IA funcionar
  console.log('⚠️ [PLEN] Nenhuma IA retornou resposta, usando processamento local')
  const respostaLocal = processarComandoLocal(mensagem, contexto, historico)
  if (respostaLocal && respostaLocal.trim() !== '') {
    console.log('✅ [PLEN] Resposta do processamento local obtida')
    return respostaLocal
  }
  
  // Se ainda não tiver resposta, retornar mensagem padrão
  console.log('⚠️ [PLEN] Processamento local não retornou resposta, usando mensagem padrão')
  return 'Olá! Eu sou o PLEN, seu assistente financeiro. Como posso ajudá-lo hoje? Você pode registrar gastos, entradas ou consultar suas finanças.'
}

// Processamento local quando não há API de IA
function processarComandoLocal(mensagem: string, contexto: any, historico: any[]): string {
  console.log('🔄 [PLEN] Processamento local chamado para:', mensagem)
  const comando = processarComando(mensagem, contexto)
  console.log('🔍 [PLEN] Comando no processamento local:', comando.tipo, comando.dados)
  
  switch (comando.tipo) {
    case 'consultar_dividas':
      const dividas = contexto.dividas || []
      if (dividas.length === 0) {
        return 'Você não possui dívidas cadastradas no momento. 🎉'
      }
      const dividasPendentes = dividas.filter((d: any) => {
        const valorPago = d.parcelas_pagas && d.parcelas_totais 
          ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
          : 0
        return valorPago < parseFloat(d.valor)
      })
      const totalDividas = dividas.reduce((sum: number, d: any) => sum + parseFloat(d.valor || 0), 0)
      const totalPendente = dividasPendentes.reduce((sum: number, d: any) => {
        const valorPago = d.parcelas_pagas && d.parcelas_totais 
          ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
          : 0
        return sum + (parseFloat(d.valor || 0) - valorPago)
      }, 0)
      
      return `Você possui ${dividas.length} dívida(s) cadastrada(s), sendo ${dividasPendentes.length} pendente(s).\n\n💰 Total: R$ ${totalDividas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n⏳ Pendente: R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    
    case 'gastos_semana':
      const gastosSemana = contexto.gastosSemana || 0
      if (gastosSemana === 0) {
        return 'Você não teve gastos nesta semana. Parabéns! 🎉'
      }
      return `Você gastou R$ ${gastosSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} nesta semana.`
    
    case 'gastos_mes':
      const gastosMes = contexto.gastosMes || 0
      if (gastosMes === 0) {
        return 'Você não teve gastos neste mês. Parabéns! 🎉'
      }
      return `Você gastou R$ ${gastosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} neste mês.`
    
    case 'total_entradas':
      const entradas = contexto.estatisticas?.totalEntradas || 0
      if (entradas === 0) {
        return 'Você ainda não possui entradas registradas.'
      }
      return `Suas entradas totalizam R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
    
    case 'total_saidas':
      const saidas = contexto.estatisticas?.totalSaidas || 0
      if (saidas === 0) {
        return 'Você ainda não possui saídas registradas.'
      }
      return `Suas saídas totalizam R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
    
    default:
      return 'Olá! Eu sou o PLEN, seu assistente financeiro inteligente. Estou aqui para ajudá-lo a gerenciar suas finanças de forma simples e eficiente.\n\n📝 Para registrar um novo lançamento, você pode me informar de forma natural, por exemplo:\n\n• "ganhei 100 reais de ana"\n• "gastei 40 no shopping"\n• "ganhei 20 da tia"\n• "divida de 2000 sofá"\n\nEu processarei e registrarei essas informações da melhor forma possível. Como posso ajudá-lo hoje?'
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [PLEN] POST recebido - Iniciando processamento')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('❌ [PLEN] Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    console.log('✅ [PLEN] Usuário autenticado:', user.id)
    
    const body = await request.json()
    console.log('📥 [PLEN] Body recebido:', { 
      message: body.message?.substring(0, 50),
      hasHistory: !!body.conversationHistory,
      historyLength: body.conversationHistory?.length || 0
    })
    
    const { message, conversationHistory } = body

    if (!message || typeof message !== 'string') {
      console.log('❌ [PLEN] Mensagem inválida:', message)
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }
    
    console.log('✅ [PLEN] Mensagem válida, processando:', message.substring(0, 50))

    // Buscar dados do usuário
    const [dividasResult, registrosResult, estatisticasResult] = await Promise.all([
      obterDividas(),
      obterRegistros(),
      obterEstatisticas()
    ])

    const dividas: any[] = dividasResult?.data || []
    const registros: any[] = registrosResult?.data || []
    const estatisticas = estatisticasResult || {}

    // Calcular gastos da semana
    const hoje = new Date()
    const inicioSemana = startOfWeek(hoje, { locale: ptBR })
    const registrosSemana = registros.filter((r: any) => {
      const dataRegistro = new Date(r.data_registro)
      return dataRegistro >= inicioSemana && r.tipo === 'saida'
    })
    const gastosSemana = registrosSemana.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)

    // Calcular gastos do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const registrosMes = registros.filter((r: any) => {
      const dataRegistro = new Date(r.data_registro)
      return dataRegistro >= inicioMes && r.tipo === 'saida'
    })
    const gastosMes = registrosMes.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0)

    // Calcular total de dívidas e dívidas pendentes
    const totalDividas = dividas.reduce((sum: number, d: any) => sum + parseFloat(d.valor || 0), 0)
    const dividasPendentes = dividas.filter((d: any) => {
      const valorPago = d.parcelas_pagas && d.parcelas_totais 
        ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
        : 0
      return valorPago < parseFloat(d.valor)
    })
    const totalPendente = dividasPendentes.reduce((sum: number, d: any) => {
      const valorPago = d.parcelas_pagas && d.parcelas_totais 
        ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
        : 0
      return sum + (parseFloat(d.valor || 0) - valorPago)
    }, 0)

    const contexto = {
      dividas,
      totalDividas,
      totalPendente,
      quantidadeDividas: dividas.length,
      quantidadePendentes: dividasPendentes.length,
      registros: registros.slice(0, 10), // Últimos 10 registros
      estatisticas,
      gastosSemana,
      gastosMes,
      totalEntradas: (estatisticas as any)?.totalEntradas || 0,
      totalSaidas: (estatisticas as any)?.totalSaidas || 0
    }

    // Verificar se é uma confirmação (sim/não) de uma transação pendente
    const msgLower = message.toLowerCase().trim()
    const isConfirmacao = /^(sim|s[íi]|yes|ok|confirmar|pode|pode confirmar|confirma|quero|desejo)$/i.test(msgLower)
    const isNegacao = /^(n[ãa]o|nao|no|n[ãa]o quero|cancelar|cancela)$/i.test(msgLower)
    
    // Verificar histórico para encontrar confirmação pendente
    let pendingConfirmation: any = null
    if (isConfirmacao || isNegacao) {
      // Procurar nas últimas 3 respostas da IA por dados de transação
      const ultimasRespostasIA = conversationHistory?.slice().reverse().filter((h: any) => h.role === 'assistant').slice(0, 3)
      
      for (const respostaIA of ultimasRespostasIA || []) {
        if (!respostaIA?.content) continue
        
        // Extrair valor - múltiplos padrões
        const valorPatterns = [
          /r\$\s*([\d.,]+)/i,
          /([\d.,]+)\s*reais?/i,
          /valor\s*(?:de|de\s+)?([\d.,]+)/i,
          /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|r\$|de)?\b/i
        ]
        
        let valorMatch: RegExpMatchArray | null = null
        for (const pattern of valorPatterns) {
          valorMatch = respostaIA.content.match(pattern)
          if (valorMatch) break
        }
        
        if (valorMatch) {
          const valorStr: string = String(valorMatch[1] || valorMatch[0] || '')
          const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'))
          
          if (!isNaN(valor) && valor > 0 && valor < 10000000) {
            // Detectar tipo
            const tipoMatch: RegExpMatchArray | null = respostaIA.content.match(/(entrada|receita|recebido|recebeu|gasto|despesa|sa[ií]da|divida|d[ií]vida|pago|paguei)/i)
            const tipo = tipoMatch ? (
              /(entrada|receita|recebido|recebeu)/i.test(tipoMatch[1] || '') ? 'entrada' :
              /(divida|d[ií]vida)/i.test(tipoMatch[1] || '') ? 'divida' : 'saida'
            ) : 'entrada' // Default para entrada se não especificado
            
            // Extrair descrição - múltiplos padrões
            const descricaoPatterns = [
              /(?:de|para|com|em|no|na|recebido|recebeu|de)\s+([^,\.\?]+?)(?:\s+deseja|\s+quer|\s+gostaria|\s+pode|\s+confirma|\?|$)/i,
              /(?:de|para|com|em|no|na)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+\d|\s+deseja|\s+quer|\s+gostaria|\s+pode|\s+confirma|\?|$)/i
            ]
            
            let descricao = ''
            for (const pattern of descricaoPatterns) {
              const match = respostaIA.content.match(pattern)
              if (match && match[1]) {
                descricao = match[1].trim()
                break
              }
            }
            
            if (!descricao || descricao.length < 3) {
              descricao = `Registro de ${tipo === 'entrada' ? 'entrada' : tipo === 'divida' ? 'dívida' : 'gasto'}`
            }
            
            pendingConfirmation = {
              valor,
              tipo,
              descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao
            }
            break // Encontrou, pode parar
          }
        }
      }
    }

    // Processar comando
    console.log('🔍 [PLEN] Processando comando para mensagem:', message)
    const comando = processarComando(message, contexto)
    console.log('🔍 [PLEN] Comando detectado:', {
      tipo: comando.tipo,
      dados: comando.dados,
      mensagem: message.substring(0, 50)
    })
    console.log('📊 [PLEN] Contexto - Dívidas:', {
      quantidade: dividas.length,
      total: totalDividas,
      pendente: totalPendente
    })
    let resposta = ''
    let actionData: any = null
    let pendingAction: any = null

    // CRÍTICO: Verificar permissões ANTES de processar qualquer comando de registro
    // Isso garante que mensagens de bloqueio sejam mostradas antes de qualquer outra resposta
    if (comando.tipo === 'registrar_divida' || comando.tipo === 'registrar_gasto' || comando.tipo === 'registrar_entrada') {
      console.log('🔒 [PLEN] Verificando permissões para:', comando.tipo)
      const permissoes = await verificarPermissoes(user, comando.tipo, comando.dados?.descricao)
      
      if (!permissoes.permitido) {
        console.log('⚠️ [PLEN] Permissão negada:', permissoes.motivo)
        
        // Se precisa de upgrade, retornar actionData com botão
        if (permissoes.upgradeRequired) {
          return NextResponse.json({
            response: permissoes.motivo || 'Você não tem permissão para executar esta ação.',
            actionData: {
              action: 'upgrade_required',
              featureName: permissoes.featureName,
              requiredPlan: permissoes.requiredPlan,
              buttonText: 'Assinar Plano',
              buttonUrl: '/configuracoes?tab=perfil'
            }
          })
        }
        
        return NextResponse.json({
          response: permissoes.motivo || 'Você não tem permissão para executar esta ação.',
          actionData: null
        })
      }
    }

    // PRIORIDADE: Processar consultas simples localmente antes de chamar IA
    if (comando.tipo === 'consultar_dividas') {
      console.log('✅ [PLEN] Processando consulta de dívidas localmente')
      const dividasLocal = dividas || []
      if (dividasLocal.length === 0) {
        resposta = 'Você não possui dívidas cadastradas no momento. 🎉'
      } else {
        const dividasPendentesLocal = dividasLocal.filter((d: any) => {
          const valorPago = d.parcelas_pagas && d.parcelas_totais 
            ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
            : 0
          return valorPago < parseFloat(d.valor)
        })
        const totalDividasLocal = dividasLocal.reduce((sum: number, d: any) => sum + parseFloat(d.valor || 0), 0)
        const totalPendenteLocal = dividasPendentesLocal.reduce((sum: number, d: any) => {
          const valorPago = d.parcelas_pagas && d.parcelas_totais 
            ? (parseFloat(d.valor) * parseFloat(d.parcelas_pagas)) / parseFloat(d.parcelas_totais)
            : 0
          return sum + (parseFloat(d.valor || 0) - valorPago)
        }, 0)
        
        resposta = `Você possui ${dividasLocal.length} dívida(s) cadastrada(s), sendo ${dividasPendentesLocal.length} pendente(s).\n\n💰 Total: R$ ${totalDividasLocal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n⏳ Pendente: R$ ${totalPendenteLocal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }
    }

    // Se é uma confirmação e temos dados pendentes, processar
    if (isConfirmacao && pendingConfirmation) {
      console.log('✅ [PLEN] Processando confirmação:', pendingConfirmation)
      
      // CRÍTICO: Verificar permissões antes de processar confirmação
      const permissoes = await verificarPermissoes(user, pendingConfirmation.tipo === 'divida' ? 'registrar_divida' : pendingConfirmation.tipo === 'saida' ? 'registrar_gasto' : 'registrar_entrada', pendingConfirmation.descricao)
      
      if (!permissoes.permitido) {
        console.log('⚠️ [PLEN] Permissão negada na confirmação:', permissoes.motivo)
        resposta = permissoes.motivo || 'Você não tem permissão para executar esta ação.'
        
        // Se precisa de upgrade, adicionar actionData com botão
        if (permissoes.upgradeRequired) {
          actionData = {
            action: 'upgrade_required',
            featureName: permissoes.featureName,
            requiredPlan: permissoes.requiredPlan,
            buttonText: 'Assinar Plano',
            buttonUrl: '/configuracoes?tab=perfil'
          }
        }
        
        pendingConfirmation = null // Limpar confirmação pendente
      } else {
        // Verificar se pode criar registro (limite mensal)
        const podeCriar = await podeCriarRegistro()
        if (!podeCriar.pode) {
          console.log('⚠️ [PLEN] Não pode criar registro (confirmação):', podeCriar.motivo)
          resposta = `❌ ${podeCriar.motivo || 'Não foi possível criar o registro.'}`
          pendingConfirmation = null
          return NextResponse.json({
            response: resposta,
            actionData: null
          })
        }
        
        // Obter ou criar usuário na tabela users (não auth.users)
        const user_id = await obterOuCriarUsuarioPadrao(supabase, user.id, user.email || '')
        
        if (!user_id) {
          console.error('❌ [PLEN] Não foi possível obter/criar usuário na tabela users')
          resposta = 'Desculpe, ocorreu um erro ao identificar o usuário. Tente novamente.'
          pendingConfirmation = null
          return NextResponse.json({
            response: resposta,
            actionData: null
          })
        }
        
        console.log('📝 [PLEN] Criando registro (confirmação):', {
          user_id,
          tipo: pendingConfirmation.tipo,
          valor: pendingConfirmation.valor,
          descricao: pendingConfirmation.descricao
        })
        
        const formData = new FormData()
        formData.append('nome', pendingConfirmation.descricao)
        formData.append('tipo', pendingConfirmation.tipo)
        formData.append('valor', pendingConfirmation.valor.toString())
        formData.append('categoria', 'outros')
        formData.append('data_registro', new Date().toISOString())
        formData.append('metodo_pagamento', 'dinheiro')
        formData.append('parcelas_totais', '1')
        formData.append('parcelas_pagas', '0')
        formData.append('user_id', user_id)
        
        if (pendingConfirmation.tipo === 'divida') {
          formData.append('etiquetas', JSON.stringify(['dívida', 'dinheiro']))
        } else {
          formData.append('etiquetas', JSON.stringify(['dinheiro']))
        }

        const resultado = await criarRegistro(formData)
        
        console.log('📊 [PLEN] Resultado do registro (confirmação):', {
          sucesso: !resultado.error,
          error: resultado.error,
          data: resultado.data
        })
        
        if (resultado.error) {
          console.error('❌ [PLEN] Erro ao registrar (confirmação):', resultado.error)
          resposta = `Desculpe, não consegui registrar. Erro: ${resultado.error}`
        } else if (!resultado.data) {
          console.error('❌ [PLEN] Registro não retornou dados:', resultado)
          resposta = `Desculpe, não consegui registrar. O registro não foi criado.`
        } else {
          console.log('✅ [PLEN] Registro criado com sucesso (confirmação)! ID:', resultado.data.id)
          const tipoRegistro = pendingConfirmation.tipo === 'divida' ? 'Dívida' : pendingConfirmation.tipo === 'saida' ? 'Gasto' : 'Entrada'
          const tipoNome = pendingConfirmation.tipo === 'divida' ? 'dívida' : pendingConfirmation.tipo === 'saida' ? 'gasto' : 'entrada'
          const nomeItem = pendingConfirmation.descricao || (pendingConfirmation.tipo === 'divida' ? 'Dívida' : pendingConfirmation.tipo === 'saida' ? 'Gasto' : 'Entrada')
          const categoria = 'outros' // Categoria padrão na confirmação
          let dataRegistro: Date
          if (resultado.data?.data_registro) {
            try {
              dataRegistro = new Date(resultado.data.data_registro)
              if (isNaN(dataRegistro.getTime())) {
                dataRegistro = new Date()
              }
            } catch {
              dataRegistro = new Date()
            }
          } else {
            dataRegistro = new Date()
          }
          
          try {
            resposta = formatarRespostaRegistro(nomeItem, pendingConfirmation.valor, dataRegistro, categoria, tipoNome)
          } catch (error) {
            console.error('❌ [PLEN] Erro ao formatar resposta na confirmação:', error)
            resposta = `✅ ${tipoRegistro} de R$ ${pendingConfirmation.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado com sucesso!`
          }
          actionData = {
            action: 'created',
            message: `${tipoRegistro} registrado com sucesso!`
          }
          
          // GARANTIR que temos uma resposta após a confirmação
          if (!resposta || resposta.trim() === '') {
            console.error('❌ [PLEN] Resposta vazia após confirmação!')
            resposta = `✅ ${tipoRegistro} de R$ ${pendingConfirmation.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} registrado com sucesso!`
          }
        }
        pendingConfirmation = null // Limpar após processar
      }
    } else if (isNegacao && pendingConfirmation) {
      resposta = 'Entendido, registro cancelado. Como posso ajudar?'
    }
    // Se já processamos a consulta de dívidas, não continuar
    else if (comando.tipo === 'consultar_dividas' && resposta) {
      // Já processado acima, não fazer nada
    }
    // Executar ação se necessário (PRIORIDADE: executar comandos antes de usar IA)
    // NOTA: Permissões já foram verificadas no início, antes de processar consultas
    else if (comando.tipo === 'registrar_gasto' || comando.tipo === 'registrar_entrada' || comando.tipo === 'registrar_divida') {
      console.log('✅ [PLEN] Executando registro:', comando.dados)
      
      // GARANTIR que temos dados válidos antes de processar
      if (!comando.dados || !comando.dados.valor) {
        console.error('❌ [PLEN] Dados inválidos no comando:', comando)
        resposta = 'Desculpe, não consegui identificar o valor. Por favor, tente novamente com uma mensagem como "ganhei 400 de mae" ou "gastei 100 reais".'
      } else {
        // Verificar se pode criar registro (limite mensal)
      const podeCriar = await podeCriarRegistro()
      if (!podeCriar.pode) {
        console.log('⚠️ [PLEN] Não pode criar registro:', podeCriar.motivo)
        return NextResponse.json({
          response: `❌ ${podeCriar.motivo || 'Não foi possível criar o registro.'}`,
          actionData: null
        })
      }
      
      // Obter ou criar usuário na tabela users (não auth.users)
      const user_id = await obterOuCriarUsuarioPadrao(supabase, user.id, user.email || '')
      
      if (!user_id) {
        console.error('❌ [PLEN] Nenhum usuário encontrado na tabela users')
        return NextResponse.json({
          response: 'Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro. Vá em Configurações → Usuários/Pessoas e clique em "+ Novo Usuário".',
          actionData: null
        })
      }
      
      console.log('📝 [PLEN] Criando registro com:', {
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

      const resultado = await criarRegistro(formData)
      
      console.log('📊 [PLEN] Resultado do registro:', {
        sucesso: !resultado.error,
        error: resultado.error,
        data: resultado.data,
        temId: !!resultado.data?.id
      })
      
      if (resultado.error) {
        console.error('❌ [PLEN] Erro ao registrar:', resultado.error)
        const tipoRegistro = comando.dados.tipo === 'divida' ? 'dívida' : comando.dados.tipo === 'saida' ? 'gasto' : 'entrada'
        resposta = `Desculpe, não consegui registrar a ${tipoRegistro}. Erro: ${resultado.error}`
      } else if (!resultado.data) {
        console.error('❌ [PLEN] Registro não retornou dados:', resultado)
        resposta = `Desculpe, não consegui registrar. O registro não foi criado.`
      } else {
        console.log('✅ [PLEN] Registro criado com sucesso! ID:', resultado.data.id)
        const tipoRegistro = comando.dados.tipo === 'divida' ? 'Dívida' : comando.dados.tipo === 'saida' ? 'Gasto' : 'Entrada'
        const tipoNome = comando.dados.tipo === 'divida' ? 'dívida' : comando.dados.tipo === 'saida' ? 'gasto' : 'entrada'
        const nomeItem = comando.dados.descricao || tipoRegistro
        const categoria = comando.dados.categoria || 'outros'
        let dataRegistro: Date
        if (resultado.data?.data_registro) {
          try {
            dataRegistro = new Date(resultado.data.data_registro)
            if (isNaN(dataRegistro.getTime())) {
              dataRegistro = new Date()
            }
          } catch {
            dataRegistro = new Date()
          }
        } else {
          dataRegistro = new Date()
        }
        
        try {
          resposta = formatarRespostaRegistro(nomeItem, comando.dados.valor, dataRegistro, categoria, tipoNome)
        } catch (error) {
          console.error('❌ [PLEN] Erro ao formatar resposta:', error)
          resposta = `✅ ${tipoRegistro} de R$ ${comando.dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado com sucesso!`
        }
        actionData = {
          action: 'created',
          message: `${tipoRegistro} registrado com sucesso!`
        }
      }
      
        // GARANTIR que temos uma resposta após o registro
        if (!resposta || resposta.trim() === '') {
          console.error('❌ [PLEN] Resposta vazia após registro! Criando resposta de fallback.')
          const tipoRegistro = comando.dados.tipo === 'divida' ? 'Dívida' : comando.dados.tipo === 'saida' ? 'Gasto' : 'Entrada'
          resposta = `✅ ${tipoRegistro} de R$ ${comando.dados.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} registrado com sucesso!`
        }
      }
    }
    
    // Se ainda não temos resposta, tentar gerar com IA
    if (!resposta || resposta.trim() === '') {
      console.log('🤖 [PLEN] Nenhuma resposta ainda, gerando com IA ou processamento local')
      console.log('🔍 [PLEN] Comando tipo:', comando.tipo, 'Comando dados:', comando.dados)
      
      try {
        resposta = await gerarRespostaIA(message, contexto, conversationHistory || [])
        
        // Se ainda não tiver resposta após IA, usar mensagem padrão
        if (!resposta || resposta.trim() === '') {
          console.log('⚠️ [PLEN] IA não retornou resposta, usando mensagem padrão')
          resposta = 'Olá! Eu sou o PLEN, seu assistente financeiro. Como posso ajudá-lo hoje? Você pode registrar gastos, entradas ou consultar suas finanças.'
        }
      } catch (error) {
        console.error('❌ [PLEN] Erro ao gerar resposta com IA:', error)
        resposta = 'Olá! Eu sou o PLEN, seu assistente financeiro. Como posso ajudá-lo hoje? Você pode registrar gastos, entradas ou consultar suas finanças.'
      }
      
      // Detectar se a resposta da IA pede confirmação
      const pedeConfirmacao = /(deseja|quer|gostaria|pode|confirma|confirmar|posso|você gostaria|deseja confirmar).*(confirmar|registrar|criar|adicionar|isso|essa entrada|esse registro)/i.test(resposta) ||
                              /(deseja confirmar|quer confirmar|gostaria de confirmar|pode confirmar|confirma isso)/i.test(resposta)
      
      if (pedeConfirmacao) {
        // Tentar extrair dados da transação da resposta - múltiplos padrões
        const valorPatterns = [
          /r\$\s*([\d.,]+)/i,
          /([\d.,]+)\s*reais?/i,
          /valor\s*(?:de|de\s+)?([\d.,]+)/i,
          /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:reais?|r\$|de)?\b/i
        ]
        
        let valorMatch: RegExpMatchArray | null = null
        for (const pattern of valorPatterns) {
          valorMatch = resposta.match(pattern)
          if (valorMatch) break
        }
        
        if (valorMatch) {
          const valorStr = valorMatch[1] || valorMatch[0]
          const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'))
          
          if (!isNaN(valor) && valor > 0 && valor < 10000000) {
            // Detectar tipo
            const tipoMatch: RegExpMatchArray | null = resposta.match(/(entrada|receita|recebido|recebeu|gasto|despesa|sa[ií]da|divida|d[ií]vida|pago|paguei)/i)
            const tipo = tipoMatch ? (
              /(entrada|receita|recebido|recebeu)/i.test(tipoMatch[1] || '') ? 'entrada' :
              /(divida|d[ií]vida)/i.test(tipoMatch[1] || '') ? 'divida' : 'saida'
            ) : 'entrada'
            
            // Extrair descrição - múltiplos padrões
            const descricaoPatterns = [
              /(?:de|para|com|em|no|na|recebido|recebeu|de)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+deseja|\s+quer|\s+gostaria|\s+pode|\s+confirma|\?|$)/i,
              /(?:de|para|com|em|no|na)\s+([^,\.\?]+?)(?:\s+\d|\s+deseja|\s+quer|\s+gostaria|\s+pode|\s+confirma|\?|$)/i
            ]
            
            let descricao = ''
            for (const pattern of descricaoPatterns) {
              const match = resposta.match(pattern)
              if (match && match[1]) {
                descricao = match[1].trim()
                // Limpar descrição
                descricao = descricao.replace(/^(?:de|para|com|em|no|na|recebido|recebeu|de)\s+/i, '')
                if (descricao.length > 3) break
              }
            }
            
            if (!descricao || descricao.length < 3) {
              descricao = `Registro de ${tipo === 'entrada' ? 'entrada' : tipo === 'divida' ? 'dívida' : 'gasto'}`
            }
            
            pendingAction = {
              valor,
              tipo,
              descricao: descricao.length > 100 ? descricao.substring(0, 100) : descricao
            }
            console.log('🔔 [PLEN] Confirmação pendente detectada:', pendingAction)
          }
        }
      }
    }

    // Garantir que sempre há uma resposta
    if (!resposta || resposta.trim() === '') {
      console.error('❌ [PLEN] Resposta vazia detectada! Usando mensagem padrão.')
      resposta = 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente ou reformule sua pergunta.'
    }
    
    console.log('✅ [PLEN] Retornando resposta:', {
      respostaLength: resposta.length,
      respostaPreview: resposta.substring(0, 100),
      hasActionData: !!actionData,
      hasPendingAction: !!pendingAction
    })
    
    const responseJson = {
      response: resposta,
      actionData,
      pendingAction
    }
    
    console.log('📤 [PLEN] Enviando resposta JSON:', JSON.stringify(responseJson).substring(0, 200))
    
    return NextResponse.json(responseJson)
  } catch (error: any) {
    console.error('❌ [PLEN] Erro crítico no chat PLEN:', error)
    console.error('❌ [PLEN] Stack trace:', error?.stack)
    
    // SEMPRE retornar uma resposta válida, mesmo em caso de erro
    return NextResponse.json({
      response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
      actionData: null,
      pendingAction: null
    })
  }
}

