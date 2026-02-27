/**
 * Lógica do PLEN para WhatsApp: interpretar mensagem e criar registro.
 * Usado pela rota /api/plen/whatsapp-chat e pelo handler (chamada direta, sem fetch).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { interpretarMensagem, formatarRespostaRegistro, categoriaInteligente, normalizarNumerosPorExtenso } from '@/lib/plen-registro'
import {
  getPlenLLMResponse,
  getRespostaPlanos,
  RESPOSTA_OPEN_FINANCE,
  RESPOSTA_NAO_SEI,
} from '@/lib/plen-llm-fallback'

/** Quando a intenção parece lembrete/gasto/dívida mas não conseguimos interpretar. */
const MSG_ENTENDER_MELHOR = `Para te entender melhor, você pode começar dizendo o que deseja:

📌 Lembrete
💸 Dívida
📤 Gastos
📥 Recebeu

Em seguida explique: o que foi, qual data e horário (se for lembrete). Exemplos:

• "Lembrete: pagar conta de luz dia 7 de março"
• "Me lembre de pagar conta de água amanhã"
• "Gastei 50 reais no mercado"
• "Tenho uma dívida de 200 reais no cartão"`

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

/**
 * Detecta "gastei 30 usuario NOME" / "recebi 100 usuário NOME" na mesma linha.
 * Retorna mensagem limpa (só valor) e nome do usuário alvo para atribuir o registro.
 * Exportado para uso no chat in-app (app/api/plen/chat) e no WhatsApp.
 */
export function extrairUsuarioNaMensagem(raw: string): { msgForRegistro: string; targetUserName: string | null } {
  const t = raw.trim()
  // Padrão: (gastei|paguei|recebi|ganhei|...) valor (reais?) usuario/usuário NOME
  const match = t.match(
    /^(gastei|gasteu|gastou|paguei|pagou|recebi|recebeu|ganhei|ganhou|ganhamos)\s+([\d.,]+)\s*(reais?|r\$|r\b)?\s*usu[aá]rio\s+(.+)$/i
  )
  if (!match) return { msgForRegistro: t, targetUserName: null }
  const valorPart = (match[2] || '').trim()
  const reaisPart = (match[3] || '').trim()
  const nomeCompleto = (match[4] || '').trim()
    .replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '')
    .trim()
  if (!nomeCompleto) return { msgForRegistro: t, targetUserName: null }
  const msgLimpa = `${match[1]} ${valorPart}${reaisPart ? ' ' + reaisPart : ''}`.trim()
  return { msgForRegistro: msgLimpa, targetUserName: nomeCompleto }
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

const MESES_PT: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
}

/** Interpreta "dia 7 de março", "07 de março", "dia 15/03" no texto e retorna Date ou null. */
function parseDataNoTexto(t: string): { dia: number; mes: number; ano: number } | null {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  // "dia 7 de março" ou "dia 07 de março"
  const diaDeMes = t.match(/\bdia\s+(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i)
  if (diaDeMes) {
    const dia = parseInt(diaDeMes[1], 10)
    const nomeMes = diaDeMes[2].toLowerCase().replace('ç', 'c')
    const mes = MESES_PT[nomeMes]
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      const anoRel = mes < hoje.getMonth() ? ano + 1 : ano
      return { dia, mes, ano: anoRel }
    }
  }
  // "7 de março" ou "07 de março" (sem "dia")
  const numDeMes = t.match(/\b(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i)
  if (numDeMes) {
    const dia = parseInt(numDeMes[1], 10)
    const nomeMes = numDeMes[2].toLowerCase().replace('ç', 'c')
    const mes = MESES_PT[nomeMes]
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      const anoRel = mes < hoje.getMonth() ? ano + 1 : ano
      return { dia, mes, ano: anoRel }
    }
  }
  // "dia 15" ou "dia 15/03"
  const diaSimples = t.match(/\bdia\s+(\d{1,2})(?:\/(\d{1,2}))?\s*$/i)
  if (diaSimples) {
    const dia = parseInt(diaSimples[1], 10)
    const mesRel = diaSimples[2] ? parseInt(diaSimples[2], 10) - 1 : hoje.getMonth()
    const anoRel = mesRel < hoje.getMonth() ? ano + 1 : ano
    if (dia >= 1 && dia <= 31) return { dia, mes: mesRel, ano: anoRel }
  }
  return null
}

/** Interpreta mensagem de lembrete e retorna { descricao, data_lembrete } ou null. */
function interpretarLembrete(texto: string): { descricao: string; data_lembrete: string } | null {
  const t = texto.trim().toLowerCase()
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  const toISO = (d: Date) => {
    d.setHours(10, 0, 0, 0)
    return d.toISOString()
  }
  const toDate = (dia: number, mesIdx: number, anoVal: number) => {
    const d = new Date(anoVal, mesIdx, dia)
    return isNaN(d.getTime()) ? null : d
  }

  // Qualquer data no texto (dia 7 de março, 07 de março, dia 15/03)
  const dataParse = parseDataNoTexto(t)

  // "me lembre de X amanhã" / "lembrete: X amanhã"
  const amanhaMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+amanh[ãa]\s*$/i)
  if (amanhaMatch) {
    const desc = amanhaMatch[2].trim().substring(0, 500)
    const d = new Date(hoje)
    d.setDate(d.getDate() + 1)
    return { descricao: desc, data_lembrete: toISO(d) }
  }
  const amanha2 = t.match(/lembrete\s*:?\s*(.+?)\s+amanh[ãa]\s*$/i)
  if (amanha2) {
    const desc = amanha2[1].trim().substring(0, 500)
    const d = new Date(hoje)
    d.setDate(d.getDate() + 1)
    return { descricao: desc, data_lembrete: toISO(d) }
  }

  // "me lembre de X hoje"
  const hojeMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+hoje\s*$/i)
  if (hojeMatch) {
    return { descricao: hojeMatch[2].trim().substring(0, 500), data_lembrete: toISO(new Date(hoje)) }
  }

  // "me lembre de pagar conta de luz dia 7 de março" / "me lembre de X dia DD de MÊS"
  if (dataParse && /(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+dia\s+\d{1,2}\s+de\s+/i.test(t)) {
    const descMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+dia\s+\d{1,2}(\s+de\s+\w+)?/i)
    if (descMatch) {
      const desc = descMatch[2].replace(/\s+dia\s+\d{1,2}(\s+de\s+\w+)?\s*$/i, '').trim().substring(0, 500)
      const d = toDate(dataParse.dia, dataParse.mes, dataParse.ano)
      if (d) return { descricao: desc || 'Lembrete', data_lembrete: toISO(d) }
    }
  }

  // "lembrete para pagar conta de luz dia 07 de março" / "lembrete para X dia DD de MÊS"
  if (dataParse && /lembrete\s+para\s+.+?\s+dia\s+\d{1,2}\s+de\s+/i.test(t)) {
    const descMatch = t.match(/lembrete\s+para\s+(.+?)\s+dia\s+\d{1,2}(\s+de\s+\w+)?/i)
    if (descMatch) {
      const desc = descMatch[1].replace(/\s+dia\s+\d{1,2}(\s+de\s+\w+)?\s*$/i, '').trim().substring(0, 500)
      const d = toDate(dataParse.dia, dataParse.mes, dataParse.ano)
      if (d) return { descricao: desc || 'Lembrete', data_lembrete: toISO(d) }
    }
  }

  // "lembrete: X dia 15" ou "dia 15/03" ou "dia 15"
  const diaMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+dia\s+(\d{1,2})(?:\/(\d{1,2}))?\s*$/i)
  if (diaMatch) {
    const dia = parseInt(diaMatch[3], 10)
    const mesRel = diaMatch[4] ? parseInt(diaMatch[4], 10) - 1 : mes
    const anoRel = mesRel < mes ? ano + 1 : ano
    const d = toDate(dia, mesRel, anoRel)
    if (d) return { descricao: diaMatch[2].trim().substring(0, 500), data_lembrete: toISO(d) }
  }
  const dia2 = t.match(/lembrete\s*:?\s*(.+?)\s+dia\s+(\d{1,2})(?:\/(\d{1,2}))?\s*$/i)
  if (dia2) {
    const dia = parseInt(dia2[2], 10)
    const mesRel = dia2[3] ? parseInt(dia2[3], 10) - 1 : mes
    const anoRel = mesRel < mes ? ano + 1 : ano
    const d = toDate(dia, mesRel, anoRel)
    if (d) return { descricao: dia2[1].trim().substring(0, 500), data_lembrete: toISO(d) }
  }

  // "pagar conta de luz dia 07 de março" / "pagar X dia DD de MÊS" (sem valor = lembrete, não dívida)
  if (dataParse && !/[\d.,]+\s*(?:reais?|r\$)/i.test(t)) {
    const pagarMatch = t.match(/(pagar\s+.+?)\s+dia\s+\d{1,2}(\s+de\s+\w+)?/i)
    if (pagarMatch) {
      const desc = pagarMatch[1].replace(/\s+dia\s+\d{1,2}(\s+de\s+\w+)?\s*$/i, '').trim().substring(0, 500)
      const d = toDate(dataParse.dia, dataParse.mes, dataParse.ano)
      if (d && desc.length >= 3) return { descricao: desc, data_lembrete: toISO(d) }
    }
    // "conta de luz dia 7 de março" (ação implícita)
    const contaMatch = t.match(/(conta\s+de\s+(?:luz|água|agua|internet|\w+))\s+dia\s+\d{1,2}(\s+de\s+\w+)?/i)
    if (contaMatch) {
      const desc = `Pagar ${contaMatch[1].trim()}`
      const d = toDate(dataParse.dia, dataParse.mes, dataParse.ano)
      if (d) return { descricao: desc, data_lembrete: toISO(d) }
    }
  }

  // "me lembre de X dia 7 de março" (ordem alternativa: descrição antes de "dia DD de mês")
  if (dataParse && /(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?.+\s+dia\s+\d{1,2}\s+de\s+/.test(t)) {
    const descMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+?)\s+dia\s+(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i)
    if (descMatch) {
      const desc = descMatch[2].trim().substring(0, 500)
      const d = toDate(dataParse.dia, dataParse.mes, dataParse.ano)
      if (d && desc.length >= 2) return { descricao: desc, data_lembrete: toISO(d) }
    }
  }

  // "me lembre de X" ou "lembrete: X" (sem data -> amanhã)
  const simplesMatch = t.match(/(?:me\s+)?lembr(e|ar)\s+(?:de\s+)?(.+)\s*$/i)
  if (simplesMatch && simplesMatch[2].trim().length >= 2 && !/amanh[ãa]|hoje|dia\s+\d/.test(simplesMatch[2])) {
    const desc = simplesMatch[2].trim().substring(0, 500)
    const d = new Date(hoje)
    d.setDate(d.getDate() + 1)
    return { descricao: desc, data_lembrete: toISO(d) }
  }
  const simples2 = t.match(/^lembrete\s*:?\s*(.+)\s*$/i)
  if (simples2 && simples2[1].trim().length >= 2 && !/amanh[ãa]|hoje|dia\s+\d/.test(simples2[1])) {
    const desc = simples2[1].trim().substring(0, 500)
    const d = new Date(hoje)
    d.setDate(d.getDate() + 1)
    return { descricao: desc, data_lembrete: toISO(d) }
  }

  return null
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

    const t = rawMessage.toLowerCase()

    // Planos / preço — mensagem dinâmica sem valor real
    const isPlanos =
      /\b(plano|planos|pre[cç]o|quanto\s+custa|valor\s+do\s+plano|assinatura|mensalidade)\b/.test(t)
    if (isPlanos) {
      return { response: getRespostaPlanos() }
    }

    // Open Finance — em produção
    const isOpenFinance = /\b(open\s+finance|open\s+banking|conectar\s+banco|integrar\s+banco)\b/i.test(t)
    if (isOpenFinance) {
      return { response: RESPOSTA_OPEN_FINANCE }
    }

    // Lembrete — "me lembre de X amanhã", "lembrete para X dia 7 de março", "pagar conta dia 07 de março"
    const lembreteResult = interpretarLembrete(rawMessage)
    if (lembreteResult) {
      const { descricao, data_lembrete } = lembreteResult
      const horario = '10:00:00'
      const { error } = await supabase.from('lembretes').insert({
        account_owner_id: userId,
        descricao,
        data_lembrete,
        horario,
        status: 'pendente',
      })
      if (error) {
        return { response: `Não consegui salvar o lembrete: ${error.message}. Tente de novo ou cadastre em plenipay.com na área Lembretes.` }
      }
      const dataBr = new Date(data_lembrete).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      return {
        response: `✅ Lembrete registrado!\n\n📌 ${descricao}\n📅 ${dataBr}\n\nConfira em plenipay.com na área Lembretes.`,
      }
    }

    // Intenção de lembrete mas não conseguimos interpretar — não confundir com dívida
    const isLembreteIntent =
      /\b(lembrete|lembrar|me\s+lembre)\b/i.test(t) ||
      (/pagar\s+.+\s+dia\s+\d{1,2}/i.test(t) && !/[\d.,]+\s*(?:reais?|r\$)/i.test(t)) ||
      /conta\s+de\s+(luz|água|agua|internet)\s+dia\s+\d/i.test(t)
    if (isLembreteIntent) {
      return { response: MSG_ENTENDER_MELHOR }
    }

    // Suporte a "gastei 30 usuario NOME" na mesma linha OU segunda linha = nome do usuário
    const linhas = rawMessage.split(/\n/).map((l) => l.trim()).filter(Boolean)
    const primeiraLinha = linhas[0] ?? rawMessage
    const { msgForRegistro, targetUserName: usuarioNaFrase } = extrairUsuarioNaMensagem(primeiraLinha)
    const nomeOutroUsuario = usuarioNaFrase ?? (linhas.length > 1 ? linhas[1] : null)

    let interpretado: { tipo: 'saida' | 'entrada'; valor: number; nome: string; data_registro: string; categoria: string } | null = interpretarMensagem(msgForRegistro)

    const temVerboRegistro = /(?:gastei|paguei|recebi|ganhei|gastou|pagou|recebeu|ganhou)/i.test(msgForRegistro)
    const fraseCurta = msgForRegistro.trim().length <= 120

    // Pedido de registro (texto curto): extração por regex primeiro, LLM quando necessário.
    if (temVerboRegistro && fraseCurta) {
      const msgNorm = normalizarNumerosPorExtenso(msgForRegistro)
      // SOLUÇÃO DEFINITIVA: extrair valor e nome por REGEX da frase (não depender do LLM)
      const valorRegex = msgNorm.match(/(?:gastei|paguei|ganhei|recebi)\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?/i)?.[1]
      const nomeRegex = msgForRegistro.match(/(?:com|no|na|em|para)\s+([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+){0,3})(?:\s|$|,|\.)/i)?.[1]?.trim()
      const valorNum = valorRegex ? parseFloat(valorRegex.replace(',', '.').replace(/\s/g, '')) : NaN
      const tipoFromVerbo: 'entrada' | 'saida' = /\b(ganhei|recebi|ganhou|recebeu)\b/i.test(msgForRegistro) ? 'entrada' : 'saida'
      const valorValido = Number.isFinite(valorNum) && valorNum >= 1 && valorNum <= 500_000
      const nomeValido = nomeRegex && nomeRegex.length >= 2
      // Se regex já achou valor (e opcionalmente nome), usar e só chamar LLM se faltar algo
      if (valorValido) {
        let valorUsar = Math.round(valorNum * 100) / 100
        let nomeUsar = nomeValido ? nomeRegex.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : (tipoFromVerbo === 'saida' ? 'Gasto' : 'Entrada')
        // Sem regras fixas de valor/nome: usar sempre o que foi transcrito (ex.: 350+mercado, 290+roupas, 80+posto)
        const dataReg = interpretado?.data_registro ?? new Date().toISOString()
        interpretado = {
          tipo: tipoFromVerbo,
          valor: valorUsar,
          nome: nomeUsar,
          data_registro: dataReg,
          categoria: categoriaInteligente(nomeUsar, tipoFromVerbo),
        }
      }
      // Sem IA: quando o regex não achou valor, usa só interpretarMensagem e extrai nome por regex "com X" / "no X"
      if (!valorValido && interpretado && interpretado.tipo === 'saida') {
        if (interpretado.nome === 'Gasto' || interpretado.nome === 'Outros') {
          const m = msgForRegistro.match(/(?:com|no|na|em|para)\s+([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+){0,3})(?:\s|$|,|\.)/i)
          if (m?.[1]) {
            const desc = m[1].trim().replace(/\s+/g, ' ').substring(0, 50)
            if (desc.length >= 2) {
              const nomeFormatado = desc.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
              interpretado = { ...interpretado, nome: nomeFormatado }
            }
          }
        }
      }
    }

    // Salvaguarda: frase tem "ganhei" ou "recebi" mas interpretado deu gasto → forçar ENTRADA
    if (interpretado?.tipo === 'saida' && /\b(ganhei|recebi)\b/i.test(msgForRegistro)) {
      const entVal = msgForRegistro.match(/(?:ganhei|recebi)\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?/i)?.[1]
      const entNum = entVal ? parseFloat(entVal.replace(',', '.')) : NaN
      const entNome = msgForRegistro.match(/(?:ganhei|recebi)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|da)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s*$|\.|,)/i)?.[1]?.trim() || msgForRegistro.match(/(?:de|da)\s+([a-záàâãéêíóôõúç]+)/i)?.[1]?.trim() || 'Entrada'
      if (Number.isFinite(entNum) && entNum >= 1 && entNum <= 500_000) {
        const nomeFormatado = entNome.length >= 2 ? entNome.charAt(0).toUpperCase() + entNome.slice(1).toLowerCase() : entNome
        interpretado = {
          ...interpretado,
          tipo: 'entrada',
          valor: entNum,
          nome: nomeFormatado || 'Entrada',
          categoria: categoriaInteligente(nomeFormatado || 'Entrada', 'entrada'),
        }
      }
    }

    if (interpretado) {
      const { tipo, valor, nome, data_registro, categoria } = interpretado
      const valorFinal = Math.round(valor * 100) / 100
      console.log('[PLEN WhatsApp] Registro interpretado:', { msg: msgForRegistro.slice(0, 100), valor: valorFinal, nome, tipo })

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

    const msgNaoEntendi = `Oops! não entendi 🥹
Estou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!

💼 O que eu posso fazer por você:

📝 REGISTRAR:
• Gastos: "paguei 50 reais no mercado"
• Entradas: "recebi 1000 reais"
• Dívidas: "tenho uma dívida de 200 reais"
• Salários: "meu salário é 3000 reais"

📊 CONSULTAR:
• "quais são minhas dívidas?"
• "quanto gastei na semana?"
• "quanto gastei no mês?"
• "quanto tenho de saldo?"
• "quanto recebi este mês?"

📈 RELATÓRIOS:
• "me mostre o relatório"
• "quero ver meu relatório financeiro"
• "mostre meu resumo do mês"
• "como estão minhas finanças?"

💡 Como eu entendo você:

Você pode falar de forma natural! Por exemplo:
• "gastei 30 reais de ônibus hoje"
• "paguei 150 reais de conta de luz"
• "recebi 500 reais do cliente"
• "tenho uma dívida de 2000 no cartão"

Eu entendo diferentes formas de falar e vou organizar tudo para você! 🎯`

    // Nunca responder "Oops! não entendi" para quem quer utilizar/cadastrar na Plenipay.
    // (Esse fluxo é tratado no handler com 3 mensagens + botões; se caiu aqui, redirecionar.)
    const isQueroUtilizarPlenipay =
      (t.includes('quero utilizar') && t.includes('plenipay')) ||
      (t.includes('quero usar') && t.includes('plenipay'))
    if (isQueroUtilizarPlenipay) {
      return {
        response:
          '👋 Para receber o link de cadastro e os botões, envie exatamente: *Olá, quero utilizar a plenipay* no nosso WhatsApp. Assim você recebe as 3 mensagens com a opção CADASTRAR e JÁ CADASTREI.',
      }
    }

    if (t.includes('oi') || t.includes('olá') || t.includes('ola')) {
      return { response: msgNaoEntendi }
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return {
        response:
          'Para registrar:\n• Gasto: "Gastei 50 no mercado", "Paguei 30 de Uber"\n• Ganho: "Ganhei 20", "Recebi 1000 do cliente"\n• Por padrão o registro vai no seu nome (dono da conta).\n• Para registrar no nome de outro usuário, mande na segunda linha o nome dele:\n  gastei 50 roupas\n  (nome do usuário)\n\nConsultar: "quanto gastei na semana?", "me mostre o relatório", "quais são minhas dívidas?"',
      }
    }

    // Fallback com LLM: resposta natural e amigável, só sobre Plenipay
    const llmReply = await getPlenLLMResponse({
      userMessage: rawMessage,
      context: 'O usuário enviou uma mensagem que não foi reconhecida como comando de registro ou consulta. Responda de forma amigável e, se fizer sentido, sugira frases que funcionam (ex.: "Ganhei 40 reais", "Recebi 100", "Me mostre o relatório"). Se for pergunta fora do escopo ou você não souber, use a mensagem exata de suporte humano (Parar assistente Plen).',
    })
    if (llmReply) {
      return { response: llmReply }
    }

    return { response: RESPOSTA_NAO_SEI }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Exceção:', err)
    return {
      response: `Erro (PLEN): ${msg}`,
    }
  }
}
