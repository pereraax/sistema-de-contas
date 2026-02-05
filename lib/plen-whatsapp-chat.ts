/**
 * Lógica do PLEN para WhatsApp: interpretar mensagem e criar registro.
 * Usado pela rota /api/plen/whatsapp-chat e pelo handler (chamada direta, sem fetch).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { interpretarMensagem, formatarRespostaRegistro } from '@/lib/plen-registro'

export type ProcessPlenWhatsAppResult = { response: string }

/**
 * Processa uma mensagem do usuário no contexto WhatsApp (userId = id do profile/account_owner).
 * Não usa cookies; usa Admin Client. Retorna sempre { response } (nunca lança).
 */
export async function processPlenWhatsAppMessage(
  userId: string,
  message: string
): Promise<ProcessPlenWhatsAppResult> {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return { response: 'Erro: Serviço indisponível (SUPABASE_SERVICE_ROLE_KEY não configurada no servidor).' }
    }

    const msg = (message || '').trim()
    if (!userId) {
      return { response: 'Sessão inválida. Envie "chamar assistente plen" e faça login de novo pelo WhatsApp.' }
    }
    if (!msg) {
      return { response: 'Envie uma mensagem. Ex.: "Gastei 50 reais" ou "Recebi 200".' }
    }

    const interpretado = interpretarMensagem(msg)

    if (interpretado) {
      const { tipo, valor, nome, data_registro, categoria } = interpretado
      const valorFinal = Math.round(valor * 100) / 100

      let registroUserId: string | null = null

      const { data: usuarios, error: errUsuarios } = await supabase
        .from('users')
        .select('id')
        .eq('account_owner_id', userId)
        .order('nome', { ascending: true })
        .limit(1)

      if (!errUsuarios && usuarios?.[0]?.id) {
        registroUserId = usuarios[0].id
      }

      if (!registroUserId) {
        const { data: novoUsuario, error: errCriar } = await supabase
          .from('users')
          .insert({ nome: 'Meus registros', account_owner_id: userId })
          .select('id')
          .single()
        if (!errCriar && novoUsuario?.id) {
          registroUserId = novoUsuario.id
        }
      }

      if (!registroUserId) {
        return {
          response: 'Não encontrei uma pessoa para o registro. Crie em Configurações → Usuários (pelo menos uma) no site e tente de novo.',
        }
      }

      const { data: inserted, error } = await supabase
        .from('registros')
        .insert({
          user_id: registroUserId,
          nome,
          tipo,
          valor: valorFinal,
          data_registro,
          categoria: categoria || null,
          parcelas_totais: 1,
          parcelas_pagas: 0,
          etiquetas: [],
        })
        .select('id')
        .single()

      if (error) {
        console.error('[PLEN whatsapp-chat] Erro ao inserir:', error)
        return {
          response: `Erro ao salvar: ${error.message}. Crie uma pessoa em Configurações → Usuários no site.`,
        }
      }

      return {
        response: formatarRespostaRegistro({
          nome,
          tipo,
          valor: valorFinal,
          dataRegistro: data_registro,
          categoria,
        }),
      }
    }

    const t = msg.toLowerCase()
    if (t.includes('oi') || t.includes('olá') || t.includes('ola')) {
      return {
        response: 'Oi! 👋 Pode dizer um gasto ou entrada, por exemplo: "Gastei 30 reais de ônibus" ou "Recebi 500".',
      }
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return {
        response: 'Para registrar:\n• Gasto: "Gastei 50 reais no mercado", "Paguei 30 de Uber"\n• Ganho: "Recebi 1000 reais do cliente"\nVocê pode incluir data: "gastei 40 ontem em roupas" ou "dia 15".',
      }
    }

    return {
      response: 'Não entendi. Tente: "Gastei 30 reais de ônibus" ou "Recebi 500 reais".',
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Exceção:', err)
    return {
      response: `Erro (PLEN): ${msg}`,
    }
  }
}
