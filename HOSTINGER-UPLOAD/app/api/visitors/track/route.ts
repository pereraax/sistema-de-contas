import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Função para gerar session ID único
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obter ou criar session ID
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('visitor_session_id')?.value
    
    if (!sessionId) {
      sessionId = generateSessionId()
      cookieStore.set('visitor_session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 365, // 1 ano
        path: '/',
        sameSite: 'lax',
        httpOnly: false, // Precisa ser acessível via JavaScript
      })
    }

    // Obter dados da requisição
    const body = await request.json()
    const { path, referrer } = body
    
    // Obter informações do usuário (se autenticado)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Obter IP e User Agent
    // Pegar o primeiro IP da lista (x-forwarded-for pode ter múltiplos IPs)
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const ipAddress = forwardedFor.split(',')[0]?.trim() || 
                      request.headers.get('x-real-ip') || 
                      request.headers.get('cf-connecting-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Ignorar se IP for 'unknown' ou inválido
    if (ipAddress === 'unknown' || !ipAddress) {
      return NextResponse.json({ success: false, message: 'IP não identificado' })
    }

    // Verificar se já existe um visitante com este IP
    const { data: existingVisitor } = await supabase
      .from('visitantes')
      .select('*')
      .eq('ip_address', ipAddress)
      .single()

    if (existingVisitor) {
      // Atualizar visitante existente (mesmo IP)
      const { error } = await supabase
        .from('visitantes')
        .update({
          last_visit_at: new Date().toISOString(),
          visit_count: existingVisitor.visit_count + 1,
          path: path || existingVisitor.path,
          referrer: referrer || existingVisitor.referrer,
          user_id: user?.id || existingVisitor.user_id,
          session_id: sessionId, // Atualizar session_id também
          user_agent: userAgent, // Atualizar user agent
        })
        .eq('ip_address', ipAddress)

      if (error) {
        console.error('Erro ao atualizar visitante:', error)
      }
    } else {
      // Criar novo visitante (novo IP)
      const { error } = await supabase
        .from('visitantes')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          ip_address: ipAddress,
          user_agent: userAgent,
          path: path || '/',
          referrer: referrer || null,
          first_visit_at: new Date().toISOString(),
          last_visit_at: new Date().toISOString(),
          visit_count: 1,
        })

      if (error) {
        console.error('Erro ao criar visitante:', error)
      }
    }

    // Atualizar ou criar sessão ativa baseada em IP
    const { data: existingSession } = await supabase
      .from('sessoes_ativas')
      .select('*')
      .eq('ip_address', ipAddress)
      .single()

    if (existingSession) {
      // Atualizar última atividade (mesmo IP)
      await supabase
        .from('sessoes_ativas')
        .update({
          last_activity_at: new Date().toISOString(),
          path: path || existingSession.path,
          user_id: user?.id || existingSession.user_id,
          session_id: sessionId,
          user_agent: userAgent,
        })
        .eq('ip_address', ipAddress)
    } else {
      // Criar nova sessão ativa (novo IP)
      await supabase
        .from('sessoes_ativas')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          ip_address: ipAddress,
          user_agent: userAgent,
          path: path || '/',
          last_activity_at: new Date().toISOString(),
        })
    }

    // Limpar sessões inativas (mais de 2 minutos sem atividade)
    await supabase.rpc('limpar_sessoes_inativas')

    return NextResponse.json({ success: true, sessionId })
  } catch (error: any) {
    console.error('Erro ao rastrear visitante:', error)
    return NextResponse.json(
      { error: 'Erro ao rastrear visitante', details: error.message },
      { status: 500 }
    )
  }
}








