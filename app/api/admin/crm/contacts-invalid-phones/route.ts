import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listContactsForRepair } from '@/lib/crm/contacts'
import { isPlausiblePhone } from '@/lib/crm/phone'

/**
 * Lista contatos com número inválido (para correção manual).
 * Útil quando o reparo automático (match por nome) não consegue corrigir.
 */
export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const all = await listContactsForRepair()
    const invalid = all.filter((c) => !c.telefone || !isPlausiblePhone(c.telefone))
    return NextResponse.json({
      total: invalid.length,
      contacts: invalid.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone })),
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/contacts-invalid-phones] GET:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
