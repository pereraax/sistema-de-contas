import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { sendBoasVindasToNumber } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { markWelcomeSent, markTestIntroSent } from '@/lib/whatsapp-contatos-pendentes'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'

function normalizarPhone(n: string): string {
  const limpo = n.replace(/\D/g, '')
  if (limpo.length >= 10 && !limpo.startsWith('55')) return `55${limpo}`
  return limpo
}

/** POST: envia as 3 mensagens de boas-vindas para um número. Body: { "phone": "5511999999999" }. */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!isApifacilConfigured()) {
    return NextResponse.json(
      { success: false, error: 'API Fácil não configurada' },
      { status: 503 }
    )
  }
  let body: { phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body deve ser JSON com campo "phone"' },
      { status: 400 }
    )
  }
  const phone = normalizarPhone(String(body.phone ?? ''))
  if (phone.length < 10) {
    return NextResponse.json(
      { success: false, error: 'Número inválido. Envie { "phone": "5511999999999" }' },
      { status: 400 }
    )
  }
  const result = await sendBoasVindasToNumber(phone)
  if (result.success) {
    await markWelcomeSent(phone)
    await markTestIntroSent(phone).catch(() => {})
  }
  return NextResponse.json({
    success: result.success,
    error: result.error,
    phone,
  })
}
