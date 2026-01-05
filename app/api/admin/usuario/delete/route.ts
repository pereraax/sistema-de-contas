import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [DELETE USER] ========== INÍCIO ==========')
    
    // Verificar se é admin
    console.log('🔐 [DELETE USER] Verificando autenticação admin...')
    const admin = await verifyAdminToken()
    if (!admin) {
      console.error('❌ [DELETE USER] Não autorizado - admin não encontrado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.log('✅ [DELETE USER] Admin autenticado:', admin.email)

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      console.error('❌ [DELETE USER] userId não fornecido')
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('📋 [DELETE USER] Deletando usuário:', userId)

    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      console.error('❌ [DELETE USER] Admin client não disponível')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // PASSO 1: Verificar se o usuário existe antes de deletar
    console.log('🔍 [DELETE USER] Verificando se usuário existe...')
    const { data: profileCheck, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [DELETE USER] Erro ao verificar usuário:', checkError)
    } else if (profileCheck) {
      console.log('✅ [DELETE USER] Usuário encontrado:', profileCheck.email)
    } else {
      console.warn('⚠️ [DELETE USER] Usuário não encontrado na tabela profiles, mas tentando deletar do auth mesmo assim')
    }

    // PASSO 2: Deletar da tabela profiles primeiro (para evitar problemas de cascade)
    console.log('🗑️ [DELETE USER] Deletando da tabela profiles...')
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      // Se o erro for porque não existe, continuar mesmo assim
      if (profileDeleteError.code === 'PGRST116' || profileDeleteError.message.includes('not found') || profileDeleteError.message.includes('no rows')) {
        console.log('ℹ️ [DELETE USER] Usuário não encontrado na tabela profiles (pode já ter sido deletado)')
      } else {
        console.warn('⚠️ [DELETE USER] Erro ao deletar do profiles:', profileDeleteError)
        // Continuar mesmo assim para tentar deletar do auth
      }
    } else {
      console.log('✅ [DELETE USER] Usuário deletado da tabela profiles')
    }

    // PASSO 3: Deletar do auth.users (isso vai cascatear e deletar de outras tabelas)
    console.log('🗑️ [DELETE USER] Deletando usuário do auth.users...')
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('❌ [DELETE USER] Erro ao deletar do auth:', authDeleteError)
      console.error('❌ [DELETE USER] Código do erro:', authDeleteError.status)
      console.error('❌ [DELETE USER] Mensagem:', authDeleteError.message)
      
      // Se o erro for porque o usuário não existe, ainda retornar sucesso
      if (authDeleteError.message?.includes('not found') || authDeleteError.message?.includes('does not exist')) {
        console.log('ℹ️ [DELETE USER] Usuário não existe no auth, mas retornando sucesso (já foi deletado)')
        return NextResponse.json({
          success: true,
          message: 'Usuário não encontrado (já pode ter sido deletado)',
        })
      }
      
      return NextResponse.json(
        { error: `Erro ao deletar usuário: ${authDeleteError.message}`, code: authDeleteError.status },
        { status: 500 }
      )
    }

    console.log('✅ [DELETE USER] Usuário deletado com sucesso do auth.users')

    // PASSO 4: Verificar se realmente foi deletado (garantir que não existe mais)
    console.log('🔍 [DELETE USER] Verificando se usuário foi realmente deletado...')
    try {
      const { data: verifyProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (verifyProfile) {
        console.warn('⚠️ [DELETE USER] Usuário ainda existe na tabela profiles após exclusão! Tentando deletar novamente...')
        // Tentar deletar novamente
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)
      } else {
        console.log('✅ [DELETE USER] Confirmado: usuário não existe mais na tabela profiles')
      }

      // Verificar no auth.users também
      try {
        const { data: verifyAuth } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (verifyAuth?.user) {
          console.warn('⚠️ [DELETE USER] Usuário ainda existe no auth.users após exclusão!')
        } else {
          console.log('✅ [DELETE USER] Confirmado: usuário não existe mais no auth.users')
        }
      } catch (verifyAuthErr: any) {
        // Se der erro 404 ou similar, significa que foi deletado (esperado)
        if (verifyAuthErr.message?.includes('not found') || verifyAuthErr.message?.includes('does not exist')) {
          console.log('✅ [DELETE USER] Confirmado: usuário não existe mais no auth.users (erro esperado)')
        } else {
          console.warn('⚠️ [DELETE USER] Erro ao verificar auth.users:', verifyAuthErr)
        }
      }
    } catch (verifyErr) {
      console.warn('⚠️ [DELETE USER] Erro ao verificar exclusão:', verifyErr)
    }

    console.log('✅ [DELETE USER] ========== SUCESSO ==========')
    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
      userId: userId, // Retornar ID para debug
    })
  } catch (error: any) {
    console.error('❌ [DELETE USER] Erro inesperado:', error)
    console.error('❌ [DELETE USER] Stack:', error.stack)
    return NextResponse.json(
      { error: 'Erro ao deletar usuário', details: error.message },
      { status: 500 }
    )
  }
}

