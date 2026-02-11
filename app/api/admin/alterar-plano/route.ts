import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient, createPublicClient } from '@/lib/supabase/server'

const PLANOS = ['teste', 'basico', 'premium'] as const

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(s: string): boolean {
  return UUID_REGEX.test(s)
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login no painel admin novamente.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const userId = body?.userId
    const idCurto = typeof body?.idCurto === 'string' ? body.idCurto : undefined
    const plano = body?.plano

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }
    if (!PLANOS.includes(plano)) {
      return NextResponse.json({ error: 'plano inválido. Use: teste, basico ou premium' }, { status: 400 })
    }

    const doRevalidate = () => {
      try {
        revalidatePath('/administracaosecr/usuarios')
      } catch (_) {}
    }

    const supabaseAdmin = createAdminClient()

    if (supabaseAdmin) {
      let idToUpdate: string | null = null
      if (idCurto) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id_curto', idCurto)
          .maybeSingle()
        if (profile?.id) idToUpdate = profile.id
      }
      if (idToUpdate === null && isUuid(userId)) idToUpdate = userId
      if (idToUpdate === null && !isUuid(userId)) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id_curto', userId)
          .maybeSingle()
        if (profile?.id) idToUpdate = profile.id
      }
      if (!idToUpdate) {
        console.error('[admin/alterar-plano] Nenhum perfil encontrado userId:', userId, 'idCurto:', idCurto)
        return NextResponse.json(
          { error: 'Usuário não encontrado na base. Verifique o ID.' },
          { status: 404 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ plano })
        .eq('id', idToUpdate)
        .select('id, email, nome, plano')
        .maybeSingle()

      if (error) {
        console.error('[admin/alterar-plano] Erro Supabase:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json(
          { error: 'Usuário não encontrado na base. Verifique o ID.' },
          { status: 404 }
        )
      }
      doRevalidate()
      return NextResponse.json({
        success: true,
        usuario: { id: data.id, email: data.email, nome: data.nome, plano: data.plano ?? plano },
      })
    }

    const supabase = createPublicClient()

    if (idCurto) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_profile_plano_by_id_curto', {
        p_id_curto: idCurto,
        p_plano: plano,
      })
      if (!rpcError) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
        if (row) {
          doRevalidate()
          return NextResponse.json({
            success: true,
            usuario: {
              id: row.id,
              email: row.email ?? '',
              nome: row.nome ?? '',
              plano: (row.plano ?? plano) as string,
            },
          })
        }
      } else {
        console.error('[admin/alterar-plano] Erro RPC by_id_curto:', rpcError)
      }
    }

    if (isUuid(userId)) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_profile_plano', {
        p_user_id: userId,
        p_plano: plano,
      })
      if (!rpcError) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
        if (row) {
          doRevalidate()
          return NextResponse.json({
            success: true,
            usuario: {
              id: row.id,
              email: row.email ?? '',
              nome: row.nome ?? '',
              plano: (row.plano ?? plano) as string,
            },
          })
        }
      } else {
        console.error('[admin/alterar-plano] Erro RPC:', rpcError)
      }
    }

    const msg = 'Usuário não encontrado ou funções RPC não existem. Execute CRIAR-RPC-ALTERAR-PLANO.sql no Supabase.'
    return NextResponse.json({ error: msg }, { status: 404 })
  } catch (err) {
    console.error('[admin/alterar-plano]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
