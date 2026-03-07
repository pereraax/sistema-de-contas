/**
 * Normalização de JID (Z-API / WhatsApp).
 * JID 1:1 = 5511999999999@s.whatsapp.net
 * Grupo = 12036300000000@g.us
 */

export interface NormalizedJid {
  /** Número limpo (só dígitos) para 1:1; para grupo fica o id do grupo. */
  phone: string
  /** JID completo para envio (só para 1:1). */
  jid: string
  /** True se for chat de grupo (@g.us). */
  isGroup: boolean
}

/**
 * Extrai phone e jid a partir do identificador retornado pela Z-API.
 * - Se contém @s.whatsapp.net: phone = parte antes do @, jid = valor completo.
 * - Se contém @g.us: isGroup = true (não usar para envio 1:1).
 */
export function normalizeJid(raw: string): NormalizedJid | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (s.includes('@g.us')) {
    const phone = s.split('@')[0]?.replace(/\D/g, '') ?? ''
    return { phone, jid: s, isGroup: true }
  }
  if (s.includes('@s.whatsapp.net')) {
    const phone = s.split('@')[0]?.replace(/\D/g, '').trim() ?? ''
    const jid = phone ? `${phone}@s.whatsapp.net` : ''
    if (!phone) return null
    return { phone, jid, isGroup: false }
  }
  return null
}

/** Retorna só o número limpo para 1:1 (ou null se grupo/inválido). */
export function phoneFromJid(raw: string): string | null {
  const n = normalizeJid(raw)
  if (!n || n.isGroup) return null
  return n.phone
}

/** Retorna o JID para envio (número@s.whatsapp.net) ou null. */
export function jidForSend(raw: string): string | null {
  const n = normalizeJid(raw)
  if (!n || n.isGroup) return null
  return n.jid
}
