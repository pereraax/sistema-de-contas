import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { getInteractionLogsByContactId } from '@/lib/crm/interaction-logs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

    const { id } = await params
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single()
    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    const logs = await getInteractionLogsByContactId(id, 50)
    return NextResponse.json({ contact, logs })
  } catch (e: any) {
    console.error('[crm/contacts/[id]] GET:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

    const { id } = await params
    const body = await request.json()
    const allowed = ['nome', 'email', 'status', 'observacoes', 'usuario_cadastrado']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('[crm/contacts/[id]] PATCH:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ contact: data })
  } catch (e: any) {
    console.error('[crm/contacts/[id]] PATCH:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
