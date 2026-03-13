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

/**
 * Tenta interpretar como receita (ex: "recebi 100 da mãe", "ganhei 500", "extra 200") ou despesa.
 * Quando o texto indica entrada (recebi, ganhei, extra...), tenta interpretarMensagem primeiro para não registrar como gasto.
 */
export function parseExpenseOrReceita(text: string): ExpenseParseResult | null {
  const t = (text || '').trim()
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
