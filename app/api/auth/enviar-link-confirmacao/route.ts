import { NextRequest, NextResponse } from 'next/server'

/**
 * Reenvia o link de confirmação de email para um endereço informado.
 *
 * Usado pelo `ModalConfirmarEmail` no cliente:
 *   POST /api/auth/enviar-link-confirmacao  { email }
 *
 * Implementação:
 * 1. Tenta `supabase.auth.resend` primeiro (método padrão)
 * 2. Se falhar (rate limit, usuário já existe, etc), usa Admin API `generateLink` + SMTP próprio
 * 3. Garante que sempre tenta enviar, mesmo se resend falhar
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório.' },
        { status: 400 }
      )
    }

    console.log('📧 [Reenvio] Iniciando reenvio de link para:', email)

    // Link de confirmação sempre com domínio oficial (plenipay.com)
    const { getSiteUrlForEmailRedirect } = await import('@/lib/auth')
    const siteUrl = await getSiteUrlForEmailRedirect()
    const redirectTo = `${siteUrl}/auth/callback?next=/home`

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // MÉTODO 1: Tentar resend padrão do Supabase (opcional, para logs)
    console.log('📤 [Reenvio] Tentando resend padrão...')
    const { data: resendData, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    // IMPORTANTE: Mesmo se resend retornar sucesso, vamos SEMPRE usar Admin API + SMTP próprio
    // porque o resend pode retornar sucesso mas não enviar realmente (rate limits, SMTP do Supabase, etc)
    // O SMTP próprio é mais confiável e garantimos que o email será enviado
    if (!resendError && resendData) {
      console.log('✅ [Reenvio] Resend padrão retornou sucesso, mas vamos garantir via Admin API + SMTP próprio...')
    } else {
      console.log('⚠️ [Reenvio] Resend retornou erro:', resendError?.message)
    }

    // MÉTODO 2: SEMPRE usar Admin API + SMTP próprio para garantir envio
    console.log('📧 [Reenvio] Gerando link via Admin API e enviando via SMTP próprio (garantia)...')

    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabaseAdmin = createAdminClient()

    if (!supabaseAdmin) {
      console.error('❌ [Reenvio] Admin client não disponível')
      return NextResponse.json(
        {
          error: resendError?.message || 'Erro ao reenviar link de confirmação.',
          detail: 'Admin client não disponível. Verifique SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      )
    }

    // Verificar se usuário existe e status de confirmação
    let linkType: 'signup' | 'magiclink' = 'signup'
    let userExists = false
    
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = usersData?.users?.find((u: any) => u.email === email)
      
      if (existingUser) {
        userExists = true
        // Se usuário já existe, usar magiclink (mais confiável para reenvio)
        linkType = 'magiclink'
        console.log(`✅ [Reenvio] Usuário encontrado (${existingUser.id}) - usando type: ${linkType}`)
        console.log(`📋 [Reenvio] Email confirmado: ${existingUser.email_confirmed_at ? 'SIM' : 'NÃO'}`)
      } else {
        console.log('ℹ️ [Reenvio] Usuário não encontrado - usando type: signup')
      }
    } catch (listErr: any) {
      console.warn(`⚠️ [Reenvio] Erro ao verificar usuário: ${listErr.message}`)
    }

    // Gerar link via Admin API
    console.log(`🔗 [Reenvio] Gerando link com type: ${linkType}...`)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: linkType,
      email: email,
      options: { redirectTo: redirectTo }
    } as any)

    if (linkError || !linkData?.properties?.action_link) {
      console.error('❌ [Reenvio] Erro ao gerar link:', linkError?.message)
      return NextResponse.json(
        {
          error: linkError?.message || resendError?.message || 'Erro ao gerar link de confirmação.',
          detail: 'Não foi possível gerar o link. Verifique se o usuário existe e se o SMTP está configurado.',
        },
        { status: 500 }
      )
    }

    let linkGerado = linkData.properties.action_link
    console.log(`✅ [Reenvio] Link gerado: ${linkGerado.substring(0, 150)}...`)

    // Converter link do Supabase para formato correto (se necessário)
    // O Supabase pode gerar: https://xxx.supabase.co/auth/v1/verify?token=...&redirect_to=...
    // Precisamos garantir que use plenipay.com/auth/callback
    const isLinkSupabase = linkGerado.includes('supabase.co/auth/v1/verify')
    
    if (isLinkSupabase) {
      console.log('🔧 [Reenvio] Link do Supabase detectado - extraindo parâmetros...')
      
      // Extrair code ou token
      const codeMatch = linkGerado.match(/[?&]code=([^&#]+)/i)
      const tokenMatch = linkGerado.match(/[?&]token=([^&#]+)/i)
      
      if (codeMatch) {
        // Se tem code, construir URL correta com code
        linkGerado = `${siteUrl}/auth/callback?code=${encodeURIComponent(codeMatch[1])}&next=/home`
        console.log('✅ [Reenvio] Link convertido para formato code')
      } else if (tokenMatch) {
        // Se tem token, converter para token_hash
        linkGerado = `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(tokenMatch[1])}&type=${linkType}&next=/home`
        console.log('✅ [Reenvio] Link convertido para formato token_hash')
      }
    }

    // Tentar enviar via SMTP próprio (se configurado)
    const { isSmtpConfigured, sendMail } = await import('@/lib/mailer')
    
    if (isSmtpConfigured()) {
      try {
        console.log('📤 [Reenvio] Enviando via SMTP próprio...')
        
        const { readFileSync } = await import('fs')
        const { join } = await import('path')
        
        const templatePath = join(process.cwd(), 'TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html')
        let templateHtml = readFileSync(templatePath, 'utf-8')
        templateHtml = templateHtml.replace(/\{\{ \.ConfirmationURL \}\}/g, linkGerado)
        
        await sendMail({
          to: email,
          subject: 'Confirme seu Cadastro - PLENIPAY',
          html: templateHtml
        })
        
        console.log('✅ [Reenvio] Email enviado via SMTP próprio!')
        return NextResponse.json({
          success: true,
          linkGenerated: true,
          message: 'Link de confirmação reenviado. Verifique sua caixa de entrada (e spam).',
          method: 'admin_api_smtp'
        })
      } catch (smtpError: any) {
        const code = (smtpError as any).code || smtpError.code
        const msg = smtpError.message || ''
        console.error('❌ [Reenvio] Erro ao enviar via SMTP próprio:', msg)
        console.error('❌ [Reenvio] Código:', code)
        // Mensagem amigável conforme o tipo de erro
        let userMessage = 'Erro ao enviar email. Verifique a configuração SMTP no .env.local (host, porta, usuário e senha).'
        if (code === 'EAUTH' || msg.includes('Invalid login') || msg.includes('authentication failed') || msg.includes('535')) {
          userMessage = 'Erro de autenticação SMTP. No painel da Hostinger, confira o usuário (email completo) e a senha do email. Se usar 2FA, crie uma "Senha de app" para SMTP.'
        } else if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || msg.includes('timeout')) {
          userMessage = 'Erro de conexão com o servidor SMTP. Verifique host (smtp.hostinger.com), porta (587) e se o firewall permite saída.'
        }
        return NextResponse.json({
          success: false,
          linkGenerated: true,
          link: linkGerado,
          message: userMessage,
          error: userMessage,
          method: 'admin_api_only',
          smtpErrorCode: code
        })
      }
    } else {
      console.warn('⚠️ [Reenvio] SMTP próprio não configurado - retornando link gerado')
      // Se SMTP não está configurado, retornar sucesso mas avisar que precisa enviar manualmente
      return NextResponse.json({
        success: true,
        linkGenerated: true,
        link: linkGerado, // Retornar link para debug/teste manual
        message: 'Link gerado, mas SMTP não configurado. Configure SMTP_* no .env.local para envio automático.',
        method: 'admin_api_only'
      })
    }
  } catch (err: any) {
    console.error('❌ [Reenvio] Erro inesperado:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro inesperado ao reenviar link de confirmação.' },
      { status: 500 }
    )
  }
}

