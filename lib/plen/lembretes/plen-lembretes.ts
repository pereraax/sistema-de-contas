/**
 * PLEN — Lembretes criados via "me lembre de pagar X dia D" / "todo dia 8" / "às 9 horas"
 */

import { createAdminClient } from '@/lib/supabase/server'

export type PlenLembreteTipo = 'pagar' | 'receber'

export interface CreatePlenLembreteParams {
  contactId: string
  tipo: PlenLembreteTipo
  descricao: string
  dataLembrete: string
  valor?: number | null
  horario?: string | null
  isRecorrente?: boolean
  diaRecorrente?: number | null
}

/** Cria lembrete. Para recorrente, dataLembrete = primeira ocorrência (ex.: este mês dia 8). */
export async function createPlenLembrete(params: CreatePlenLembreteParams): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const {
    contactId,
    tipo,
    descricao,
    dataLembrete,
    valor = null,
    horario = null,
    isRecorrente = false,
    diaRecorrente = null,
  } = params
  const { data, error } = await supabase
    .from('plen_lembretes')
    .insert({
      contact_id: contactId,
      tipo,
      descricao: descricao.slice(0, 500),
      data_lembrete: dataLembrete,
      valor: valor != null ? valor : null,
      horario: horario ?? null,
      is_recorrente: isRecorrente,
      dia_recorrente: diaRecorrente ?? null,
      status: 'pendente',
    })
    .select('id')
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

export type PlenLembreteParaEnvio = {
  id: string
  contact_id: string
  tipo: string
  descricao: string
  valor?: number | null
}

/** Converte "HH:MM:SS" ou "HH:MM" para minutos desde meia-noite (0-1439). */
function horarioParaMinutos(horario: string | null | undefined): number | null {
  if (!horario || typeof horario !== 'string') return null
  const parts = horario.trim().split(':')
  const h = parseInt(parts[0], 10)
  const m = parts[1] ? parseInt(parts[1], 10) : 0
  if (!Number.isFinite(h) || h < 0 || h > 23) return null
  return h * 60 + Math.min(59, Math.max(0, Number.isFinite(m) ? m : 0))
}

/** Fuso usado para "hoje" e hora (lembretes são no horário do usuário, Brasil). */
const TZ_LEMBRETES = 'America/Sao_Paulo'

/** Data de hoje no fuso (YYYY-MM-DD) e minutos desde meia-noite nesse fuso. */
function hojeETempoNoFuso(now: Date): { today: string; dayOfMonth: number; minutosAgora: number } {
  const formatterDate = new Intl.DateTimeFormat('en-CA', { timeZone: TZ_LEMBRETES, year: 'numeric', month: '2-digit', day: '2-digit' })
  const today = formatterDate.format(now)
  const dateParts = formatterDate.formatToParts(now)
  const dayOfMonth = parseInt(dateParts.find((p) => p.type === 'day')?.value ?? '1', 10)
  const timeParts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ_LEMBRETES, hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(now)
  const hour = parseInt(timeParts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(timeParts.find((p) => p.type === 'minute')?.value ?? '0', 10)
  return { today, dayOfMonth, minutosAgora: hour * 60 + minute }
}

/** Lembretes pendentes para hoje: data = hoje (ou recorrente no dia) e, se tiver horário, hora atual já passou (America/Sao_Paulo). */
export async function getPlenLembretesParaHoje(): Promise<PlenLembreteParaEnvio[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const now = new Date()
  const { today, dayOfMonth, minutosAgora } = hojeETempoNoFuso(now)
  const { data, error } = await supabase
    .from('plen_lembretes')
    .select('id, contact_id, tipo, descricao, valor, data_lembrete, is_recorrente, dia_recorrente, horario')
    .eq('status', 'pendente')
  if (error) return []
  const rows = (data ?? []) as Array<{
    id: string
    contact_id: string
    tipo: string
    descricao: string
    valor?: number | null
    data_lembrete: string
    is_recorrente?: boolean
    dia_recorrente?: number | null
    horario?: string | null
  }>
  return rows.filter((r) => {
    const dataStr = r.data_lembrete?.slice(0, 10)
    const ehHoje = dataStr === today || (r.is_recorrente && r.dia_recorrente != null && r.dia_recorrente === dayOfMonth)
    if (!ehHoje) return false
    const minLembrete = horarioParaMinutos(r.horario)
    if (minLembrete == null) return true
    return minutosAgora >= minLembrete
  })
}

export async function markPlenLembreteEnviado(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase.from('plen_lembretes').update({ status: 'enviado' }).eq('id', id)
  return !error
}

export async function markPlenLembreteConcluido(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase.from('plen_lembretes').update({ status: 'concluido' }).eq('id', id)
  return !error
}

export async function getPlenLembreteById(id: string): Promise<{ id: string; contact_id: string; descricao: string } | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('plen_lembretes')
    .select('id, contact_id, descricao')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as { id: string; contact_id: string; descricao: string }
}
