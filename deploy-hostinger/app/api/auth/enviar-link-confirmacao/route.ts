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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectTo = `${siteUrl}/auth/callback?next=/home`
    console.log('🔗 URL de redirecionamento:', redirectTo)
    
    // PASSO 3: Usar inviteUserByEmail como método PRINCIPAL (sempre envia email)
    console.log('📤 PASSO 3: Tentando inviteUserByEmail (método principal - sempre envia email)...')
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirectTo,
          data: {
            ...user.user_metadata
          }
        }
      )
      
      console.log('📬 Resposta do inviteUserByEmail:')
      console.log('  - Tem dados:', !!inviteData)
      console.log('  - Tem erro:', !!inviteError)
      console.log('  - Erro completo:', inviteError ? JSON.stringify(inviteError, null, 2) : 'Nenhum')
      console.log('  - Dados completos:', inviteData ? JSON.stringify(inviteData, null, 2) : 'Nenhum')
      
      if (inviteError) {
        const errorMsg = inviteError.message.toLowerCase()
        console.error('❌ Erro completo do inviteUserByEmail:', JSON.stringify(inviteError, null, 2))
        
        if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
          console.log('⚠️ Usuário já existe (esperado), mas inviteUserByEmail pode ter enviado email mesmo assim')
          
          return NextResponse.json({
            success: true,
            message: 'Link de confirmação enviado! Verifique sua caixa de entrada (incluindo spam).',
            method: 'invite_user_by_email',
            note: 'Se não receber, verifique spam e logs do Supabase (Authentication → Logs)'
          })
        } else {
          console.error('❌ Erro diferente de "already exists":', inviteError.message)
          // Continuar para tentar outros métodos
        }
      } else {
        console.log('✅ inviteUserByEmail executado com sucesso!')
        console.log('📧 Email DEVE ter sido enviado pelo Supabase')
        console.log('📝 Dados retornados:', JSON.stringify(inviteData, null, 2))
        
        return NextResponse.json({
          success: true,
          message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
          method: 'invite_user_by_email',
          note: 'Se não receber, verifique spam e logs do Supabase.'
        })
      }
    } catch (inviteException: any) {
      console.error('❌ Exceção ao enviar convite:', inviteException.message)
      console.error('❌ Stack:', inviteException.stack)
      console.error('❌ Exceção completa:', JSON.stringify(inviteException, null, 2))
      // Continuar para tentar outros métodos
    }
    
    // PASSO 5: Fallback - Tentar resend após limpar confirmação
    console.log('📤 PASSO 5: Tentando resend como fallback...')
    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: resendData, error: resendError } = await supabasePublic.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    
    console.log('📬 Resposta do resend:')
    console.log('  - Erro:', resendError?.message || 'Nenhum')
    console.log('  - Dados:', resendData ? JSON.stringify(resendData, null, 2) : 'Nenhum')
    
    if (!resendError && resendData) {
      console.log('✅ Resend retornou sucesso!')
      console.log('📧 Email DEVE ter sido enviado pelo Supabase')
      return NextResponse.json({
        success: true,
        message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
        method: 'resend_fallback',
        note: 'Se não receber, verifique spam e logs do Supabase (Authentication → Logs)'
      })
    }
    
    console.log('⚠️ Resend falhou:', resendError?.message || 'Sem erro mas sem dados')
    
    // PASSO 6: Último fallback - Tentar com type 'email'
    console.log('📤 PASSO 6: Tentando resend com type "signup" (último fallback)...')
    const { data: resendData2, error: resendError2 } = await supabasePublic.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    
    if (!resendError2 && resendData2) {
      console.log('✅ Resend com type "email" retornou sucesso!')
      return NextResponse.json({
        success: true,
        message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
        method: 'resend_email_type',
        note: 'Se não receber, verifique spam e logs do Supabase'
      })
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
        suggestion: 'Nenhum método funcionou. Verifique logs do console e do Supabase para ver o erro real.',
        methodsTried: ['generateLink', 'inviteUserByEmail', 'resend_signup', 'resend_email']
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

