import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * PARTE 2: Callback Route Simples
 * Processa link de confirmação de email e faz login automático
 */
export async function GET(request: NextRequest) {
  const productionUrl = 'https://plenipay.com'
  
  console.log('🔍 [Callback] ========== CALLBACK INICIADO ==========')
  console.log('🔍 [Callback] URL recebida (request.url):', request.url)
  console.log('🔍 [Callback] Host:', request.headers.get('host'))
  console.log('🔍 [Callback] Referer:', request.headers.get('referer'))
  console.log('🔍 [Callback] Origin:', request.headers.get('origin'))
  console.log('🔍 [Callback] NextUrl.href:', request.nextUrl.href)
  console.log('🔍 [Callback] NextUrl.origin:', request.nextUrl.origin)
  
  // CRÍTICO: Verificar se já estamos redirecionando para evitar loops
  // Se o referer já é /home ou /login, não processar novamente
  const referer = request.headers.get('referer')
  if (referer && (referer.includes('/home') || referer.includes('/login'))) {
    console.warn('⚠️ [Callback] Referer indica que já foi redirecionado - evitando loop')
    // Se já foi redirecionado, apenas retornar a página home sem processar
    const redirectUrl = new URL('/home', productionUrl)
    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
  
  // CRÍTICO: Verificar cookie para evitar processar o mesmo token múltiplas vezes
  const cookieStore = await cookies()
  const processedToken = cookieStore.get('callback_processed')
  const token_hash = request.nextUrl.searchParams.get('token_hash')
  
  if (processedToken && processedToken.value === token_hash) {
    console.warn('⚠️ [Callback] Token já foi processado - redirecionando para home sem reprocessar')
    const redirectUrl = new URL('/home', productionUrl)
    const response = NextResponse.redirect(redirectUrl, { status: 303 })
    // Remover o cookie após usar
    response.cookies.delete('callback_processed')
    return response
  }
  
  // CRÍTICO: Se a URL recebida já contém 0.0.0.0:10000, redirecionar IMEDIATAMENTE
  // Isso pode acontecer se o Next.js está usando URL base errada
  if (request.url.includes('0.0.0.0') || request.url.includes(':10000') || 
      request.nextUrl.href.includes('0.0.0.0') || request.nextUrl.href.includes(':10000')) {
    console.error('❌ [Callback] URL recebida contém 0.0.0.0:10000 - REDIRECIONANDO IMEDIATAMENTE!')
    console.error('❌ [Callback] request.url:', request.url)
    console.error('❌ [Callback] request.nextUrl.href:', request.nextUrl.href)
    
    // Extrair parâmetros da URL errada (tentar de ambas as URLs)
    let token_hash: string | null = null
    let type: string = 'signup'
    let next: string = '/home'
    
    try {
      const urlErrada = new URL(request.url)
      token_hash = urlErrada.searchParams.get('token_hash')
      type = urlErrada.searchParams.get('type') || 'signup'
      next = urlErrada.searchParams.get('next') || '/home'
    } catch {
      // Se falhar, tentar extrair da string diretamente
      const tokenMatch = request.url.match(/[?&#]token_hash=([^&#]+)/i)
      if (tokenMatch) token_hash = decodeURIComponent(tokenMatch[1])
      const typeMatch = request.url.match(/[?&#]type=([^&#]+)/i)
      if (typeMatch) type = decodeURIComponent(typeMatch[1])
      const nextMatch = request.url.match(/[?&#]next=([^&#]+)/i)
      if (nextMatch) next = decodeURIComponent(nextMatch[1])
    }
    
    // Construir URL correta
    const urlCorreta = new URL('/auth/callback', productionUrl)
    if (token_hash) urlCorreta.searchParams.set('token_hash', token_hash)
    if (type) urlCorreta.searchParams.set('type', type)
    if (next) urlCorreta.searchParams.set('next', next)
    
    console.log('🔄 [Callback] Redirecionando para:', urlCorreta.toString())
    console.log('🔄 [Callback] Parâmetros preservados:', { token_hash: token_hash ? token_hash.substring(0, 20) + '...' : null, type, next })
    return NextResponse.redirect(urlCorreta.toString(), { status: 307 })
  }
  
  // CRÍTICO: Sempre construir URL usando productionUrl, nunca usar request.url diretamente
  // Extrair parâmetros da URL, mas sempre usar productionUrl como base
  let requestUrl: URL
  try {
    // Se request.url contém plenipay.com, usar diretamente
    if (request.url.includes('plenipay.com')) {
      requestUrl = new URL(request.url)
    } else {
      // Se não, construir URL correta usando productionUrl
      const pathAndQuery = request.url.replace(/https?:\/\/[^\/]+/, '')
      requestUrl = new URL(pathAndQuery, productionUrl)
      console.log('⚠️ [Callback] URL não contém plenipay.com, reconstruindo:', requestUrl.toString())
    }
  } catch {
    // Se falhar, construir do zero usando productionUrl
    const pathAndQuery = request.url.replace(/https?:\/\/[^\/]+/, '')
    requestUrl = new URL(pathAndQuery, productionUrl)
    console.log('⚠️ [Callback] Erro ao construir URL, usando productionUrl:', requestUrl.toString())
  }
  
  // VERIFICAR se requestUrl ainda contém 0.0.0.0:10000
  if (requestUrl.href.includes('0.0.0.0') || requestUrl.href.includes(':10000')) {
    console.error('❌ [Callback] requestUrl AINDA contém 0.0.0.0:10000 após correção!')
    console.error('❌ [Callback] requestUrl.href:', requestUrl.href)
    // Forçar correção
    const pathAndQuery = requestUrl.pathname + requestUrl.search
    requestUrl = new URL(pathAndQuery, productionUrl)
    console.log('✅ [Callback] URL forçada para:', requestUrl.toString())
  }
  
  // Extrair parâmetros principais
  // IMPORTANTE: Extrair da string da URL diretamente, mesmo se URL estiver errada (0.0.0.0:10000)
  let token_hash = requestUrl.searchParams.get('token_hash')
  let type = requestUrl.searchParams.get('type') || 'signup'
  let next = requestUrl.searchParams.get('next') || '/home'
  
  // Se não encontrou, tentar extrair da string completa (mesmo com URL errada)
  if (!token_hash) {
    // Tentar extrair da query string da URL original
    const urlString = request.url
    const tokenMatch = urlString.match(/[?&#]token_hash=([^&#]+)/i)
    if (tokenMatch) {
      token_hash = decodeURIComponent(tokenMatch[1])
      console.log('✅ [Callback] Token extraído da string da URL')
    }
  }
  
  // Tentar extrair do hash se ainda não encontrou
  if (!token_hash && requestUrl.hash) {
    try {
      const hashParams = new URLSearchParams(requestUrl.hash.substring(1))
      token_hash = hashParams.get('token_hash') || token_hash
      type = hashParams.get('type') || type
      next = hashParams.get('next') || next
      if (token_hash) {
        console.log('✅ [Callback] Token extraído do hash')
      }
    } catch {
      // Ignorar erro
    }
  }
  
  // Extrair type e next da string também
  if (!type || type === 'signup') {
    const typeMatch = request.url.match(/[?&#]type=([^&#]+)/i)
    if (typeMatch) {
      type = decodeURIComponent(typeMatch[1])
    }
  }
  
  if (!next || next === '/home') {
    const nextMatch = request.url.match(/[?&#]next=([^&#]+)/i)
    if (nextMatch) {
      next = decodeURIComponent(nextMatch[1])
    }
  }
  
  console.log('🔍 [Callback] Parâmetros extraídos:', { 
    token_hash: token_hash ? token_hash.substring(0, 20) + '...' : null, 
    type, 
    next
  })

  // Verificar se temos token_hash (obrigatório)
  if (!token_hash) {
    console.error('❌ [Callback] Token não encontrado - redirecionando para login')
    const redirectUrl = new URL('/login', productionUrl)
    redirectUrl.searchParams.set('error', 'Link de confirmação inválido. Solicite um novo link.')
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  }

  // Criar cliente Supabase
  const cookieStore = await cookies()
  
  // IMPORTANTE: Garantir que o Supabase client não use URLs erradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('0.0.0.0') || supabaseUrl.includes(':10000')) {
    console.error('❌ [Callback] NEXT_PUBLIC_SUPABASE_URL contém URL inválida:', supabaseUrl)
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // IMPORTANTE: Garantir que cookies não usem domínio errado
          cookiesToSet.forEach(({ name, value, options }) => {
            // Se options tem domain com 0.0.0.0:10000, remover ou corrigir
            if (options?.domain && (options.domain.includes('0.0.0.0') || options.domain.includes('10000'))) {
              console.warn(`⚠️ [Callback] Cookie ${name} tem domain inválido, removendo:`, options.domain)
              delete options.domain
            }
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // PARTE 2: Verificar e confirmar email
  console.log('🔍 [Callback] Verificando link de confirmação...')
  
  // Tentar diferentes tipos de confirmação (signup, email)
  const typesToTry = [type, 'signup', 'email'].filter((t, i, arr) => arr.indexOf(t) === i)
  console.log('🔍 [Callback] Tipos a tentar:', typesToTry)
  
  let verifySuccess = false
  let lastError: any = null
  
  for (const tryType of typesToTry) {
    console.log(`🔄 [Callback] Tentando verifyOtp com type: ${tryType}`)
    console.log(`🔍 [Callback] Token_hash: ${token_hash ? token_hash.substring(0, 20) + '...' : 'N/A'}`)
    
    // IMPORTANTE: verifyOtp pode fazer redirect interno - precisamos garantir que não use URL errada
    // Não passar redirectTo aqui porque queremos controlar o redirect manualmente
    // CRÍTICO: O Supabase pode estar usando alguma URL base errada internamente
    console.log(`🔍 [Callback] Chamando verifyOtp com type: ${tryType}`)
    console.log(`🔍 [Callback] Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    
    const { data, error } = await supabase.auth.verifyOtp({
      type: tryType as any,
      token_hash,
      // NÃO passar redirectTo aqui - vamos fazer o redirect manualmente após verificar
    } as any)
    
    console.log(`🔍 [Callback] verifyOtp retornou:`, {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      hasError: !!error,
      errorMessage: error?.message,
      // Verificar se há algum redirect na resposta
      dataKeys: data ? Object.keys(data) : [],
      errorKeys: error ? Object.keys(error) : []
    })
    
    // IMPORTANTE: Verificar se a resposta contém algum redirect ou URL
    if (data && typeof data === 'object') {
      const dataStr = JSON.stringify(data)
      if (dataStr.includes('0.0.0.0') || dataStr.includes('10000')) {
        console.error('❌ [Callback] Resposta do verifyOtp contém 0.0.0.0:10000!')
        console.error('❌ [Callback] Resposta completa:', JSON.stringify(data, null, 2))
      }
    }

    if (!error && data?.user) {
      verifySuccess = true
      console.log('✅ [Callback] Email confirmado com sucesso!')
      console.log('👤 [Callback] Usuário:', data.user.id)
      console.log('📧 [Callback] Email:', data.user.email)
      console.log('🔑 [Callback] Sessão criada:', !!data.session)
      
      // Se há sessão, fazer login automático e redirecionar
      if (data.session) {
        console.log('✅ [Callback] Sessão criada - redirecionando para home')
        console.log(`🔍 [Callback] productionUrl: ${productionUrl}`)
        console.log(`🔍 [Callback] next: ${next}`)
        
        // GARANTIR que sempre usa productionUrl (não requestUrl.origin que pode ser 0.0.0.0:10000)
        // IMPORTANTE: Usar URL absoluta completa para evitar que Next.js use URL base errada
        // EVITAR parâmetros de query para prevenir loops de redirecionamento
        let redirectPath = next.startsWith('/') ? next : `/${next}`
        
        // Construir URL absoluta SEM parâmetros de query para evitar loops
        const redirectUrl = new URL(redirectPath, productionUrl)
        
        // FORÇAR URL absoluta completa (não relativa)
        let finalUrl = redirectUrl.toString()
        console.log(`🔍 [Callback] URL final de redirecionamento: ${finalUrl}`)
        
        // Verificar se a URL não contém 0.0.0.0:10000
        if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
          console.error('❌ [Callback] URL de redirecionamento contém 0.0.0.0:10000 - CORRIGINDO!')
          finalUrl = `${productionUrl}${redirectPath}`
          console.log(`✅ [Callback] URL corrigida: ${finalUrl}`)
        }
        
        // GARANTIR que é URL absoluta antes de redirecionar
        if (!finalUrl.startsWith('http')) {
          finalUrl = new URL(finalUrl, productionUrl).toString()
          console.log(`⚠️ [Callback] URL não era absoluta, convertendo: ${finalUrl}`)
        }
        
        // CRÍTICO: Usar redirect simples SEM parâmetros de query para evitar loops
        // Os parâmetros emailConfirmed e mensagem serão mostrados via cookies ou localStorage no cliente
        console.log(`✅ [Callback] Redirecionando para URL absoluta (sem query params): ${finalUrl}`)
        
        // Marcar token como processado para evitar loops
        const response = NextResponse.redirect(finalUrl, { status: 303 })
        if (token_hash) {
          // Marcar que este token foi processado (expira em 5 minutos)
          response.cookies.set('callback_processed', token_hash, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 300, // 5 minutos
            path: '/'
          })
        }
        
        // Usar redirect 303 (See Other) em vez de 307 para evitar loops
        // 303 força GET e limpa o método POST se houver
        return response
      }
      
      // Se não há sessão, redirecionar para login (não deveria acontecer, mas por segurança)
      console.log('⚠️ [Callback] Email confirmado mas sem sessão - redirecionando para login')
      const redirectUrl = new URL('/login', productionUrl)
      redirectUrl.searchParams.set('emailConfirmed', 'true')
      redirectUrl.searchParams.set('mensagem', 'Email confirmado! Faça login para continuar.')
      redirectUrl.searchParams.set('email', data.user.email || '')
      
      // FORÇAR URL absoluta completa
      let finalUrl = redirectUrl.toString()
      console.log(`🔍 [Callback] URL final de redirecionamento (login): ${finalUrl}`)
      console.log(`🔍 [Callback] Verificando se URL é absoluta: ${finalUrl.startsWith('http')}`)
      
      // Verificar se a URL não contém 0.0.0.0:10000
      if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
        console.error('❌ [Callback] URL de redirecionamento contém 0.0.0.0:10000 - CORRIGINDO!')
        finalUrl = finalUrl.replace(/https?:\/\/[^\/]+/, productionUrl)
        console.log(`✅ [Callback] URL corrigida: ${finalUrl}`)
      }
      
      // GARANTIR que é URL absoluta antes de redirecionar
      if (!finalUrl.startsWith('http')) {
        finalUrl = new URL(finalUrl, productionUrl).toString()
        console.log(`⚠️ [Callback] URL não era absoluta, convertendo: ${finalUrl}`)
      }
      
      // CRÍTICO: Sempre usar HTML redirect quando estamos em localhost:3000
      const isLocalhost = request.url.includes('localhost:3000') || request.nextUrl.href.includes('localhost:3000')
      
      if (isLocalhost || finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
        console.log('⚠️ [Callback] Usando HTML redirect para garantir URL absoluta correta (login sem sessão)')
        
        // Garantir que a URL é absoluta e correta
        let safeUrl = finalUrl
        if (safeUrl.includes('localhost:3000')) {
          safeUrl = safeUrl.replace(/http:\/\/localhost:3000/g, productionUrl)
          console.log(`✅ [Callback] URL corrigida de localhost: ${safeUrl}`)
        }
        if (safeUrl.includes('0.0.0.0') || safeUrl.includes(':10000')) {
          safeUrl = `${productionUrl}/login?emailConfirmed=true&mensagem=${encodeURIComponent('Email confirmado! Faça login para continuar.')}&email=${encodeURIComponent(data.user.email || '')}`
          console.log(`✅ [Callback] URL corrigida de 0.0.0.0: ${safeUrl}`)
        }
        
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=${safeUrl}">
  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p>Redirecionando... <a href="${safeUrl}">Clique aqui se não for redirecionado</a></p>
</body>
</html>`
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Location': safeUrl,
          },
        })
      }
      
      console.log(`✅ [Callback] Redirecionando para URL absoluta: ${finalUrl}`)
      return NextResponse.redirect(finalUrl, { status: 307 })
    } else if (error) {
      lastError = error
      console.log(`⚠️ [Callback] verifyOtp falhou com type: ${tryType}, erro: ${error.message}`)
      console.log(`🔍 [Callback] Erro completo:`, JSON.stringify(error, null, 2))
    }
  }
  
  // Se todas as tentativas falharam, redirecionar com erro
  if (lastError) {
    console.error('❌ [Callback] Erro ao verificar link:', lastError.message)
    console.error('❌ [Callback] Erro completo:', JSON.stringify(lastError, null, 2))
    console.error('❌ [Callback] Token_hash usado:', token_hash ? token_hash.substring(0, 20) + '...' : 'N/A')
    console.error('❌ [Callback] Type usado:', type)
    
    const errorMsg = (lastError.message || '').toLowerCase()
    let errorMessage = 'Erro ao confirmar email. O link pode ter expirado.'
    
    if (errorMsg.includes('expired') || errorMsg.includes('expirado')) {
      errorMessage = 'Link de confirmação expirado. Por favor, solicite um novo link.'
    } else if (errorMsg.includes('invalid') || errorMsg.includes('inválido')) {
      errorMessage = 'Link de confirmação inválido. Por favor, solicite um novo link.'
    }
    
    // CRÍTICO: GARANTIR URL absoluta completa - NUNCA usar requestUrl.origin
    // Sempre usar productionUrl explicitamente
    const redirectUrl = new URL('/login', productionUrl)
    redirectUrl.searchParams.set('error', errorMessage)
    
    // FORÇAR URL absoluta completa
    let finalUrl = redirectUrl.toString()
    
    // VERIFICAR se contém 0.0.0.0:10000 e corrigir
    if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
      console.error('❌ [Callback] URL de redirect contém 0.0.0.0:10000 - CORRIGINDO!')
      finalUrl = finalUrl.replace(/https?:\/\/[^\/]+/, productionUrl)
      console.log(`✅ [Callback] URL corrigida: ${finalUrl}`)
    }
    
    // GARANTIR que é URL absoluta
    if (!finalUrl.startsWith('http')) {
      finalUrl = new URL(finalUrl, productionUrl).toString()
      console.log(`⚠️ [Callback] Convertendo para URL absoluta: ${finalUrl}`)
    }
    
    console.log(`🔍 [Callback] Redirecionando para login (erro): ${finalUrl}`)
    console.log(`🔍 [Callback] Verificando URL final: ${finalUrl}`)
    console.log(`🔍 [Callback] É absoluta? ${finalUrl.startsWith('http')}`)
    console.log(`🔍 [Callback] Contém 0.0.0.0? ${finalUrl.includes('0.0.0.0')}`)
    console.log(`🔍 [Callback] Contém :10000? ${finalUrl.includes(':10000')}`)
    
    // ÚLTIMA VERIFICAÇÃO antes de redirecionar
    if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
      console.error('❌ [Callback] URL AINDA contém 0.0.0.0:10000 após correção!')
      // Forçar URL correta - construir do zero
      const forcedUrl = new URL('/login', productionUrl)
      forcedUrl.searchParams.set('error', errorMessage)
      finalUrl = forcedUrl.toString()
      console.log(`✅ [Callback] URL forçada para: ${finalUrl}`)
    }
    
    // VERIFICAÇÃO FINAL: garantir que é URL absoluta e não contém 0.0.0.0:10000
    if (!finalUrl.startsWith('http')) {
      console.error('❌ [Callback] URL não é absoluta! Convertendo...')
      finalUrl = new URL(finalUrl, productionUrl).toString()
    }
    
    // ÚLTIMA VERIFICAÇÃO antes de redirecionar
    if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
      console.error('❌ [Callback] URL FINAL AINDA contém 0.0.0.0:10000! FORÇANDO CORREÇÃO!')
      finalUrl = `${productionUrl}/login?error=${encodeURIComponent(errorMessage)}`
      console.log(`✅ [Callback] URL FINAL forçada para: ${finalUrl}`)
    }
    
    console.log(`✅ [Callback] REDIRECIONANDO FINALMENTE para: ${finalUrl}`)
    console.log(`✅ [Callback] URL é absoluta? ${finalUrl.startsWith('http')}`)
    console.log(`✅ [Callback] URL contém plenipay.com? ${finalUrl.includes('plenipay.com')}`)
    console.log(`✅ [Callback] URL contém 0.0.0.0? ${finalUrl.includes('0.0.0.0')}`)
    
    // CRÍTICO: Sempre usar HTML redirect quando estamos em localhost:3000
    // O NextResponse.redirect() pode usar a URL base errada (localhost:3000) mesmo com URL absoluta
    // O HTML redirect força o navegador a usar a URL absoluta correta
    const isLocalhost = request.url.includes('localhost:3000') || request.nextUrl.href.includes('localhost:3000')
    
    if (isLocalhost || finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
      console.log('⚠️ [Callback] Usando HTML redirect para garantir URL absoluta correta')
      console.log(`⚠️ [Callback] isLocalhost: ${isLocalhost}`)
      
      // Garantir que a URL é absoluta e correta
      let safeUrl = finalUrl
      if (safeUrl.includes('localhost:3000')) {
        safeUrl = safeUrl.replace(/http:\/\/localhost:3000/g, productionUrl)
        console.log(`✅ [Callback] URL corrigida de localhost: ${safeUrl}`)
      }
      if (safeUrl.includes('0.0.0.0') || safeUrl.includes(':10000')) {
        safeUrl = `${productionUrl}/login?error=${encodeURIComponent(errorMessage)}`
        console.log(`✅ [Callback] URL corrigida de 0.0.0.0: ${safeUrl}`)
      }
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=${safeUrl}">
  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p>Redirecionando... <a href="${safeUrl}">Clique aqui se não for redirecionado</a></p>
</body>
</html>`
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Location': safeUrl, // Header adicional para garantir
        },
      })
    }
    
    // Se não é localhost, tentar redirect normal
    try {
      return NextResponse.redirect(finalUrl, { status: 307 })
    } catch (error) {
      console.error('❌ [Callback] Erro ao fazer redirect, usando HTML redirect:', error)
      // Fallback: HTML redirect
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=${finalUrl}">
  <script>window.location.replace("${finalUrl}");</script>
</head>
<body>
  <p>Redirecionando... <a href="${finalUrl}">Clique aqui se não for redirecionado</a></p>
</body>
</html>`
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Location': finalUrl,
        },
      })
    }
  }

  // Fallback: redirecionar para login se não houve sucesso nem erro
  console.warn('⚠️ [Callback] Nenhum resultado - redirecionando para login')
  
  // CRÍTICO: GARANTIR URL absoluta completa - NUNCA usar requestUrl.origin
  const redirectUrl = new URL('/login', productionUrl)
  redirectUrl.searchParams.set('error', 'Erro ao confirmar email. Solicite um novo link.')
  
  // FORÇAR URL absoluta completa
  let finalUrl = redirectUrl.toString()
  
  // VERIFICAR se contém 0.0.0.0:10000 e corrigir
  if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
    console.error('❌ [Callback] URL de redirect contém 0.0.0.0:10000 - CORRIGINDO!')
    finalUrl = finalUrl.replace(/https?:\/\/[^\/]+/, productionUrl)
    console.log(`✅ [Callback] URL corrigida: ${finalUrl}`)
  }
  
  // GARANTIR que é URL absoluta
  if (!finalUrl.startsWith('http')) {
    finalUrl = new URL(finalUrl, productionUrl).toString()
    console.log(`⚠️ [Callback] Convertendo para URL absoluta: ${finalUrl}`)
  }
  
  console.log(`🔍 [Callback] Redirecionando para login (fallback): ${finalUrl}`)
  console.log(`🔍 [Callback] Verificando URL final: ${finalUrl}`)
  console.log(`🔍 [Callback] É absoluta? ${finalUrl.startsWith('http')}`)
  console.log(`🔍 [Callback] Contém 0.0.0.0? ${finalUrl.includes('0.0.0.0')}`)
  console.log(`🔍 [Callback] Contém :10000? ${finalUrl.includes(':10000')}`)
  
  // ÚLTIMA VERIFICAÇÃO antes de redirecionar
  if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
    console.error('❌ [Callback] URL AINDA contém 0.0.0.0:10000 após correção!')
    // Forçar URL correta
    finalUrl = `${productionUrl}/login?error=${encodeURIComponent('Erro ao confirmar email. Solicite um novo link.')}`
    console.log(`✅ [Callback] URL forçada para: ${finalUrl}`)
  }
  
  return NextResponse.redirect(finalUrl, { status: 307 })
}
