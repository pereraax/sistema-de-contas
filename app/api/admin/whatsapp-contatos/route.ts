/**
 * GET: lista todos os contatos WhatsApp (whatsapp_contatos) para o CRM do admin.
 * Retorna phone, last_message, last_message_at, welcome_sent_at para exibir e "Abrir no WhatsApp".
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_contatos'

export async function GET() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ contatos: [] })
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, phone, last_message, last_message_at, welcome_sent_at, created_at')
    .order('last_message_at', { ascending: false })
  if (error) {
    console.error('[whatsapp-contatos] Erro ao listar:', error)
    return NextResponse.json({ contatos: [] })
  }
  return NextResponse.json({ contatos: data ?? [] })
}
