/**
 * Lógica do PLEN para WhatsApp: interpretar mensagem e criar registro.
 * Usado pela rota /api/plen/whatsapp-chat e pelo handler (chamada direta, sem fetch).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { interpretarMensagem, formatarRespostaRegistro, categoriaInteligente, normalizarNumerosPorExtenso, extrairValor } from '@/lib/plen-registro'
import { getRespostaPlanos, getPlenLLMResponse, RESPOSTA_OPEN_FINANCE } from '@/lib/plen-llm-fallback'

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

/** URL da plataforma para botões no WhatsApp: sempre produção (plenipay.com) para o usuário abrir no celular. */
const PLENIPAY_BASE = 'https://plenipay.com'
/** Texto e rótulo do botão "ver no perfil" em qualquer resposta de registro ou relatório. */
const PERFIL_BUTTON_BODY = 'Veja com mais detalhes no seu perfil:'
const PERFIL_BUTTON_LABEL = 'Ver no perfil'
const PERFIL_URL = `${PLENIPAY_BASE}/registros`

export type ProcessPlenWhatsAppResult = {
  response: string
  /** Quando preenchido, a resposta deve ser enviada com botão de link. */
  buttonUrl?: string
  buttonLabel?: string
  /** Texto da mensagem que contém o botão (ex.: "Confira todos os seus registros..."). */
  buttonBody?: string
  /** Botões de resposta (ex.: "Falar com humano" na mensagem Oops). */
  replyButtons?: { body: string; buttons: { id: string; title: string }[] }
}

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

/** Lista de dívidas (registros tipo=divida) para exibir em detalhes. */
async function obterListaDividas(
  supabase: SupabaseClient,
  accountOwnerId: string
): Promise<{ nome: string; valor: number; parcelas_totais: number; parcelas_pagas: number }[]> {
  const { data: usuarios, error: errU } = await supabase
    .from('users')
    .select('id')
    .eq('account_owner_id', accountOwnerId)
  if (errU || !usuarios?.length) return []
  const userIds = usuarios.map((u) => u.id)
  const { data: rows, error } = await supabase
    .from('registros')
    .select('nome, valor, parcelas_totais, parcelas_pagas')
    .eq('tipo', 'divida')
    .in('user_id', userIds)
    .order('data_registro', { ascending: false })
  if (error || !rows?.length) return []
  return rows.map((r) => ({
    nome: String(r.nome || 'Dívida'),
    valor: Number(r.valor) || 0,
    parcelas_totais: Number(r.parcelas_totais) || 1,
    parcelas_pagas: Number(r.parcelas_pagas) || 0,
  }))
}

/** Lista de empréstimos (registros tipo=divida com categoria Empréstimo ou nome "Empréstimo - ..."). */
async function obterListaEmprestimos(
  supabase: SupabaseClient,
  accountOwnerId: string
): Promise<{ nome: string; valor: number; parcelas_totais: number; parcelas_pagas: number }[]> {
  const { data: usuarios, error: errU } = await supabase
    .from('users')
    .select('id')
    .eq('account_owner_id', accountOwnerId)
  if (errU || !usuarios?.length) return []
  const userIds = usuarios.map((u) => u.id)
  const { data: rows, error } = await supabase
    .from('registros')
    .select('nome, valor, parcelas_totais, parcelas_pagas')
    .eq('tipo', 'divida')
    .eq('categoria', 'Empréstimo')
    .in('user_id', userIds)
    .order('data_registro', { ascending: false })
  if (error || !rows?.length) return []
  return rows.map((r) => ({
    nome: String(r.nome || 'Empréstimo'),
    valor: Number(r.valor) || 0,
    parcelas_totais: Number(r.parcelas_totais) || 1,
    parcelas_pagas: Number(r.parcelas_pagas) || 0,
  }))
}

/** Lista de registros da semana (para "me mostre os registros da semana"). */
async function obterListaRegistrosSemana(
  supabase: SupabaseClient,
  accountOwnerId: string
): Promise<{ nome: string; tipo: string; valor: number; data_registro: string }[]> {
  const { inicio, fim } = intervaloSemana()
  const { data: usuarios, error: errU } = await supabase
    .from('users')
    .select('id')
    .eq('account_owner_id', accountOwnerId)
  if (errU || !usuarios?.length) return []
  const userIds = usuarios.map((u) => u.id)
  const { data: rows, error } = await supabase
    .from('registros')
    .select('nome, tipo, valor, data_registro')
    .in('user_id', userIds)
    .gte('data_registro', inicio)
    .lte('data_registro', fim)
    .order('data_registro', { ascending: false })
  if (error || !rows?.length) return []
  return rows.map((r) => ({
    nome: String(r.nome || 'Registro'),
    tipo: String(r.tipo || ''),
    valor: Number(r.valor) || 0,
    data_registro: String(r.data_registro || ''),
  }))
}

function formatarDataShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
 * Fallback: tenta apenas registrar gasto/receita a partir do texto (quando o fluxo normal retorna vazio).
 * Retorna mensagem de confirmação ou null se não conseguir interpretar.
 */
export async function registerGastoReceitaFallback(
  userId: string,
  rawMessage: string
): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const msg = (rawMessage || '').trim()
  if (!msg) return null
  const msgNorm = normalizarNumerosPorExtenso(msg)
  let interp = interpretarMensagem(msgNorm)
  if (!interp) interp = interpretarMensagem(msg)
  if (!interp || (interp.tipo !== 'saida' && interp.tipo !== 'entrada')) return null
  const { tipo, valor, nome, data_registro, categoria } = interp
  const valorFinal = Math.round(valor * 100) / 100
  if (valorFinal < 1 || valorFinal > 500_000) return null

  let profileNome: string | null = null
  try {
    const { data: profile } = await supabase.from('profiles').select('nome, email').eq('id', userId).single()
    if (profile?.nome?.trim()) profileNome = profile.nome.trim()
    else if (profile?.email) profileNome = profile.email.split('@')[0]?.trim() ?? null
  } catch (_) {}

  let registroUserId: string | null = null
  const { data: usuarios, error: errU } = await supabase
    .from('users')
    .select('id, nome')
    .eq('account_owner_id', userId)
    .order('nome', { ascending: true })
  if (!errU && usuarios?.length) {
    registroUserId = usuarios[0].id
  } else {
    const { data: novo, error: errCriar } = await supabase
      .from('users')
      .insert({ nome: profileNome || 'Meus registros', account_owner_id: userId })
      .select('id')
      .single()
    if (errCriar || !novo?.id) return null
    registroUserId = novo.id
  }
  if (!registroUserId) return null

  const { error } = await supabase.from('registros').insert({
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
  if (error) {
    console.error('[PLEN WhatsApp] registerGastoReceitaFallback insert:', error.message)
    return null
  }
  return formatarRespostaRegistro({
    nome,
    tipo,
    valor: valorFinal,
    dataRegistro: data_registro,
    categoria: categoria || 'Outros',
    nomeUsuario: profileNome || undefined,
  })
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

    const t = rawMessage.toLowerCase().replace(/\s+/g, ' ').trim()
    const norm = t.replace(/_/g, ' ')

    // "Falar com humano" (clique no botão da mensagem Oops ou digitado)
    if (norm === 'falar com humano' || t === 'falar_com_humano') {
      return {
        response:
          'Beleza! Vou chamar um humano pra te atender. 💙 Aguarda um momentinho que em breve alguém da nossa equipe vai falar contigo. Enquanto isso, fico na torcida aqui! 😊',
        replyButtons: {
          body: 'Quer voltar a falar comigo?',
          buttons: [{ id: 'voltar_plen', title: 'Voltar a falar com a PLEN' }],
        },
      }
    }

    // "Voltar a falar com a PLEN" (clique no botão após handoff para humano)
    if (norm === 'voltar a falar com a plen' || t === 'voltar_plen') {
      return {
        response:
          'Oi! Voltei. 😊 Em que posso ajudar? Pode mandar um gasto, uma entrada, pedir relatório ou qualquer coisa. Estou aqui! 💙',
      }
    }

    // Planos / preço / "qual valor?" — resposta curta com emojis, descrição dos planos e botão para /planos
    const isPlanos =
      /\b(plano|planos|pre[cç]o|quanto\s+custa|qual\s+valor|qual\s+o\s+valor|quanto\s+é|valor\s+do\s+plano|assinatura|mensalidade)\b/.test(t) ||
      /^qual\s+valor\s*\??\s*$/i.test(rawMessage.trim())
    if (isPlanos) {
      const planosUrl =
        typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL?.trim()
          ? (process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
              ? process.env.NEXT_PUBLIC_SITE_URL
              : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
            ).replace(/\/+$/, '')
          : 'https://plenipay.com'
      const planosLink = `${planosUrl}/planos`
      return {
        response: getRespostaPlanos(),
        buttonUrl: planosLink,
        buttonLabel: 'Ver planos e assinar',
      }
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
        response: `✅ Lembrete registrado!\n\n📌 ${descricao}\n📅 ${dataBr}`,
        buttonUrl: `${PLENIPAY_BASE}/lembretes`,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
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

    // Empréstimo: "emprestei 500 para João", "emprestei 200 reais para Maria"
    const empresteiMatch = rawMessage.match(
      /emprestei\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?\s*(?:para|pro|a)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s*$|\.|,)/i
    )
    if (empresteiMatch) {
      const valorStr = empresteiMatch[1].replace(',', '.').replace(/\s/g, '')
      const valorNum = Math.round(parseFloat(valorStr) * 100) / 100
      const nomePessoa = empresteiMatch[2].trim().replace(/\s+/g, ' ').substring(0, 200)
      if (Number.isFinite(valorNum) && valorNum >= 1 && valorNum <= 500_000 && nomePessoa.length >= 2) {
        const { data: profile } = await supabase.from('profiles').select('plano').eq('id', userId).single()
        const plano = (profile?.plano ?? 'teste').toString().toLowerCase().trim()
        if (plano === 'premium') {
          const dataEmprestimo = new Date()
          const dataPagamento = new Date()
          dataPagamento.setMonth(dataPagamento.getMonth() + 1)
          const { error: errEmp } = await supabase.from('emprestimos').insert({
            nome_pessoa: nomePessoa,
            valor: valorNum,
            observacao: `Empréstimo registrado via WhatsApp`,
            data_emprestimo: dataEmprestimo.toISOString(),
            data_pagamento: dataPagamento.toISOString(),
            parcelas_totais: 1,
            parcelas_pagas: 0,
          })
          if (errEmp) {
            return { response: `Não consegui registrar o empréstimo: ${errEmp.message}. Tente pelo site em plenipay.com.` }
          }
          const { data: usuarios } = await supabase.from('users').select('id').eq('account_owner_id', userId).limit(1)
          const primeiroUserId = usuarios?.[0]?.id
          if (primeiroUserId) {
            await supabase.from('registros').insert({
              user_id: primeiroUserId,
              nome: `Empréstimo - ${nomePessoa}`,
              observacao: `Empréstimo para ${nomePessoa} (via WhatsApp)`,
              tipo: 'divida',
              valor: valorNum,
              categoria: 'Empréstimo',
              etiquetas: ['empréstimo', nomePessoa.toLowerCase().replace(/\s+/g, '-')],
              parcelas_totais: 1,
              parcelas_pagas: 0,
              data_registro: dataEmprestimo.toISOString(),
            })
          }
          const fmtVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNum)
          return {
            response: `✅ Empréstimo registrado!\n\n💰 ${fmtVal} para ${nomePessoa}`,
            buttonUrl: PERFIL_URL,
            buttonLabel: PERFIL_BUTTON_LABEL,
            buttonBody: PERFIL_BUTTON_BODY,
          }
        }
        const planosUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL?.trim())
          ? (process.env.NEXT_PUBLIC_SITE_URL.startsWith('http') ? process.env.NEXT_PUBLIC_SITE_URL : `https://${process.env.NEXT_PUBLIC_SITE_URL}`).replace(/\/+$/, '')
          : 'https://plenipay.com'
        const planosLink = `${planosUrl}/planos`
        return {
          response: `Ops, você está no plano básico. Acesse o link para obter essa e outras dezenas de funções.\n\nAcesse:`,
          buttonUrl: planosLink,
          buttonLabel: 'Ver planos',
        }
      }
    }

    const linhas = rawMessage.split(/\n/).map((l) => l.trim()).filter(Boolean)
    const primeiraLinha = linhas[0] ?? rawMessage
    const { msgForRegistro, targetUserName: usuarioNaFrase } = extrairUsuarioNaMensagem(primeiraLinha)
    const nomeOutroUsuario = usuarioNaFrase ?? (linhas.length > 1 && linhas.length <= 2 ? linhas[1] : null)

    // Múltiplos pedidos na mesma mensagem: cada linha com verbo de registro vira um registro (na ordem)
    const frasesRegistro = linhas.filter((l) => /(?:gastei|paguei|recebi|ganhei|gastou|pagou|recebeu|ganhou)/i.test(l))
    const multiRegistro = frasesRegistro.length > 1
    const frasesParaProcessar = multiRegistro ? frasesRegistro : [msgForRegistro]

    type InterpretadoT = { tipo: 'saida' | 'entrada'; valor: number; nome: string; data_registro: string; categoria: string }
    const interpretados: InterpretadoT[] = []

    for (const frase of frasesParaProcessar) {
      let interp: InterpretadoT | null = interpretarMensagem(frase)
      const temVerboRegistro = /(?:gastei|paguei|recebi|ganhei|gastou|pagou|recebeu|ganhou)/i.test(frase)
      const fraseCurta = frase.trim().length <= 120

      if (temVerboRegistro && fraseCurta) {
        const msgNorm = normalizarNumerosPorExtenso(frase)
        const valorRegex = msgNorm.match(/(?:gastei|paguei|ganhei|recebi)\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?/i)?.[1]
        let nomeRegexGasto = frase.match(/(?:com|no|na|em|para)\s+([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+){0,3})(?:\s|$|,|\.)/i)?.[1]?.trim()
        // "gastei 500 shopping" / "gastei 500 casa" — nome após o valor (sem com/no/na/em/para)
        if (!nomeRegexGasto && tipoFromVerbo === 'saida') {
          const gastoAposValor = frase.match(/(?:gastei|paguei|gastou|pagou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s+([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+){0,2})\s*$/i)?.[1]?.trim()
          if (gastoAposValor && gastoAposValor.length >= 2) nomeRegexGasto = gastoAposValor
        }
        const nomeRegexEntrada = frase.match(/(?:recebi|ganhei|recebeu|ganhou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|da|do)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s*$|\.|,)/i)?.[1]?.trim()
        const valorNum = valorRegex != null ? (extrairValor(valorRegex) ?? NaN) : NaN
        const tipoFromVerbo: 'entrada' | 'saida' = /\b(ganhei|recebi|ganhou|recebeu)\b/i.test(frase) ? 'entrada' : 'saida'
        const valorValido = Number.isFinite(valorNum) && valorNum >= 1 && valorNum <= 500_000
        const nomeValidoGasto = nomeRegexGasto && nomeRegexGasto.length >= 2
        const nomeValidoEntrada = nomeRegexEntrada && nomeRegexEntrada.length >= 2
        if (valorValido) {
          const valorUsar = Math.round(valorNum * 100) / 100
          let nomeUsar: string
          if (tipoFromVerbo === 'entrada') {
            if (interp?.nome && interp.nome !== 'Entrada' && interp.nome.length >= 2) {
              nomeUsar = interp.nome
            } else if (nomeValidoEntrada) {
              nomeUsar = nomeRegexEntrada!.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            } else {
              nomeUsar = 'Entrada'
            }
          } else {
            if (interp?.nome && interp.nome !== 'Gasto' && interp.nome.length >= 2) {
              nomeUsar = interp.nome
            } else if (nomeValidoGasto) {
              nomeUsar = nomeRegexGasto!.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            } else {
              nomeUsar = 'Gasto'
            }
          }
          const dataReg = interp?.data_registro ?? new Date().toISOString()
          const categoria = categoriaInteligente(nomeUsar, tipoFromVerbo)
          interp = { tipo: tipoFromVerbo, valor: valorUsar, nome: nomeUsar, data_registro: dataReg, categoria }
        }
        if (!valorValido && interp) {
          if (interp.tipo === 'saida' && (interp.nome === 'Gasto' || interp.nome === 'Outros')) {
            const m = frase.match(/(?:com|no|na|em|para)\s+([a-záàâãéêíóôõúç]+(?:\s+[a-záàâãéêíóôõúç]+){0,3})(?:\s|$|,|\.)/i)
            if (m?.[1]) {
              const desc = m[1].trim().replace(/\s+/g, ' ').substring(0, 50)
              if (desc.length >= 2) {
                const nomeFormatado = desc.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                interp = { ...interp, nome: nomeFormatado, categoria: categoriaInteligente(nomeFormatado, 'saida') }
              }
            }
          }
          if (interp.tipo === 'entrada' && interp.nome === 'Entrada') {
            const mEnt = frase.match(/(?:recebi|ganhei|recebeu|ganhou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|da|do)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s*$|\.|,)/i)
            if (mEnt?.[1]) {
              const nomePessoa = mEnt[1].trim().replace(/\s+/g, ' ').substring(0, 50)
              if (nomePessoa.length >= 2) {
                const nomeFormatado = nomePessoa.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                interp = { ...interp, nome: nomeFormatado, categoria: 'Pessoas' }
              }
            }
          }
        }
      }

      if (interp?.tipo === 'saida' && /\b(ganhei|recebi)\b/i.test(frase)) {
        const entVal = frase.match(/(?:ganhei|recebi)\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?/i)?.[1]
        const entNum = entVal != null ? (extrairValor(entVal) ?? NaN) : NaN
        const entNome = frase.match(/(?:ganhei|recebi)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|da)\s+([a-záàâãéêíóôõúç\s]+?)(?:\s*$|\.|,)/i)?.[1]?.trim() || frase.match(/(?:de|da)\s+([a-záàâãéêíóôõúç]+)/i)?.[1]?.trim() || 'Entrada'
        if (Number.isFinite(entNum) && entNum >= 1 && entNum <= 500_000) {
          const nomeFormatado = entNome.length >= 2 ? entNome.charAt(0).toUpperCase() + entNome.slice(1).toLowerCase() : entNome
          interp = { ...interp, tipo: 'entrada', valor: entNum, nome: nomeFormatado || 'Entrada', categoria: categoriaInteligente(nomeFormatado || 'Entrada', 'entrada') }
        }
      }

      if (interp) interpretados.push(interp)
    }

    const interpretado: InterpretadoT | null = interpretados.length === 1 ? interpretados[0]! : null

    if (interpretados.length > 1) {
      try {
        let profileNome: string | null = null
        try {
          const { data: profile } = await supabase.from('profiles').select('nome, email').eq('id', userId).single()
          if (profile?.nome?.trim()) profileNome = profile.nome.trim()
          else if (profile?.email) profileNome = profile.email.split('@')[0]?.trim() ?? null
        } catch (_) {}
        const { data: usuarios, error: errUsuarios } = await supabase
          .from('users')
          .select('id, nome')
          .eq('account_owner_id', userId)
          .order('nome', { ascending: true })
        if (errUsuarios || !usuarios?.length) {
          return {
            response: 'Não encontrei uma pessoa para o registro. Crie em Configurações → Usuários (pelo menos uma) no site e tente de novo.',
          }
        }
        const registroUserId = (nomeOutroUsuario
          ? usuarios.find((u) => u.nome?.toLowerCase() === nomeOutroUsuario.toLowerCase())?.id
          : null) ?? (profileNome
          ? usuarios.find((u) => u.nome?.toLowerCase() === profileNome!.toLowerCase())?.id
          : null) ?? usuarios[0].id
        const partes: string[] = []
        for (const interp of interpretados) {
          const valorFinal = Math.round(interp.valor * 100) / 100
          const categoria = interp.categoria ?? 'Outros'
          console.log('[PLEN WhatsApp] Registro (multi):', { msg: interp.nome, valor: valorFinal, tipo: interp.tipo })
          const { error: errInsert } = await supabase.from('registros').insert({
            user_id: registroUserId,
            valor: valorFinal,
            tipo: interp.tipo,
            nome: interp.nome,
            data_registro: interp.data_registro,
            categoria: categoria || null,
            parcelas_totais: 1,
            parcelas_pagas: 0,
            etiquetas: [],
          })
          if (errInsert) {
            console.error('[PLEN WhatsApp] Erro insert (multi):', errInsert)
            partes.push(`❌ ${interp.nome}: R$ ${valorFinal.toFixed(2)} — erro ao salvar`)
          } else {
            partes.push(formatarRespostaRegistro({
              nome: interp.nome,
              tipo: interp.tipo,
              valor: valorFinal,
              dataRegistro: interp.data_registro,
              categoria,
            }))
          }
        }
        const textoResposta = partes.join('\n\n')
        return {
          response: textoResposta,
          buttonUrl: PERFIL_URL,
          buttonLabel: PERFIL_BUTTON_LABEL,
          buttonBody: PERFIL_BUTTON_BODY,
        }
      } catch (multiErr) {
        console.error('[PLEN WhatsApp] Erro no bloco multi-registro:', multiErr)
        return {
          response: 'Ocorreu um erro ao registrar um dos itens. Tente enviar de novo ou um por vez. 💙',
          buttonUrl: PERFIL_URL,
          buttonLabel: PERFIL_BUTTON_LABEL,
          buttonBody: PERFIL_BUTTON_BODY,
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
            buttonUrl: PERFIL_URL,
            buttonLabel: PERFIL_BUTTON_LABEL,
            buttonBody: PERFIL_BUTTON_BODY,
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
        buttonUrl: PERFIL_URL,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
      }
    }

    // LISTAS DETALHADAS: "me mostre as dívidas" / "me mostre os empréstimos" / "me mostre os registros da semana"
    const isListaDividas =
      /me\s+mostr(e|ar)\s+as\s+d[ií]vidas?/i.test(t) ||
      /quais\s+s[aã]o\s+minhas?\s+d[ií]vidas?/i.test(t) ||
      /mostr(e|ar)\s+as\s+d[ií]vidas?/i.test(t)
    const isListaEmprestimos = /me\s+mostr(e|ar)\s+os\s+empr[eé]stimos?/i.test(t) || /mostr(e|ar)\s+os\s+empr[eé]stimos?/i.test(t)
    const isListaRegistrosSemana =
      /me\s+mostr(e|ar)\s+(todos\s+)?(os\s+)?registros?\s+(da\s+)?semana/i.test(t) ||
      /mostr(e|ar)\s+registros?\s+da\s+semana/i.test(t) ||
      /registros?\s+da\s+semana/i.test(t)

    if (isListaDividas) {
      const lista = await obterListaDividas(supabase, userId)
      if (lista.length === 0) {
        return {
          response: '📌 Você não tem dívidas cadastradas no momento.',
          buttonUrl: PERFIL_URL,
          buttonLabel: PERFIL_BUTTON_LABEL,
          buttonBody: PERFIL_BUTTON_BODY,
        }
      }
      const linhas: string[] = ['📌 *Dívidas:*', '']
      let totalPendente = 0
      lista.forEach((d) => {
        const parcelas = d.parcelas_totais > 1 ? ` (${d.parcelas_pagas}/${d.parcelas_totais} parcelas)` : ''
        const pendente = d.valor * (1 - (d.parcelas_pagas || 0) / (d.parcelas_totais || 1))
        totalPendente += pendente
        linhas.push(`• ${d.nome}: ${fmt(d.valor)}${parcelas}`)
      })
      linhas.push('')
      linhas.push(`💰 Total pendente: ${fmt(totalPendente)}`)
      return {
        response: linhas.join('\n'),
        buttonUrl: PERFIL_URL,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
      }
    }

    if (isListaEmprestimos) {
      const lista = await obterListaEmprestimos(supabase, userId)
      if (lista.length === 0) {
        return {
          response: '💰 Você não tem empréstimos cadastrados no momento.',
          buttonUrl: PERFIL_URL,
          buttonLabel: PERFIL_BUTTON_LABEL,
          buttonBody: PERFIL_BUTTON_BODY,
        }
      }
      const linhas: string[] = ['💰 *Empréstimos:*', '']
      let totalPendente = 0
      lista.forEach((e) => {
        const parcelas = e.parcelas_totais > 1 ? ` (${e.parcelas_pagas}/${e.parcelas_totais} parcelas)` : ''
        const pendente = e.valor * (1 - (e.parcelas_pagas || 0) / (e.parcelas_totais || 1))
        totalPendente += pendente
        linhas.push(`• ${e.nome}: ${fmt(e.valor)}${parcelas}`)
      })
      linhas.push('')
      linhas.push(`💰 Total pendente: ${fmt(totalPendente)}`)
      return {
        response: linhas.join('\n'),
        buttonUrl: PERFIL_URL,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
      }
    }

    if (isListaRegistrosSemana) {
      const lista = await obterListaRegistrosSemana(supabase, userId)
      if (lista.length === 0) {
        return {
          response: '📅 Nenhum registro nesta semana.',
          buttonUrl: PERFIL_URL,
          buttonLabel: PERFIL_BUTTON_LABEL,
          buttonBody: PERFIL_BUTTON_BODY,
        }
      }
      const linhas: string[] = ['📅 *Registros desta semana:*', '']
      lista.forEach((r) => {
        const emoji = r.tipo === 'entrada' ? '🟢' : r.tipo === 'divida' ? '📌' : '🔴'
        const dataStr = formatarDataShort(r.data_registro)
        linhas.push(`• ${dataStr} ${emoji} ${r.nome}: ${fmt(r.valor)}`)
      })
      return {
        response: linhas.join('\n'),
        buttonUrl: PERFIL_URL,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
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
      return {
        response: text,
        buttonUrl: PERFIL_URL,
        buttonLabel: PERFIL_BUTTON_LABEL,
        buttonBody: PERFIL_BUTTON_BODY,
      }
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

    // Nunca enviar "Oops! não entendi" na sequência de quero utilizar/cadastrar na Plenipay.
    const pareceQueroPlenipay =
      (t.includes('quero') && (t.includes('plenipay') || t.includes('pleni'))) ||
      t.includes('quero utilizar') ||
      t.includes('quero usar')
    if (pareceQueroPlenipay) {
      return {
        response:
          '👋 Para receber o link de cadastro e os botões, envie: *Olá, quero utilizar a plenipay* no WhatsApp. Você recebe as 3 mensagens com CADASTRAR e JÁ CADASTREI.',
      }
    }

    // Nunca enviar resposta quando for eco das nossas mensagens ou saudações/confirmações (evita spam)
    const trechosNossasMensagens = [
      'eu sou a plen',
      'sua assistente financeira',
      'oiii',
      'antes da gente começar',
      'cria sua conta',
      'assim que finalizar o cadastro',
      'me envia seu e-mail',
      'escolha abaixo',
      'combinado',
      'anotar tudo pra você',
      'direto pelo whatsapp',
    ]
    if (trechosNossasMensagens.some((trecho) => t.includes(trecho))) {
      return { response: '' }
    }
    // Eco da nossa confirmação de registro (evita enviar "Oops!" logo após "Seu gasto foi registrado com sucesso!")
    if (
      /registrado com sucesso/i.test(t) ||
      (t.includes('plenipay.com') && (/confira todos os seus registros|seu gasto foi|sua entrada foi|sua d[ií]vida foi/i.test(t)))
    ) {
      return { response: '' }
    }
    // oi/olá e confirmações curtas: não enviar nada (evita "Em que posso ajudar?" e spam)
    if (/\b(oi|olá|ola|ok|tá|combinado|beleza|obrigad[oa]|valeu|entendi)\b/.test(t)) {
      return { response: '' }
    }
    if (t.includes('ajuda') || t.includes('como usar')) {
      return {
        response:
          'Para registrar:\n• Gasto: "Gastei 50 no mercado", "Paguei 30 de Uber"\n• Ganho: "Ganhei 20", "Recebi 1000 do cliente"\n• Por padrão o registro vai no seu nome (dono da conta).\n• Para registrar no nome de outro usuário, mande na segunda linha o nome dele:\n  gastei 50 roupas\n  (nome do usuário)\n\nConsultar: "quanto gastei na semana?", "me mostre o relatório", "quais são minhas dívidas?"',
      }
    }

    // Comando não reconhecido: usar Gemini/Groq/OpenAI para entender contexto e sugerir como registrar (ex.: "emprestei minha tia 34" → sugerir frase exata)
    try {
      const llmReply = await getPlenLLMResponse({
        userMessage: rawMessage,
        context:
          'O usuário enviou uma mensagem que não foi reconhecida como comando. Entenda o que ele quis fazer (ex.: registrar gasto, entrada, empréstimo para alguém) e responda em UMA mensagem curta para WhatsApp: (1) confirme o que ele quis dizer; (2) sugira a frase exata que ele pode usar para registrar. Ex.: se disse "emprestei minha tia 34", responda que ele quer registrar um empréstimo e sugira "Emprestei 34 reais para minha tia" ou "Gastei 34 com minha tia". Seja amigável e direto.',
      })
      if (llmReply && llmReply.trim()) {
        return {
          response: llmReply.trim(),
          replyButtons: {
            body: 'Precisa de ajuda humana?',
            buttons: [{ id: 'falar_com_humano', title: 'Falar com humano' }],
          },
        }
      }
    } catch (e) {
      console.warn('[PLEN whatsapp-chat] LLM fallback (Grok xAI/Groq/OpenAI) falhou:', e)
    }

    // Fallback: "Oops!" com exemplos + botão "Falar com humano"
    return {
      response: msgNaoEntendi,
      replyButtons: {
        body: 'Precisa de ajuda humana?',
        buttons: [{ id: 'falar_com_humano', title: 'Falar com humano' }],
      },
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Exceção:', err)
    return {
      response: `Erro (PLEN): ${msg}`,
    }
  }
}
