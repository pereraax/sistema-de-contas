/**
 * Assistente PLEN pausada para todos (global).
 * Quando true, a assistente não responde a ninguém no WhatsApp; humano pode atender.
 * Valor armazenado em platform_config (key: assistente_global_pausada).
 */

import { createAdminClient } from '@/lib/supabase/server'

const KEY = 'assistente_global_pausada'

export async function getAssistenteGlobalPausada(): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    if (!supabase) return false
    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', KEY)
      .maybeSingle()
    if (error || !data) {
      if (process.env.NODE_ENV === 'development' && error) {
        console.warn('[assistente-global-pausada] leitura falhou:', error.message)
      }
      return false
    }
    const pausada = ((data as { value?: string }).value ?? '').trim().toLowerCase() === 'true'
    return pausada
  } catch {
    return false
  }
}

export async function setAssistenteGlobalPausada(pausada: boolean): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    if (!supabase) return false
    const value = pausada ? 'true' : 'false'
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key: KEY, value, description: 'Se true, a assistente PLEN não responde para ninguém no WhatsApp. Controle pelo painel admin.', updated_at: new Date().toISOString() }, { onConflict: 'key' })
    return !error
  } catch {
    return false
  }
}
