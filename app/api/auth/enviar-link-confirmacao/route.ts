import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { logInfo, logError, logSuccess } from '@/lib/server-logs'

/**
 * API ROUTE - REENVIAR LINK DE CONFIRMAÇÃO
 * Tenta SMTP próprio PRIMEIRO (Admin API + envio), depois resend do Supabase
 */
export async function POST(request: NextRequest) {
  try {
    logInfo('📧 ========== REENVIAR LINK ==========', 'EMAIL_CONFIRMATION')
    console.error('📧 ========== REENVIAR LINK ==========')
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    logInfo(`📧 Email: ${email}`, 'EMAIL_CONFIRMATION')
    console.error(`📧 Email: ${email}`)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logError('❌ Variáveis Supabase não configuradas', 'EMAIL_CONFIRMATION')
      return NextResponse.json({ 
        error: 'Configuração incompleta.',
        detail: 'NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY ausentes.'
      }, { status: 500 })
    }

    const redirectTo = 'https://plenipay.com/auth/callback?next=/home'
    
    // Verificar Admin Client
    let supabaseAdmin: any = null
    try {
      supabaseAdmin = createAdminClient()
      console.error(`📧 Admin disponível: ${!!supabaseAdmin}`)
      if (!supabaseAdmin) {
        console.error('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurado ou inválido')
      }
    } catch (adminErr: any) {
      console.error('❌ Erro ao criar Admin client:', adminErr.message)
      supabaseAdmin = null
    }
    
    // Verificar SMTP
    let isSmtpConfigured = false
    let sendMail: any = null
    try {
      const mailer = await import('@/lib/mailer')
      isSmtpConfigured = mailer.isSmtpConfigured()
      sendMail = mailer.sendMail
      console.error(`📧 SMTP configurado: ${isSmtpConfigured}`)
      if (!isSmtpConfigured) {
        console.error('⚠️ Variáveis SMTP_* não configuradas ou inválidas')
        console.error('   Verifique: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD')
      }
    } catch (mailerErr: any) {
      console.error('❌ Erro ao importar mailer:', mailerErr.message)
      isSmtpConfigured = false
    }

    // TENTATIVA 1: SMTP próprio (Admin API + envio)
    if (isSmtpConfigured && supabaseAdmin && sendMail) {
      logInfo('📤 Tentativa 1: Admin API + SMTP próprio...', 'EMAIL_CONFIRMATION')
      console.error('📤 Tentativa 1: Admin API + SMTP próprio...')
      
      try {
        // Verificar se usuário existe primeiro para usar o tipo correto
        let linkType: 'signup' | 'recovery' | 'magiclink' = 'signup'
        try {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = usersData?.users?.find((u: any) => u.email === email)
          if (existingUser) {
            // Usuário existe - usar magiclink para confirmação de email
            linkType = 'magiclink'
            console.error(`✅ Usuário encontrado (${existingUser.id}) - usando type: ${linkType}`)
          } else {
            console.error(`ℹ️ Usuário não encontrado - usando type: ${linkType}`)
          }
        } catch (listErr: any) {
          console.error(`⚠️ Erro ao verificar usuário, usando type: ${linkType}`, listErr.message)
        }
        
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: linkType,
          email,
          options: { redirectTo }
        } as any)
        
        if (linkError || !linkData?.properties?.action_link) {
          throw new Error(linkError?.message || 'Link não gerado')
        }
        
        let linkGerado = linkData.properties.action_link
        console.error(`🔍 Link gerado pelo Supabase: ${linkGerado.substring(0, 200)}...`)
        
        // SEMPRE converter link do Supabase para link direto do plenipay.com
        // O Supabase gera: https://xxx.supabase.co/auth/v1/verify?token=...&redirect_to=...
        // Precisamos: https://plenipay.com/auth/callback?token_hash=...&type=...&next=...
        
        const isLinkSupabase = linkGerado.includes('supabase.co/auth/v1/verify')
        const precisaCorrigir = linkGerado.includes('0.0.0.0') || 
                                linkGerado.includes(':10000') || 
                                linkGerado.includes('localhost') ||
                                isLinkSupabase ||
                                !linkGerado.includes('plenipay.com/auth/callback')
        
        if (precisaCorrigir) {
          console.error('⚠️ Link precisa ser corrigido, extraindo parâmetros...')
          
          let tokenHash: string | null = null
          let linkType = 'signup'
          let nextPath = '/home'
          
          // Se é link do Supabase (/auth/v1/verify), extrair token e redirect_to
          if (isLinkSupabase) {
            console.error('🔍 Detectado link do Supabase - extraindo token e redirect_to...')
            
            // Extrair token da query string
            const tokenMatch = linkGerado.match(/[?&]token=([^&#]+)/i)
            if (tokenMatch) {
              tokenHash = decodeURIComponent(tokenMatch[1])
              console.error('✅ Token extraído do link do Supabase')
            }
            
            // Extrair redirect_to (pode estar URL encoded)
            const redirectToMatch = linkGerado.match(/[?&]redirect_to=([^&#]+)/i)
            if (redirectToMatch) {
              const redirectToDecoded = decodeURIComponent(redirectToMatch[1])
              console.error(`🔍 redirect_to decodificado: ${redirectToDecoded.substring(0, 100)}...`)
              
              // Extrair type e next do redirect_to
              const redirectUrl = new URL(redirectToDecoded)
              linkType = redirectUrl.searchParams.get('type') || 'signup'
              nextPath = redirectUrl.searchParams.get('next') || '/home'
              console.error(`✅ Type: ${linkType}, Next: ${nextPath}`)
            }
            
            // Extrair type do link original também (pode estar na query)
            const typeMatch = linkGerado.match(/[?&]type=([^&#]+)/i)
            if (typeMatch) {
              linkType = decodeURIComponent(typeMatch[1])
            }
          } else {
            // Link não é do Supabase - tentar extrair token_hash ou access_token
            const tokenHashMatch = linkGerado.match(/[?&#]token_hash=([^&#]+)/i)
            if (tokenHashMatch) {
              tokenHash = decodeURIComponent(tokenHashMatch[1])
              console.error('✅ Token_hash extraído da query string')
            }
            
            // Tentar extrair access_token do hash (#access_token=...)
            if (!tokenHash) {
              const accessTokenMatch = linkGerado.match(/#access_token=([^&#]+)/i)
              if (accessTokenMatch) {
                tokenHash = decodeURIComponent(accessTokenMatch[1])
                console.error('✅ Access_token extraído do hash')
              }
            }
            
            // Extrair type e next
            const typeMatch = linkGerado.match(/[?&#]type=([^&#]+)/i)
            const nextMatch = linkGerado.match(/[?&#]next=([^&#]+)/i)
            linkType = typeMatch ? decodeURIComponent(typeMatch[1]) : 'signup'
            nextPath = nextMatch ? decodeURIComponent(nextMatch[1]) : '/home'
          }
          
          if (tokenHash) {
            // Construir URL correta com plenipay.com usando token_hash
            linkGerado = `https://plenipay.com/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(linkType)}&next=${encodeURIComponent(nextPath)}`
            console.error(`✅ Link corrigido: ${linkGerado.substring(0, 150)}...`)
          } else {
            console.error('❌ Não foi possível extrair token - usando redirectTo como fallback')
            linkGerado = redirectTo
          }
        }
        
        // Garantir que o link sempre use plenipay.com/auth/callback (verificação final)
        if (!linkGerado.includes('plenipay.com/auth/callback')) {
          console.error('❌ Link ainda não contém plenipay.com/auth/callback - forçando...')
          linkGerado = redirectTo
          console.error(`✅ Link forçado para redirectTo: ${linkGerado}`)
        }
        
        console.error(`✅ Link final que será enviado: ${linkGerado.substring(0, 150)}...`)
        
        console.error('📄 Lendo template HTML...')
        const { readFileSync } = await import('fs')
        const { join } = await import('path')
        const templatePath = join(process.cwd(), 'TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html')
        console.error(`📄 Template path: ${templatePath}`)
        
        let templateHtml: string
        try {
          templateHtml = readFileSync(templatePath, 'utf-8')
          console.error('✅ Template lido com sucesso')
        } catch (fileErr: any) {
          console.error(`❌ Erro ao ler template: ${fileErr.message}`)
          throw new Error(`Template não encontrado: ${templatePath}`)
        }
        
        templateHtml = templateHtml.replace(/\{\{ \.ConfirmationURL \}\}/g, linkGerado)
        console.error('✅ Template processado, link inserido')
        console.error(`🔍 Link que será inserido no email: ${linkGerado.substring(0, 200)}...`)
        
        // IMPORTANTE: Verificar se o link está correto antes de enviar
        if (linkGerado.includes('0.0.0.0') || linkGerado.includes(':10000') || !linkGerado.includes('plenipay.com')) {
          console.error('❌ [CRÍTICO] Link ainda contém URL errada após correção!')
          console.error(`❌ Link: ${linkGerado}`)
          throw new Error('Link gerado contém URL inválida. Não é possível enviar email.')
        }
        
        console.error('📤 Chamando sendMail...')
        try {
          await sendMail({
            to: email,
            subject: 'Confirme seu Cadastro - PLENIPAY',
            html: templateHtml
          })
          
          logSuccess('✅ Email enviado via SMTP próprio', 'EMAIL_CONFIRMATION')
          console.error('✅ Email enviado via SMTP próprio')
          return NextResponse.json({
            success: true,
            message: 'Link enviado! Verifique sua caixa de entrada.',
            method: 'smtp_proprio'
          }, { status: 200 })
        } catch (sendMailError: any) {
          // Se sendMail falhar, relançar o erro para ser capturado pelo catch externo
          console.error('❌ Erro ao chamar sendMail:', sendMailError.message)
          console.error('❌ Código:', sendMailError.code)
          throw sendMailError
        }
        
      } catch (e: any) {
        const msg = e?.message || String(e)
        const code = e?.code
        logError(`❌ SMTP próprio falhou: ${msg}`, 'EMAIL_CONFIRMATION')
        console.error(`❌ SMTP próprio falhou: ${msg}`)
        console.error(`❌ Código: ${code || 'N/A'}`)
        if (e?.stack) console.error(`❌ Stack: ${e.stack.substring(0, 300)}`)
        if (e?.originalError) {
          console.error(`❌ Erro original: ${e.originalError.message}`)
          console.error(`❌ Código original: ${e.originalError.code || 'N/A'}`)
        }
        // Segue para tentativa 2 (resend)
      }
    } else {
      console.error('⚠️ Pulando SMTP próprio porque:')
      if (!supabaseAdmin) {
        console.error('   ❌ Admin client não disponível (SUPABASE_SERVICE_ROLE_KEY?)')
      }
      if (!isSmtpConfigured) {
        console.error('   ❌ SMTP não configurado (SMTP_* no .env.local?)')
      }
      if (!sendMail) {
        console.error('   ❌ sendMail não disponível (erro ao importar?)')
      }
    }

    // TENTATIVA 2: Resend do Supabase
    logInfo('📤 Tentativa 2: Resend do Supabase...', 'EMAIL_CONFIRMATION')
    console.error('📤 Tentativa 2: Resend do Supabase...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo }
    })
    
    if (!error) {
      logSuccess('✅ Email enviado via resend', 'EMAIL_CONFIRMATION')
      console.error('✅ Email enviado via resend')
      return NextResponse.json({
        success: true,
        message: 'Link enviado! Verifique sua caixa de entrada.'
      }, { status: 200 })
    }
    
    logError(`❌ Resend falhou: ${error.message}`, 'EMAIL_CONFIRMATION')
    console.error(`❌ Resend falhou: ${error.message}`)
    
    if (error.message.toLowerCase().includes('rate limit')) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
    }
    
    return NextResponse.json({
      error: `Erro ao enviar email: ${error.message}`,
      detail: !supabaseAdmin
        ? 'Configure SUPABASE_SERVICE_ROLE_KEY no .env.local para usar SMTP próprio.'
        : !isSmtpConfigured
          ? 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD no .env.local.'
          : 'Supabase e SMTP próprio falharam. Verifique terminal para detalhes.'
    }, { status: 500 })
    
  } catch (error: any) {
    const msg = error?.message || 'Erro desconhecido'
    const code = error?.code
    logError(`❌ Erro inesperado: ${msg}`, 'EMAIL_CONFIRMATION')
    console.error('❌ ========== ERRO INESPERADO ==========')
    console.error('❌ Mensagem:', msg)
    console.error('❌ Código:', code || 'N/A')
    console.error('❌ Tipo:', typeof error)
    if (error?.stack) {
      console.error('❌ Stack:', error.stack.substring(0, 500))
    }
    if (error?.originalError) {
      console.error('❌ Erro original:', error.originalError.message)
      console.error('❌ Código original:', error.originalError.code || 'N/A')
    }
    return NextResponse.json({
      error: `Erro ao enviar email: ${msg}`,
      detail: code ? `Código: ${code}. Verifique terminal para mais detalhes.` : 'Verifique terminal para mais detalhes.'
    }, { status: 500 })
  }
}
