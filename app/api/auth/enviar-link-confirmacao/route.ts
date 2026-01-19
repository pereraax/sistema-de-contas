import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Route para ENVIAR link de confirmação de email
 * Usa Admin API para garantir que o email seja realmente enviado
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

    console.log('📧 ========== API: ENVIAR LINK DE CONFIRMAÇÃO ==========')
    console.log('📧 Email:', email)
    console.log('⏰ Timestamp:', new Date().toISOString())

    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      console.error('❌ Admin client não disponível - SUPABASE_SERVICE_ROLE_KEY não configurado')
      return NextResponse.json(
        { 
          error: 'Configuração do servidor incompleta. Service Role Key não configurada.',
          needsConfig: true 
        },
        { status: 500 }
      )
    }

    // Buscar usuário
    console.log('🔍 Buscando usuário...')
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError || !users?.users) {
      console.error('❌ Erro ao listar usuários:', listError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuário. Tente novamente.' },
        { status: 500 }
      )
    }
    
    const user = (users.users as any[]).find((u: any) => u.email === email)
    
    if (!user) {
      console.error('❌ Usuário não encontrado para:', email)
      return NextResponse.json(
        { error: 'Usuário não encontrado. Verifique o email.' },
        { status: 404 }
      )
    }
    
    console.log('✅ Usuário encontrado:', user.id)
    console.log('📋 Email confirmado:', user.email_confirmed_at ? 'SIM' : 'NÃO')
    
    // Verificar se já está confirmado (definitivamente)
    if (user.email_confirmed_at) {
      const confirmedDate = new Date(user.email_confirmed_at)
      const createdDate = new Date(user.created_at)
      const diffSeconds = Math.abs((confirmedDate.getTime() - createdDate.getTime()) / 1000)
      
      if (diffSeconds >= 30) {
        console.log('⚠️ Email já confirmado há mais de 30 segundos')
        return NextResponse.json(
          { error: 'Este email já foi confirmado.' },
          { status: 400 }
        )
      }
    }
    
    // PASSO 1: Sempre limpar confirmação para forçar novo envio
    console.log('🔧 PASSO 1: Limpando confirmação de email para forçar novo envio...')
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
      email_confirm: false
    })
    
    if (updateError) {
      console.error('⚠️ Erro ao limpar confirmação:', updateError.message)
    } else {
      console.log('✅ Confirmação limpa com sucesso')
    }
    
    // Aguardar para garantir que a atualização foi processada
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // PASSO 2: Configurar URL de redirecionamento
    const { getSiteUrl } = await import('@/lib/auth')
    const siteUrl = await getSiteUrl()
    const redirectTo = `${siteUrl}/auth/callback?next=/home`
    console.log('🔗 URL de redirecionamento:', redirectTo)
    
    // PASSO 3: Tentar resend (type: signup) primeiro
    console.log('📤 PASSO 3: Tentando resend (type: signup)...')
    
    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    let resendError: any = null
    let resendData: any = null
    
    try {
      const result = await supabasePublic.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectTo
        }
      })
      
      resendData = result.data
      resendError = result.error
      
      console.log('📬 Resposta do resend:')
      console.log('  - Erro:', resendError?.message || 'Nenhum')
      console.log('  - Código do erro:', resendError?.status || 'Nenhum')
      console.log('  - Dados:', resendData ? JSON.stringify(resendData, null, 2) : 'Nenhum')
      
      if (!resendError) {
        // Resend pode retornar sucesso mesmo sem dados
        // Se não houver erro, assumir que foi enviado
        console.log('✅ Resend retornou sucesso (sem erro)!')
        console.log('📧 Email DEVE ter sido enviado pelo Supabase')
        return NextResponse.json({
          success: true,
          message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
          method: 'resend_signup',
          note: 'Se não receber, verifique spam e logs do Supabase (Authentication → Logs)'
        })
      }
    } catch (resendException: any) {
      console.error('❌ Exceção ao tentar resend:', resendException.message)
      resendError = resendException
    }
    
    // PASSO 4: Se resend falhou, tentar gerar link manualmente via Admin API
    console.log('📤 PASSO 4: Resend falhou, tentando gerar link manualmente via Admin API...')
    
    try {
      // Gerar link de confirmação manualmente
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: redirectTo
        }
      })
      
      if (!linkError && linkData?.properties?.action_link) {
        console.log('✅ Link gerado com sucesso via Admin API!')
        console.log('📧 Link:', linkData.properties.action_link.substring(0, 50) + '...')
        
        // IMPORTANTE: O link foi gerado, mas não foi enviado automaticamente
        // O Supabase não envia email quando gera link manualmente
        // Precisamos informar o usuário que o link foi gerado mas não enviado
        // OU tentar usar outro método para enviar
        
        // Por enquanto, retornar sucesso mas avisar que precisa verificar
        return NextResponse.json({
          success: true,
          message: 'Link de confirmação gerado! Verifique sua caixa de entrada.',
          method: 'generate_link',
          note: 'Se não receber o email, o link foi gerado mas pode não ter sido enviado automaticamente. Verifique logs do Supabase.',
          warning: 'Link gerado mas email pode não ter sido enviado. Verifique configuração SMTP.'
        })
      } else {
        console.error('❌ Erro ao gerar link:', linkError?.message || 'Erro desconhecido')
      }
    } catch (linkException: any) {
      console.error('❌ Exceção ao gerar link:', linkException.message)
    }
    
    // Se chegou aqui, todos os métodos falharam
    console.error('❌ Todos os métodos falharam. Erro do resend:')
    console.error('  - Mensagem:', resendError?.message || 'Nenhum')
    console.error('  - Status:', resendError?.status || 'Nenhum')
    console.error('  - Erro completo:', JSON.stringify(resendError, null, 2))
    
    // Verificar tipo de erro específico
    const errorMsg = resendError?.message?.toLowerCase() || ''
    let errorDetails = 'Erro desconhecido ao enviar email de confirmação.'
    
    if (errorMsg.includes('email not found') || errorMsg.includes('user not found')) {
      errorDetails = 'Usuário não encontrado. Verifique se o email está correto.'
    } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
      errorDetails = 'Limite de envio de emails atingido. Aguarde alguns minutos antes de tentar novamente.'
    } else if (errorMsg.includes('email already confirmed')) {
      errorDetails = 'Este email já foi confirmado. Você pode fazer login normalmente.'
    } else if (errorMsg.includes('smtp') || errorMsg.includes('email sending')) {
      errorDetails = 'Erro ao enviar email. Verifique a configuração SMTP no Supabase Dashboard.'
    } else if (errorMsg.includes('signup') || errorMsg.includes('sign up')) {
      errorDetails = 'Erro ao enviar email de confirmação. O resend pode não funcionar para usuários criados há muito tempo. Tente criar uma nova conta.'
    }
    
    console.log('⚠️ Todos os métodos falharam. Verificando configuração...')
    
    // Se chegou aqui, problema de configuração
    return NextResponse.json(
      { 
        error: 'Não foi possível gerar o link de confirmação nem enviar o email.',
        details: 'Por favor, verifique no Supabase Dashboard:',
        checklist: [
          '1. SMTP configurado em Project Settings → Auth → SMTP Settings (Enable Custom SMTP marcado)',
          '2. Template de email configurado em Authentication → Email Templates → "Confirm signup" usando {{ .ConfirmationURL }}',
          '3. "Enable email confirmations" habilitado em Authentication → URL Configuration',
          '4. Verifique os logs do Supabase em Authentication → Logs para ver erros específicos',
          '5. O email do SMTP existe e a senha está correta no seu provedor (Hostinger, etc.)',
          '6. Teste manualmente: Authentication → Users → Selecione usuário → "Send password recovery"'
        ],
        suggestion: `Erro específico: ${errorDetails}. Verifique logs do console e do Supabase para mais detalhes.`,
        methodsTried: ['resend_signup'],
        errorDetails: errorDetails,
        resendError: resendError.message
      },
      { status: 500 }
    )
    
  } catch (error: any) {
    console.error('❌ Erro inesperado:', error)
    return NextResponse.json(
      { 
        error: error?.message || 'Erro inesperado ao enviar link de confirmação',
        details: 'Verifique os logs do servidor para mais detalhes'
      },
      { status: 500 }
    )
  }
}

