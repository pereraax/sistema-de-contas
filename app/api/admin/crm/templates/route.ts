import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    const { data, error } = await supabase
      .from('crm_message_templates')
      .select('id, titulo, conteudo, categoria')
      .order('updated_at', { ascending: false })
    if (error) return NextResponse.json({ templates: [] })
    return NextResponse.json({ templates: data ?? [] })
  } catch {
    return NextResponse.json({ templates: [] })
  }
}
