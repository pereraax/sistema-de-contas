/**
 * Parseia "me lembre de pagar X dia D" / "todo dia 8" / "às 9 horas"
 */

export interface ParsedLembrete {
  descricao: string
  valor?: number
  data?: string
  horario?: string
  isRecorrente?: boolean
  diaRecorrente?: number
  missingDate: boolean
}

function extrairValor(texto: string): number | undefined {
  const t = texto.replace(/\s+/g, ' ').trim()
  const match = t.match(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(?:reais?|r\$|r\b)?/i)
  if (!match) return undefined
  const s = match[1].replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 && n <= 500_000 ? n : undefined
}

/** Retorna descrição limpa para o lembrete (ex.: "pagar 140 da academia"). */
function descricaoParaLembrete(texto: string, valor?: number): string {
  let d = texto
    .replace(/\b(me\s+)?lembre\s+de\s+/gi, '')
    .replace(/\b(lembrete\s+)?(para\s+)?/gi, '')
    .replace(/\bdia\s+\d{1,2}(?:[-\/]\d{1,2})?(?:[-\/]\d{2,4})?\b/gi, '')
    .replace(/\btodo\s+dia\s+\d{1,2}\b/gi, '')
    .replace(/\b(?:as|às)\s+\d{1,2}\s*(?:horas?|h)?(?::\d{2})?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (d.length > 200) d = d.slice(0, 200)
  return d || 'Lembrete'
}

/**
 * Parseia mensagem do tipo "me lembre de pagar 140 da academia dia 13-09" ou "todo dia 8 às 9 horas".
 * Se não houver data nem "todo dia X", retorna missingDate: true.
 */
export function parseLembreteMensagem(texto: string): ParsedLembrete {
  const t = (texto || '').trim().toLowerCase()
  const missing: ParsedLembrete = {
    descricao: descricaoParaLembrete(texto),
    missingDate: true,
  }

  if (!/lembre|lembrete/i.test(t)) return missing

  const valor = extrairValor(texto)
  const descricao = descricaoParaLembrete(texto, valor)

  // "todo dia 8" ou "todo dia 8 às 9 horas"
  const todoDiaMatch = t.match(/\btodo\s+dia\s+(\d{1,2})\b/)
  const horasMatch = t.match(/(?:as|às)\s+(\d{1,2})\s*(?:horas?|h)?(?::(\d{2}))?/)
  let horario: string | undefined
  if (horasMatch) {
    const h = Math.min(23, Math.max(0, parseInt(horasMatch[1], 10)))
    const m = horasMatch[2] ? Math.min(59, Math.max(0, parseInt(horasMatch[2], 10))) : 0
    horario = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  }

  if (todoDiaMatch) {
    const dia = Math.min(31, Math.max(1, parseInt(todoDiaMatch[1], 10)))
    const now = new Date()
    const dataPrimeira = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return {
      descricao: descricao || 'Lembrete',
      valor,
      data: dataPrimeira,
      horario,
      isRecorrente: true,
      diaRecorrente: dia,
      missingDate: false,
    }
  }

  // "dia 13-09" ou "dia 13/09" ou "dia 07" (dia 7 deste mês)
  const diaBarraMatch = t.match(/\bdia\s+(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{2,4}))?/)
  const diaSimplesMatch = t.match(/\bdia\s+(\d{1,2})\b/)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (diaBarraMatch) {
    const d = parseInt(diaBarraMatch[1], 10)
    const m = parseInt(diaBarraMatch[2], 10) - 1
    const y = diaBarraMatch[3] ? parseInt(diaBarraMatch[3], 10) : year
    const fullYear = y < 100 ? 2000 + y : y
    const data = new Date(fullYear, m, Math.min(31, d))
    if (data.getTime() < now.getTime()) data.setFullYear(data.getFullYear() + 1)
    const dataStr = data.toISOString().slice(0, 10)
    return { descricao: descricao || 'Lembrete', valor, data: dataStr, horario, missingDate: false }
  }

  if (diaSimplesMatch) {
    const dia = Math.min(31, Math.max(1, parseInt(diaSimplesMatch[1], 10)))
    let data = new Date(year, month, dia)
    if (data.getTime() < now.getTime()) data = new Date(year, month + 1, dia)
    const dataStr = data.toISOString().slice(0, 10)
    return { descricao: descricao || 'Lembrete', valor, data: dataStr, horario, missingDate: false }
  }

  // "amanhã"
  if (/\bamanh[aã]\b/.test(t)) {
    const amanha = new Date(now)
    amanha.setDate(amanha.getDate() + 1)
    return { descricao: descricao || 'Lembrete', valor, data: amanha.toISOString().slice(0, 10), horario, missingDate: false }
  }

  return { ...missing, descricao: descricao || 'Lembrete', valor }
}
