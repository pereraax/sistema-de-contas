/**
 * Registro da última vez que a conta WhatsApp sofreu restrição/spam.
 * Usado no admin para documentar quando ocorreu e ter histórico.
 */

import { createAdminClient } from '@/lib/supabase/server'

const KEY = 'whatsapp_ultima_restricao_registrada'

export async function getUltimaRestricaoRegistrada(): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from('platform_config')
      .select('value, updated_at')
      .eq('key', KEY)
      .maybeSingle()
    if (error || !data) return null
    return (data.value as string) || (data.updated_at as string) || null
  } catch {
    return null
  }
}

export async function registrarRestricaoAgora(): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    if (!supabase) return false
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('platform_config')
      .upsert(
        {
          key: KEY,
          value: now,
          description: 'Data/hora em que foi registrada a última restrição (spam) do WhatsApp. Preenchido manualmente no admin.',
          updated_at: now,
        },
        { onConflict: 'key' }
      )
    return !error
  } catch {
    return false
  }
}
