import { createAdminClient } from '@/lib/supabase/server'

export interface CrmInteractionLogInsert {
  contact_id: string
  evento: string
  detalhes?: Record<string, unknown> | null
}

export async function logInteraction(input: CrmInteractionLogInsert): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  await supabase.from('crm_interaction_logs').insert({
    contact_id: input.contact_id,
    evento: input.evento,
    detalhes: input.detalhes ?? null,
  })
}

export async function getInteractionLogsByContactId(
  contactId: string,
  limit = 50
): Promise<Array<{ id: string; evento: string; detalhes: unknown; timestamp: string }>> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_interaction_logs')
    .select('id, evento, detalhes, timestamp')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Array<{ id: string; evento: string; detalhes: unknown; timestamp: string }>
}
