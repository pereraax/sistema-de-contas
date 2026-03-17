import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { wooviCreateCharge } from '@/lib/woovi'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Plano oferta quiz: anual a R$ 29,90
const VALUE_CENTS = 2990

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const nome = String(body?.nome || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const celular = String(body?.celular || '').replace(/\D/g, '')
    const cpf = String(body?.cpf || '').replace(/\D/g, '')

    if (!nome) return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 })
    if (!email) return NextResponse.json({ success: false, error: 'E-mail é obrigatório.' }, { status: 400 })
    if (cpf.length !== 11) return NextResponse.json({ success: false, error: 'CPF inválido ou não informado.' }, { status: 400 })

    const admin = createAdminClient()
    if (!admin) return NextResponse.json({ success: false, error: 'Serviço temporariamente indisponível.' }, { status: 503 })

    let userId: string

    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profileByEmail?.id) {
      userId = profileByEmail.id
      await admin.from('profiles').update({
        nome,
        cpf,
        ...(celular.length >= 10 && { whatsapp: celular }),
      }).eq('id', userId)
    } else {
      const tempPassword = crypto.randomBytes(24).toString('hex')
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: nome },
      })
      const createdId = (data as any)?.user?.id ?? (data as any)?.id
      if (error || !createdId) {
        return NextResponse.json({ success: false, error: error?.message || 'Não foi possível criar sua conta.' }, { status: 400 })
      }
      userId = createdId
      await admin.from('profiles').upsert({
        id: userId,
        email,
        nome,
        cpf,
        ...(celular.length >= 10 && { whatsapp: celular }),
      }, { onConflict: 'id' })
    }

    // CorrelationID para recuperar userId no webhook/status
    const correlationID = `pleni_${userId}_${Date.now()}`

    const charge = await wooviCreateCharge({
      correlationID,
      valueInCents: VALUE_CENTS,
      comment: 'Plano Anual Plenipay',
      customer: {
        name: nome,
        email,
        ...(celular.length >= 10 ? { phone: `55${celular}` } : {}),
        taxID: cpf,
      },
    })

    const chargeId = charge.identifier || charge.transactionID || charge.globalID
    if (!chargeId) {
      return NextResponse.json({ success: false, error: 'Não foi possível gerar a cobrança PIX.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      provider: 'woovi',
      chargeId,
      correlationID,
      pixCopyPaste: charge.brCode || null,
      pixQrCode: charge.qrCodeImage || null, // URL da imagem do QR
      paymentLinkUrl: charge.paymentLinkUrl || null,
    })
  } catch (err: any) {
    console.error('[woovi/checkout-guest] erro:', err?.message ?? err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao processar pagamento.' }, { status: 500 })
  }
}

