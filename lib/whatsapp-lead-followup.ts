/**
 * Follow-up automático para leads inativos no fluxo de teste (10 min sem responder).
 * Envia mensagem estratégica para tentar converter (testar gasto ou cadastrar).
 */

import { listLeadsInativosParaFollowUp10Min, markLeadFollowup10minSent } from '@/lib/whatsapp-contatos-pendentes'
import { sendTextMessage as sendZapi, isZapiConfigured } from '@/lib/whatsapp-zapi'
import { sendTextMessage as sendApifacil, isApifacilConfigured } from '@/lib/whatsapp-apifacil'

/** Mensagem enviada após 10 min de inatividade do lead (ainda sem cadastro). */
const MSG_LEAD_FOLLOWUP_10MIN = `Oi! Vi que você ainda não testou 😊

Que tal me dizer um gasto do dia? Por exemplo:
*50 mercado*
*20 uber*

Em segundos mostro como fica organizado. Depois podemos criar sua conta e você continua registrando tudo por aqui 💙`

export interface RunLead10MinFollowUpResult {
  ok: boolean
  sent: number
  total: number
  errors?: string[]
}

/** Máximo de mensagens de follow-up 10min em uma execução (anti-spam WhatsApp). */
const MAX_FOLLOWUP_10MIN_PER_RUN = 2

/**
 * Lista leads inativos (10–50 min) no fluxo de teste, envia uma mensagem de follow-up por número e marca como enviado.
 * Limitado a MAX_FOLLOWUP_10MIN_PER_RUN por execução para evitar banimento.
 */
export async function runLead10MinFollowUp(): Promise<RunLead10MinFollowUpResult> {
  if (!isZapiConfigured() && !isApifacilConfigured()) {
    return { ok: false, sent: 0, total: 0, errors: ['WhatsApp não configurado (Z-API ou API Fácil)'] }
  }
  const sendTextMessage = isZapiConfigured() ? sendZapi : sendApifacil

  const leads = await listLeadsInativosParaFollowUp10Min()
  const toProcess = leads.slice(0, MAX_FOLLOWUP_10MIN_PER_RUN)
  const errors: string[] = []
  let sent = 0

  const delayBetweenMs = () => 60000 + Math.random() * 30000
  for (let i = 0; i < toProcess.length; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayBetweenMs()))
    }
    const { phone } = toProcess[i]
    try {
      const result = await sendTextMessage(phone, MSG_LEAD_FOLLOWUP_10MIN)
      if (result.success) {
        await markLeadFollowup10minSent(phone)
        sent += 1
      } else {
        errors.push(`${phone}: ${result.error ?? 'erro ao enviar'}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${phone}: ${msg}`)
    }
  }

  return {
    ok: true,
    sent,
    total: toProcess.length,
    errors: errors.length ? errors : undefined,
  }
}
