/**
 * Helpers para PIX copia-e-cola (BR Code EMV) e imagem base64 do Asaas.
 * Um payload truncado ou com espaços quebra o app do banco ao escanear/colar.
 */

/** Remove quebras de linha e espaços que alguns bancos rejeitam no BR Code */
export function normalizePixCopyPaste(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined
  const s = String(raw).replace(/\s+/g, '').trim()
  return s.length ? s : undefined
}

/**
 * Imagem base64 do Asaas: às vezes vem com prefixo "=" em exemplos da doc; garantir PNG válido.
 */
export function normalizePixEncodedImage(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined
  let s = String(raw).trim()
  if (!s) return undefined
  if (s.startsWith('data:image')) return s
  // Raro: base64 com "=" inicial (artefato)
  if (s.startsWith('=') && /^=iVBOR/.test(s)) s = s.slice(1)
  return s.length ? s : undefined
}

/**
 * Validação leve do BR Code PIX (dinâmico) — evita devolver QR escaneável mas inválido.
 * Formato típico: começa com 000201 e termina com CRC 6304 + 4 hex.
 */
export function isLikelyValidBrPixPayload(payload: string): boolean {
  const s = payload.trim()
  if (s.length < 90) return false
  if (!s.startsWith('000201')) return false
  if (!/6304[0-9A-Fa-f]{4}$/.test(s)) return false
  return true
}

/**
 * Escolhe a cobrança PIX pendente mais recente (assinatura pode listar várias entradas).
 */
export function selectPendingPixPayment(payments: unknown[]): Record<string, unknown> | null {
  if (!Array.isArray(payments) || payments.length === 0) return null
  const pending = payments.filter((p) => {
    const row = p as Record<string, unknown>
    const st = String(row?.status ?? '').toUpperCase()
    const okStatus = st === 'PENDING' || st === 'AWAITING_RISK_ANALYSIS'
    const bt = String(row?.billingType ?? '').toUpperCase()
    const okBilling = !bt || bt === 'PIX'
    return okStatus && okBilling
  }) as Record<string, unknown>[]

  if (!pending.length) return null

  pending.sort((a, b) => {
    const da = new Date(String(a.dateCreated ?? a.dueDate ?? 0)).getTime()
    const db = new Date(String(b.dateCreated ?? b.dueDate ?? 0)).getTime()
    return db - da
  })
  return pending[0] ?? null
}
