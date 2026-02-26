/**
 * Interpretação de mensagens PLEN (gasto/entrada) e formatação da resposta.
 * Usado pelo chat in-app e pelo WhatsApp.
 */

import type { TipoRegistro } from '@/lib/types'

/**
 * Substitui números por extenso (pt-BR) por dígitos no texto, para áudio/OCR.
 * Ex: "paguei oitenta reais" → "paguei 80 reais", "gastei dois" → "gastei 2"
 * Exportado para uso em extrairComandoDeTexto (comprovante/legenda).
 */
export function normalizarNumerosPorExtenso(texto: string): string {
  if (!texto || typeof texto !== 'string') return texto
  const t = texto.trim().toLowerCase()
  const map: Record<string, number> = {
    um: 1, dois: 2, três: 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
    onze: 11, doze: 12, treze: 13, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
    vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
    cem: 100, duzentos: 200, trezentos: 300, quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
    mil: 1000,
  }
  let out = t
  // Ordenar por tamanho decrescente para não substituir "trezentos" por "3entos"
  const words = Object.keys(map).sort((a, b) => b.length - a.length)
  for (const w of words) {
    const re = new RegExp(`\\b${w}\\b`, 'gi')
    out = out.replace(re, String(map[w]))
  }
  // "e X" após dezenas: "vinte e cinco" → 25 (simplificado: só "e N" onde N < 10)
  out = out.replace(/\b(20|30|40|50|60|70|80|90)\s+e\s+([1-9])\b/gi, (_, dezena, un) => String(parseInt(dezena, 10) + parseInt(un, 10)))
  // Centenas + e cinquenta: "quatrocentos e cinquenta" já virou "400 e 50" → 450 (áudio "gastei 450 com roupas")
  out = out.replace(/\b(100|200|300|400|500|600|700|800|900)\s+e\s+50\b/gi, (_, cent) => String(parseInt(cent, 10) + 50))
  return out
}

/** Aceita 50, 1.500,00 (BR), 1,500.00 (US), 50 reais, R$ 1.234,56 */
function extrairValor(texto: string): number | null {
  const raw = texto.replace(/\s*(reais?|r\$|r\b)\s*/gi, '').trim()
  const match = raw.match(/[\d.,]+/)
  if (!match) return null
  const s = match[0]
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  let num: number
  if (hasComma && hasDot) {
    const lastSep = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.'
    const parts = s.split(lastSep)
    const decimalPart = parts[parts.length - 1].replace(/\D/g, '')
    const intPart = parts.slice(0, -1).join('').replace(/\D/g, '')
    num = parseFloat(`${intPart}.${decimalPart}`)
  } else if (hasComma) {
    const parts = s.split(',')
    const decimalPart = (parts[1] || '00').replace(/\D/g, '').slice(0, 2)
    const intPart = (parts[0] || '0').replace(/\D/g, '')
    num = parseFloat(`${intPart}.${decimalPart}`)
  } else if (hasDot) {
    const parts = s.split('.')
    const decimalPart = (parts[parts.length - 1] || '00').replace(/\D/g, '').slice(0, 2)
    const intPart = parts.slice(0, -1).join('').replace(/\D/g, '')
    num = parseFloat(`${intPart}.${decimalPart}`)
  } else {
    num = parseFloat(s.replace(/\D/g, ''))
  }
  return isNaN(num) || num <= 0 ? null : num
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

  // "hoje" ou nenhuma data explícita → hoje no fuso Brasília (evita servidor UTC dar dia seguinte)
  try {
    const br = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    var hojeBR = () => toISONoonUTC(br.getFullYear(), br.getMonth(), br.getDate())
  } catch {
    var hojeBR = () => toISONoonUTC(y, m, d)
  }
  if (/\bhoje\b/.test(t)) return hojeBR()
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
  return hojeBR()
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
/** Mapeia nome/descrição para categoria inteligente: compras→Supermercado, nomes de pessoas→Pessoas, etc. */
export function categoriaInteligente(nome: string, tipo: TipoRegistro): string {
  const n = nome.trim().toLowerCase()
  if (!n || n === 'gasto' || n === 'entrada') return 'Outros'
  const categoriasGasto: Record<string, string> = {
    mercado: 'Supermercado',
    supermercado: 'Supermercado',
    compras: 'Supermercado',
    feira: 'Supermercado',
    alimentacao: 'Alimentação',
    comida: 'Alimentação',
    restaurante: 'Alimentação',
    lanche: 'Alimentação',
    uber: 'Transporte',
    transporte: 'Transporte',
    gasolina: 'Transporte',
    combustivel: 'Transporte',
    onibus: 'Transporte',
    'conta de luz': 'Contas',
    luz: 'Contas',
    agua: 'Contas',
    internet: 'Contas',
    telefone: 'Contas',
    cartao: 'Cartão',
    cartão: 'Cartão',
    emprestimo: 'Empréstimo',
    empréstimo: 'Empréstimo',
    carro: 'Carro',
    saude: 'Saúde',
    remedio: 'Saúde',
    farmacia: 'Saúde',
    farmácia: 'Saúde',
    roupas: 'Vestuário',
    roupa: 'Vestuário',
    pix: 'Transferência',
    pagsmile: 'Transferência',
    transferencia: 'Transferência',
    transferência: 'Transferência',
    pagamento: 'Transferência',
  }
  const cat = categoriasGasto[n] || Object.keys(categoriasGasto).find((k) => n.includes(k))
  if (cat) return categoriasGasto[cat] || cat
  if (tipo === 'entrada') return n.length <= 2 || /^(da|do|de|do\s|da\s)/.test(n) ? 'Outros' : 'Pessoas'
  if (tipo === 'divida') return n === 'dívida' ? 'Outros' : 'Pessoas'
  return 'Outros'
}

/** Coleta todos os números que parecem valor em reais (1 a 500.000) no texto normalizado. */
function todosValoresNoTexto(texto: string): number[] {
  const vals: number[] = []
  const re = /[\d.,]+\s*(?:reais?|r\$|r\b)?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(texto)) !== null) {
    const n = extrairValor(m[0])
    if (n != null && n >= 1 && n <= 500_000) vals.push(n)
  }
  const re2 = /[\d.,]+/g
  while ((m = re2.exec(texto)) !== null) {
    const n = extrairValor(m[0])
    if (n != null && n >= 1 && n <= 500_000 && !vals.includes(n)) vals.push(n)
  }
  return [...new Set(vals)]
}

export function interpretarMensagem(texto: string): InterpretadoPlen | null {
  const t = normalizarNumerosPorExtenso(texto.trim().toLowerCase())
  // Preferir o valor que vem logo após o verbo (gastei/paguei/recebi) para não pegar "2" de "dia 2" ou transcrição errada
  const valorAposVerbo = t.match(/(?:gastei|gasteu|gastou|paguei|pagou|recebi|recebeu|ganhei|ganhou|entrada\s+de)\s+([\d.,]+)\s*(?:reais?|r\$|r\b)?/i)?.[1]
  let valorStr = valorAposVerbo ?? t.match(/[\d.,]+\s*(?:reais?|r\$|r\b)?/i)?.[0] ?? t.match(/[\d.,]+/)?.[0]
  let valorNum = valorStr ? extrairValor(valorStr) : null
  if (valorNum == null || valorNum <= 0) return null

  // Áudio/transcrição: quando deu R$ 2,00 mas há outro número no texto, usar o maior (evita "2" errado do Whisper)
  if (valorNum === 2) {
    const todos = todosValoresNoTexto(t)
    const maior = todos
      .filter((n) => n > 2 && n <= 500_000 && (n < 2019 || n > 2030)) // exclui ano (ex.: 2026)
      .sort((a, b) => b - a)[0]
    if (maior != null) valorNum = maior
  }

  let tipo: TipoRegistro
  let nome: string

  // DÍVIDA: "tenho uma dívida de 200", "dívida de 200 no cartão", "devo 200"
  const dividaMatch = t.match(/(?:tenho\s+(?:uma\s+)?d[ií]vida\s+de|d[ií]vida\s+de|devo)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:no|em|no\s+)?\s*(.*)/i)
  if (dividaMatch && /(?:tenho\s+(?:uma\s+)?d[ií]vida|d[ií]vida\s+de|devo)\s+[\d.,]+/i.test(t)) {
    const nomeDivida = (dividaMatch[1] || '').trim() || 'Dívida'
    nome = nomeDivida.substring(0, 200)
    nome = nome.replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '').trim() || 'Dívida'
    const data_registro = parseDataDoTexto(t)
    const categoria = categoriaInteligente(nome, 'divida')
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

  // ENTRADA por "ganhos de X", "novos ganhos de X reais", "entrada de X", "adicione X como ganho"
  const ganhosDeMatch = t.match(/(?:novos?\s+)?ganhos?\s+de\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(.*)/i)
  if (ganhosDeMatch) {
    const resto = (ganhosDeMatch[1] || '').trim().replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '').trim()
    nome = resto ? resto.substring(0, 200) : 'Ganhos'
    const data_registro = parseDataDoTexto(t)
    return { tipo: 'entrada', valor: valorNum, nome, data_registro, categoria: 'Outros' }
  }
  const entradaDeMatch = t.match(/\bentrada\s+de\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(.*)/i)
  if (entradaDeMatch) {
    const resto = (entradaDeMatch[1] || '').trim().replace(/\s*(hoje|ontem|dia\s+\d{1,2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*$/gi, '').trim()
    nome = resto ? resto.substring(0, 200) : 'Entrada'
    const data_registro = parseDataDoTexto(t)
    return { tipo: 'entrada', valor: valorNum, nome, data_registro, categoria: 'Outros' }
  }
  const adicioneGanhoMatch = t.match(/\badicione?\s+(?:um\s+)?(?:ganho\s+de\s+)?[\d.,]+\s*(?:reais?|r\$|r\b)?/i)
  if (adicioneGanhoMatch) {
    nome = 'Ganhos'
    const data_registro = parseDataDoTexto(t)
    return { tipo: 'entrada', valor: valorNum, nome, data_registro, categoria: 'Outros' }
  }

  // Verbos de GASTO: gastei, gasteu, paguei, pagou, etc.
  // \b nas preposições evita "com" em "comida" virar preposição e sobrar "ida"
  const verbosGasto = /(?:gastei|gasteu|gastou|paguei|pagou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?/i
  const despesaMatch = t.match(/(?:gastei|gasteu|gastou|paguei|pagou)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:\b(?:de|em|com|para|no|na)\b\s+)?(.*)/i)

  // Verbos de ENTRADA: recebi, recebeu, ganhei, ganhou, entrei com, entrada de, etc.
  const verbosEntrada = /(?:recebi|recebeu|ganhei|ganhou|ganhamos|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?/i
  const entradaMatch = t.match(/(?:recebi|recebeu|ganhei|ganhou|ganhamos|entrada\s+de?)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*(?:\b(?:de|do|da|com)\b\s+)?(.*)/i)

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
  const categoria = categoriaInteligente(nome, tipo)

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
    'plenipay.com',
  )
  return linhas.join('\n')
}
