/**
 * Lógica do PLEN para WhatsApp: interpretar mensagem e criar registro.
 * Usado pela rota /api/plen/whatsapp-chat e pelo handler (chamada direta, sem fetch).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { interpretarMensagem, formatarRespostaRegistro } from '@/lib/plen-registro'

export type ProcessPlenWhatsAppResult = { response: string }

/** Estatísticas por conta (para consultas/relatórios no WhatsApp). */
type StatsPlen = {
  totalEntradas: number
  totalSaidas: number
  totalDividas: number
  dividasPagas: number
  totalDividasPendentes: number
  saldo: number
}

function fmt(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

/** Retorna início e fim da semana (últimos 7 dias) em ISO. */
function intervaloSemana(): { inicio: string; fim: string } {
  const fim = new Date()
  const inicio = new Date(fim)
  inicio.setDate(inicio.getDate() - 6)
  inicio.setHours(0, 0, 0, 0)
  fim.setHours(23, 59, 59, 999)
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

/** Retorna início e fim do mês atual em ISO. */
function intervaloMes(): { inicio: string; fim: string } {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0)
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

async function obterEstatisticasPlen(
  supabase: SupabaseClient,
  accountOwnerId: string,
  dataInicio?: string,
  dataFim?: string
): Promise<StatsPlen | null> {
  const { data: usuarios, error: errU } = await supabase
    .from('users')
    .select('id')
    .eq('account_owner_id', accountOwnerId)
  if (errU || !usuarios?.length) return null
  const userIds = usuarios.map((u) => u.id)

  let query = supabase
    .from('registros')
    .select('tipo, valor, parcelas_totais, parcelas_pagas')
    .in('user_id', userIds)
  if (dataInicio) query = query.gte('data_registro', dataInicio)
  if (dataFim) query = query.lte('data_registro', dataFim)
  const { data: registros, error } = await query
  if (error || !registros) return null

  let totalEntradas = 0
  let totalSaidas = 0
  let totalDividas = 0
  let dividasPagas = 0
  registros.forEach((r) => {
    if (r.tipo === 'entrada') totalEntradas += Number(r.valor)
    else if (r.tipo === 'saida') totalSaidas += Number(r.valor)
    else if (r.tipo === 'divida') {
      totalDividas += Number(r.valor)
      const n = Number(r.parcelas_totais) || 1
      const p = Number(r.parcelas_pagas) || 0
      dividasPagas += (Number(r.valor) * p) / n
    }
  })
  return {
    totalEntradas,
    totalSaidas,
    totalDividas,
    dividasPagas,
    totalDividasPendentes: totalDividas - dividasPagas,
    saldo: totalEntradas - totalSaidas,
  }
}

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
        // Padrão: dono da conta = pessoa cujo nome coincide com o perfil; se não existir, criar uma para o dono
        const profileNomeLower = (profileNome ?? '').toLowerCase()
        const dono = usuarios.find((u) => (u.nome ?? '').trim().toLowerCase() === profileNomeLower)
        if (dono) {
          registroUserId = dono.id
          nomeParaResposta = (dono.nome ?? '').trim()
        } else {
          // Não existe pessoa com nome do dono → criar "Dono da conta" para que o registro seja sempre do titular
          const nomeDono = profileNome || 'Dono da conta'
          const { data: novoDono, error: errDono } = await supabase
            .from('users')
            .insert({ nome: nomeDono, account_owner_id: userId })
            .select('id, nome')
            .single()
          if (!errDono && novoDono?.id) {
            registroUserId = novoDono.id
            nomeParaResposta = (novoDono.nome ?? nomeDono).trim()
          } else {
            registroUserId = usuarios[0].id
            nomeParaResposta = (usuarios[0].nome ?? '').trim()
          }
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

    const t = rawMessage.toLowerCase()

    // CONSULTAR / RELATÓRIOS: reconhece as frases da mensagem de boas-vindas do PLEN
    const isRelatorio =
      /\b(relat[oó]rio|resumo|finan[cç]as|como estão)\b/.test(t) ||
      /me\s+mostr(e|ar)|mostre\s+meu|quero\s+ver\s+meu/.test(t)
    const isGastosSemana =
      /\b(gastos?\s+(dessa|esta|na)\s+semana|gastei\s+na\s+semana|quanto\s+gastei\s+na\s+semana|qual\s+foi\s+meus?\s+gastos?\s+essa\s+semana)\b/.test(t)
    const isGastosMes =
      /\b(gastos?\s+(do\s+)?m[eê]s|gastei\s+no\s+m[eê]s|quanto\s+gastei\s+no\s+m[eê]s)\b/.test(t)
    const isDividas = /\b(d[ií]vidas?|quais\s+s[aã]o\s+minhas?\s+d[ií]vidas?)\b/.test(t)
    const isSaldo = /\b(saldo|quanto\s+tenho\s+de\s+saldo)\b/.test(t)
    const isRecebiMes = /\b(recebi\s+(este|no)\s+m[eê]s|quanto\s+recebi\s+este\s+m[eê]s)\b/.test(t)

    if (isRelatorio || isGastosSemana || isGastosMes || isDividas || isSaldo || isRecebiMes) {
      const { inicio: inicioSemana, fim: fimSemana } = intervaloSemana()
      const { inicio: inicioMes, fim: fimMes } = intervaloMes()
      const statsSemana = await obterEstatisticasPlen(supabase, userId, inicioSemana, fimSemana)
      const statsMes = await obterEstatisticasPlen(supabase, userId, inicioMes, fimMes)
      if (statsSemana === null && statsMes === null) {
        return {
          response:
            'Não encontrei dados da sua conta. Crie pessoas em Configurações → Usuários e registre alguns lançamentos.',
        }
      }
      const sSemana = statsSemana ?? {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDividas: 0,
        dividasPagas: 0,
        totalDividasPendentes: 0,
        saldo: 0,
      }
      const sMes = statsMes ?? {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDividas: 0,
        dividasPagas: 0,
        totalDividasPendentes: 0,
        saldo: 0,
      }

      const linhas: string[] = []
      if (isGastosSemana || isRelatorio) {
        linhas.push('📅 Esta semana')
        linhas.push(`🟢 Entradas: ${fmt(sSemana.totalEntradas)}`)
        linhas.push(`🔴 Gastos: ${fmt(sSemana.totalSaidas)}`)
        linhas.push(`💰 Saldo da semana: ${fmt(sSemana.saldo)}`)
      }
      if (isGastosMes || isRecebiMes || isRelatorio) {
        linhas.push('')
        linhas.push('📆 Este mês')
        linhas.push(`🟢 Entradas: ${fmt(sMes.totalEntradas)}`)
        linhas.push(`🔴 Gastos: ${fmt(sMes.totalSaidas)}`)
        linhas.push(`💰 Saldo do mês: ${fmt(sMes.saldo)}`)
      }
      if (isDividas || isRelatorio) {
        linhas.push('')
        linhas.push('📌 Dívidas')
        linhas.push(`Total: ${fmt(sMes.totalDividas)}`)
        linhas.push(`Pago: ${fmt(sMes.dividasPagas)}`)
        linhas.push(`Pendente: ${fmt(sMes.totalDividasPendentes)}`)
      }
      if (isSaldo && !linhas.length) {
        linhas.push(`💰 Saldo atual (entradas − gastos): ${fmt(sMes.saldo)}`)
        linhas.push(`📌 Dívidas pendentes: ${fmt(sMes.totalDividasPendentes)}`)
      }
      const text = linhas.length ? linhas.join('\n') : `💰 Saldo: ${fmt(sMes.saldo)}\n📌 Dívidas pendentes: ${fmt(sMes.totalDividasPendentes)}`
      return { response: text }
    }

    if (t.includes('oi') || t.includes('olá') || t.includes('ola')) {
      return {
        response: 'Oi! 👋 Pode dizer um gasto ou entrada, por exemplo: "Gastei 30 reais de ônibus" ou "Recebi 500".',
      }
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return {
        response:
          'Para registrar:\n• Gasto: "Gastei 50 no mercado", "Paguei 30 de Uber"\n• Ganho: "Ganhei 20", "Recebi 1000 do cliente"\n• Por padrão o registro vai no seu nome (dono da conta).\n• Para registrar no nome de outro usuário, mande na segunda linha o nome dele:\n  gastei 50 roupas\n  (nome do usuário)\n\nConsultar: "quanto gastei na semana?", "me mostre o relatório", "quais são minhas dívidas?"',
      }
    }

    return {
      response:
        'Não entendi. Tente: "Gastei 30 reais de ônibus", "Ganhei 20", "Recebi 500 reais", "Quanto gastei na semana?" ou "Me mostre o relatório".',
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Exceção:', err)
    return {
      response: `Erro (PLEN): ${msg}`,
    }
  }
}
