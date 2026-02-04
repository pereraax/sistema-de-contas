/**
 * Lógica do PLEN para WhatsApp: interpretar mensagem e criar registro.
 * Usado pela rota /api/plen/whatsapp-chat e pelo handler (chamada direta, sem fetch).
 */

import { createAdminClient } from '@/lib/supabase/server'
import type { TipoRegistro } from '@/lib/types'

function extrairValor(texto: string): number | null {
  const match = texto.match(/(\d+)(?:[.,](\d+))?/)
  if (!match) return null
  const inteiro = match[1]
  const decimal = match[2] || '00'
  const valor = parseFloat(`${inteiro}.${decimal}`)
  return isNaN(valor) ? null : valor
}

function interpretarMensagem(texto: string): { tipo: TipoRegistro; valor: number; nome: string } | null {
  const t = texto.trim().toLowerCase()
  const valorMatch = t.match(/(\d+)(?:[.,](\d+))?\s*(?:reais?|r\$|r\b)?/i)
  const valorNum = valorMatch ? extrairValor(valorMatch[0]) : null
  if (valorNum == null || valorNum <= 0) return null

  const despesaMatch = t.match(/(?:gastei|gasteu|paguei)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|em|com|para)?\s*(.*)/i)
  if (despesaMatch) {
    const nome = (despesaMatch[1] || '').trim() || 'Gasto'
    return { tipo: 'saida', valor: valorNum, nome: nome.substring(0, 200) }
  }
  if (/\b(?:gastei|gasteu|paguei)\s+[\d.,]+/i.test(t)) {
    return { tipo: 'saida', valor: valorNum, nome: 'Gasto' }
  }

  const entradaMatch = t.match(/(?:recebi|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|do|da)?\s*(.*)/i)
  if (entradaMatch) {
    const nome = (entradaMatch[1] || '').trim() || 'Entrada'
    return { tipo: 'entrada', valor: valorNum, nome: nome.substring(0, 200) }
  }
  if (/\brecebi\s+[\d.,]+/i.test(t)) {
    return { tipo: 'entrada', valor: valorNum, nome: 'Entrada' }
  }

  return null
}

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
      const { tipo, valor, nome } = interpretado
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
          data_registro: new Date().toISOString(),
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

      const tipoLabel = tipo === 'saida' ? 'Despesa' : 'Entrada'
      const valorFormatado = valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return {
        response: `✅ Registrado: ${tipoLabel} de ${valorFormatado} – ${nome}.`,
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
        response: 'Para registrar: "Gastei 50 reais no mercado", "Gasteu 400 roupa", "Recebi 1000 reais", "Paguei 30 de Uber".',
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
