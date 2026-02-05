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

    const rawMessage = (message || '').trim()
    if (!userId) {
      return { response: 'Sessão inválida. Envie "chamar assistente plen" e faça login de novo pelo WhatsApp.' }
    }
    if (!rawMessage) {
      return { response: 'Envie uma mensagem. Ex.: "Gastei 50 reais" ou "Recebi 200".' }
    }

    // Segunda linha = nome do usuário (pessoa) para registrar no nome dele; senão usa dono da conta
    const linhas = rawMessage.split(/\n/).map((l) => l.trim()).filter(Boolean)
    const msgForRegistro = linhas[0] ?? rawMessage
    const nomeOutroUsuario = linhas.length > 1 ? linhas[1] : null

    const interpretado = interpretarMensagem(msgForRegistro)

    if (interpretado) {
      const { tipo, valor, nome, data_registro, categoria } = interpretado
      const valorFinal = Math.round(valor * 100) / 100

      // Nome do dono da conta (profile) para preferir essa pessoa quando não houver segunda linha
      let profileNome: string | null = null
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', userId)
          .single()
        if (profile?.nome?.trim()) profileNome = profile.nome.trim()
        else if (profile?.email) profileNome = profile.email.split('@')[0]?.trim() ?? null
      } catch (_) {}

      const { data: usuarios, error: errUsuarios } = await supabase
        .from('users')
        .select('id, nome')
        .eq('account_owner_id', userId)
        .order('nome', { ascending: true })

      if (errUsuarios || !usuarios?.length) {
        const { data: novoUsuario, error: errCriar } = await supabase
          .from('users')
          .insert({ nome: profileNome || 'Meus registros', account_owner_id: userId })
          .select('id, nome')
          .single()
        if (!errCriar && novoUsuario?.id) {
          const nomeParaResposta = novoUsuario.nome ?? 'Meus registros'
          const { data: inserted, error } = await supabase
            .from('registros')
            .insert({
              user_id: novoUsuario.id,
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
            return { response: `Erro ao salvar: ${error.message}. Crie uma pessoa em Configurações → Usuários no site.` }
          }
          return {
            response: formatarRespostaRegistro({
              nome,
              tipo,
              valor: valorFinal,
              dataRegistro: data_registro,
              categoria,
              nomeUsuario: nomeParaResposta,
            }),
          }
        }
        return {
          response: 'Não encontrei uma pessoa para o registro. Crie em Configurações → Usuários (pelo menos uma) no site e tente de novo.',
        }
      }

      let registroUserId: string | null = null
      let nomeParaResposta: string = ''

      if (nomeOutroUsuario) {
        const nomeBusca = nomeOutroUsuario.trim().toLowerCase()
        const encontrado = usuarios.find((u) => (u.nome ?? '').trim().toLowerCase() === nomeBusca)
        if (!encontrado) {
          return {
            response: `Usuário "${nomeOutroUsuario}" não encontrado. Use o nome exatamente como em Configurações → Usuários. Ex.:\n\ngastei 50 roupas\n(nome do usuário)`,
          }
        }
        registroUserId = encontrado.id
        nomeParaResposta = (encontrado.nome ?? '').trim()
      } else {
        // Padrão: dono da conta = pessoa cujo nome coincide com o perfil (ou primeira da lista)
        const profileNomeLower = (profileNome ?? '').toLowerCase()
        const dono = usuarios.find((u) => (u.nome ?? '').trim().toLowerCase() === profileNomeLower)
        if (dono) {
          registroUserId = dono.id
          nomeParaResposta = (dono.nome ?? '').trim()
        } else {
          registroUserId = usuarios[0].id
          nomeParaResposta = (usuarios[0].nome ?? '').trim()
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
          nomeUsuario: nomeParaResposta,
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
        response: 'Para registrar:\n• Gasto: "Gastei 50 no mercado", "Paguei 30 de Uber"\n• Ganho: "Ganhei 20", "Recebi 1000 do cliente"\n• Por padrão o registro vai no seu nome (dono da conta).\n• Para registrar no nome de outro usuário, mande na segunda linha o nome dele:\n  gastei 50 roupas\n  (nome do usuário)',
      }
    }

    return {
      response: 'Não entendi. Tente: "Gastei 30 reais de ônibus", "Ganhei 20", "Recebi 500 reais" ou "Tenho uma dívida de 200 no cartão".',
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Exceção:', err)
    return {
      response: `Erro (PLEN): ${msg}`,
    }
  }
}
