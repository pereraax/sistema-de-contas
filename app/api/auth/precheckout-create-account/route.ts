import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '')
}

function randomStrongPassword(): string {
  // Senha aleatória apenas para "reservar" a conta sem autenticar.
  // O usuário vai definir a senha de verdade no `/cadastro`.
  const base = crypto.randomBytes(16).toString('hex')
  const now = Date.now().toString(36)
  return `Plen${now}!${base}#`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawEmail = typeof body.email === 'string' ? body.email : ''
    const rawPhone = typeof body.celularDigits === 'string' ? body.celularDigits : typeof body.phone === 'string' ? body.phone : body.celular
    const rawName = typeof body.nome === 'string' ? body.nome : ''

    const email = normalizeEmail(rawEmail)
    const phoneDigits = normalizePhoneDigits(rawPhone)
    const nome = (rawName || '').trim() || 'Assinante'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'E-mail inválido.' }, { status: 400 })
    }

    // BR: garantimos no mínimo DDD + 8/9 dígitos (10-11 dígitos)
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      return NextResponse.json(
        { success: false, error: 'Número de celular inválido. Informe com DDD.' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Serviço indisponível. Configure SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      )
    }

    // Busca usuário existente por email (Admin API).
    const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listErr) {
      return NextResponse.json({ success: false, error: listErr.message || 'Erro ao buscar usuário.' }, { status: 500 })
    }

    const existingUser = usersData?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email) ?? null

    let userId: string

    if (existingUser?.id) {
      userId = existingUser.id

      // Atualiza apenas dados de contato/profiling; não "derruba" plano ativo.
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, plano')
        .eq('id', userId)
        .maybeSingle()

      const planoToKeep = existingProfile?.plano || 'teste'

      const { error: upsertProfileErr } = await admin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email,
            nome,
            telefone: phoneDigits,
            whatsapp: phoneDigits,
            plano: planoToKeep,
          },
          { onConflict: 'id' }
        )

      if (upsertProfileErr) {
        return NextResponse.json({ success: false, error: upsertProfileErr.message || 'Erro ao atualizar perfil.' }, { status: 500 })
      }

      return NextResponse.json({ success: true, existed: true })
    }

    // Cria user no Supabase Auth sem autenticar.
    // IMPORTANTE: não confirmamos o email agora (email_confirm: false),
    // para o usuário conseguir completar o fluxo no `/cadastro`.
    const password = randomStrongPassword()

    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        nome,
        celular: phoneDigits,
        origem: 'precheckout_discreet',
      },
    } as any)

    if (createErr || !createData?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: createErr?.message || 'Erro ao criar conta no Supabase Auth.',
        },
        { status: 500 }
      )
    }

    userId = createData.user.id

    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        nome,
        telefone: phoneDigits,
        whatsapp: phoneDigits,
        plano: 'teste',
      },
      { onConflict: 'id' }
    )

    if (profileErr) {
      return NextResponse.json({ success: false, error: profileErr.message || 'Erro ao criar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, existed: false })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro inesperado ao criar conta.' },
      { status: 500 }
    )
  }
}

