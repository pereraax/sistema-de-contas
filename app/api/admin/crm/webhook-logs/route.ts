import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ logs: [] })

    const { data, error } = await supabase
      .from('crm_webhook_logs')
      .select('id, received_at, status, detail, contact_id, payload_preview')
      .order('received_at', { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ logs: [], error: error.message })
    }
    return NextResponse.json({ logs: data ?? [] })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}
