import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listPendentes, addPendenteManualmente } from '@/lib/whatsapp-contatos-pendentes'

/** GET: lista contatos que ainda não receberam as 3 mensagens de boas-vindas (qualquer mensagem ou adicionados manualmente). */
export async function GET() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const list = await listPendentes()
  return NextResponse.json({ pendentes: list })
}

/** POST: adiciona um número manualmente à lista de pendentes (para reenvio). Body: { "phone": "5511999999999" }. */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  let body: { phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body deve ser JSON com campo "phone"' }, { status: 400 })
  }
  const phone = String(body.phone ?? '').trim()
  if (!phone) {
    return NextResponse.json({ error: 'Campo "phone" é obrigatório' }, { status: 400 })
  }
  const result = await addPendenteManualmente(phone)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Erro ao adicionar' }, { status: 400 })
  }
  return NextResponse.json({ success: true, message: 'Número adicionado. Aparecerá na lista em até 10s ou clique em Atualizar.' })
}
