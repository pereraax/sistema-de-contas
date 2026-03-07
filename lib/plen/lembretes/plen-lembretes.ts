/**
 * PLEN — Lembretes criados via "preciso pagar dia X" / "preciso receber dia X"
 */

import { createAdminClient } from '@/lib/supabase/server'

export type PlenLembreteTipo = 'pagar' | 'receber'

export async function createPlenLembrete(
  contactId: string,
  tipo: PlenLembreteTipo,
  dataLembrete: string,
  descricao: string
): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('plen_lembretes')
    .insert({
      contact_id: contactId,
      tipo,
      descricao: descricao.slice(0, 500),
      data_lembrete: dataLembrete,
      status: 'pendente',
    })
    .select('id')
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

/** Lembretes pendentes para hoje (data_lembrete = hoje). */
export async function getPlenLembretesParaHoje(): Promise<
  { id: string; contact_id: string; tipo: string; descricao: string }[]
> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('plen_lembretes')
    .select('id, contact_id, tipo, descricao')
    .eq('data_lembrete', today)
    .eq('status', 'pendente')
  if (error) return []
  return (data ?? []) as { id: string; contact_id: string; tipo: string; descricao: string }[]
}

export async function markPlenLembreteEnviado(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('plen_lembretes')
    .update({ status: 'enviado' })
    .eq('id', id)
  return !error
}
