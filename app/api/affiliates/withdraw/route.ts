import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requestWithdrawal } from '@/lib/affiliates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const amount = Number(body?.amount)
    const pixKeyType = body?.pix_key_type
    const pixKeyValue = body?.pix_key_value
    const name = body?.name

    if (!amount || amount < 30) {
      return NextResponse.json({ error: 'Valor mínimo para saque é R$ 30.' }, { status: 400 })
    }
    if (!['cpf', 'phone', 'email'].includes(pixKeyType)) {
      return NextResponse.json({ error: 'Tipo de chave PIX inválido. Use: cpf, phone ou email.' }, { status: 400 })
    }
    if (!pixKeyValue || typeof pixKeyValue !== 'string' || !pixKeyValue.trim()) {
      return NextResponse.json({ error: 'Informe a chave PIX.' }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }

    const result = await requestWithdrawal(
      user.id,
      amount,
      pixKeyType,
      pixKeyValue.trim(),
      name.trim()
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[affiliates/withdraw]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
