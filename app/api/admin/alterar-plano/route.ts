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
    const planoStatus = body?.planoStatus as string | undefined

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }
    if (!PLANOS.includes(plano)) {
      return NextResponse.json({ error: 'plano inválido. Use: teste, basico ou premium' }, { status: 400 })
    }

    // Para o app desbloquear as funções, plano_status deve ser 'ativo' (ou 'trial') e plano_data_fim futura (lib/plano.ts).
    const statusValido = planoStatus === 'ativo' || planoStatus === 'trial' || planoStatus === 'cancelado' || planoStatus === 'expirado'
    const novoStatus = statusValido ? planoStatus : (plano === 'teste' ? 'trial' : 'ativo')
    const dataFimUmAno = new Date()
    dataFimUmAno.setFullYear(dataFimUmAno.getFullYear() + 1)
    const novoDataFim = plano === 'basico' || plano === 'premium' ? dataFimUmAno.toISOString() : null

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

      const updatePayload: Record<string, unknown> = { plano }
      if (plano === 'basico' || plano === 'premium') {
        updatePayload.plano_status = novoStatus
        updatePayload.plano_data_fim = novoDataFim
      } else if (plano === 'teste') {
        updatePayload.plano_status = 'trial'
        updatePayload.plano_data_fim = null
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', idToUpdate)
        .select('id, email, nome, plano, plano_status, plano_data_fim')
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

    const rpcPayloadIdCurto = {
      p_id_curto: idCurto,
      p_plano: plano,
      p_plano_status: novoStatus,
      p_plano_data_fim: novoDataFim,
    }
    const rpcPayloadUuid = {
      p_user_id: userId,
      p_plano: plano,
      p_plano_status: novoStatus,
      p_plano_data_fim: novoDataFim,
    }

    if (idCurto) {
      let result = await supabase.rpc('admin_update_profile_plano_by_id_curto', rpcPayloadIdCurto)
      if (result.error && (result.error.message?.includes('does not exist') || result.error.message?.includes('argument'))) {
        result = await supabase.rpc('admin_update_profile_plano_by_id_curto', { p_id_curto: idCurto, p_plano: plano })
      }
      if (!result.error) {
        const row = Array.isArray(result.data) ? result.data[0] : result.data
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
        console.error('[admin/alterar-plano] Erro RPC by_id_curto:', result.error)
      }
    }

    if (isUuid(userId)) {
      let result = await supabase.rpc('admin_update_profile_plano', rpcPayloadUuid)
      if (result.error && (result.error.message?.includes('does not exist') || result.error.message?.includes('argument'))) {
        result = await supabase.rpc('admin_update_profile_plano', { p_user_id: userId, p_plano: plano })
      }
      if (!result.error) {
        const row = Array.isArray(result.data) ? result.data[0] : result.data
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
        console.error('[admin/alterar-plano] Erro RPC:', result.error)
      }
    }

    const msg = 'Usuário não encontrado ou funções RPC não existem. Execute CRIAR-RPC-ALTERAR-PLANO.sql no Supabase (a versão atual também define plano_status e plano_data_fim para o app desbloquear).'
    return NextResponse.json({ error: msg }, { status: 404 })
  } catch (err) {
    console.error('[admin/alterar-plano]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
