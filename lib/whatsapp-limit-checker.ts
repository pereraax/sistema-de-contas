/**
 * Verificador de limite de mensagens WhatsApp para plano TESTE
 * 
 * Esta função verifica se o usuário pode enviar mais mensagens via WhatsApp
 * e registra o envio antes de processar a mensagem.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { addLog } from '@/lib/server-logs'

interface LimitCheckResult {
  allowed: boolean
  currentCount: number
  limit: number
  message?: string
  error?: string
}

const LIMITE_ENVIOS_GRATUITO = 10

/** Mensagem persuasiva quando o limite do plano gratuito é atingido (com promoção e botão para o site). */
export function getMensagemLimitePlanoGratuito(totalRegistros: number): string {
  return `Poxa, eu queria muito continuar te ajudando, mas seu limite no plano gratuito expirou. 💙

Você pode consultar todos os seus registros, relatórios e outras funções a qualquer momento na sua conta na plataforma. Mas olha… se eu fosse você, aproveitava a promoção: eu sou a única assistente avançada no momento para te ajudar todo dia com suas finanças.

*Por que escolher a Pleni?*
• Registros ilimitados pelo WhatsApp
• Dívidas, metas e lembretes
• Relatórios e visão do seu dinheiro
• Tudo organizado em um só lugar

*Promoção:* de ~~R$ 47,99~~ por apenas *R$ 9,99/mês* no plano básico.

*Planos:*
📌 *Básico (R$ 9,99)* – Registros ilimitados, dívidas, metas, relatórios e calendário.
📌 *Premium* – Tudo do básico + empréstimos, metas ilimitadas e recursos avançados.

💰 *Indique e ganhe:* convide amigos com seu link e ganhe R$ 3 por indicação. Ao juntar R$ 30, pode sacar.

Quer mais informações? Toque no botão abaixo para ver os planos e a promoção no site. 👇`
}

/**
 * Verifica o limite de mensagens e registra o envio se permitido
 * 
 * @param userId - ID do usuário (account_owner_id)
 * @param comandoTipo - Tipo do comando (registrar_entrada, registrar_divida, registrar_gasto)
 * @returns Resultado da verificação
 */
export async function checkAndRegisterWhatsAppLimit(
  userId: string,
  comandoTipo: 'registrar_entrada' | 'registrar_divida' | 'registrar_gasto'
): Promise<LimitCheckResult> {
  try {
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      const error = 'Erro ao criar cliente Supabase Admin'
      console.error(`❌ [WhatsApp Limit] ${error}`)
      addLog('error', `❌ [WhatsApp Limit] ${error}`)
      
      // Em caso de erro na conexão, permitir (fail-open)
      return {
        allowed: true,
        currentCount: 0,
        limit: LIMITE_ENVIOS_GRATUITO,
        error: 'Erro ao verificar limite - permitindo envio'
      }
    }

    // PASSO 1: Buscar plano do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plano')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      const error = `Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`
      console.error(`❌ [WhatsApp Limit] ${error}`)
      addLog('error', `❌ [WhatsApp Limit] ${error}`)
      
      // Em caso de erro, permitir (fail-open)
      return {
        allowed: true,
        currentCount: 0,
        limit: LIMITE_ENVIOS_GRATUITO,
        error: 'Erro ao buscar plano - permitindo envio'
      }
    }

    // Normalizar plano
    const planoRaw = profile.plano
    const planoNormalizado = typeof planoRaw === 'string' ? planoRaw.toLowerCase().trim() : null
    const plano = planoNormalizado || 'teste'

    console.log('🔍 [WhatsApp Limit] ==========================================')
    console.log('🔍 [WhatsApp Limit] VERIFICANDO LIMITE DE ENVIOS')
    console.log('🔍 [WhatsApp Limit] User ID:', userId.substring(0, 8) + '...')
    console.log('🔍 [WhatsApp Limit] Plano (raw):', profile.plano)
    console.log('🔍 [WhatsApp Limit] Plano (normalizado):', plano)
    console.log('🔍 [WhatsApp Limit] É plano TESTE?', plano === 'teste')
    console.log('🔍 [WhatsApp Limit] ==========================================')

    addLog('info', `🔍 [WhatsApp Limit] Verificando limite - User: ${userId.substring(0, 8)}..., Plano: ${plano}, É teste: ${plano === 'teste'}`)

    // Se NÃO for plano teste, permitir sem limite
    if (plano !== 'teste') {
      console.log(`✅ [WhatsApp Limit] Plano ${plano.toUpperCase()} - SEM LIMITE`)
      addLog('info', `✅ [WhatsApp Limit] Plano ${plano.toUpperCase()} - Sem limite de envios`)
      return {
        allowed: true,
        currentCount: 0,
        limit: -1, // Sem limite
      }
    }

    // PASSO 2: Contar envios atuais (CRÍTICO: fazer isso ANTES de inserir)
    const { data: enviosAtuais, error: errorContagem } = await supabaseAdmin
      .from('whatsapp_envios')
      .select('id, created_at')
      .eq('account_owner_id', userId)
      .order('created_at', { ascending: false })

    if (errorContagem) {
      const errorMsg = `❌ ERRO ao contar envios: ${errorContagem.message}`
      console.error('='.repeat(80))
      console.error(errorMsg)
      console.error('Detalhes:', errorContagem)
      console.error('='.repeat(80))
      addLog('error', errorMsg)
      
      // Se a tabela não existe, criar ela primeiro
      if (errorContagem.code === '42P01') {
        console.log('⚠️ [WhatsApp Limit] Tabela whatsapp_envios não existe ainda')
        addLog('warn', '⚠️ [WhatsApp Limit] Tabela whatsapp_envios não existe - criando estrutura...')
        
        // Permitir e deixar a inserção criar a estrutura (se RLS permitir)
        // Mas melhor bloquear para forçar correção
        return {
          allowed: false,
          currentCount: 0,
          limit: LIMITE_ENVIOS_GRATUITO,
          message: `❌ Erro ao verificar limite de envios. Por favor, entre em contato com o suporte.`,
          error: 'Tabela whatsapp_envios não encontrada'
        }
      }
      
      // Para outros erros, permitir (fail-open)
      return {
        allowed: true,
        currentCount: 0,
        limit: LIMITE_ENVIOS_GRATUITO,
        error: `Erro ao contar: ${errorContagem.message} - permitindo envio`
      }
    }

    const totalAtual = enviosAtuais?.length || 0
    
    console.log('📊 [WhatsApp Limit] ==========================================')
    console.log('📊 [WhatsApp Limit] CONTAGEM DE ENVIOS')
    console.log('📊 [WhatsApp Limit] Total atual:', totalAtual)
    console.log('📊 [WhatsApp Limit] Limite:', LIMITE_ENVIOS_GRATUITO)
    console.log('📊 [WhatsApp Limit] Pode enviar?', totalAtual < LIMITE_ENVIOS_GRATUITO)
    console.log('📊 [WhatsApp Limit] ==========================================')

    addLog('info', `📊 [WhatsApp Limit] Total de envios: ${totalAtual} / ${LIMITE_ENVIOS_GRATUITO}`)

    // PASSO 3: Se já atingiu o limite, BLOQUEAR
    if (totalAtual >= LIMITE_ENVIOS_GRATUITO) {
      const limiteMsg = `❌ LIMITE EXCEDIDO! Total: ${totalAtual} / ${LIMITE_ENVIOS_GRATUITO}`
      console.log('='.repeat(80))
      console.log(limiteMsg)
      console.log('='.repeat(80))
      addLog('warn', limiteMsg)

      return {
        allowed: false,
        currentCount: totalAtual,
        limit: LIMITE_ENVIOS_GRATUITO,
        message: getMensagemLimitePlanoGratuito(totalAtual),
      }
    }

    // PASSO 4: INSERIR o novo envio ANTES de processar (para garantir contagem correta)
    const tipoRegistroEnvio = comandoTipo === 'registrar_entrada' ? 'entrada' : 
                              comandoTipo === 'registrar_divida' ? 'divida' : 'saida'

    console.log('📝 [WhatsApp Limit] Inserindo envio:', tipoRegistroEnvio)
    addLog('info', `📝 [WhatsApp Limit] Inserindo envio: ${tipoRegistroEnvio}`)

    const { data: envioInserido, error: envioError } = await supabaseAdmin
      .from('whatsapp_envios')
      .insert({
        account_owner_id: userId,
        tipo_registro: tipoRegistroEnvio,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (envioError) {
      const errorInsertMsg = `❌ ERRO AO INSERIR ENVIO! Código: ${envioError.code}, Mensagem: ${envioError.message}`
      console.error('='.repeat(80))
      console.error(errorInsertMsg)
      console.error('Detalhes:', envioError.details)
      console.error('Hints:', envioError.hint)
      console.error('='.repeat(80))
      addLog('error', errorInsertMsg)

      // Se erro de constraint única (duplicata), ainda permitir (já foi contado)
      if (envioError.code === '23505') {
        console.log('⚠️ [WhatsApp Limit] Duplicata detectada - permitindo (já foi contado)')
        addLog('warn', '⚠️ [WhatsApp Limit] Duplicata detectada - permitindo')
        return {
          allowed: true,
          currentCount: totalAtual,
          limit: LIMITE_ENVIOS_GRATUITO,
          error: 'Duplicata - já foi contado'
        }
      }

      // Para outros erros, bloquear por segurança
      return {
        allowed: false,
        currentCount: totalAtual,
        limit: LIMITE_ENVIOS_GRATUITO,
        message: `❌ Erro ao registrar envio. Por favor, tente novamente ou entre em contato com o suporte.`,
        error: `Erro ao inserir: ${envioError.message}`
      }
    }

    // PASSO 5: Verificar contagem após inserção
    const { data: enviosApos } = await supabaseAdmin
      .from('whatsapp_envios')
      .select('id')
      .eq('account_owner_id', userId)

    const totalApos = enviosApos?.length || 0
    
    const successMsg = `✅ ENVIO REGISTRADO! ID: ${envioInserido?.id}, Total: ${totalApos} / ${LIMITE_ENVIOS_GRATUITO}`
    console.log('='.repeat(80))
    console.log(successMsg)
    console.log('='.repeat(80))
    addLog('info', successMsg)
    addLog('info', `📊 [WhatsApp Limit] Total após inserção: ${totalApos} / ${LIMITE_ENVIOS_GRATUITO}`)

    return {
      allowed: true,
      currentCount: totalApos,
      limit: LIMITE_ENVIOS_GRATUITO,
    }

  } catch (error: any) {
    const criticalErrorMsg = `❌ ERRO CRÍTICO no verificador de limite: ${error.message}`
    console.error('='.repeat(80))
    console.error(criticalErrorMsg)
    console.error('Stack:', error.stack?.substring(0, 500))
    console.error('='.repeat(80))
    addLog('error', criticalErrorMsg)

    // Em caso de erro crítico, permitir (fail-open) mas logar
    return {
      allowed: true,
      currentCount: 0,
      limit: LIMITE_ENVIOS_GRATUITO,
      error: `Erro crítico: ${error.message} - permitindo envio`
    }
  }
}

