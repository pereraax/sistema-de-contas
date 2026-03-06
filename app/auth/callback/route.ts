import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/** HTML que faz exchangeCodeForSession no cliente (link do email oficial Supabase = ?code=...). Chama on-email-confirmed e redireciona com emailConfirmed para modal + WhatsApp. */
function buildClientSideExchangeHtml(
  code: string,
  productionUrl: string,
  nextPath: string,
  platformApp: boolean,
  supabaseUrl: string,
  supabaseAnonKey: string
): NextResponse {
  const fallbackSuffix = platformApp ? '?platform=app' : ''
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Entrando - PleniPay</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00C2FF,#0099CC);font-family:sans-serif;">
<div style="background:#fff;padding:2rem;border-radius:16px;text-align:center;max-width:380px;">
<p style="margin:0 0 1rem;">Confirmando email e entrando...</p>
<script>
(function(){
  var supabaseUrl = ${JSON.stringify(supabaseUrl)};
  var supabaseKey = ${JSON.stringify(supabaseAnonKey)};
  var code = ${JSON.stringify(code)};
  var nextPath = ${JSON.stringify(nextPath)};
  var fallbackSuffix = ${JSON.stringify(fallbackSuffix)};
  var base = ${JSON.stringify(productionUrl)};
  if (!supabaseUrl || !supabaseKey || !code) { window.location.replace(base + '/login?error=Configuração inválida'); return; }
  if (nextPath === '/Ilogin' || nextPath === 'Ilogin') nextPath = '/login';
  var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  supabase.auth.exchangeCodeForSession(code).then(function(r) {
    if (r.error) { window.location.replace(base + '/login?error=' + encodeURIComponent(r.error.message)); return; }
    var session = r.data && r.data.session;
    if (session) {
      fetch(base + '/api/auth/on-email-confirmed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token || '' })
      }).catch(function() {});
      try { document.cookie = 'email_confirmed=true; path=/; max-age=120; SameSite=Lax'; sessionStorage.setItem('email_just_confirmed', '1'); } catch (e) {}
    }
    var dest = (nextPath === '/login' || nextPath === 'login') ? '/login?emailConfirmed=true' : (nextPath + (nextPath.indexOf('?') >= 0 ? '&' : '?') + 'emailConfirmed=true');
    if (dest.indexOf('emailConfirmed') === -1) dest = dest + (dest.indexOf('?') >= 0 ? '&' : '?') + 'emailConfirmed=true';
    window.location.replace(base + dest + (platformApp ? '&platform=app' : ''));
  }).catch(function(e) { window.location.replace(base + '/login?error=' + encodeURIComponent(e.message)); });
})();
</script>
</div>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/**
 * PARTE 2: Callback Route Simples
 * Processa link de confirmação de email e faz login automático
 */
export async function GET(request: NextRequest) {
  try {
    return await handleCallback(request)
  } catch (err) {
    console.error('❌ [Callback] Erro não tratado:', err)
    return NextResponse.json(
      { code: 500, error_code: 'auth_callback_error', msg: 'Erro ao processar login. Tente novamente.' },
      { status: 500 }
    )
  }
}

async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Callback] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas')
    return NextResponse.json(
      { code: 503, error_code: 'config_missing', msg: 'Autenticação não configurada. Configure as variáveis do Supabase.' },
      { status: 503 }
    )
  }

  // URL base: SEMPRE a origem da requisição (localhost em dev, plenipay.com em prod). Em localhost NUNCA usar plenipay.com.
  const hostHeader = request.headers.get('host') || ''
  const isLocalhost = hostHeader.includes('localhost') || hostHeader.startsWith('127.0.0.1')
  const isHttps = request.headers.get('x-forwarded-proto') === 'https' || (hostHeader.includes('plenipay.com') && !isLocalhost)
  const siteUrl = isHttps ? `https://${hostHeader}` : `http://${hostHeader}`
  let productionUrl = siteUrl.replace(/\/$/, '') // sem barra no final
  // Em produção, SEMPRE usar plenipay.com para redirect e on-email-confirmed (link do email e janela "verificado" devem abrir no domínio certo).
  if (!isLocalhost) {
    productionUrl = 'https://plenipay.com'
    console.log('🔧 [Callback] Produção: usando https://plenipay.com para redirect + modal + WhatsApp')
  }
  if (isLocalhost) console.log('🔧 [Callback] Localhost detectado - redirect será para', productionUrl)

  const isCorrectDomain = hostHeader === 'plenipay.com' || hostHeader === 'www.plenipay.com' || hostHeader.includes('plenipay.com')
  // Em localhost (http) cookies com secure: true não são gravados — sessão se perde e usuário cai na welcome
  const isSecureOrigin = isCorrectDomain || request.headers.get('x-forwarded-proto') === 'https'

  console.log('🔍 [Callback] ========== CALLBACK INICIADO ==========')
  console.log('🔍 [Callback] Host Header (real):', hostHeader)
  console.log('🔍 [Callback] É domínio correto?', isCorrectDomain)
  console.log('🔍 [Callback] URL recebida (request.url):', request.url)
  console.log('🔍 [Callback] Referer:', request.headers.get('referer'))
  console.log('🔍 [Callback] Origin:', request.headers.get('origin'))
  console.log('🔍 [Callback] NextUrl.href:', request.nextUrl.href)
  console.log('🔍 [Callback] NextUrl.origin:', request.nextUrl.origin)
  
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const typeParam = request.nextUrl.searchParams.get('type') || 'signup'
  let nextParam = request.nextUrl.searchParams.get('next') || '/home'
  if (nextParam === '/Ilogin' || nextParam === 'Ilogin') nextParam = '/login'

  // token_hash: processar SEMPRE no cliente para evitar loop (cookies do servidor podem não ser enviados no redirect)
  if (tokenHash && !code) {
    console.log('🔑 [Callback] token_hash detectado - processando no cliente para evitar loop de redirect')
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirmando email - PleniPay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #00C2FF 0%, #0099CC 50%, #007A99 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      color: #0D1B2A;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .spinner {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.5rem;
      border: 4px solid #E5E7EB;
      border-top-color: #00C2FF;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0D1B2A;
      margin-bottom: 0.5rem;
    }
    .sub {
      font-size: 0.9375rem;
      color: #6B7280;
      margin-bottom: 1.75rem;
      line-height: 1.5;
    }
    .link {
      display: inline-block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #00C2FF;
      text-decoration: none;
      padding: 0.5rem 0;
      border-bottom: 1px solid transparent;
      transition: color 0.2s, border-color 0.2s;
    }
    .link:hover { color: #0099CC; border-bottom-color: #0099CC; }
  </style>
  <script>
    (async function() {
      const productionUrl = '${productionUrl}';
      const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
      const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
      const tokenHash = ${JSON.stringify(tokenHash)};
      const type = ${JSON.stringify(typeParam)};
      const nextPath = ${JSON.stringify(nextParam)};
      
      const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      const typesToTry = [type, 'magiclink', 'signup', 'email'];
      
      for (const t of typesToTry) {
        const { data, error } = await supabaseClient.auth.verifyOtp({ type: t, token_hash: tokenHash });
        if (!error && data?.session) {
          console.log('✅ Sessão criada via verifyOtp');
          try {
            await fetch(productionUrl + '/api/auth/on-email-confirmed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token || '' })
            });
          } catch (e) { console.warn('Notify WhatsApp:', e); }
          var destPath = nextPath === '/login' || nextPath === 'login' ? '/login?emailConfirmed=true&mensagem=' + encodeURIComponent('Email confirmado! Faça login para continuar.') : nextPath;
          if (destPath === '/home' || destPath === 'home' || destPath.startsWith('/home') && !destPath.includes('emailConfirmed')) destPath = '/home?emailConfirmed=true';
          else if (destPath && !destPath.includes('emailConfirmed') && destPath !== '/login') destPath = destPath + (destPath.includes('?') ? '&' : '?') + 'emailConfirmed=true';
          window.location.replace(productionUrl + destPath);
          return;
        }
      }
      console.error('❌ verifyOtp falhou');
      window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Link inválido ou expirado. Solicite um novo link.'));
    })();
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner" aria-hidden="true"></div>
    <h1>Confirmando email...</h1>
    <p class="sub">Estamos validando seu link. Em instantes você será redirecionado.</p>
    <a class="link" href="${productionUrl}${nextParam}">Clique aqui se não redirecionar</a>
  </div>
</body>
</html>`
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  }

  // Sem parâmetros na query (pode haver hash #access_token ou #token_hash — hash NUNCA vem no request ao servidor)
  // O layout redireciona / com hash para /auth/callback?next=/login#... para chegar aqui e processar no cliente
  if (!code && !tokenHash) {
    console.log('⚠️ [Callback] Sem code/token_hash na query - retornando HTML para processar hash no cliente (confirmação de email)')
    
    // Retornar página HTML que processa o hash no cliente usando Supabase JS
    // O hash (#access_token) não é enviado ao servidor, então precisa ser processado no cliente
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirmando email - PleniPay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    (async function() {
      const productionUrl = '${productionUrl}';
      const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
      const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
      
      // Criar cliente Supabase
      const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      
      const hash = window.location.hash;
      const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
      const tokenHashFromHash = hashParams && hashParams.get('token_hash');
      const typeFromHash = hashParams && hashParams.get('type');
      if (tokenHashFromHash && typeFromHash) {
        console.log('🔑 [Callback Client] Processando token_hash do hash...');
        const typesToTry = [typeFromHash, 'magiclink', 'signup', 'email'];
        for (const t of typesToTry) {
          const { data, error } = await supabaseClient.auth.verifyOtp({ type: t, token_hash: tokenHashFromHash });
          if (!error && data && data.session) {
            console.log('✅ [Callback Client] Sessão criada via verifyOtp (hash)');
            try {
              await fetch(productionUrl + '/api/auth/on-email-confirmed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token || '' })
              });
            } catch (e) { console.warn('Notify WhatsApp:', e); }
            let next = new URLSearchParams(window.location.search).get('next') || '/home';
            if (next === '/Ilogin' || next === 'Ilogin') next = '/login';
            var destPath = (next === '/login' || next === 'login') ? '/login?emailConfirmed=true&mensagem=' + encodeURIComponent('Email confirmado! Faça login para continuar.') : next;
            if (destPath === '/home' || destPath === 'home' || (destPath.startsWith('/home') && destPath.indexOf('emailConfirmed') === -1)) destPath = '/home?emailConfirmed=true';
            else if (destPath && destPath.indexOf('emailConfirmed') === -1 && destPath !== '/login') destPath = destPath + (destPath.indexOf('?') >= 0 ? '&' : '?') + 'emailConfirmed=true';
            try { document.cookie = 'email_confirmed=true; path=/; max-age=120; SameSite=Lax'; sessionStorage.setItem('email_just_confirmed', '1'); } catch (e) {}
            window.location.replace(productionUrl + (destPath.startsWith('/') ? destPath : '/' + destPath));
            return;
          }
        }
        console.error('❌ [Callback Client] verifyOtp com token_hash falhou');
        window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Link inválido ou expirado. Solicite um novo link.'));
        return;
      }
      if (hash && hash.includes('access_token')) {
        console.log('🔑 [Callback Client] Processando access_token do hash...');
        
        try {
          // Extrair parâmetros do hash
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            // Criar sessão usando access_token
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('❌ [Callback Client] Erro ao criar sessão:', error);
              window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Erro ao confirmar email. O link pode ter expirado.'));
              return;
            }
            
            if (data.session) {
              console.log('✅ [Callback Client] Sessão criada com sucesso!');
              try {
                await fetch(productionUrl + '/api/auth/on-email-confirmed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token || '' })
                });
              } catch (e) { console.warn('Notify WhatsApp:', e); }
              try { document.cookie = 'email_confirmed=true; path=/; max-age=120; SameSite=Lax'; sessionStorage.setItem('email_just_confirmed', '1'); } catch (e) {}
              let next = new URLSearchParams(window.location.search).get('next') || '/home';
              if (next === '/Ilogin' || next === 'Ilogin') next = '/login';
              var destPath = (next === '/login' || next === 'login') ? '/login?emailConfirmed=true&mensagem=' + encodeURIComponent('Email confirmado! Faça login para continuar.') : next;
              if (destPath === '/home' || destPath === 'home' || (destPath.startsWith('/home') && destPath.indexOf('emailConfirmed') === -1)) destPath = '/home?emailConfirmed=true';
              else if (destPath && destPath.indexOf('emailConfirmed') === -1 && destPath !== '/login') destPath = destPath + (destPath.indexOf('?') >= 0 ? '&' : '?') + 'emailConfirmed=true';
              window.location.replace(productionUrl + (destPath.startsWith('/') ? destPath : '/' + destPath));
              return;
            }
          }
        } catch (error) {
          console.error('❌ [Callback Client] Erro ao processar hash:', error);
          window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Erro ao processar autenticação.'));
          return;
        }
      }
      
      // Verificar se há code na query string (pode ter sido adicionado depois)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        console.log('🔑 [Callback Client] Processando code...');
        try {
          const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ [Callback Client] Erro ao trocar code:', error);
            window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Link de confirmação inválido ou expirado.'));
            return;
          }
          
          if (data.session) {
            console.log('✅ [Callback Client] Sessão criada via code!');
            try {
              await fetch(productionUrl + '/api/auth/on-email-confirmed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token || '' })
              });
            } catch (e) { console.warn('Notify WhatsApp:', e); }
            try { document.cookie = 'email_confirmed=true; path=/; max-age=120; SameSite=Lax'; sessionStorage.setItem('email_just_confirmed', '1'); } catch (e) {}
            let next = urlParams.get('next') || '/home';
            if (next === '/Ilogin' || next === 'Ilogin') next = '/login';
            var destPath = (next === '/login' || next === 'login') ? '/login?emailConfirmed=true&mensagem=' + encodeURIComponent('Email confirmado! Faça login para continuar.') : next;
            if (destPath === '/home' || destPath === 'home' || (destPath.startsWith('/home') && !destPath.includes('emailConfirmed'))) destPath = '/home?emailConfirmed=true';
            else if (destPath && !destPath.includes('emailConfirmed') && destPath !== '/login') destPath = destPath + (destPath.includes('?') ? '&' : '?') + 'emailConfirmed=true';
            window.location.replace(productionUrl + destPath);
            return;
          }
        } catch (error) {
          console.error('❌ [Callback Client] Erro ao processar code:', error);
          window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Erro ao processar autenticação.'));
          return;
        }
      }
      
      // Se não há hash nem code, verificar se já está autenticado
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session) {
        console.log('✅ [Callback Client] Já autenticado - redirecionando...');
        let next = urlParams.get('next') || '/home';
        if (next === '/Ilogin' || next === 'Ilogin') next = '/login';
        var destPath = (next === '/login' || next === 'login') ? '/login?emailConfirmed=true' : (next + (next.indexOf('?') >= 0 ? '&' : '?') + 'emailConfirmed=true');
        try { document.cookie = 'email_confirmed=true; path=/; max-age=120; SameSite=Lax'; sessionStorage.setItem('email_just_confirmed', '1'); } catch (e) {}
        window.location.replace(productionUrl + (destPath.startsWith('/') ? destPath : '/' + destPath));
        return;
      }
      
      // Se não há sessão nem parâmetros, redirecionar para login
      console.warn('⚠️ [Callback Client] Sem sessão nem parâmetros - redirecionando para login...');
      window.location.replace(productionUrl + '/login?error=' + encodeURIComponent('Link de confirmação inválido. Solicite um novo link.'));
    })();
  </script>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="spinner"></div>
      <h1>Processando...</h1>
      <p class="sub">Confirmando seu email. Aguarde um momento.</p>
    </div>
  </div>
  <style>
    .wrap { min-height: 100vh; background: linear-gradient(135deg, #00C2FF 0%, #0099CC 50%, #007A99 100%); display: flex; align-items: center; justify-content: center; padding: 1.5rem; font-family: 'Inter', -apple-system, sans-serif; }
    .card { background: #fff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2); padding: 2.5rem 2rem; max-width: 420px; width: 100%; text-align: center; }
    .spinner { width: 56px; height: 56px; margin: 0 auto 1.5rem; border: 4px solid #E5E7EB; border-top-color: #00C2FF; border-radius: 50%; animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .card h1 { font-size: 1.35rem; font-weight: 700; color: #0D1B2A; margin-bottom: 0.5rem; }
    .sub { font-size: 0.9375rem; color: #6B7280; line-height: 1.5; }
  </style>
</body>
</html>`
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  }
  
  // Cookie store (usado para persistir sessão Supabase e evitar loops)
  // Em alguns hosts (preview, Edge) cookies() pode lançar — nesse caso fazemos exchange no cliente
  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch (cookieErr) {
    console.warn('⚠️ [Callback] cookies() falhou, usando fallback no cliente:', cookieErr)
    return buildClientSideExchangeHtml(
      code!,
      productionUrl,
      nextParam,
      request.nextUrl.searchParams.get('platform') === 'app',
      supabaseUrl,
      supabaseAnonKey
    )
  }

  // CRÍTICO: Se estamos no domínio correto, IGNORAR completamente 0.0.0.0 na URL base
  // Isso é normal - o servidor roda em 0.0.0.0:3000 mas o usuário acessa plenipay.com
  if (isCorrectDomain) {
    console.log('✅ [Callback] Domínio correto detectado - ignorando URL base (0.0.0.0 é normal)')
  }

  /**
   * OAuth com Google/Apple: ?code=... (PKCE).
   * O code_verifier fica no navegador que iniciou o login; por isso o exchange SEMPRE fazemos no cliente.
   * Assim evitamos "invalid request: both auth code and code_verifier" e redirect para /login.
   */
  if (code) {
    console.log('🔑 [Callback] code detectado - trocando por sessão no cliente (PKCE)')
    const nextPath = nextParam
    const platformApp = request.nextUrl.searchParams.get('platform') === 'app'
    return buildClientSideExchangeHtml(code, productionUrl, nextPath, platformApp, supabaseUrl, supabaseAnonKey)
  }

  // CRÍTICO: Verificar se já estamos redirecionando para evitar loops
  // Se o referer já é /home ou /login, não processar novamente
  const referer = request.headers.get('referer')
  if (referer && (referer.includes('/home') || referer.includes('/login'))) {
    console.warn('⚠️ [Callback] Referer indica que já foi redirecionado - evitando loop')
    // Se já foi redirecionado, apenas retornar a página home sem processar
    const redirectUrl = new URL('/home', productionUrl)
    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
  
  // CRÍTICO: Sempre extrair parâmetros diretamente da query string, ignorando a URL base
  // Isso evita problemas quando request.url contém 0.0.0.0
  let token_hash: string | null = null
  let type: string = 'signup'
  let next: string = '/home'
  
  // Extrair token_hash primeiro para verificar cookie
  try {
    token_hash = request.nextUrl.searchParams.get('token_hash')
  } catch (error) {
    // Fallback: extrair da string diretamente
    const urlString = request.url
    const tokenMatch = urlString.match(/[?&#]token_hash=([^&#]+)/i)
    if (tokenMatch) token_hash = decodeURIComponent(tokenMatch[1])
  }
  
  // Verificar se o token já foi processado (cookieStore já foi obtido acima)
  const processedToken = cookieStore.get('callback_processed')
  if (processedToken && processedToken.value === token_hash && token_hash) {
    console.warn('⚠️ [Callback] Token já foi processado - redirecionando para home sem reprocessar')
    const redirectUrl = new URL('/home', productionUrl)
    const response = NextResponse.redirect(redirectUrl, { status: 303 })
    // Remover o cookie após usar
    response.cookies.delete('callback_processed')
    return response
  }
  
  // CRÍTICO: Ignorar completamente a URL base (pode ser 0.0.0.0:3000 em produção)
  // Isso é normal - o servidor roda em 0.0.0.0:3000 mas devemos sempre usar productionUrl para redirects
  // Se estamos no domínio correto, não fazer nada - apenas continuar processamento normalmente
  if (!isCorrectDomain && (request.url.includes('0.0.0.0') || request.nextUrl.href.includes('0.0.0.0'))) {
    console.log('ℹ️ [Callback] URL base contém 0.0.0.0 mas não estamos no domínio correto - isso é estranho')
    console.log('ℹ️ [Callback] request.url:', request.url)
    console.log('ℹ️ [Callback] request.nextUrl.href:', request.nextUrl.href)
  }
  
  // Extrair parâmetros diretamente da query string (não depende da URL base)
  try {
    // Usar request.nextUrl.searchParams que já extrai corretamente, independente da URL base
    token_hash = request.nextUrl.searchParams.get('token_hash')
    type = request.nextUrl.searchParams.get('type') || 'signup'
    next = request.nextUrl.searchParams.get('next') || '/home'
  } catch (error) {
    console.error('❌ [Callback] Erro ao extrair parâmetros:', error)
    // Fallback: extrair da string diretamente
    const urlString = request.url
    const tokenMatch = urlString.match(/[?&#]token_hash=([^&#]+)/i)
    if (tokenMatch) token_hash = decodeURIComponent(tokenMatch[1])
    const typeMatch = urlString.match(/[?&#]type=([^&#]+)/i)
    if (typeMatch) type = decodeURIComponent(typeMatch[1])
    const nextMatch = urlString.match(/[?&#]next=([^&#]+)/i)
    if (nextMatch) next = decodeURIComponent(nextMatch[1])
  }
  
  console.log('✅ [Callback] Parâmetros extraídos:', { 
    token_hash: token_hash ? token_hash.substring(0, 20) + '...' : null, 
    type, 
    next 
  })
  
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
  if (!token_hash) {
    try {
      const hash = request.nextUrl.hash || ''
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1))
        token_hash = hashParams.get('token_hash') || token_hash
        type = hashParams.get('type') || type
        next = hashParams.get('next') || next
        if (token_hash) {
          console.log('✅ [Callback] Token extraído do hash')
        }
      }
    } catch {
      // Ignorar erro
    }
  }
  
  // Extrair type e next da string também se ainda não encontrou
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
  if (next === '/Ilogin' || next === 'Ilogin') next = '/login'

  console.log('🔍 [Callback] Parâmetros finais extraídos:', { 
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

  // Criar cliente Supabase (cookieStore já foi obtido acima; supabaseUrl/supabaseAnonKey validados no início)
  if (supabaseUrl.includes('0.0.0.0') || supabaseUrl.includes(':10000')) {
    console.warn('⚠️ [Callback] NEXT_PUBLIC_SUPABASE_URL contém URL inválida:', supabaseUrl)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
  
  // Tentar diferentes tipos de confirmação (magiclink, signup, email)
  // IMPORTANTE: magiclink é usado pelo Supabase para links de confirmação de email
  const typesToTry = [type, 'magiclink', 'signup', 'email'].filter((t, i, arr) => arr.indexOf(t) === i)
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

      // Se há sessão, redirecionar (para /login ou /home conforme link do email)
      if (data.session) {
        const isLoginPage = next === 'login' || next === '/login'
        console.log('✅ [Callback] Sessão criada - redirecionando para', isLoginPage ? 'login' : next)
        console.log(`🔍 [Callback] productionUrl: ${productionUrl}`)
        console.log(`🔍 [Callback] next: ${next}`)
        
        let redirectPath = next.startsWith('/') ? next : `/${next}`
        const redirectUrl = new URL(redirectPath, productionUrl)
        // Sempre adicionar emailConfirmed=true para a página destino mostrar o modal de sucesso
        redirectUrl.searchParams.set('emailConfirmed', 'true')
        if (isLoginPage) {
          redirectUrl.searchParams.set('mensagem', 'Email confirmado! Faça login para continuar.')
        }
        
        let finalUrl = redirectUrl.toString()
        console.log(`🔍 [Callback] URL final de redirecionamento: ${finalUrl}`)
        
        // Verificar se a URL não contém 0.0.0.0:10000
        if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
          console.error('❌ [Callback] URL de redirecionamento contém 0.0.0.0:10000 - CORRIGINDO!')
          const fixedUrl = new URL(redirectPath, productionUrl)
          fixedUrl.searchParams.set('emailConfirmed', 'true')
          if (isLoginPage) fixedUrl.searchParams.set('mensagem', 'Email confirmado! Faça login para continuar.')
          finalUrl = fixedUrl.toString()
          console.log(`✅ [Callback] URL corrigida: ${finalUrl}`)
        }
        
        // GARANTIR que é URL absoluta antes de redirecionar
        if (!finalUrl.startsWith('http')) {
          finalUrl = new URL(finalUrl, productionUrl).toString()
          console.log(`⚠️ [Callback] URL não era absoluta, convertendo: ${finalUrl}`)
        }
        
        // emailConfirmed na URL + cookie para o modal de sucesso aparecer na página destino
        console.log(`✅ [Callback] Redirecionando para URL absoluta: ${finalUrl}`)
        
        // Marcar token como processado para evitar loops
        const response = NextResponse.redirect(finalUrl, { status: 303 })
        if (token_hash) {
          // Marcar que este token foi processado (expira em 5 minutos)
          response.cookies.set('callback_processed', token_hash, {
            httpOnly: true,
            secure: isSecureOrigin,
            sameSite: 'lax',
            maxAge: 300, // 5 minutos
            path: '/'
          })
          // Marcar que o callback foi processado recentemente (expira em 10 segundos)
          response.cookies.set('callback_recently_processed', 'true', {
            httpOnly: true,
            secure: isSecureOrigin,
            sameSite: 'lax',
            maxAge: 10,
            path: '/'
          })
        }
        // Sempre setar cookie de email confirmado (fluxo code ou token_hash) para o modal aparecer
        response.cookies.set('email_confirmed', 'true', {
          httpOnly: false,
          secure: isSecureOrigin,
          sameSite: 'lax',
          maxAge: 60,
          path: '/'
        })
        
        // CRÍTICO: Adicionar headers para evitar que o navegador siga redirects múltiplos
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        response.headers.set('X-Robots-Tag', 'noindex, nofollow') // Evitar indexação de redirects
        
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
            'Content-Type': 'text/html; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
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
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
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
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
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
