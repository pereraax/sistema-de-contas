import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/admin-auth'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Servidor não configurado para login admin (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      )
    }

    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, nome, password_hash')
      .eq('email', String(email).trim())
      .eq('is_active', true)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(String(password), admin.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const token = await new SignJWT({
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    return NextResponse.json({ token })
  } catch (err: any) {
    console.error('[api/admin/login] Erro:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar login' },
      { status: 500 }
    )
  }
}
