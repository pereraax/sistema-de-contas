import { createAdminClient } from '@/lib/supabase/server'

export type WebhookLogStatus = 'success' | 'ignored' | 'error'

export async function logWebhookEvent(params: {
  status: WebhookLogStatus
  detail?: string | null
  contact_id?: string | null
  payload_preview?: string | null
}): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  await supabase.from('crm_webhook_logs').insert({
    status: params.status,
    detail: params.detail ?? null,
    contact_id: params.contact_id ?? null,
    payload_preview: params.payload_preview ?? null,
  })
}
