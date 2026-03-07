import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listContactsForRepair } from '@/lib/crm/contacts'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Repara números de contato: normaliza formato (adiciona DDI 55 se 10–11 dígitos).
 * Com Z-API não há API de histórico; apenas correção de formato no banco.
 */
function normalizeToE164(phone: string): string {
  const n = phone.replace(/\D/g, '').trim()
  if (n.length === 10 || n.length === 11) return '55' + n
  return n
}

export async function POST() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const contacts = await listContactsForRepair()
    let repaired = 0
    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase indisponível' }, { status: 500 })

    for (const c of contacts) {
      const normalized = normalizeToE164(c.telefone)
      if (normalized !== c.telefone) {
        const { error } = await supabase
          .from('crm_contacts')
          .update({ telefone: normalized, updated_at: new Date().toISOString() })
          .eq('id', c.id)
        if (!error) repaired++
      }
    }

    return NextResponse.json({
      ok: true,
      repaired,
      message:
        repaired > 0
          ? `${repaired} número(s) de contato corrigido(s) (formato DDI 55).`
          : 'Nenhum contato com número a corrigir (ou já estão no formato 55+DDD+Número).',
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/repair-phones] POST:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro ao reparar' }, { status: 500 })
  }
}
