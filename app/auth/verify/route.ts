import { NextRequest, NextResponse } from 'next/server'

/**
 * Rota intermediária para interceptar links de verificação do Supabase
 * que contenham 0.0.0.0:10000 e redirecionar para o domínio correto
 * 
 * Esta rota é chamada ANTES do Supabase fazer o redirect final,
 * permitindo corrigir a URL antes do navegador tentar acessar 0.0.0.0:10000
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔍 [Verify] ========== INTERCEPTANDO LINK DE VERIFICAÇÃO ==========')
  console.log('🔍 [Verify] URL original:', request.url)
  
  const requestUrl = new URL(request.url)
  const hostHeader = request.headers.get('host') || ''
  const isLocalhost = hostHeader.includes('localhost') || hostHeader.startsWith('127.0.0.1')
  const productionUrl = isLocalhost ? `http://${hostHeader}`.replace(/\/$/, '') : 'https://plenipay.com'
  
  // Extrair TODOS os parâmetros da query string
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const redirect_to = requestUrl.searchParams.get('redirect_to') || requestUrl.searchParams.get('email_redirect_to')
  
  console.log('🔍 [Verify] Parâmetros extraídos:')
  console.log('  - token_hash:', token_hash ? token_hash.substring(0, 20) + '...' : 'NÃO ENCONTRADO')
  console.log('  - type:', type || 'NÃO ENCONTRADO')
  console.log('  - redirect_to:', redirect_to || 'NÃO ENCONTRADO')
  
  // Se o redirect_to contém 0.0.0.0:10000, CORRIGIR IMEDIATAMENTE
  let redirectToCorrigido = redirect_to
  
  if (redirect_to && (redirect_to.includes('0.0.0.0') || redirect_to.includes('10000'))) {
    console.error('❌ [Verify] redirect_to contém 0.0.0.0:10000!')
    console.error('❌ [Verify] URL incorreta:', redirect_to)
    console.error('❌ [Verify] Corrigindo para origem correta:', productionUrl)
    
    redirectToCorrigido = redirect_to
      .replace(/https?:\/\/0\.0\.0\.0:10000/g, productionUrl)
      .replace(/https?:\/\/0\.0\.0\.0\/auth/g, `${productionUrl}/auth`)
      .replace(/http:\/\/0\.0\.0\.0:10000/g, productionUrl)
      .replace(/http:\/\/0\.0\.0\.0/g, productionUrl)
    
    console.log('✅ [Verify] redirect_to corrigido:', redirectToCorrigido)
  }
  
  // Se não há redirect_to ou está incorreto, usar callback padrão
  if (!redirectToCorrigido || redirectToCorrigido.includes('0.0.0.0') || redirectToCorrigido.includes('10000')) {
    console.log('⚠️ [Verify] redirect_to não encontrado ou ainda incorreto, usando callback padrão')
    redirectToCorrigido = `${productionUrl}/auth/callback?next=/home`
  }
  
  // Construir URL final do callback com TODOS os parâmetros necessários
  const callbackUrl = new URL(redirectToCorrigido)
  
  // Adicionar token_hash e type se existirem
  if (token_hash) {
    callbackUrl.searchParams.set('token_hash', token_hash)
  }
  if (type) {
    callbackUrl.searchParams.set('type', type)
  }
  
  // Adicionar todos os outros parâmetros da query string original
  requestUrl.searchParams.forEach((value, key) => {
    // Ignorar parâmetros já processados
    if (key !== 'token_hash' && key !== 'type' && key !== 'redirect_to' && key !== 'email_redirect_to') {
      callbackUrl.searchParams.set(key, value)
    }
  })
  
  const finalUrl = callbackUrl.toString()
  
  console.log('🔄 [Verify] Redirecionando para:', finalUrl)
  console.log('✅ [Verify] ==========================================')
  
  // Redirecionar IMEDIATAMENTE para o callback correto
  return NextResponse.redirect(finalUrl, { status: 307 })
}
