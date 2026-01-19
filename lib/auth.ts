'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface UserProfile {
  id: string
  email: string
  nome: string
  telefone?: string
  whatsapp?: string
  plano?: 'teste' | 'basico' | 'premium'
  created_at: string
}

// Função helper para obter a URL correta do site
// IMPORTANTE: Para links de email, SEMPRE usar URL de produção, nunca localhost
// Deve ser async porque está em arquivo com 'use server'
export async function getSiteUrl(): Promise<string> {
  console.log('🔍 [getSiteUrl] Detectando URL do site...')
  console.log('🔍 [getSiteUrl] NODE_ENV:', process.env.NODE_ENV)
  console.log('🔍 [getSiteUrl] NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'NÃO CONFIGURADO')
  console.log('🔍 [getSiteUrl] RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL || 'NÃO CONFIGURADO')
  console.log('🔍 [getSiteUrl] VERCEL_URL:', process.env.VERCEL_URL || 'NÃO CONFIGURADO')
  
  // 1. Tentar usar variável de ambiente (prioridade máxima)
  // IMPORTANTE: Se contém localhost, ignorar - links de email nunca devem usar localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim()
    // NUNCA usar localhost para links de email (mesmo em desenvolvimento)
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      console.log('✅ [getSiteUrl] Usando NEXT_PUBLIC_SITE_URL:', url)
      return url
    } else {
      console.log('⚠️ [getSiteUrl] NEXT_PUBLIC_SITE_URL contém localhost, ignorando (links de email devem usar produção)')
    }
  }
  
  // 2. Tentar usar RENDER_EXTERNAL_URL (se estiver no Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.RENDER_EXTERNAL_URL.trim()
    if (url && !url.includes('localhost')) {
      console.log('✅ [getSiteUrl] Usando RENDER_EXTERNAL_URL:', url)
      return url
    }
  }
  
  // 3. Tentar usar VERCEL_URL (se estiver no Vercel)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`
    console.log('✅ [getSiteUrl] Usando VERCEL_URL:', url)
    return url
  }
  
  // 4. Tentar usar RAILWAY_PUBLIC_DOMAIN (se estiver no Railway)
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    console.log('✅ [getSiteUrl] Usando RAILWAY_PUBLIC_DOMAIN:', url)
    return url
  }
  
  // 5. SEMPRE usar URL de produção para links de email
  // IMPORTANTE: Mesmo em desenvolvimento local, links de email devem apontar para produção
  // porque o email será aberto em qualquer lugar, não necessariamente no localhost
  const productionUrl = 'https://plenipay.com'
  console.log('✅ [getSiteUrl] Usando URL de produção para links de email:', productionUrl)
  console.log('ℹ️ [getSiteUrl] Nota: Links de email sempre usam produção, mesmo em desenvolvimento local')
  return productionUrl
}

export async function signUp(email: string, password: string, nome: string, telefone: string, whatsapp: string, plano: 'teste' | 'basico' | 'premium') {
  try {
    const supabase = await createClient()
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      console.error('❌ ERRO: createAdminClient retornou null! Não é possível gerenciar usuários.')
      return { error: 'Erro interno do servidor: Admin client não disponível.' }
    }
    
    console.log('📝 Iniciando processo de criação de conta...')
    
    // IMPORTANTE: Sempre usar https://plenipay.com para links de email
    // Mesmo em desenvolvimento local, links de email devem apontar para produção
    const siteUrl = 'https://plenipay.com' // FORÇAR URL de produção sempre
    const redirectUrl = `${siteUrl}/auth/callback?next=/home`
    
    // USAR SIGNUP NORMAL DO SUPABASE - ENVIA EMAIL AUTOMATICAMENTE
    // IMPORTANTE: O Supabase só envia email se:
    // 1. "Enable email confirmations" estiver habilitado
    // 2. SMTP estiver configurado (ou usar SMTP padrão)
    // 3. Template de email estiver configurado
    console.log('📧 ========== CONFIGURAÇÕES DE EMAIL ==========')
    console.log('📧 Site URL (FORÇADA):', siteUrl)
    console.log('📧 emailRedirectTo:', redirectUrl)
    console.log('📧 Email destinatário:', email)
    console.log('📧 ⚠️ IMPORTANTE: URL forçada para produção (https://plenipay.com)')
    console.log('📧 ⚠️ VERIFIQUE: Template de email deve usar {{ .ConfirmationURL }} e não {{ .SiteURL }}')
    console.log('📧 ==========================================')
    
    // IMPORTANTE: Tentar criar primeiro, SEM verificar antes
    // Se der erro "already exists", aí verificamos se está confirmado
    let authData: any = null
    let authError: any = null
    
    // Primeira tentativa de criar conta
    console.log('🔄 Tentando criar conta...')
    console.log('📧 [SIGNUP] emailRedirectTo que será enviado:', redirectUrl)
    console.log('📧 [SIGNUP] ⚠️ IMPORTANTE: Se o link no email tiver 0.0.0.0:10000, o Supabase está ignorando emailRedirectTo')
    console.log('📧 [SIGNUP] ⚠️ Verifique Site URL no Supabase Dashboard (Authentication → URL Configuration)')
    
    let signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          telefone,
          whatsapp,
          plano,
          email,
        },
        emailRedirectTo: redirectUrl, // URL forçada para produção
      }
    })
    
    authData = signUpResult.data
    authError = signUpResult.error
    
    // Log adicional para debug
    console.log('📧 [DEBUG] emailRedirectTo enviado para Supabase:', redirectUrl)
    console.log('📧 [DEBUG] Verifique se o template de email usa {{ .ConfirmationURL }} e não {{ .SiteURL }}')
    console.log('📧 [DEBUG] ⚠️ Se o link no email tiver 0.0.0.0:10000, o problema está na configuração do Supabase')
    
    // Verificar se o email foi realmente enviado
    // O Supabase pode criar o usuário mas não enviar email se:
    // - Confirmação de email estiver desabilitada
    // - SMTP não estiver configurado
    // - Template não estiver configurado
    console.log('📬 Resultado do signUp:')
    console.log('   - Usuário criado:', !!authData?.user)
    console.log('   - Email confirmado:', authData?.user?.email_confirmed_at ? 'SIM' : 'NÃO')
    console.log('   - Session criada:', !!authData?.session)
    console.log('   - Erro:', authError?.message || 'Nenhum')
    
    // Verificar se há erro PRIMEIRO
    let teveErroEmail = false
    if (authError) {
      const errorMsg = authError.message.toLowerCase()
      const isEmailError = errorMsg.includes('email') || errorMsg.includes('sending') || errorMsg.includes('confirmation')
      const isAlreadyExists = errorMsg.includes('already exists') || errorMsg.includes('already registered') || errorMsg.includes('user already registered')
      
      // Se o erro for "email already exists", verificar se está confirmado
      if (isAlreadyExists && !authData?.user) {
        console.log('⚠️ Email já existe - verificando se está confirmado...')
        
        // Verificar se o usuário existe e se está confirmado
        if (supabaseAdmin) {
          try {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = usersData?.users?.find((u: any) => u.email === email)
            
            if (existingUser) {
              if (existingUser.email_confirmed_at) {
                // Email já confirmado - não pode criar novamente
                console.log('❌ Email já está confirmado - não é possível criar conta novamente')
                return { error: 'Este email já está cadastrado e confirmado. Faça login ou recupere sua senha.' }
              } else {
                // Email não confirmado - deletar e tentar criar novamente
                console.log('🗑️ Email não confirmado - deletando usuário antigo para permitir criar novamente...')
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
                
                if (deleteError) {
                  console.error('⚠️ Erro ao deletar usuário antigo:', deleteError.message)
                  return { error: 'Erro ao processar conta existente. Tente novamente.' }
                } else {
                  console.log('✅ Usuário não confirmado deletado com sucesso')
                  // Aguardar um pouco para garantir que foi deletado
                  await new Promise(resolve => setTimeout(resolve, 1500))
                  
                  // Tentar criar novamente
                  console.log('🔄 Tentando criar conta novamente após deletar usuário não confirmado...')
                  signUpResult = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                      data: {
                        nome,
                        telefone,
                        whatsapp,
                        plano,
                        email,
                      },
                      emailRedirectTo: redirectUrl,
                    }
                  })
                  
                  authData = signUpResult.data
                  authError = signUpResult.error
                  
                  if (authError) {
                    console.error('❌ Erro ao criar conta após deletar usuário antigo:', authError.message)
                    return { error: authError.message || 'Erro ao criar conta. Tente novamente.' }
                  }
                  
                  if (!authData?.user) {
                    console.error('❌ Usuário não foi criado após retry')
                    return { error: 'Erro ao criar usuário. Tente novamente.' }
                  }
                  
                  console.log('✅ Conta criada com sucesso após deletar usuário não confirmado')
                  // Limpar o erro para continuar processamento
                  authError = null
                }
              }
            } else {
              // Usuário não encontrado - erro estranho, mas tentar continuar
              console.warn('⚠️ Erro diz que email existe mas não encontramos o usuário')
              return { error: 'Erro ao verificar conta existente. Tente novamente.' }
            }
          } catch (checkError: any) {
            console.error('❌ Erro ao verificar usuário existente:', checkError.message)
            return { error: 'Erro ao verificar conta existente. Tente novamente.' }
          }
        } else {
          console.error('❌ Admin client não disponível para verificar usuário existente')
          return { error: 'Erro ao verificar conta existente. Tente novamente.' }
        }
      } else if (authData?.user && isEmailError) {
      // Se o usuário foi criado mas houve erro no envio de email
        console.warn('⚠️ Usuário criado mas erro ao enviar email:', authError.message)
        console.log('🔄 Processando normalmente - email será enviado via Admin API...')
        teveErroEmail = true
        // IMPORTANTE: Continuar processamento normalmente mesmo com erro de email
        // O email será enviado via Admin API depois
      } else if (!isAlreadyExists) {
        // Outros erros (não relacionados a email ou "already exists") - erro real
        console.error('❌ Erro ao criar conta:', authError)
        return { error: authError.message || 'Erro ao criar conta' }
      }
    }
    
    if (!authData.user) {
      console.error('❌ Usuário não foi criado')
      return { error: 'Erro ao criar usuário. Tente novamente.' }
    }
    
    // Se chegou aqui, usuário foi criado com sucesso
    // IMPORTANTE: SEMPRE enviar email de confirmação via resend (type: signup)
    // NÃO usar inviteUserByEmail pois envia email de "invite", não de confirmação
    console.log('📧 ========== GARANTINDO ENVIO DE EMAIL ==========')
    console.log('📧 Sempre enviar email de confirmação após criar conta')
    console.log('📧 Usando apenas resend (type: signup) para garantir email correto')
    
    if (!authData.user.email_confirmed_at) {
      // Aguardar um pouco para garantir que o usuário foi criado completamente
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        console.log('📤 Enviando email de confirmação via resend (type: signup)...')
        console.log('📧 Email:', email)
        console.log('📧 Redirect URL (FORÇADA):', redirectUrl)
        console.log('📧 ⚠️ IMPORTANTE: Se o link no email tiver 0.0.0.0:10000, o Supabase está ignorando emailRedirectTo')
        console.log('📧 ⚠️ Verifique Site URL no Supabase Dashboard (Authentication → URL Configuration)')
        
        const { error: resendError, data: resendData } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: redirectUrl,
          }
        })
        
        console.log('📬 Resposta do resend:')
        console.log('  - Erro:', resendError?.message || 'Nenhum')
        console.log('  - Dados:', resendData ? JSON.stringify(resendData, null, 2) : 'Nenhum')
        
        if (resendError) {
          console.error('❌ Erro ao enviar via resend:', resendError.message)
          console.error('❌ Erro completo do resend:', JSON.stringify(resendError, null, 2))
          console.error('⚠️ IMPORTANTE: Verifique se:')
          console.error('   1. SMTP está configurado no Supabase Dashboard')
          console.error('   2. Template de email "Confirm signup" está configurado')
          console.error('   3. "Enable email confirmations" está habilitado')
          console.error('   4. Verifique logs do Supabase (Authentication → Logs)')
          teveErroEmail = true
        } else {
          console.log('✅ Email de confirmação enviado via resend com sucesso!')
          console.log('✅ O usuário receberá o email de confirmação (não email de invite)')
        }
      } catch (emailError: any) {
        console.error('❌ Erro inesperado ao enviar email:', emailError.message)
        console.error('❌ Stack:', emailError.stack)
        teveErroEmail = true
      }
    } else {
      console.log('⚠️ Email já está confirmado - não precisa enviar')
    }
    
    console.log('📧 ==========================================')
    
    console.log('✅ Usuário criado com sucesso')
    console.log('📧 Email do usuário:', email)
    console.log('📧 User ID:', authData.user.id)
    console.log('📧 Email confirmado?', authData.user.email_confirmed_at ? 'SIM' : 'NÃO')
    console.log('📧 Email enviado?', teveErroEmail ? 'Tentado (pode ter falhado)' : 'SIM')
    
    // O perfil será criado automaticamente pelo trigger no Supabase
    // Aguardar um pouco para garantir que o trigger executou
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Verificar se o perfil foi criado pelo trigger e atualizar com dados completos se necessário
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('Erro ao verificar perfil:', profileFetchError)
    }

    // Se o perfil não foi criado pelo trigger ou está incompleto, criar/atualizar manualmente
    if (!existingProfile || !existingProfile.email || existingProfile.email === '') {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          nome,
          telefone,
          whatsapp,
          plano,
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Erro ao criar/atualizar perfil (fallback):', profileError)
        console.error('Detalhes do erro de perfil:', JSON.stringify(profileError, null, 2))
        
        // Se o erro for de permissão RLS, tentar novamente após um delay
        if (profileError.message.includes('permission') || profileError.message.includes('policy') || profileError.message.includes('RLS')) {
          console.warn('Erro de permissão RLS. Verifique se as políticas RLS estão configuradas corretamente.')
          // Não retornar erro aqui, pois o trigger pode criar o perfil
        } else if (profileError.message.includes('relation') || profileError.message.includes('does not exist')) {
          console.error('❌ ERRO CRÍTICO: Tabela profiles não existe! Execute o script supabase-auth-schema.sql no Supabase.')
          return { error: 'Banco de dados não configurado. Execute os scripts SQL no Supabase (supabase-schema.sql e supabase-auth-schema.sql).' }
        } else {
          // Outros erros podem ser críticos
          console.warn('Perfil não foi criado/atualizado, mas o usuário foi criado. Verifique o trigger no Supabase.')
        }
      } else {
        console.log('Perfil criado/atualizado com sucesso (fallback)')
      }
    } else {
      console.log('Perfil já existe e está completo')
    }

    // Verificar se o email foi confirmado (NÃO deve estar confirmado - usuário precisa verificar primeiro)
    const emailConfirmado = authData.user.email_confirmed_at !== null
    
    console.log('✅✅✅ Usuário criado com sucesso!')
    console.log('📧 Email:', authData.user.email)
    console.log('✅ Email confirmado:', emailConfirmado ? 'SIM' : 'NÃO')
    console.log('📬 Email de confirmação:', teveErroEmail ? 'Tentado enviar via Admin API' : 'Pode ter sido enviado pelo Supabase')
    console.log('🔒 Usuário precisa verificar email ANTES de fazer login')
    
    // NÃO criar sessão - usuário precisa verificar email primeiro
    const authDataFinal = {
      user: authData.user,
      session: null
    }
    
    // IMPORTANTE: Mesmo se teve erro de email, retornar dados se o usuário foi criado
    // O email será enviado via Admin API ou o usuário pode usar o botão de reenvio
    console.log('📤 Retornando dados para o frontend...')
    console.log('   - Tem data:', !!authDataFinal)
    console.log('   - Email confirmado:', emailConfirmado)
    console.log('   - Teve erro de email:', teveErroEmail)
    
    return { data: authDataFinal, emailConfirmado, teveErroEmail: teveErroEmail }
  } catch (error: any) {
    console.error('Erro inesperado no signUp:', error)
    return { error: error.message || 'Erro inesperado ao criar conta' }
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
    const supabase = await createClient()

    console.log('🔐 Verificando código OTP...')
    console.log('📧 Email:', email)
    console.log('🔢 Código recebido:', codigo, `(${codigo.length} dígitos)`)

    // IMPORTANTE: signUp envia OTP com type 'signup', então tentar primeiro com 'signup'
    let data: any = null
    let error: any = null

    // Tentativa 1: Código completo com type 'signup' (tipo usado no signUp)
    console.log(`🔄 Tentativa 1: Verificando com código completo e type 'signup'`)
    const result1 = await supabase.auth.verifyOtp({
      email: email,
      token: codigo,
      type: 'signup'
    })
    
    if (!result1.error && result1.data?.user) {
      data = result1.data
      console.log('✅ Sucesso na tentativa 1 (type signup)')
    } else {
      error = result1.error
      console.log(`❌ Tentativa 1 falhou:`, error?.message)
      
      // Tentativa 2: Primeiros 6 dígitos com type 'signup'
      if (codigo.length >= 6) {
        const codigo6Digitos = codigo.substring(0, 6)
        console.log(`🔄 Tentativa 2: Verificando com primeiros 6 dígitos (${codigo6Digitos}) e type 'signup'`)
        const result2 = await supabase.auth.verifyOtp({
          email: email,
          token: codigo6Digitos,
          type: 'signup'
        })
        
        if (!result2.error && result2.data?.user) {
          data = result2.data
          error = null
          console.log('✅ Sucesso na tentativa 2 (6 dígitos, type signup)')
        } else {
          console.log(`❌ Tentativa 2 falhou:`, result2.error?.message)
          error = result2.error || error
          
          // Tentativa 3: Código completo com type 'email' (fallback)
          console.log(`🔄 Tentativa 3: Verificando com código completo e type 'email'`)
          const result3 = await supabase.auth.verifyOtp({
            email: email,
            token: codigo,
            type: 'email'
          })
          
          if (!result3.error && result3.data?.user) {
            data = result3.data
            error = null
            console.log('✅ Sucesso na tentativa 3 (type email)')
          } else {
            console.log(`❌ Tentativa 3 falhou:`, result3.error?.message)
            error = result3.error || error
            
            // Tentativa 4: Primeiros 6 dígitos com type 'email' (fallback)
            if (codigo.length >= 6) {
              const codigo6Digitos = codigo.substring(0, 6)
              console.log(`🔄 Tentativa 4: Verificando com primeiros 6 dígitos (${codigo6Digitos}) e type 'email'`)
              const result4 = await supabase.auth.verifyOtp({
                email: email,
                token: codigo6Digitos,
                type: 'email'
              })
              
              if (!result4.error && result4.data?.user) {
                data = result4.data
                error = null
                console.log('✅ Sucesso na tentativa 4 (6 dígitos, type email)')
              } else {
                console.log(`❌ Tentativa 4 falhou:`, result4.error?.message)
                error = result4.error || error
              }
            }
          }
        }
      }
    }

    if (error) {
      console.error('❌ Todas as tentativas falharam. Erro final:', error)
      console.error('📋 Detalhes do erro:', JSON.stringify(error, null, 2))
      
      // Mensagens de erro mais amigáveis
      if (error.message.includes('expired') || error.message.includes('expir')) {
        return { error: 'Código expirado. Solicite um novo código.' }
      }
      if (error.message.includes('invalid') || error.message.includes('incorrect')) {
        return { error: 'Código inválido. Verifique e tente novamente.' }
      }
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return { error: 'Código não encontrado. Solicite um novo código.' }
      }
      
      return { error: error.message || 'Erro ao verificar código. Tente solicitar um novo código.' }
    }

    if (!data?.user) {
      console.error('❌ Nenhum usuário retornado após verificação')
      return { error: 'Erro ao verificar código. Tente novamente.' }
    }

    // Verificar se o email foi confirmado
    if (!data.user.email_confirmed_at) {
      console.warn('⚠️ Email ainda não confirmado após verificação OTP')
      return { error: 'Email ainda não foi confirmado. Tente novamente.' }
    }

    console.log('✅ Email confirmado com sucesso!')
    console.log('👤 User ID:', data.user.id)
    revalidatePath('/')
    return { data, success: true }
  } catch (error: any) {
    console.error('❌ Erro inesperado ao verificar código:', error)
    return { error: error.message || 'Erro inesperado ao verificar código' }
  }
}

export async function reenviarCodigoEmail(email: string) {
  console.log('🚀 [REENVIAR LINK] ========== INÍCIO ==========')
  console.log('📧 Email:', email)
  console.log('⏰ Timestamp:', new Date().toISOString())
  
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      console.error('❌ Admin client não disponível')
      return { 
        error: 'Configuração do servidor incompleta. Contate o suporte.',
        needsConfig: true 
      }
    }
    
    // Buscar usuário
    console.log('🔍 Buscando usuário...')
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError || !users?.users) {
      console.error('❌ Erro ao listar usuários:', listError)
      return { error: 'Erro ao buscar usuário. Tente novamente.' }
    }
    
    const user = (users.users as any[]).find((u: any) => u.email === email)
    
    if (!user) {
      console.error('❌ Usuário não encontrado para:', email)
      return { error: 'Usuário não encontrado. Verifique o email.' }
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
        return { error: 'Este email já foi confirmado.' }
      }
    }
    
    // Limpar confirmação se existir para permitir novo envio
    if (user.email_confirmed_at) {
      console.log('🔧 Limpando confirmação de email...')
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
        email_confirm: false 
      })
      
      if (updateError) {
        console.error('⚠️ Erro ao limpar confirmação:', updateError.message)
      } else {
        console.log('✅ Confirmação limpa com sucesso')
      }
      
      // Aguardar para garantir que a atualização foi processada
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Configurar URL de redirecionamento
    // IMPORTANTE: SEMPRE usar https://plenipay.com explicitamente
    // Não confiar em getSiteUrl() que pode retornar URL errada
    const siteUrl = 'https://plenipay.com' // FORÇAR URL de produção sempre
    const redirectTo = `${siteUrl}/auth/callback?next=/home`
    console.log('🔗 URL de redirecionamento (FORÇADA):', redirectTo)
    console.log('⚠️ IMPORTANTE: URL forçada para produção (https://plenipay.com)')
    
    // MÉTODO 1: Tentar resend (type: signup) - NÃO usar inviteUserByEmail
    // inviteUserByEmail envia email de "invite", não de confirmação
    console.log('📤 Tentando resend (type: signup) - método principal...')
    const { createClient } = await import('./supabase/server')
    const supabase = await createClient()
    
    const { data: resendData, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    
    if (!resendError) {
      console.log('✅ Resend retornou sucesso!')
      return {
        success: true,
        message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
        linkGenerated: true
      }
    }
    
    console.error('❌ Resend também falhou:', resendError.message)
    return {
      error: `Erro ao enviar email: ${resendError.message || 'Não foi possível enviar o link de confirmação'}`,
      details: 'Verifique: 1) SMTP configurado no Supabase, 2) Template de email configurado, 3) Tipo de confirmação como "Email Link"'
    }
    
  } catch (error: any) {
    console.error('❌ Erro inesperado:', error)
    return { 
      error: error?.message || 'Erro inesperado ao enviar link de confirmação',
      details: 'Verifique os logs do servidor para mais detalhes'
    }
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

