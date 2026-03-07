/**
 * PLEN — Detecção de intenção (sempre JSON estruturado)
 * Intenções: registrar_despesa | registrar_receita | consultar_saldo | consultar_mes | pergunta | menu | saudacao | cadastro | desconhecido
 */

import { parseExpenseOrReceita, type ExpenseParseResult } from './expense-parser'

export type PlenIntent =
  | 'registrar_despesa'
  | 'registrar_receita'
  | 'consultar_saldo'
  | 'consultar_mes'
  | 'pergunta'
  | 'menu'
  | 'saudacao'
  | 'cadastro'
  | 'lembrete_pagar'
  | 'lembrete_receber'
  | 'desconhecido'

export interface IntentResult {
  intent: PlenIntent
  descricao?: string
  valor?: number
  categoria?: string
  /** Para pergunta: resposta curta sugerida (opcional). */
  replyHint?: string
  /** Para lembrete: data do lembrete (YYYY-MM-DD). */
  dataLembrete?: string
  /** Para lembrete: descrição (ex: "pagar cartão"). */
  descricaoLembrete?: string
}

const SAUDACAO_PATTERNS = [
  /^oi\s*!?$/i,
  /^ol[aá]\s*!?$/i,
  /^ola\s*$/i,
  /^eai\s*!?$/i,
  /^e\s*aí\s*!?$/i,
  /^hey\s*$/i,
  /^hi\s*$/i,
  /^hello\s*$/i,
  /^bom\s+dia\s*!?$/i,
  /^boa\s+tarde\s*!?$/i,
  /^boa\s+noite\s*!?$/i,
  /^fala\s*!?$/i,
  /^salve\s*!?$/i,
]

const CADASTRO_PATTERNS = [
  /cadastr/i,
  /quero\s+(utilizar|usar)\s+(a\s+)?plen/i,
  /criar\s+conta/i,
  /me\s+cadastr/i,
]

function isSaudacao(text: string): boolean {
  const t = text.trim()
  return SAUDACAO_PATTERNS.some((r) => r.test(t))
}

function isCadastro(text: string): boolean {
  return CADASTRO_PATTERNS.some((r) => r.test(text))
}

/** Extrai "preciso pagar dia 15" / "preciso receber dia 10" → data no mês atual (ou próximo se dia já passou). */
function parseLembreteDia(
  text: string,
  tipo: 'pagar' | 'receber'
): IntentResult | null {
  const t = text.trim().toLowerCase()
  const prefix = tipo === 'pagar' ? 'preciso\\s+pagar' : 'preciso\\s+receber'
  const re = new RegExp(`${prefix}(?:\\s+dia)?\\s+(\\d{1,2})(?:\\s+(.+))?`, 'i')
  const m = t.match(re)
  if (!m) return null
  const day = parseInt(m[1], 10)
  if (day < 1 || day > 31) return null
  const descricao = (m[2] ?? '').trim() || (tipo === 'pagar' ? 'Pagamento' : 'Recebimento')
  const now = new Date()
  let month = now.getMonth()
  let year = now.getFullYear()
  if (day <= now.getDate()) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  const dataLembrete = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return {
    intent: tipo === 'pagar' ? 'lembrete_pagar' : 'lembrete_receber',
    dataLembrete,
    descricaoLembrete: descricao.slice(0, 200),
  }
}

function isPergunta(text: string): boolean {
  const t = text.trim()
  if (t.endsWith('?')) return true
  const perguntas = [
    /como\s+funciona/i,
    /o\s+que\s+(e|é)\s*(a\s+)?plen/i,
    /o\s+que\s+faz/i,
    /como\s+(eu\s+)?(uso|registro)/i,
    /qual\s+o\s+formato/i,
    /pode\s+explicar/i,
    /me\s+ajuda/i,
    /ajuda\s*$/i,
  ]
  return perguntas.some((r) => r.test(t))
}

/**
 * Roteia a mensagem e retorna intent + dados estruturados.
 */
export function routeIntent(text: string): IntentResult {
  const t = text.trim()
  if (!t) return { intent: 'desconhecido' }

  const expense = parseExpenseOrReceita(t)
  if (expense) {
    return {
      intent: expense.intent,
      descricao: expense.descricao,
      valor: expense.valor,
      categoria: expense.categoria,
    }
  }

  if (/^menu\s*$/i.test(t)) return { intent: 'menu' }
  if (isSaudacao(t)) return { intent: 'saudacao' }
  if (isCadastro(t)) return { intent: 'cadastro' }
  const lembretePagar = parseLembreteDia(t, 'pagar')
  if (lembretePagar) return lembretePagar
  const lembreteReceber = parseLembreteDia(t, 'receber')
  if (lembreteReceber) return lembreteReceber
  if (/(?:saldo|total|quanto\s+tenho|quanto\s+gastei)/i.test(t)) return { intent: 'consultar_saldo' }
  if (/(?:m[eê]s|resumo\s+do\s+m[eê]s|gastos\s+do\s+m[eê]s)/i.test(t)) return { intent: 'consultar_mes' }
  if (isPergunta(t)) {
    return {
      intent: 'pergunta',
      replyHint: 'A Plen registra seus gastos quando você envia mensagens como: Café 12. Mas primeiro precisamos finalizar seu cadastro.',
    }
  }

  return { intent: 'desconhecido' }
}
