'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logInfo, logError, logSuccess, logWarn } from '@/lib/server-logs'

export interface UserProfile {
  id: string
  email: string
  nome: string
  telefone?: string
  whatsapp?: string
  plano?: 'teste' | 'basico' | 'premium'
  created_at: string
}

// Função helper para obter a URL correta do site (usada em links de confirmação de email)
// Em desenvolvimento: usa localhost se configurado. Em produção: nunca localhost.
export async function getSiteUrl(): Promise<string> {
  const isDev = process.env.NODE_ENV === 'development'
  console.log('🔍 [getSiteUrl] NODE_ENV:', process.env.NODE_ENV)

  // 1. Em desenvolvimento: usar localhost se configurado (para testar o link no próprio ambiente)
  if (isDev && process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim()
    if (url && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      console.log('✅ [getSiteUrl] Desenvolvimento: usando', url)
      return url.replace(/\/$/, '') // sem barra no final
    }
  }

  // 2. Produção ou NEXT_PUBLIC_SITE_URL sem localhost: usar variável se for URL de produção
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim()
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      console.log('✅ [getSiteUrl] Usando NEXT_PUBLIC_SITE_URL:', url)
      return url.replace(/\/$/, '')
    }
  }

  // 3. URLs de ambiente (Railway, Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL.trim()
    if (url && !url.includes('localhost')) {
      console.log('✅ [getSiteUrl] Usando RENDER_EXTERNAL_URL:', url)
      return url.replace(/\/$/, '')
    }
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    console.log('✅ [getSiteUrl] Usando RAILWAY_PUBLIC_DOMAIN:', url)
    return url
  }

  // 4. Fallback: produção
  const productionUrl = 'https://plenipay.com'
  console.log('✅ [getSiteUrl] Usando URL padrão:', productionUrl)
  return productionUrl
}

/** URL para links de confirmação de email. Use EMAIL_REDIRECT_BASE_URL no servidor para forçar (ex.: https://plenipay.com). */
export async function getSiteUrlForEmailRedirect(): Promise<string> {
  // Forçar base do link do email (Railway/Vercel: defina EMAIL_REDIRECT_BASE_URL=https://plenipay.com para nunca sair localhost)
  const forced = process.env.EMAIL_REDIRECT_BASE_URL?.trim()
  if (forced && forced.startsWith('http') && !forced.includes('localhost') && !forced.includes('127.0.0.1')) {
    return forced.replace(/\/$/, '')
  }
  if (process.env.NODE_ENV === 'development') {
    const env = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (env && (env.includes('localhost') || env.includes('127.0.0.1'))) {
      return env.replace(/\/$/, '')
    }
  }
  return 'https://plenipay.com'
}

export async function signUp(
  email: string,
  password: string,
  nome: string,
  telefone: string,
  whatsapp: string,
  plano: 'teste' | 'basico' | 'premium',
  referredByCode?: string | null
) {
  try {
    logInfo('📝 ========== CRIAR CONTA ==========', 'SIGNUP')
    logInfo(`📧 Email: ${email}`, 'SIGNUP')
    
    const supabase = await createClient()
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()
    
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    logInfo(`🔍 Verificando variáveis de ambiente...`, 'SIGNUP')
    logInfo(`  - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurado' : '❌ FALTANDO'}`, 'SIGNUP')
    logInfo(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurado' : '❌ FALTANDO'}`, 'SIGNUP')
    logInfo(`  - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurado' : '❌ FALTANDO'}`, 'SIGNUP')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logError('❌ Variáveis de ambiente do Supabase não configuradas!', 'SIGNUP')
      return { error: 'Erro de configuração do servidor. Entre em contato com o suporte.' }
    }
    
    if (!supabaseAdmin) {
      logWarn('⚠️ Admin client não disponível (SUPABASE_SERVICE_ROLE_KEY ausente no .env.local). Se aparecer "Erro ao criar usuário", adicione a chave para o fallback funcionar.', 'SIGNUP')
      // Continuar mesmo sem admin client - podemos tentar criar usuário normalmente
    }

    // URL base para links de confirmação: sempre domínio oficial (plenipay.com)
    const siteUrlForEmail = await getSiteUrlForEmailRedirect()
    const redirectTo = `${siteUrlForEmail}/auth/callback?next=/login`
    logInfo('🔄 Criando conta via signUp...', 'SIGNUP')
    logInfo(`🔗 redirectTo (link do email): ${redirectTo}`, 'SIGNUP')
    logInfo(`📧 Email: ${email}`, 'SIGNUP')
    
    let authData: any = null
    let authError: any = null
    
    try {
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { nome, telefone, whatsapp, plano, email },
        }
      })
      
      authData = signUpResult.data
      authError = signUpResult.error
      
      logInfo(`📊 Resultado signUp:`, 'SIGNUP')
      logInfo(`  - Usuário criado: ${authData?.user ? 'SIM' : 'NÃO'}`, 'SIGNUP')
      logInfo(`  - Session criada: ${authData?.session ? 'SIM' : 'NÃO'}`, 'SIGNUP')
      logInfo(`  - Erro: ${authError?.message || 'Nenhum'}`, 'SIGNUP')
      logInfo(`  - Status: ${authError?.status || 'N/A'}`, 'SIGNUP')
      
      if (authData?.user) {
        logSuccess(`✅ Usuário criado: ${authData.user.id}`, 'SIGNUP')
        logInfo(`  - Email confirmado: ${authData.user.email_confirmed_at ? 'SIM' : 'NÃO'}`, 'SIGNUP')
      }
      
      if (authError) {
        logError(`❌ Erro do signUp: ${authError.message}`, 'SIGNUP')
        logError(`❌ Código: ${authError.status || 'N/A'}`, 'SIGNUP')
        logError(`❌ Erro completo: ${JSON.stringify(authError, null, 2)}`, 'SIGNUP')
      }
    } catch (signUpErr: any) {
      logError(`❌ Exceção no signUp: ${signUpErr.message}`, 'SIGNUP')
      authError = signUpErr
    }

    // Tratar erros do Supabase
    let userToUse = authData?.user
    
    if (authError) {
      const errorMsg = authError.message.toLowerCase()
      const isAlreadyExists = errorMsg.includes('already exists') ||
        errorMsg.includes('already registered') ||
        errorMsg.includes('email already registered') ||
        errorMsg.includes('user already registered') ||
        errorMsg.includes('already been registered') ||
        errorMsg.includes('duplicate') ||
        errorMsg.includes('email already in use') ||
        errorMsg.includes('já está cadastrado') ||
        errorMsg.includes('já existe')
      const isEmailSendingError = errorMsg.includes('error sending confirmation email') || 
                                  errorMsg.includes('error sending email') ||
                                  errorMsg.includes('sending confirmation email') ||
                                  errorMsg.includes('failed to send email')
      
      logInfo(`⚠️ Erro do Supabase: ${authError.message}`, 'SIGNUP')
      
      // Se é erro de "already exists", verificar se usuário existe
      if (isAlreadyExists && !authData?.user && supabaseAdmin) {
        logInfo('⚠️ Usuário já existe - verificando...', 'SIGNUP')
        
        try {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
          const existingUser = usersData?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email)
          
          if (existingUser?.email_confirmed_at) {
            logError('❌ Email já confirmado', 'SIGNUP')
            return { error: 'Este email já está cadastrado e confirmado. Faça login.' }
          }
          
          if (existingUser) {
            logInfo('📧 Usuário não confirmado - usando existente e enviando novo link', 'SIGNUP')
            userToUse = existingUser
            // Marcar que precisa enviar email (usuário existe mas não confirmado)
            // O código abaixo vai gerar e enviar o link
          } else {
            return { error: 'Erro ao verificar conta existente.' }
          }
        } catch (adminErr: any) {
          logError(`❌ Erro ao verificar: ${adminErr.message}`, 'SIGNUP')
          return { error: 'Erro ao verificar conta existente.' }
        }
      } 
      // Se é erro de envio de email - verificar se usuário foi criado mesmo assim
      else if (isEmailSendingError) {
        logWarn('⚠️ Erro ao enviar email de confirmação - verificando se usuário foi criado...', 'SIGNUP')
        
        // Se usuário foi criado, usar ele
        if (authData?.user) {
          logSuccess('✅ Usuário foi criado apesar do erro de envio de email', 'SIGNUP')
          userToUse = authData.user
        } 
        // Se não tem usuário, verificar via Admin API
        else if (supabaseAdmin) {
          logInfo('🔍 Verificando se usuário foi criado via Admin API...', 'SIGNUP')
          try {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
            const existingUser = usersData?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email)
            
            if (existingUser) {
              logSuccess('✅ Usuário encontrado via Admin API - usando ele', 'SIGNUP')
              userToUse = existingUser
            } else {
              logError('❌ Usuário não foi criado', 'SIGNUP')
              return { 
                error: 'Erro ao criar usuário. Tente novamente.',
                details: authError.message
              }
            }
          } catch (adminErr: any) {
            logError(`❌ Erro ao verificar: ${adminErr.message}`, 'SIGNUP')
            return { 
              error: 'Erro ao verificar criação do usuário. Tente novamente.',
              details: authError.message
            }
          }
        } else {
          logError('❌ Admin client não disponível - não é possível verificar', 'SIGNUP')
          return { 
            error: 'Erro ao criar usuário. Verifique as configurações.',
            details: authError.message
          }
        }
      }
      // Se é erro mas usuário foi criado, continuar
      else if (authData?.user) {
        logWarn('⚠️ Erro ocorreu, mas usuário foi criado - continuando...', 'SIGNUP')
        userToUse = authData.user
      }
      // Outros erros
      else {
        logError(`❌ Erro ao criar usuário: ${authError.message}`, 'SIGNUP')
        
        if (authError.status === 429) {
          return { 
            error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
          }
        }
        
        return { 
          error: authError.message || 'Erro ao criar conta'
        }
      }
    }

    // Última tentativa: Supabase pode ter criado o usuário mas a resposta não trouxe (ex.: erro só no envio do email, timeout)
    if (!userToUse && supabaseAdmin) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = usersData?.users?.find((u: any) => (u.email ?? '').toLowerCase() === email.toLowerCase())
        if (found) {
          logInfo('✅ Usuário encontrado via listUsers (fallback)', 'SIGNUP')
          userToUse = found
        }
      } catch (e) {
        logWarn(`⚠️ Fallback listUsers falhou: ${(e as Error)?.message}`, 'SIGNUP')
      }
    }

    // Verificar se temos usuário
    if (!userToUse) {
      logError(`❌ Usuário não foi criado. ${authError?.message || ''}`, 'SIGNUP')
      const msg = (authError?.message || '').toLowerCase()
      if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')) {
        return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
      }
      if (msg.includes('invalid') && msg.includes('email')) {
        return { error: 'E-mail inválido. Verifique e tente outro.' }
      }
      return { 
        error: 'Erro ao criar usuário. Tente novamente.',
        details: authError?.message
      }
    }

    logSuccess('✅ Usuário disponível', 'SIGNUP')
    
    // Criar perfil
    logInfo('📋 Criando perfil...', 'SIGNUP')
    await supabase.from('profiles').upsert({
      id: userToUse.id,
      email,
      nome,
      telefone,
      whatsapp,
      plano,
    }, { onConflict: 'id' })

    logSuccess('✅ Perfil criado', 'SIGNUP')

    // Registrar indicação de afiliado se veio por link (ref=)
    if (referredByCode && referredByCode.trim() && supabaseAdmin) {
      try {
        const { getReferrerIdByCode, registerReferral } = await import('@/lib/affiliates')
        const referrerId = await getReferrerIdByCode(referredByCode.trim())
        if (referrerId && referrerId !== userToUse.id) {
          const refResult = await registerReferral(referrerId, userToUse.id)
          if (refResult.success) logInfo('✅ Indicação de afiliado registrada', 'SIGNUP')
          else logWarn(`⚠️ Indicação não registrada: ${refResult.error}`, 'SIGNUP')
        }
      } catch (refErr: any) {
        logWarn(`⚠️ Erro ao registrar indicação: ${refErr?.message}`, 'SIGNUP')
      }
    }
    
    // Verificar status do email
    const emailConfirmado = !!userToUse.email_confirmed_at || !!authData?.session
    // Se houve erro de envio de email, marcar como não enviado para permitir reenvio
    const teveErroEnvioEmail = authError && (
      authError.message.toLowerCase().includes('error sending confirmation email') ||
      authError.message.toLowerCase().includes('error sending email') ||
      authError.message.toLowerCase().includes('sending confirmation email') ||
      authError.message.toLowerCase().includes('failed to send email')
    )
    
    // IMPORTANTE: emailEnviado começa como false
    // Será true APENAS se:
    // 1. Email já está confirmado (não precisa enviar)
    // 2. OU SMTP próprio enviou com sucesso (sempre tentamos enviar quando não confirmado)
    let emailEnviado = false
    
    // Verificar se usuário já existia antes de tentar criar (para logs)
    const authMsg = (authError?.message || '').toLowerCase()
    const usuarioJaExistia = !!authError && (
      authMsg.includes('already exists') ||
      authMsg.includes('already registered') ||
      authMsg.includes('email already registered') ||
      authMsg.includes('user already registered') ||
      authMsg.includes('already been registered') ||
      authMsg.includes('duplicate') ||
      authMsg.includes('email already in use') ||
      authMsg.includes('já está cadastrado') ||
      authMsg.includes('já existe')
    )
    
    // Se email já está confirmado, não precisa enviar
    if (emailConfirmado) {
      emailEnviado = true
      logInfo('✅ Email já confirmado - não precisa enviar', 'SIGNUP')
    }
    
    // Sempre que o usuário não está confirmado: enviar link por nosso SMTP/Resend (cadastro novo ou reenvio).
    // O Supabase pode não enviar o email (SMTP do projeto não configurado, limites, etc.), então enviamos nós mesmos.
    const deveTentarSmtpProprio = userToUse && !emailConfirmado && supabaseAdmin
    
    if (deveTentarSmtpProprio) {
      const { isSmtpConfigured, isResendConfigured, sendMail } = await import('./mailer')
      const emailEnvioConfigurado = isSmtpConfigured() || isResendConfigured()
      
      if (emailEnvioConfigurado) {
        logInfo('📧 Gerando e enviando link de confirmação por email (SMTP/Resend)...', 'SIGNUP')
        try {
          // Link do email sempre com domínio oficial (getSiteUrlForEmailRedirect = plenipay.com)
          const redirectToEmail = redirectTo
          logInfo(`🔗 URL do link no email: ${redirectToEmail}`, 'SIGNUP')

          // Para confirmação de email (novo ou existente não confirmado), usar sempre type 'signup'
          const linkType: 'signup' | 'recovery' | 'magiclink' = 'signup'
          logInfo(`📧 Gerando link de confirmação (type: ${linkType})...`, 'SIGNUP')
          
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: linkType,
            email: email,
            options: { redirectTo: redirectToEmail }
          } as any)
          
          if (!linkError && linkData?.properties?.action_link) {
            let linkGerado = linkData.properties.action_link
            logInfo(`🔍 Link gerado pelo Supabase: ${linkGerado.substring(0, 200)}...`, 'SIGNUP')
            
            const isLinkSupabase = linkGerado.includes('supabase.co/auth/v1/verify')
            const emailBaseUrl = await getSiteUrlForEmailRedirect()
            const callbackPath = `${emailBaseUrl}/auth/callback`
            const precisaCorrigir = linkGerado.includes('0.0.0.0') || 
                                    linkGerado.includes(':10000') || 
                                    isLinkSupabase ||
                                    !linkGerado.includes('/auth/callback')
            
            if (precisaCorrigir) {
              logWarn(`⚠️ Link precisa ser corrigido, extraindo parâmetros...`, 'SIGNUP')
              
              let tokenHash: string | null = null
              let linkType = 'signup'
              let nextPath = '/login'
              
              // Se é link do Supabase (/auth/v1/verify), extrair token e redirect_to
              if (isLinkSupabase) {
                logInfo('🔍 Detectado link do Supabase - extraindo token e redirect_to...', 'SIGNUP')
                
                // Extrair token da query string
                const tokenMatch = linkGerado.match(/[?&]token=([^&#]+)/i)
                if (tokenMatch) {
                  tokenHash = decodeURIComponent(tokenMatch[1])
                  logInfo('✅ Token extraído do link do Supabase', 'SIGNUP')
                }
                
                // Extrair redirect_to (pode estar URL encoded)
                const redirectToMatch = linkGerado.match(/[?&]redirect_to=([^&#]+)/i)
                if (redirectToMatch) {
                  const redirectToDecoded = decodeURIComponent(redirectToMatch[1])
                  logInfo(`🔍 redirect_to decodificado: ${redirectToDecoded.substring(0, 100)}...`, 'SIGNUP')
                  
                  // Extrair type e next do redirect_to
                  try {
                    const redirectUrl = new URL(redirectToDecoded)
                    linkType = redirectUrl.searchParams.get('type') || 'signup'
                    nextPath = redirectUrl.searchParams.get('next') || '/login'
                    logInfo(`✅ Type: ${linkType}, Next: ${nextPath}`, 'SIGNUP')
                  } catch (urlErr: any) {
                    logWarn(`⚠️ Erro ao parsear redirect_to: ${urlErr.message}`, 'SIGNUP')
                  }
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
                  logInfo('✅ Token_hash extraído da query string', 'SIGNUP')
                }
                
                // Tentar extrair access_token do hash (#access_token=...)
                if (!tokenHash) {
                  const accessTokenMatch = linkGerado.match(/#access_token=([^&#]+)/i)
                  if (accessTokenMatch) {
                    tokenHash = decodeURIComponent(accessTokenMatch[1])
                    logInfo('✅ Access_token extraído do hash', 'SIGNUP')
                  }
                }
                
                // Extrair type e next
                const typeMatch = linkGerado.match(/[?&#]type=([^&#]+)/i)
                const nextMatch = linkGerado.match(/[?&#]next=([^&#]+)/i)
                linkType = typeMatch ? decodeURIComponent(typeMatch[1]) : 'signup'
                nextPath = nextMatch ? decodeURIComponent(nextMatch[1]) : '/login'
              }
              
              if (tokenHash) {
                // Construir URL correta com siteUrl (localhost em dev, plenipay.com em prod)
                linkGerado = `${callbackPath}?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(linkType)}&next=${encodeURIComponent(nextPath)}`
                logSuccess(`✅ Link corrigido: ${linkGerado.substring(0, 150)}...`, 'SIGNUP')
              } else {
                logError('❌ Não foi possível extrair token - usando redirectTo como fallback', 'SIGNUP')
                linkGerado = redirectTo
              }
            }
            
            if (!linkGerado.includes('/auth/callback')) {
              logError('❌ Link ainda não contém /auth/callback - forçando...', 'SIGNUP')
              linkGerado = redirectTo
              logWarn(`✅ Link forçado para redirectTo: ${linkGerado}`, 'SIGNUP')
            }
            
            // Template de email: arquivo no projeto ou fallback embutido (para produção onde o arquivo pode não existir)
            const { readFileSync, existsSync } = await import('fs')
            const { join } = await import('path')
            const templatePath = join(process.cwd(), 'TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html')
            const fallbackTemplate = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirme seu Cadastro</title></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#1B263B,#0D1B2A);padding:30px;text-align:center;"><h1 style="margin:0;color:#E6E6E6;font-size:24px;">Confirme seu Cadastro</h1></td></tr><tr><td style="padding:40px;"><p style="margin:0 0 20px;color:#333;">Olá! 👋</p><p style="margin:0 0 24px;color:#333;">Bem-vindo(a)! Para ativar sua conta, clique no botão abaixo:</p><p style="text-align:center;margin:0 0 24px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00C2FF,#0099CC);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;">Confirmar Email</a></p><p style="margin:0;color:#666;font-size:14px;">Ou copie e cole no navegador:<br><a href="{{ .ConfirmationURL }}" style="color:#00C2FF;word-break:break-all;">{{ .ConfirmationURL }}</a></p><p style="margin:24px 0 0;color:#666;font-size:13px;">Este link é válido por 24 horas.</p></td></tr><tr><td style="padding:20px;background:#f8f9fa;text-align:center;color:#999;font-size:12px;">PleniPay</td></tr></table></body></html>`
            let templateHtml: string
            if (existsSync(templatePath)) {
              templateHtml = readFileSync(templatePath, 'utf-8')
            } else {
              logWarn(`⚠️ Template não encontrado em ${templatePath} - usando template embutido`, 'SIGNUP')
              templateHtml = fallbackTemplate
            }
            templateHtml = templateHtml.replace(/\{\{ \.ConfirmationURL \}\}/g, linkGerado)
            
            await sendMail({
              to: email,
              subject: 'Confirme seu Cadastro - PLENIPAY',
              html: templateHtml
            })
            
            logSuccess('✅ Email enviado (Resend ou SMTP)!', 'SIGNUP')
            emailEnviado = true
          } else {
            logError(`❌ Erro ao gerar link: ${linkError?.message || 'Link não gerado'}`, 'SIGNUP')
          }
        } catch (smtpError: any) {
          logError(`❌ Erro ao enviar email (Resend/SMTP): ${smtpError.message}`, 'SIGNUP')
          // Só marcar como enviado se Supabase enviou (usuário criado agora, sem erro de envio)
          // Se usuário já existia ou teve erro de envio, email não foi enviado
          if (!usuarioJaExistia && !teveErroEnvioEmail && authData?.user) {
            logInfo('✅ Supabase provavelmente enviou (envio próprio falhou)', 'SIGNUP')
            emailEnviado = true
          } else {
            emailEnviado = false
          }
        }
      } else {
        if (usuarioJaExistia) {
          logWarn('⚠️ Envio de email não configurado - configure RESEND_API_KEY ou SMTP_* para reenviar link a quem já tem conta', 'SIGNUP')
        }
        if (!usuarioJaExistia && !teveErroEnvioEmail && authData?.user) {
          emailEnviado = true
          logInfo('✅ Supabase enviou o email oficial de confirmação', 'SIGNUP')
        }
      }
    }
    
    logInfo(`📊 Status final:`, 'SIGNUP')
    logInfo(`  - Email confirmado: ${emailConfirmado}`, 'SIGNUP')
    logInfo(`  - Email enviado: ${emailEnviado}`, 'SIGNUP')
    logInfo(`  - Teve erro de envio: ${teveErroEnvioEmail}`, 'SIGNUP')
    
    return { 
      data: { user: userToUse, session: authData?.session || null }, 
      userCreated: true,
      emailEnviado, // true se enviou via fallback, false se não conseguiu
      emailConfirmado
    }
    
  } catch (error: any) {
    logError(`❌ Erro: ${error.message}`, 'SIGNUP')
    return { error: error.message || 'Erro inesperado' }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Erro ao fazer login:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      
      // Mensagens de erro mais amigáveis
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email ou senha incorretos' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.' }
      }
      
      return { error: error.message }
    }

    if (!data.user) {
      console.error('Usuário não retornado após login')
      return { error: 'Erro ao fazer login. Tente novamente.' }
    }

    // Verificar se email está confirmado (deve estar, pois login foi bloqueado se não estiver)
    if (!data.user.email_confirmed_at) {
      console.warn('⚠️ Email não confirmado - isso não deveria acontecer se confirmação estiver habilitada no Supabase')
    } else {
      console.log('✅ Email confirmado - login permitido')
    }

    console.log('Login bem-sucedido para usuário:', data.user.id)
    console.log('Email confirmado:', !!data.user.email_confirmed_at)
    console.log('Session:', data.session ? 'existe' : 'não existe')

    // Verificar se o perfil existe (opcional, mas útil para debug)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.warn('Perfil não encontrado, mas login foi bem-sucedido:', profileError)
    } else if (profile) {
      console.log('Perfil encontrado:', profile.email)
    } else {
      console.warn('⚠️ Perfil não encontrado para o usuário:', data.user.id)
    }

    // IMPORTANTE: Não aguardar aqui, pois pode causar problemas
    // Os cookies são salvos automaticamente pelo Supabase SSR

    // Revalidar caminhos importantes ANTES de retornar
    revalidatePath('/', 'layout')
    revalidatePath('/home', 'layout')
    revalidatePath('/registros', 'layout')
    revalidatePath('/dividas', 'layout')
    revalidatePath('/calendario', 'layout')
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/configuracoes', 'layout')

    return { data, session: data.session, user: data.user }
  } catch (error: any) {
    console.error('Erro inesperado no signIn:', error)
    return { error: error.message || 'Erro inesperado ao fazer login' }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/login')
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return null
    }
    
    return user
  } catch (error: any) {
    return null
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  return profile as UserProfile
}

export async function verificarCodigoEmail(codigo: string, email: string) {
  try {
    // IMPORTANTE: Criar um novo cliente Supabase para cada verificação
    // Isso garante que não há estado compartilhado que possa invalidar o código
    const supabase = await createClient()

    console.log('🔐 ========== VERIFICANDO CÓDIGO OTP ==========')
    console.log('📧 Email:', email)
    console.log('🔢 Código recebido:', codigo, `(${codigo.length} dígitos)`)
    console.log('🔢 Código (string):', JSON.stringify(codigo))
    console.log('🔢 Código (tipo):', typeof codigo)
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('⚠️ IMPORTANTE: Verificando código diretamente, sem operações intermediárias')
    
    // IMPORTANTE: Limpar espaços e caracteres não numéricos do código
    // O código pode vir com espaços ou outros caracteres do input
    const codigoLimpo = codigo.replace(/\s+/g, '').trim()
    console.log('🔢 Código limpo:', codigoLimpo, `(${codigoLimpo.length} dígitos)`)
    
    if (codigoLimpo.length !== 6) {
      console.error('❌ Código não tem 6 dígitos!')
      return { error: 'Código deve ter exatamente 6 dígitos.' }
    }
    
    if (!/^\d{6}$/.test(codigoLimpo)) {
      console.error('❌ Código contém caracteres não numéricos!')
      return { error: 'Código deve conter apenas números.' }
    }
    
    // IMPORTANTE: NÃO fazer nenhuma operação antes de verificar o código
    // Qualquer chamada ao Supabase (getUser, resend, etc.) pode invalidar o código OTP
    // Vamos verificar o código diretamente, sem verificar o estado do usuário primeiro

    // IMPORTANTE: signUp envia OTP com type 'signup', então tentar primeiro com 'signup'
    // Mas também tentar com 'email' caso o resend tenha usado tipo diferente
    // IMPORTANTE: Tentar também sem especificar o tipo (deixar Supabase decidir)
    let data: any = null
    let error: any = null

    // IMPORTANTE: O Supabase pode invalidar códigos OTP quando um novo é solicitado
    // Por isso, tentar verificar o código o mais rápido possível, SEM fazer outras operações
    // Tentativa 1: Código completo com type 'signup' (tipo usado no signUp)
    // O signUp do Supabase envia OTP com type 'signup' por padrão
    console.log(`🔄 Tentativa 1: Verificando com código completo (${codigo}) e type 'signup'`)
    console.log(`⚠️ IMPORTANTE: Se este código foi enviado pelo signUp, deve usar type 'signup'`)
    console.log(`⚠️ IMPORTANTE: NÃO fazer outras operações antes desta verificação`)
    
    // IMPORTANTE: Verificar o código imediatamente, sem delay
    // IMPORTANTE: Tentar também sem especificar o tipo primeiro (alguns casos o Supabase aceita)
    // Mas vamos começar com 'signup' que é o padrão do signUp
    // IMPORTANTE: Tentar verificar o código usando o Admin API do Supabase
    // Isso pode funcionar mesmo se o código foi invalidado pelo cliente
    let result1: any = null
    try {
      // Primeiro, tentar com o cliente normal
      console.log('📤 [VERIFY] Chamando supabase.auth.verifyOtp com:')
      console.log('   - email:', email)
      console.log('   - token (original):', codigo)
      console.log('   - token (limpo):', codigoLimpo)
      console.log('   - type: signup')
      console.log('   - timestamp:', new Date().toISOString())
      
      result1 = await supabase.auth.verifyOtp({
        email: email,
        token: codigoLimpo, // Usar código limpo
        type: 'signup'
      })
      
      console.log('📥 [VERIFY] Resposta completa do Supabase:')
      console.log('   - Tem erro?', !!result1.error)
      console.log('   - Tem data?', !!result1.data)
      console.log('   - Erro completo:', result1.error ? JSON.stringify(result1.error, null, 2) : 'Nenhum')
      console.log('   - Data completa:', result1.data ? JSON.stringify(result1.data, null, 2) : 'Nenhum')
      
      if (result1.error) {
        console.log('❌ [VERIFY] Erro detalhado:')
        console.log('   - Mensagem:', result1.error.message)
        console.log('   - Status:', result1.error.status)
        console.log('   - Código:', result1.error.code)
        console.log('   - Nome:', result1.error.name)
        console.log('   - Stack:', result1.error.stack)
        console.log('   - Objeto completo:', JSON.stringify(result1.error, Object.getOwnPropertyNames(result1.error), 2))
      }
      
      // IMPORTANTE: Se o código foi rejeitado como "expirado", pode ser um problema de timing
      // O Supabase pode estar invalidando o código muito rapidamente
      // Vamos tentar uma abordagem diferente: verificar se o problema é realmente expiração
      if (result1.error && (result1.error.message?.includes('expired') || result1.error.message?.includes('expir'))) {
        console.log('⚠️ Código rejeitado como expirado - verificando se é realmente expirado ou se é outro problema...')
        console.log('⚠️ Pode ser que o código foi invalidado por alguma operação anterior')
        console.log('⚠️ Tentando verificar novamente com diferentes parâmetros...')
        
        // Tentar verificar novamente, mas desta vez sem especificar o tipo
        // Alguns casos o Supabase aceita sem tipo
        try {
          console.log('🔄 [RETRY] Tentando verificar sem especificar tipo...')
          const resultRetry = await supabase.auth.verifyOtp({
            email: email,
            token: codigoLimpo // Usar código limpo
            // Não especificar type - deixar Supabase decidir
          } as any)
          
          console.log('📥 [RETRY] Resposta do retry:')
          console.log('   - Tem erro?', !!resultRetry.error)
          console.log('   - Tem data?', !!resultRetry.data)
          console.log('   - Erro:', resultRetry.error ? JSON.stringify(resultRetry.error, null, 2) : 'Nenhum')
          
          if (!resultRetry.error && resultRetry.data?.user) {
            console.log('✅ Código verificado com sucesso sem especificar tipo!')
            result1 = resultRetry
          } else {
            console.log('❌ Tentativa sem tipo também falhou:', resultRetry.error?.message)
          }
        } catch (retryError: any) {
          console.error('❌ Erro ao tentar verificar sem tipo:', retryError)
          console.error('❌ Stack:', retryError.stack)
        }
      }
    } catch (verifyError: any) {
      console.error('❌ Erro ao chamar verifyOtp:', verifyError)
      console.error('❌ Stack:', verifyError.stack)
      console.error('❌ Tipo:', typeof verifyError)
      console.error('❌ Objeto completo:', JSON.stringify(verifyError, Object.getOwnPropertyNames(verifyError), 2))
      result1 = { error: verifyError, data: null }
    }
    
    console.log('📋 Resultado tentativa 1:')
    console.log('  - Erro:', result1.error?.message || 'Nenhum')
    console.log('  - Status:', result1.error?.status || 'Nenhum')
    console.log('  - Código do erro:', result1.error?.code || 'Nenhum')
    console.log('  - User:', result1.data?.user ? 'Encontrado' : 'Não encontrado')
    console.log('  - Email confirmado:', result1.data?.user?.email_confirmed_at ? 'SIM' : 'NÃO')
    console.log('  - Erro completo:', result1.error ? JSON.stringify(result1.error, null, 2) : 'Nenhum')
    
    if (!result1.error && result1.data?.user) {
      data = result1.data
      console.log('✅ Sucesso na tentativa 1 (type signup)')
    } else if (result1.error) {
      error = result1.error
      console.log(`❌ Tentativa 1 falhou:`, error?.message)
      console.log(`📋 Detalhes do erro:`, JSON.stringify(error, null, 2))
      
      // Tentativa 2: Código completo com type 'email' (pode ser que resend usou tipo diferente)
      console.log(`🔄 Tentativa 2: Verificando com código completo (${codigo}) e type 'email'`)
        const result2 = await supabase.auth.verifyOtp({
          email: email,
          token: codigoLimpo, // Usar código limpo
          type: 'email'
        })
      
      console.log('📋 Resultado tentativa 2:')
      console.log('  - Erro:', result2.error?.message || 'Nenhum')
      console.log('  - Status:', result2.error?.status || 'Nenhum')
      console.log('  - Código do erro:', result2.error?.code || 'Nenhum')
      console.log('  - User:', result2.data?.user ? 'Encontrado' : 'Não encontrado')
      console.log('  - Erro completo:', result2.error ? JSON.stringify(result2.error, null, 2) : 'Nenhum')
        
        if (!result2.error && result2.data?.user) {
          data = result2.data
          error = null
        console.log('✅ Sucesso na tentativa 2 (type email)')
        } else {
          console.log(`❌ Tentativa 2 falhou:`, result2.error?.message)
          error = result2.error || error
          
        // Tentativa 3: Primeiros 6 dígitos com type 'signup'
        if (codigoLimpo.length >= 6) {
          const codigo6Digitos = codigoLimpo.substring(0, 6)
          console.log(`🔄 Tentativa 3: Verificando com primeiros 6 dígitos (${codigo6Digitos}) e type 'signup'`)
          const result3 = await supabase.auth.verifyOtp({
            email: email,
            token: codigo6Digitos.trim(), // Limpar espaços
            type: 'signup'
          })
          
          console.log('📋 Resultado tentativa 3:')
          console.log('  - Erro:', result3.error?.message || 'Nenhum')
          console.log('  - Status:', result3.error?.status || 'Nenhum')
          console.log('  - Código do erro:', result3.error?.code || 'Nenhum')
          console.log('  - User:', result3.data?.user ? 'Encontrado' : 'Não encontrado')
          console.log('  - Erro completo:', result3.error ? JSON.stringify(result3.error, null, 2) : 'Nenhum')
          
          if (!result3.error && result3.data?.user) {
            data = result3.data
            error = null
            console.log('✅ Sucesso na tentativa 3 (6 dígitos, type signup)')
          } else {
            console.log(`❌ Tentativa 3 falhou:`, result3.error?.message)
            error = result3.error || error
            
            // Tentativa 4: Primeiros 6 dígitos com type 'email' (fallback)
              console.log(`🔄 Tentativa 4: Verificando com primeiros 6 dígitos (${codigo6Digitos}) e type 'email'`)
              const result4 = await supabase.auth.verifyOtp({
                email: email,
                token: codigo6Digitos.trim(), // Limpar espaços
                type: 'email'
              })
            
            console.log('📋 Resultado tentativa 4:')
            console.log('  - Erro:', result4.error?.message || 'Nenhum')
            console.log('  - Status:', result4.error?.status || 'Nenhum')
            console.log('  - Código do erro:', result4.error?.code || 'Nenhum')
            console.log('  - User:', result4.data?.user ? 'Encontrado' : 'Não encontrado')
            console.log('  - Erro completo:', result4.error ? JSON.stringify(result4.error, null, 2) : 'Nenhum')
              
              if (!result4.error && result4.data?.user) {
                data = result4.data
                error = null
                console.log('✅ Sucesso na tentativa 4 (6 dígitos, type email)')
              } else {
                console.log(`❌ Tentativa 4 falhou:`, result4.error?.message)
                error = result4.error || error
              
              // Tentativa 5: Tentar sem especificar o tipo (deixar Supabase decidir)
              console.log(`🔄 Tentativa 5: Verificando sem especificar tipo (deixar Supabase decidir)`)
              try {
                // Tentar verificar sem type - alguns clientes do Supabase permitem isso
                const result5 = await supabase.auth.verifyOtp({
                  email: email,
                  token: codigoLimpo, // Usar código limpo
                  // Não especificar type - deixar Supabase decidir
                } as any)
                
                console.log('📋 Resultado tentativa 5:')
                console.log('  - Erro:', result5.error?.message || 'Nenhum')
                console.log('  - User:', result5.data?.user ? 'Encontrado' : 'Não encontrado')
                
                if (!result5.error && result5.data?.user) {
                  data = result5.data
                  error = null
                  console.log('✅ Sucesso na tentativa 5 (sem tipo especificado)')
                } else {
                  console.log(`❌ Tentativa 5 falhou:`, result5.error?.message)
                }
              } catch (e: any) {
                console.log(`❌ Tentativa 5 gerou exceção:`, e.message)
              }
            }
          }
        }
      }
    }

    if (error) {
      console.error('❌ ========== TODAS AS TENTATIVAS FALHARAM ==========')
      console.error('❌ Erro final:', error)
      console.error('📋 Mensagem do erro:', error.message)
      console.error('📋 Status do erro:', error.status)
      console.error('📋 Código do erro:', error.code)
      console.error('📋 Detalhes completos do erro:', JSON.stringify(error, null, 2))
      console.error('📋 Código tentado:', codigo)
      console.error('📋 Email:', email)
      console.error('📋 Tipos tentados: signup, email, sem tipo')
      console.error('⏰ Timestamp do erro:', new Date().toISOString())
      
      // Verificar se o erro é realmente de expiração ou se é outro problema
      const errorMsg = (error.message || '').toLowerCase()
      const errorCode = (error.code || '').toLowerCase()
      
      console.error('📋 Análise do erro:')
      console.error('  - Contém "expired"?', errorMsg.includes('expired') || errorMsg.includes('expir'))
      console.error('  - Contém "invalid"?', errorMsg.includes('invalid') || errorMsg.includes('incorrect'))
      console.error('  - Contém "not found"?', errorMsg.includes('not found') || errorMsg.includes('does not exist'))
      console.error('  - Código do erro:', errorCode)
      
      // Mensagens de erro mais amigáveis
      if (errorMsg.includes('expired') || errorMsg.includes('expir') || errorCode.includes('expired')) {
        console.error('⚠️ Código expirado - pode ter sido invalidado por reenvio ou limpeza de confirmação')
        console.error('⚠️ SOLUÇÃO: Verifique se o modal não está tentando reenviar automaticamente')
        console.error('⚠️ SOLUÇÃO: Verifique se a API não está limpando confirmação quando usarOTP=true')
        
        // IMPORTANTE: Não usar solução alternativa - precisamos descobrir a causa raiz
        // O código deve funcionar corretamente, não devemos fazer workarounds
        console.error('⚠️ CAUSA RAIZ DO PROBLEMA:')
        console.error('  1. Verifique se o template de email está configurado corretamente no Supabase')
        console.error('  2. Verifique se o tipo de confirmação está como "OTP" no Supabase')
        console.error('  3. Verifique se não há operações que invalidam o código antes da verificação')
        console.error('  4. Verifique se o código está sendo verificado com o tipo correto (signup)')
        console.error('  5. Verifique se não há chamadas de resend() que invalidam o código original')
        
        return { error: 'Código expirado. Solicite um novo código.' }
      }
      if (errorMsg.includes('invalid') || errorMsg.includes('incorrect') || errorCode.includes('invalid')) {
        console.error('⚠️ Código inválido - verifique se digitou corretamente')
        return { error: 'Código inválido. Verifique e tente novamente.' }
      }
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorCode.includes('not_found')) {
        console.error('⚠️ Código não encontrado - pode ter sido invalidado')
        console.error('⚠️ SOLUÇÃO: O código pode ter sido invalidado quando um novo foi solicitado')
        return { error: 'Código não encontrado. Solicite um novo código.' }
      }
      
      console.error('⚠️ Erro desconhecido - retornando mensagem genérica')
      return { error: error.message || 'Erro ao verificar código. Tente solicitar um novo código.' }
    }

    if (!data?.user) {
      console.error('❌ Nenhum usuário retornado após verificação')
      return { error: 'Erro ao verificar código. Tente novamente.' }
    }

    // IMPORTANTE: Após verifyOtp bem-sucedido, o email já está confirmado
    // O verifyOtp do Supabase já confirma o email automaticamente
    // Não precisamos verificar email_confirmed_at - o verifyOtp já faz isso
    console.log('✅ verifyOtp bem-sucedido - email já está confirmado internamente')
    console.log('✅ Email confirmado com sucesso!')
    console.log('👤 User ID:', data.user.id)
    console.log('📧 Email confirmado em:', data.user.email_confirmed_at || 'Agora')
    console.log('🔐 Fazendo login automático após confirmação...')
    
    // IMPORTANTE: Após confirmar o código, verificar usuário (getUser valida no servidor Auth)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('✅ Sessão criada automaticamente após verificação OTP')
    } else {
      console.warn('⚠️ Sessão não foi criada automaticamente - pode precisar fazer login manual')
    }
    
    revalidatePath('/')
    return { data, success: true, session: undefined }
  } catch (error: any) {
    console.error('❌ Erro inesperado ao verificar código:', error)
    return { error: error.message || 'Erro inesperado ao verificar código' }
  }
}

export async function reenviarCodigoEmail(email: string) {
  // Verificação de email temporariamente desabilitada
  // Será reimplementada do zero
  return {
    error: 'Verificação de email está temporariamente desabilitada. Será reimplementada em breve.'
  }
}

export async function atualizarSenha(senhaAtual: string, novaSenha: string) {
  try {
    const supabase = await createClient()
    
    // Primeiro, verificar a senha atual fazendo login
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) {
      return { error: 'Usuário não encontrado' }
    }

    // Verificar senha atual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senhaAtual,
    })

    if (signInError) {
      return { error: 'Senha atual incorreta' }
    }

    // Atualizar para nova senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro inesperado ao atualizar senha:', error)
    return { error: error.message || 'Erro inesperado ao atualizar senha' }
  }
}

export async function reenviarEmailConfirmacao() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) {
      return { error: 'Usuário não encontrado' }
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    })

    if (error) {
      console.error('Erro ao reenviar email de confirmação:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro inesperado ao reenviar email:', error)
    return { error: error.message || 'Erro inesperado ao reenviar email' }
  }
}

export async function enviarLinkRedefinicaoSenha(email: string) {
  try {
    if (!email?.trim() || !email.includes('@')) {
      return { error: 'Informe um email válido' }
    }

    // Links em emails devem SEMPRE usar domínio público (plenipay.com)
    let siteUrl = await getSiteUrl()
    if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
      siteUrl = 'https://plenipay.com'
    }
    const redirectTo = `${siteUrl}/auth/redefinir-senha`
    const emailTrim = email.trim()

    // Usar resetPasswordForEmail do Supabase - o email é enviado pelos SERVIDORES do Supabase,
    // que conectam ao SMTP configurado no painel. Assim comercial@plenipay.com funciona em produção.
    // Configure SMTP em: Supabase Dashboard → Project Settings → Auth → SMTP (Hostinger)
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, { redirectTo })

    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many requests')) {
        return { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' }
      }
      if ((msg.includes('user') && msg.includes('not found')) || msg.includes('email not found')) {
        return { error: 'Nenhuma conta encontrada com este email. Verifique ou crie uma conta.' }
      }
      return { error: error.message }
    }

    logSuccess(`Link de redefinição solicitado para ${emailTrim}`, 'AUTH')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao enviar link de redefinição:', error)
    return { error: error.message || 'Erro ao enviar link. Tente novamente.' }
  }
}

export async function limparBypassEmailConfirmacao() {
  'use server'
  
  console.log('🚀 [LIMPAR-BYPASS] ========== INÍCIO ==========')
  
  try {
    const supabase = await createClient()
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      console.error('❌ [LIMPAR-BYPASS] Admin client não disponível')
      return { error: 'Configuração do servidor incompleta.' }
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) {
      console.error('❌ [LIMPAR-BYPASS] Usuário não encontrado')
      return { error: 'Usuário não encontrado' }
    }
    
    console.log('📋 [LIMPAR-BYPASS] Usuário encontrado:', user.email)
    console.log('📋 [LIMPAR-BYPASS] email_confirmed_at:', user.email_confirmed_at)
    console.log('📋 [LIMPAR-BYPASS] created_at:', user.created_at)
    
    // SEMPRE limpar email_confirmed_at se existir (não precisa verificar bypass aqui)
    // A verificação de bypass já foi feita no componente cliente
    if (user.email_confirmed_at) {
      console.log('🔧 [LIMPAR-BYPASS] Limpando email_confirmed_at...')
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: false }
      )
      
      if (updateError) {
        console.error('❌ [LIMPAR-BYPASS] Erro ao limpar:', updateError.message)
        return { error: `Erro ao limpar confirmação: ${updateError.message}` }
      }
      
      console.log('✅ [LIMPAR-BYPASS] email_confirmed_at limpo com sucesso!')
      console.log('🚀 [LIMPAR-BYPASS] ========== FIM ==========')
      return { success: true }
    }
    
    console.log('ℹ️ [LIMPAR-BYPASS] email_confirmed_at já estava null')
    console.log('🚀 [LIMPAR-BYPASS] ========== FIM ==========')
    return { success: true, message: 'Já estava limpo.' }
  } catch (error: any) {
    console.error('❌ [LIMPAR-BYPASS] Erro inesperado:', error)
    console.error('❌ [LIMPAR-BYPASS] Stack:', error.stack)
    return { error: error?.message || 'Erro inesperado ao limpar bypass' }
  }
}

