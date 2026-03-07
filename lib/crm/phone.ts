/**
 * Validação de número de telefone para evitar sincronizar IDs internos
 * (ex: 258187747926220, 120363404711201900) como se fossem números de WhatsApp.
 * Aceita 10–15 dígitos (Z-API envia com DDI; IDs internos costumam 16+).
 */

/** Número plausível: 10–15 dígitos. Z-API envia com DDI; IDs internos costumam 16+. */
export function isPlausiblePhone(digits: string): boolean {
  if (!digits || typeof digits !== 'string') return false
  const d = digits.replace(/\D/g, '').trim()
  return d.length >= 10 && d.length <= 15
}
