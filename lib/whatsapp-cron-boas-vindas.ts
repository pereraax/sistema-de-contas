/**
 * Lógica compartilhada: backfill da API Fácil + envio das 3 mensagens para todos os pendentes.
 * Usado pelo cron e pela rota admin "enviar todos pendentes agora".
 */

import {
  listPhonesPendentesParaCron,
  markWelcomeSent,
  backfillFromNotificacoes,
  isQueroUtilizarPlenipay,
} from '@/lib/whatsapp-contatos-pendentes'
import { listarNotificacoesRecebidas } from '@/lib/whatsapp-apifacil-notificacoes'
import { sendBoasVindasToNumber } from '@/lib/whatsapp-enviar-boas-vindas-lib'

export interface RunBoasVindasPendentesResult {
  ok: boolean
  error?: string
  backfillImported: number
  processed: number
  total: number
  errors?: string[]
}

/**
 * 1) Backfill: busca na API Fácil mensagens recebidas (últimas 48h) "quero utilizar plenipay" e preenche whatsapp_contatos.
 * 2) Lista todos com welcome_sent_at null (últimos 7 dias) e envia as 3 mensagens para cada um.
 */
export async function runBoasVindasPendentes(
  maxAgeHours: number = 168
): Promise<RunBoasVindasPendentesResult> {
  let backfillImported = 0
  try {
    const dataFinal = new Date()
    const dataInicial = new Date()
    dataInicial.setHours(dataInicial.getHours() - 48)
    const dataInicialStr = dataInicial.toISOString().slice(0, 10)
    const dataFinalStr = dataFinal.toISOString().slice(0, 10)
    const res = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr, 100, { omitirInstanciaId: true })
    if (!res.error && res.notificacoes?.length) {
      const paraBackfill = res.notificacoes
        .filter((n) => isQueroUtilizarPlenipay((n.mensagem ?? '').trim()))
        .map((n) => ({ origem: n.origem, mensagem: n.mensagem ?? '', created_at: n.created_at }))
      const { importados } = await backfillFromNotificacoes(paraBackfill)
      backfillImported = importados
    }
  } catch (e) {
    console.error('[runBoasVindasPendentes] backfill from API Fácil:', e)
  }

  const pendentes = await listPhonesPendentesParaCron(maxAgeHours)
  const errors: string[] = []
  let processed = 0

  for (let i = 0; i < pendentes.length; i++) {
    const { phone } = pendentes[i]
    // Delay aleatório entre cada contato (3–12 s) para evitar pico de envio e aparência de spam
    if (i > 0) {
      const delayMs = 3000 + Math.floor(Math.random() * 9000)
      await new Promise((r) => setTimeout(r, delayMs))
    }
    try {
      const result = await sendBoasVindasToNumber(phone)
      if (result.success) {
        await markWelcomeSent(phone)
        processed += 1
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
    backfillImported,
    processed,
    total: pendentes.length,
    errors: errors.length ? errors : undefined,
  }
}
