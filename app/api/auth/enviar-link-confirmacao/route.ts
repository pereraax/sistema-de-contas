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
    
    // PASSO 2.5: VERIFICAR URL ANTES DE ENVIAR (SOLUÇÃO PARA BUG DO SUPABASE)
    // IMPORTANTE: Gerar link primeiro para verificar se Supabase está usando Site URL correta
    // Se o link tiver 0.0.0.0:10000, BLOQUEAR envio e retornar erro com instruções
    // IMPORTANTE: Só bloqueia se detectar 0.0.0.0:10000 explicitamente
    console.log('🔍 PASSO 2.5: Verificando URL do link antes de enviar email...')
    console.log('🔍 Isso detecta o bug do Supabase onde resend() ignora emailRedirectTo')
    
    let linkGeradoComUrlCorreta = false
    let linkGerado: string | null = null
    let linkTemUrlIncorreta = false
    
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: redirectTo
        }
      })
      
      if (!linkError && linkData?.properties?.action_link) {
        linkGerado = linkData.properties.action_link
        console.log('📧 Link gerado via Admin API:', linkGerado.substring(0, 150) + '...')
        
        // Verificar se o link contém a URL correta
        if (linkGerado.includes('plenipay.com')) {
          console.log('✅ Link gerado contém URL correta (plenipay.com)')
          linkGeradoComUrlCorreta = true
          linkTemUrlIncorreta = false
        } else if (linkGerado.includes('0.0.0.0') || linkGerado.includes('10000')) {
          console.error('❌ PROBLEMA CRÍTICO: Link gerado contém 0.0.0.0:10000!')
          console.error('❌ Isso confirma que o Supabase está usando Site URL do dashboard')
          console.error('❌ redirectTo passado:', redirectTo)
          console.error('❌ ⚠️ BLOQUEANDO ENVIO - Site URL precisa ser corrigida primeiro')
          linkGeradoComUrlCorreta = false
          linkTemUrlIncorreta = true
        } else {
          // Se não tem nem plenipay.com nem 0.0.0.0:10000, pode ser outra URL válida
          // (ex: localhost em desenvolvimento, ou outra URL de produção)
          // NÃO bloquear neste caso - permitir envio
          console.log('⚠️ Link gerado não contém plenipay.com nem 0.0.0.0:10000')
          console.log('⚠️ Link:', linkGerado.substring(0, 100) + '...')
          console.log('⚠️ Permitindo envio - pode ser URL válida (ex: localhost em desenvolvimento)')
          linkGeradoComUrlCorreta = false // Não é plenipay.com, mas não é 0.0.0.0:10000
          linkTemUrlIncorreta = false // NÃO bloquear - pode ser válido
        }
      } else {
        console.warn('⚠️ Não foi possível gerar link para verificação:', linkError?.message || 'Erro desconhecido')
        console.warn('⚠️ Permitindo envio mesmo assim - pode ser problema temporário')
        // Se não conseguiu gerar link, permitir envio (pode ser problema temporário)
        linkGeradoComUrlCorreta = false
        linkTemUrlIncorreta = false // NÃO bloquear se não conseguiu gerar link
      }
    } catch (linkException: any) {
      console.warn('⚠️ Exceção ao gerar link:', linkException.message)
      console.warn('⚠️ Permitindo envio mesmo assim - pode ser problema temporário')
      // Se deu exceção, permitir envio (pode ser problema temporário)
      linkGeradoComUrlCorreta = false
      linkTemUrlIncorreta = false // NÃO bloquear se deu exceção
    }
    
    // BLOQUEAR ENVIO APENAS SE DETECTAR 0.0.0.0:10000 EXPLICITAMENTE
    // IMPORTANTE: Só bloqueia se realmente detectar o problema
    if (linkTemUrlIncorreta && linkGerado) {
      console.error('🚫 BLOQUEANDO ENVIO: Link tem URL incorreta (0.0.0.0:10000)')
      console.error('🚫 Não vamos enviar email com link incorreto')
      console.error('🚫 Site URL no Supabase Dashboard precisa ser corrigida primeiro')
      
      return NextResponse.json(
        {
          error: 'Link de confirmação está usando URL incorreta (0.0.0.0:10000).',
          details: 'O Supabase está usando a Site URL do dashboard em vez do emailRedirectTo devido a um bug conhecido.',
          solution: 'Corrija a Site URL no Supabase Dashboard ANTES de tentar novamente:',
          steps: [
            '1. Acesse: https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration',
            '2. Encontre o campo "Site URL"',
            '3. Se estiver como "0.0.0.0:10000" ou vazio, MUDE PARA: https://plenipay.com',
            '4. IMPORTANTE: Sem barra final (não use https://plenipay.com/)',
            '5. Clique em "Save"',
            '6. Aguarde 2-3 minutos para as alterações serem aplicadas',
            '7. Tente novamente criar a conta'
          ],
          redirectToPassed: redirectTo,
          linkGenerated: linkGerado.substring(0, 200) + '...',
          bugInfo: 'Há um bug conhecido no Supabase (issue #802) onde resend() ignora emailRedirectTo e usa Site URL do dashboard. A solução é garantir que a Site URL esteja correta.',
          templateCheck: 'Também verifique o template de email: Authentication → Email Templates → "Confirm signup" → Deve usar {{ .ConfirmationURL }} e não {{ .SiteURL }}'
        },
        { status: 500 }
      )
    }
    
    // Se chegou aqui, não detectou 0.0.0.0:10000, então permitir envio
    console.log('✅ Verificação de URL concluída - permitindo envio de email')
    
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
        console.log('  - Tem dados:', !!resendData)
        console.log('  - Tem erro:', !!resendError)
        
        // IMPORTANTE: Verificar se realmente foi enviado
        // O Supabase pode retornar sucesso (sem erro) mas não enviar email se:
        // - SMTP não estiver configurado
        // - Template não estiver configurado
        // - Email confirmations não estiver habilitado
        if (!resendError) {
          // Resend retornou sucesso (sem erro)
          console.log(`✅ Resend retornou sucesso com type: ${tipo}!`)
          console.log('📧 Verificando se email foi realmente enviado...')
          
          // IMPORTANTE: Mesmo sem erro, verificar se há dados na resposta
          // Se não há dados, pode ser que o email não foi enviado
          if (resendData) {
            console.log('✅ Resposta contém dados - email provavelmente foi enviado')
            tipoUsado = tipo
            resendError = null
            break // Sucesso, não precisa tentar outros tipos
          } else {
            console.warn('⚠️ Resend retornou sucesso mas SEM DADOS na resposta')
            console.warn('⚠️ Isso pode indicar que o email NÃO foi enviado')
            console.warn('⚠️ Possíveis causas: SMTP não configurado, template não configurado, ou email confirmations desabilitado')
            console.warn('⚠️ Continuando para tentar próximo tipo ou método alternativo...')
            ultimoErro = { message: 'Resend retornou sucesso mas sem dados - email pode não ter sido enviado' }
            // Continuar para tentar próximo tipo ou método alternativo
          }
        } else {
          console.warn(`⚠️ Resend falhou com type: ${tipo}, erro: ${resendError.message}`)
          ultimoErro = resendError // Guardar último erro
          // Continuar para tentar próximo tipo
        }
      } catch (resendException: any) {
        console.error(`❌ Exceção ao tentar resend (type: ${tipo}):`, resendException.message)
        resendError = resendException
        ultimoErro = resendException
        // Continuar para tentar próximo tipo
      }
    }
    
    // Se algum tipo funcionou, retornar sucesso
    // IMPORTANTE: Verificar se tipoUsado foi definido (indica que resend retornou sucesso)
    if (tipoUsado) {
      console.log(`✅ Resend funcionou com type: ${tipoUsado} - retornando sucesso`)
      
      // Se o link gerado tinha URL incorreta, adicionar aviso
      const response: any = {
        success: true,
        message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
        method: `resend_${tipoUsado}`,
        note: 'Se não receber, verifique spam e logs do Supabase (Authentication → Logs)'
      }
      
      if (!linkGeradoComUrlCorreta && linkGerado) {
        console.error('⚠️ ATENÇÃO: Link gerado tinha URL incorreta!')
        console.error('⚠️ O email foi enviado, mas o link pode ter 0.0.0.0:10000')
        console.error('⚠️ SOLUÇÃO: Verifique Site URL no Supabase Dashboard')
        response.warning = 'O link pode ter URL incorreta (0.0.0.0:10000). Verifique Site URL no Supabase Dashboard.'
        response.linkGenerated = linkGerado.substring(0, 200) + '...'
        response.solution = 'Authentication → URL Configuration → Site URL deve ser https://plenipay.com'
        response.bugInfo = 'Há um bug conhecido no Supabase onde resend() ignora emailRedirectTo e usa Site URL do dashboard'
      }
      
      return NextResponse.json(response)
    }
    
    // Se chegou aqui, nenhum tipo funcionou ou retornou sucesso mas sem dados
    console.error('❌ Nenhum tipo de resend funcionou ou retornou sucesso mas sem dados')
    console.error('❌ Último erro:', ultimoErro?.message || 'Nenhum erro capturado')
    
    // PASSO 4: Se resend não funcionou, tentar inviteUserByEmail como fallback
    console.log('📤 PASSO 4: Resend não funcionou - tentando inviteUserByEmail como fallback...')
    console.log('⚠️ NOTA: inviteUserByEmail envia email de "invite", mas funciona mesmo se resend falhar')
    
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo,
        data: {
          // Manter dados do usuário
        }
      })
      
      if (!inviteError && inviteData?.user) {
        console.log('✅ inviteUserByEmail funcionou!')
        console.log('⚠️ NOTA: Este método envia email de "invite", não de "confirmação"')
        console.log('⚠️ Mas o link funciona para confirmar o email')
        
        return NextResponse.json({
          success: true,
          message: 'Link de confirmação enviado! Verifique sua caixa de entrada.',
          method: 'inviteUserByEmail',
          note: 'Email enviado via inviteUserByEmail. Se não receber, verifique spam e logs do Supabase (Authentication → Logs)',
          warning: 'Este método envia email de "invite", mas o link funciona para confirmar o email.'
        })
      } else {
        console.error('❌ inviteUserByEmail também falhou:', inviteError?.message || 'Erro desconhecido')
      }
    } catch (inviteException: any) {
      console.error('❌ Exceção ao tentar inviteUserByEmail:', inviteException.message)
    }
    
    // PASSO 5: Se inviteUserByEmail também falhou, tentar gerar link manualmente via Admin API
    // IMPORTANTE: generateLink NÃO envia email, apenas gera o link
    // Mas podemos verificar se o link gerado tem a URL correta
    console.log('📤 PASSO 5: inviteUserByEmail também falhou, tentando gerar link manualmente via Admin API...')
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
    console.error('  - Mensagem:', ultimoErro?.message || resendError?.message || 'Nenhum erro específico')
    console.error('  - Status:', ultimoErro?.status || resendError?.status || 'Nenhum')
    console.error('  - Erro completo:', ultimoErro || resendError ? JSON.stringify(ultimoErro || resendError, null, 2) : 'Nenhum erro capturado')
    
    // Verificar tipo de erro específico
    const errorMsg = ((ultimoErro || resendError)?.message || '').toLowerCase()
    let errorDetails = 'Erro desconhecido ao enviar email de confirmação.'
    
    // Se não há erro específico do resend, pode ser problema de configuração
    if (!ultimoErro && !resendError) {
      errorDetails = 'O resend não retornou erro, mas também não enviou o email. Isso geralmente indica problema de configuração SMTP ou template de email no Supabase.'
    }
    
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
        methodsTried: ['resend_signup', 'resend_email'],
        errorDetails: errorDetails,
        resendError: (ultimoErro || resendError)?.message || 'Erro desconhecido do resend'
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

