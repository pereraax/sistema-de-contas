import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { logInfo, logError, logSuccess, logWarn } from '@/lib/server-logs'

/**
 * Rota de diagnóstico para verificar por que email não está sendo enviado
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    logInfo(`🔍 ========== DIAGNÓSTICO DE ENVIO DE EMAIL ==========`, 'DIAGNOSTIC')
    logInfo(`📧 Email: ${email}`, 'DIAGNOSTIC')

    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      logError('❌ Admin client não disponível', 'DIAGNOSTIC')
      return NextResponse.json(
        { 
          error: 'Admin client não disponível',
          needsConfig: true 
        },
        { status: 500 }
      )
    }

    // 1. Verificar se usuário existe
    logInfo('🔍 PASSO 1: Verificando se usuário existe...', 'DIAGNOSTIC')
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      logError(`❌ Erro ao listar usuários: ${listError.message}`, 'DIAGNOSTIC')
      return NextResponse.json(
        { error: 'Erro ao buscar usuário', details: listError.message },
        { status: 500 }
      )
    }
    
    const user = (users.users as any[]).find((u: any) => u.email === email)
    
    if (!user) {
      logError(`❌ Usuário não encontrado para: ${email}`, 'DIAGNOSTIC')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    logInfo(`✅ Usuário encontrado: ${user.id}`, 'DIAGNOSTIC')
    logInfo(`📋 Email confirmado: ${user.email_confirmed_at ? 'SIM' : 'NÃO'}`, 'DIAGNOSTIC')

    // 2. Configurar URL de redirecionamento
    const siteUrl = 'https://plenipay.com'
    const redirectTo = `${siteUrl}/auth/callback?next=/home`
    logInfo(`🔗 URL de redirecionamento: ${redirectTo}`, 'DIAGNOSTIC')

    // 3. Testar resend
    logInfo('🔍 PASSO 2: Testando resend()...', 'DIAGNOSTIC')
    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const result1 = await supabasePublic.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    
    logInfo(`📬 Resposta do resend:`, 'DIAGNOSTIC')
    logInfo(`   - Erro: ${result1.error ? result1.error.message : 'Nenhum'}`, 'DIAGNOSTIC')
    logInfo(`   - Status do erro: ${(result1.error as any)?.status || 'N/A'}`, 'DIAGNOSTIC')
    logInfo(`   - Dados: ${result1.data ? JSON.stringify(result1.data) : 'Nenhum'}`, 'DIAGNOSTIC')

    if (result1.error) {
      const errorMsg = result1.error.message || ''
      
      // 4. Verificar configurações do Supabase
      logInfo('🔍 PASSO 3: Verificando configurações...', 'DIAGNOSTIC')
      
      let diagnosticos = []
      
      // Verificar tipo de erro
      if (errorMsg.includes('rate limit')) {
        diagnosticos.push('❌ RATE LIMITING: Muitas tentativas. Aguarde alguns minutos.')
      }
      
      if (errorMsg.includes('already confirmed')) {
        diagnosticos.push('⚠️ Email já confirmado. Isso pode impedir envio de novo link.')
      }
      
      if (errorMsg.includes('email not found') || errorMsg.includes('user not found')) {
        diagnosticos.push('❌ Usuário não encontrado no Supabase Auth.')
      }
      
      if (errorMsg.includes('smtp') || errorMsg.includes('SMTP')) {
        diagnosticos.push('❌ PROBLEMA DE SMTP: Verifique configuração SMTP no Supabase Dashboard.')
      }
      
      if (errorMsg.includes('template') || errorMsg.includes('Template')) {
        diagnosticos.push('❌ PROBLEMA DE TEMPLATE: Verifique template de email no Supabase Dashboard.')
      }
      
      // Se não encontrou diagnóstico específico, verificar logs do Supabase
      if (diagnosticos.length === 0) {
        diagnosticos.push('❓ Erro desconhecido. Verifique logs do Supabase (Authentication → Logs)')
      }
      
      diagnosticos.push(`📋 Mensagem do erro: ${errorMsg}`)
      diagnosticos.push(`📋 Código do erro: ${(result1.error as any)?.status || 'N/A'}`)
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar email',
        diagnostics: diagnosticos,
        details: {
          message: errorMsg,
          status: (result1.error as any)?.status,
          code: (result1.error as any)?.code
        },
        suggestions: [
          '1. Verifique SMTP configurado no Supabase Dashboard',
          '2. Verifique se Email confirmation está habilitado',
          '3. Verifique template de email configurado',
          '4. Verifique logs do Supabase (Authentication → Logs)',
          '5. Verifique se não está em rate limiting (aguarde alguns minutos)'
        ]
      }, { status: 500 })
    }
    
    logSuccess('✅ Email enviado com sucesso via resend!', 'DIAGNOSTIC')
    
    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso!',
      note: 'Verifique sua caixa de entrada e spam.'
    }, { status: 200 })
    
  } catch (error: any) {
    logError(`❌ Erro inesperado no diagnóstico: ${error.message}`, 'DIAGNOSTIC', {
      stack: error.stack
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Erro inesperado',
        details: 'Verifique os logs do servidor'
      },
      { status: 500 }
    )
  }
}
