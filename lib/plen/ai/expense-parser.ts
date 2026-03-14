/**
 * PLEN — Parser de gastos para formato "Descrição Valor" (ex: Café 12)
 * Usa plen-registro para interpretação rica; valida no backend.
 */

import {
  extrairValor,
  categoriaInteligente,
  normalizarNumerosPorExtenso,
  interpretarMensagem,
} from '@/lib/plen-registro'

export interface ExpenseParseResult {
  intent: 'registrar_despesa' | 'registrar_receita'
  descricao: string
  valor: number
  categoria: string
}

/**
 * Tenta extrair gasto no formato "descrição valor" (ex: Café 12, Almoço 35).
 * Retorna null se não houver número, valor <= 0 ou descrição vazia.
 */
export function parseExpenseSimple(text: string): ExpenseParseResult | null {
  const t = normalizarNumerosPorExtenso(text.trim().toLowerCase())
  if (!t) return null

  const valor = extrairValor(t)
  if (valor == null || valor <= 0) return null

  const match = t.match(/^(.+?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*$/i)
  const descricao = match
    ? (match[1] ?? '').trim().replace(/\s*(reais?|r\$|r\b)\s*$/gi, '').trim()
    : t.replace(/[\d.,]+(?:\s*reais?|\s*r\$?)?\s*$/gi, '').trim()

  if (!descricao || descricao.length < 1) return null

  const categoria = categoriaInteligente(descricao, 'saida')
  return {
    intent: 'registrar_despesa',
    descricao,
    valor,
    categoria,
  }
}

/** Palavras que indicam ENTRADA (receita). Se o texto começar com uma delas (ou tiver verbo + número), priorizar interpretarMensagem para não registrar como gasto. */
const ENTRADA_KEYWORDS =
  /^(recebi|recebeu|ganhei|ganhou|ganhamos|extra|recebido|entrada\s+de|(meu\s+)?sal[aá]rio)\s+[\d.,\s]|^(recebi|recebeu|ganhei|ganhou|extra|recebido)\s+[\d.,]/i

/** Textos que são opções de menu (não registrar como gasto/receita). */
const MENU_OPTION_PATTERNS = [
  /^assinatura\s*r\$\s*9[,.]90$/i,
  /^plano\s*r\$\s*9[,.]90/i,
  /^fun[cç][oõ]es\s*premium$/i,
  /^indique\s*e\s*ganhe$/i,
  /^total\s*\/?\s*saldo$/i,
  /^falar\s*com\s*humano$/i,
  /^como\s*funciona$/i,
]

function isMenuOptionText(text: string): boolean {
  const t = (text || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return MENU_OPTION_PATTERNS.some((r) => r.test(t))
}

/**
 * Tenta interpretar como receita (ex: "recebi 100 da mãe", "ganhei 500", "extra 200") ou despesa.
 * Quando o texto indica entrada (recebi, ganhei, extra...), tenta interpretarMensagem primeiro para não registrar como gasto.
 */
export function parseExpenseOrReceita(text: string): ExpenseParseResult | null {
  const t = (text || '').trim()
  if (isMenuOptionText(t)) return null
  if (ENTRADA_KEYWORDS.test(t)) {
    const interpreted = interpretarMensagem(text)
    if (interpreted) {
      if (interpreted.tipo === 'entrada') {
        return {
          intent: 'registrar_receita',
          descricao: interpreted.nome,
          valor: interpreted.valor,
          categoria: interpreted.categoria,
        }
      }
      if (interpreted.tipo === 'saida') {
        return {
          intent: 'registrar_despesa',
          descricao: interpreted.nome,
          valor: interpreted.valor,
          categoria: interpreted.categoria,
        }
      }
    }
  }

  const simple = parseExpenseSimple(text)
  if (simple) return simple

  const interpreted = interpretarMensagem(text)
  if (!interpreted) return null

  if (interpreted.tipo === 'saida') {
    return {
      intent: 'registrar_despesa',
      descricao: interpreted.nome,
      valor: interpreted.valor,
      categoria: interpreted.categoria,
    }
  }
  if (interpreted.tipo === 'entrada') {
    return {
      intent: 'registrar_receita',
      descricao: interpreted.nome,
      valor: interpreted.valor,
      categoria: interpreted.categoria,
    }
  }
  return null
}

/** Regex para detectar início de nova frase de gasto/receita (verbo + número). */
const INICIO_TRANSACAO =
  /(?:gastei|gasteu|recebi|recebeu|ganhei|ganhou|paguei|pagou|extra|recebido|ganhamos)\s+[\d.,]/i

/**
 * Divide o texto em frases que podem ser gasto/receita e interpreta cada uma, na ordem.
 * Suporta várias linhas ("gastei 329 em roupas\nrecebi 879 de pai") ou várias frases na mesma linha
 * ("gastei 329 em roupas recebi 879 de pai Gastei 87 uber").
 * Retorna array em ordem; se nenhuma for reconhecida, tenta o texto inteiro como um único registro.
 */
export function parseMultipleExpensesOrReceita(text: string): ExpenseParseResult[] {
  const t = (text || '').trim()
  if (!t) return []
  if (isMenuOptionText(t)) return []

  const resultados: ExpenseParseResult[] = []

  // 1) Dividir por quebra de linha
  const linhas = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  if (linhas.length > 1) {
    for (const linha of linhas) {
      const parsed = parseExpenseOrReceita(linha)
      if (parsed) resultados.push(parsed)
    }
    if (resultados.length > 0) return resultados
  }

  // 2) Mesma linha: dividir onde começa nova transação (verbo + número)
  const partes = t.split(new RegExp(`(?=${INICIO_TRANSACAO.source})`, 'i')).map((s) => s.trim()).filter(Boolean)
  if (partes.length > 1) {
    for (const parte of partes) {
      const parsed = parseExpenseOrReceita(parte)
      if (parsed) resultados.push(parsed)
    }
    if (resultados.length > 0) return resultados
  }

  // 3) Fallback: texto inteiro como um único registro
  const unico = parseExpenseOrReceita(t)
  if (unico) return [unico]
  return []
}
