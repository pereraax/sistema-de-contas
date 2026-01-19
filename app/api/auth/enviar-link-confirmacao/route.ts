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
    console.log('📋 Data de confirmação:', user.email_confirmed_at || 'NÃO CONFIRMADO')
    
    // IMPORTANTE: Sempre permitir reenvio, mesmo se já confirmado
    // Motivo: O link anterior pode ter sido gerado com URL errada (0.0.0.0:10000)
    // e o usuário precisa receber um novo link com a URL correta
    console.log('⚠️ IMPORTANTE: Permitindo reenvio mesmo se já confirmado')
    console.log('⚠️ Motivo: Link anterior pode ter sido gerado com URL errada (0.0.0.0:10000)')
    
    // PASSO 1: Sempre limpar confirmação para forçar novo envio
    // Isso permite que o usuário receba um novo link mesmo se o anterior foi "confirmado"
    console.log('🔧 PASSO 1: Limpando confirmação de email para forçar novo envio...')
    console.log('🔧 Isso permite reenvio mesmo se link anterior foi gerado com URL errada')
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
      email_confirm: false
    })
    
    if (updateError) {
      console.error('⚠️ Erro ao limpar confirmação:', updateError.message)
      console.warn('⚠️ Continuando mesmo com erro - tentando reenviar de qualquer forma')
    } else {
      console.log('✅ Confirmação limpa com sucesso')
    }
    
    // Aguardar para garantir que a atualização foi processada
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // PASSO 2: Configurar URL de redirecionamento
    // IMPORTANTE: SEMPRE usar https://plenipay.com explicitamente
    // Não confiar em getSiteUrl() que pode retornar URL errada
    const siteUrl = 'https://plenipay.com' // FORÇAR URL de produção sempre
    const redirectTo = `${siteUrl}/auth/callback?next=/home`
    console.log('🔗 URL de redirecionamento (FORÇADA):', redirectTo)
    console.log('⚠️ IMPORTANTE: URL forçada para produção (https://plenipay.com)')
    
    // PASSO 3: Tentar resend com múltiplos tipos
    console.log('📤 PASSO 3: Tentando resend com múltiplos tipos...')
    
    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Tentar múltiplos tipos: 'signup' primeiro, depois 'email'
    const tiposParaTentar = ['signup', 'email'] as const
    let resendError: any = null
    let resendData: any = null
    let tipoUsado: string | null = null
    
    for (const tipo of tiposParaTentar) {
      try {
        console.log(`📤 [RESEND] Tentando com type: ${tipo}...`)
        console.log('  - email:', email)
        console.log('  - emailRedirectTo:', redirectTo)
        console.log('  - ⚠️ IMPORTANTE: Verifique se o Supabase está usando este emailRedirectTo')
        
        const result = await supabasePublic.auth.resend({
          type: tipo as any,
          email: email,
          options: {
            emailRedirectTo: redirectTo
          }
        })
        
        resendData = result.data
        resendError = result.error
        
        console.log(`📬 [RESEND] Resposta do resend (type: ${tipo}):`)
        console.log('  - Erro:', resendError?.message || 'Nenhum')
        console.log('  - Código do erro:', resendError?.status || 'Nenhum')
        console.log('  - Dados:', resendData ? JSON.stringify(resendData, null, 2) : 'Nenhum')
        
        if (!resendError) {
          // Resend retornou sucesso
          console.log(`✅ Resend retornou sucesso com type: ${tipo}!`)
          console.log('📧 Email DEVE ter sido enviado pelo Supabase')
          tipoUsado = tipo
          break // Sucesso, não precisa tentar outros tipos
        } else {
          console.warn(`⚠️ Resend falhou com type: ${tipo}, erro: ${resendError.message}`)
          // Continuar para tentar próximo tipo
        }
      } catch (resendException: any) {
        console.error(`❌ Exceção ao tentar resend (type: ${tipo}):`, resendException.message)
        resendError = resendException
        // Continuar para tentar próximo tipo
      }
    }
    
    // Se algum tipo funcionou, retornar sucesso
    if (!resendError && tipoUsado) {
      return NextResponse.json({
        success: true,
        message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
        method: `resend_${tipoUsado}`,
        note: 'Se não receber, verifique spam e logs do Supabase (Authentication → Logs)'
      })
    }
    
    // PASSO 4: Se resend falhou, tentar gerar link manualmente via Admin API
    // IMPORTANTE: generateLink NÃO envia email, apenas gera o link
    // Mas podemos verificar se o link gerado tem a URL correta
    console.log('📤 PASSO 4: Resend falhou, tentando gerar link manualmente via Admin API...')
    console.log('⚠️ IMPORTANTE: generateLink NÃO envia email, apenas gera o link para diagnóstico')
    
    try {
      // Gerar link de confirmação manualmente para verificar se a URL está correta
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: redirectTo
        }
      })
      
      if (!linkError && linkData?.properties?.action_link) {
        const generatedLink = linkData.properties.action_link
        console.log('✅ Link gerado com sucesso via Admin API!')
        console.log('📧 Link completo:', generatedLink)
        console.log('🔍 Verificando URL no link gerado...')
        
        // Verificar se o link contém a URL correta
        if (generatedLink.includes('plenipay.com')) {
          console.log('✅ Link gerado contém URL correta (plenipay.com)')
          
          // IMPORTANTE: generateLink NÃO envia email automaticamente
          // Mas podemos usar o link gerado para criar um email manualmente
          // Por enquanto, retornar erro informando que resend falhou
          console.error('❌ generateLink não envia email automaticamente')
          console.error('❌ Resend falhou, então não foi possível enviar o email')
          console.error('⚠️ O link foi gerado corretamente, mas precisa ser enviado manualmente')
        } else if (generatedLink.includes('0.0.0.0') || generatedLink.includes('10000')) {
          console.error('❌ PROBLEMA CRÍTICO: Link gerado contém 0.0.0.0:10000!')
          console.error('❌ Isso significa que o Supabase está usando Site URL do dashboard em vez do redirectTo')
          console.error('❌ Link gerado:', generatedLink)
          console.error('❌ redirectTo passado:', redirectTo)
          console.error('❌ ⚠️ SOLUÇÃO OBRIGATÓRIA: Verifique Site URL no Supabase Dashboard')
          console.error('❌ ⚠️ Authentication → URL Configuration → Site URL deve ser https://plenipay.com')
          console.error('❌ ⚠️ NÃO pode ser 0.0.0.0:10000 ou vazio')
          
          // Retornar erro específico sobre Site URL
          return NextResponse.json(
            {
              error: 'Link gerado está usando URL incorreta (0.0.0.0:10000).',
              details: 'O Supabase está usando a Site URL do dashboard em vez do emailRedirectTo.',
              solution: 'Corrija a Site URL no Supabase Dashboard:',
              steps: [
                '1. Acesse: Authentication → URL Configuration',
                '2. Verifique "Site URL" - deve ser https://plenipay.com',
                '3. Se estiver como 0.0.0.0:10000 ou vazio, MUDE PARA https://plenipay.com',
                '4. SALVE as alterações',
                '5. Tente novamente'
              ],
              redirectToPassed: redirectTo,
              generatedLink: generatedLink.substring(0, 200) + '...'
            },
            { status: 500 }
          )
        } else {
          console.warn('⚠️ Link gerado não contém plenipay.com nem 0.0.0.0:10000')
          console.warn('⚠️ Link:', generatedLink.substring(0, 100) + '...')
        }
        
        // IMPORTANTE: generateLink NÃO envia email automaticamente
        // Retornar erro informando que resend falhou
        console.error('❌ generateLink não envia email automaticamente')
        console.error('❌ Resend falhou, então não foi possível enviar o email')
      } else {
        console.error('❌ Erro ao gerar link:', linkError?.message || 'Erro desconhecido')
        console.error('❌ Erro completo:', JSON.stringify(linkError, null, 2))
      }
    } catch (linkException: any) {
      console.error('❌ Exceção ao gerar link:', linkException.message)
      console.error('❌ Stack:', linkException.stack)
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

