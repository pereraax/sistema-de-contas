/**
 * Interpretação de mensagens PLEN (gasto/entrada) e formatação da resposta.
 * Usado pelo chat in-app e pelo WhatsApp.
 */

import type { TipoRegistro } from '@/lib/types'

function extrairValor(texto: string): number | null {
  const match = texto.match(/(\d+)(?:[.,](\d+))?/)
  if (!match) return null
  const inteiro = match[1]
  const decimal = match[2] || '00'
  const valor = parseFloat(`${inteiro}.${decimal}`)
  return isNaN(valor) ? null : valor
}

/**
 * Data (só dia) para ISO às 12:00 UTC — usado quando o usuário informa só a data (ontem, dia 15, 05/02).
 * Assim o dia exibe correto em qualquer fuso.
 */
function toISONoonUTC(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month + 1)}-${pad(day)}T12:00:00.000Z`
}

/**
 * Interpreta data no texto e retorna ISO.
 * - Sem data ou "hoje" → momento exato da solicitação (data e hora reais).
 * - "ontem", "dia 15", "05/02" → esse dia às 12:00 UTC (só a data importa).
 */
function parseDataDoTexto(texto: string): string {
  const t = texto.trim().toLowerCase()
  const agora = new Date()
  const y = agora.getFullYear()
  const m = agora.getMonth()
  const d = agora.getDate()

  // "hoje" ou nenhuma data explícita → usa data e hora do momento da solicitação
  if (/\bhoje\b/.test(t)) return agora.toISOString()
  if (/\bontem\b/.test(t)) {
    const ontem = new Date(y, m, d - 1)
    return toISONoonUTC(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
  }
  const diaMatch = t.match(/\bdia\s+(\d{1,2})\b/)
  if (diaMatch) {
    const dia = parseInt(diaMatch[1], 10)
    if (dia >= 1 && dia <= 31) return toISONoonUTC(y, m, dia)
  }
  const dataMatch = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (dataMatch) {
    const dia = parseInt(dataMatch[1], 10)
    const mes = parseInt(dataMatch[2], 10) - 1
    const ano = dataMatch[3] ? parseInt(dataMatch[3], 10) : y
    const anoFull = ano < 100 ? 2000 + ano : ano
    const data = new Date(anoFull, mes, dia)
    if (!isNaN(data.getTime())) return toISONoonUTC(data.getFullYear(), data.getMonth(), data.getDate())
  }
  // Padrão: momento exato da solicitação (data e hora corretas na plataforma)
  return agora.toISOString()
}

export type InterpretadoPlen = {
  tipo: TipoRegistro
  valor: number
  nome: string
  data_registro: string
  categoria: string
}

/**
 * Interpreta mensagem em linguagem natural e retorna tipo, valor, nome, data e categoria.
 */
export function interpretarMensagem(texto: string): InterpretadoPlen | null {
  const t = texto.trim().toLowerCase()
  const valorMatch = t.match(/(\d+)(?:[.,](\d+))?\s*(?:reais?|r\$|r\b)?/i)
  const valorNum = valorMatch ? extrairValor(valorMatch[0]) : null
  if (valorNum == null || valorNum <= 0) return null

  // DÍVIDA: "tenho uma dívida de 200", "dívida de 200 no cartão", "devo 200"
  const dividaMatch = t.match(/(?:tenho\s+(?:uma\s+)?d[ií]vida\s+de|d[ií]vida\s+de|devo)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:no|em|no\s+)?\s*(.*)/i)
  if (dividaMatch && /(?:tenho\s+(?:uma\s+)?d[ií]vida|d[ií]vida\s+de|devo)\s+[\d.,]+/i.test(t)) {
    const nomeDivida = (dividaMatch[1] || '').trim() || 'Dívida'
    nome = nomeDivida.substring(0, 200)
    nome = nome.replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '').trim() || 'Dívida'
    const data_registro = parseDataDoTexto(t)
    const categoria = nome !== 'Dívida' ? nome : 'Outros'
    return { tipo: 'divida', valor: valorNum, nome, data_registro, categoria }
  }

  // SALÁRIO (entrada): "meu salário é 3000", "salário de 3000", "meu salário 3000"
  const salarioMatch = t.match(/(?:meu\s+)?sal[aá]rio\s+(?:é|de)?\s*[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(.*)/i)
  if (salarioMatch && /sal[aá]rio\s+(?:é|de)?\s*[\d.,]+/i.test(t)) {
    const nomeSal = (salarioMatch[1] || '').trim() || 'Salário'
    nome = nomeSal.substring(0, 200) || 'Salário'
    nome = nome.replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '').trim() || 'Salário'
    const data_registro = parseDataDoTexto(t)
    return { tipo: 'entrada', valor: valorNum, nome, data_registro, categoria: 'Salário' }
  }

  // Verbos de GASTO: gastei, gasteu, paguei, pagou, etc.
  const verbosGasto = /(?:gastei|gasteu|gastou|paguei|pagou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?/i
  const despesaMatch = t.match(/(?:gastei|gasteu|gastou|paguei|pagou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|em|com|para|no|na)?\s*(.*)/i)

  // Verbos de ENTRADA: recebi, recebeu, ganhei, ganhou, entrei com, entrada de, etc.
  const verbosEntrada = /(?:recebi|recebeu|ganhei|ganhou|ganhamos|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?/i
  const entradaMatch = t.match(/(?:recebi|recebeu|ganhei|ganhou|ganhamos|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:de|do|da|com)?\s*(.*)/i)

  let tipo: TipoRegistro
  let nome: string

  if (despesaMatch && verbosGasto.test(t)) {
    nome = (despesaMatch[1] || '').trim() || 'Gasto'
    tipo = 'saida'
  } else if (verbosGasto.test(t)) {
    nome = 'Gasto'
    tipo = 'saida'
  } else if (entradaMatch && verbosEntrada.test(t)) {
    nome = (entradaMatch[1] || '').trim() || 'Entrada'
    tipo = 'entrada'
  } else if (verbosEntrada.test(t)) {
    nome = 'Entrada'
    tipo = 'entrada'
  } else {
    return null
  }

  // Remover termos de data do final do nome (ex.: "roupas ontem" -> "roupas", "mercado dia 15" -> "mercado")
  nome = nome
    .replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '')
    .trim()
  nome = nome.substring(0, 200) || (tipo === 'saida' ? 'Gasto' : 'Entrada')
  const data_registro = parseDataDoTexto(t)
  const categoria = nome && nome !== 'Gasto' && nome !== 'Entrada' ? nome : 'Outros'

  return { tipo, valor: valorNum, nome, data_registro, categoria }
}

/** Formata data ISO para DD/MM/AAAA. */
function formatarDataBR(iso: string): string {
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return new Date().toLocaleDateString('pt-BR')
  }
}

/** URL do site (sempre com https para ficar clicável no WhatsApp). */
function getSiteUrl(): string {
  const raw =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL?.trim()) || 'https://plenipay.com'
  return raw.startsWith('http') ? raw : `https://${raw.replace(/^\/+|\/+$/g, '')}`
}

/** Zero-width space (U+200B): evita que o WhatsApp gere miniatura do link, mas o link continua clicável. */
const ZWSP = '\u200B'

/** Retorna a URL para exibir na mensagem, sem gerar preview/miniatura no WhatsApp. */
function getSiteUrlSemPreview(): string {
  const url = getSiteUrl()
  if (!url.startsWith('https://')) return url
  return `https://${ZWSP}${url.slice(8)}`
}

/**
 * Monta a resposta no formato pedido:
 * 📌 (nome)
 * 🔴 R$ valor (gasto) ou 🟢 R$ valor (ganho)
 * 📅 data
 * 🗂️ Categoria: ...
 * usuario: (nome do usuário/pessoa) — opcional
 * ✨ Mensagem de sucesso
 * Confira todos os seus registros acessando sua conta
 * https://plenipay.com
 */
export function formatarRespostaRegistro(params: {
  nome: string
  tipo: TipoRegistro
  valor: number
  dataRegistro: string
  categoria: string
  /** Nome do usuário/pessoa em que o registro foi lançado (ex.: dono da conta ou outro). */
  nomeUsuario?: string
}): string {
  const { nome, tipo, valor, dataRegistro, categoria, nomeUsuario } = params
  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dataBR = formatarDataBR(dataRegistro)
  const emojiValor = tipo === 'entrada' ? '🟢' : '🔴' // entrada = ganho (verde), saida/divida = vermelho
  const mensagemSucesso =
    tipo === 'saida'
      ? '✨ Seu gasto foi registrado com sucesso!'
      : tipo === 'divida'
        ? '✨ Sua dívida foi registrada com sucesso!'
        : '✨ Sua entrada foi registrada com sucesso!'

  const linhas = [
    `📌 ${nome}`,
    `${emojiValor} ${valorFormatado}`,
    `📅 ${dataBR}`,
    `🗂️ Categoria: ${categoria}`,
  ]
  if (nomeUsuario != null && nomeUsuario.trim() !== '') {
    linhas.push(`usuario: ${nomeUsuario.trim()}`)
  }
  linhas.push(
    '',
    mensagemSucesso,
    '',
    'Confira todos os seus registros acessando sua conta',
    getSiteUrlSemPreview(),
  )
  return linhas.join('\n')
}
