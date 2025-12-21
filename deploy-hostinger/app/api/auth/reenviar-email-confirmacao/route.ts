import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    console.log('📧 ========== API: REENVIAR EMAIL DE CONFIRMAÇÃO ==========')
    console.log('📧 Email destinatário:', email)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Tentar primeiro com cliente público (resend)
    const supabasePublic = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    
    // Tentar múltiplos tipos para garantir funcionamento
    const tiposParaTentar = ['signup', 'email'] as const
    let ultimoErro: any = null
    let resultadoFinal: any = null
    let enviadoComSucesso = false

    for (const tipo of tiposParaTentar) {
      console.log(`📤 Tentando enviar com resend (type: ${tipo})...`)
      const { data, error } = await supabasePublic.auth.resend({
        type: tipo as any,
        email: email
      })

      if (error) {
        console.error(`❌ Erro com resend (type: ${tipo}):`, error.message)
        ultimoErro = error
        continue // Tentar próximo tipo
      }

      // Verificar se realmente foi enviado
      if (!data || (data.user === null && data.session === null)) {
        console.warn(`⚠️ Resposta vazia com type ${tipo}, tentando próximo tipo...`)
        continue
      }

      // Sucesso!
      console.log(`✅ Sucesso com type ${tipo}!`)
      resultadoFinal = data
      enviadoComSucesso = true
      break
    }

    // Se nenhum tipo funcionou
    if (!enviadoComSucesso && ultimoErro) {
      console.error('❌ Todos os tipos falharam:', ultimoErro.message)
      const error = ultimoErro
      console.error('📋 Código do erro:', (error as any)?.code)
      
      // Se falhar, tentar usar admin client para gerar link e enviar
      const adminClient = createAdminClient()
      
      if (adminClient) {
        console.log('🔄 Admin client disponível (mas não pode reenviar email OTP diretamente)')
        console.log('⚠️ GenerateLink requer senha e não envia email OTP')
        // Nota: generateLink não funciona para reenvio de OTP sem senha
      }
      
      // Retornar erro detalhado
      const errorMessage = error.message || ''
      const errorCode = (error as any)?.code || ''
      
      if (errorMessage.includes('rate limit') || errorCode.includes('rate_limit')) {
        return NextResponse.json({
          error: 'Limite de envio atingido. Aguarde alguns minutos.',
          code: 'rate_limit'
        }, { status: 429 })
      }
      
      if (errorMessage.includes('not found') || errorCode.includes('user_not_found')) {
        return NextResponse.json({
          error: 'Email não encontrado. Verifique se o email está correto.',
          code: 'user_not_found'
        }, { status: 404 })
      }
      
      // Se resposta estava vazia mesmo sem erro, é problema de configuração
      if (!resultadoFinal || (resultadoFinal.user === null && resultadoFinal.session === null)) {
        console.warn('⚠️ Resposta vazia - email não foi enviado')
        return NextResponse.json({
          success: false,
          needsConfig: true,
          error: 'Email não foi enviado. Verifique: 1) Template usando {{ .Token }}, 2) Tipo OTP ativado, 3) SMTP configurado',
          suggestion: 'Verifique Authentication → Email Templates → "Confirm signup" → Source → deve ter {{ .Token }}'
        })
      }

      return NextResponse.json({
        error: errorMessage || 'Erro ao reenviar código',
        code: errorCode,
        suggestion: 'Verifique: 1) Template usando {{ .Token }}, 2) Tipo OTP ativado, 3) SMTP configurado'
      }, { status: 500 })
    }

    console.log('✅ Resposta do resend:', resultadoFinal ? 'Sucesso' : 'Sem dados')
    console.log('📝 Dados:', JSON.stringify(resultadoFinal, null, 2))
    
    if (!resultadoFinal || (resultadoFinal.user === null && resultadoFinal.session === null)) {
      console.warn('⚠️ Resposta vazia - email não foi enviado realmente')
      return NextResponse.json({
        success: false,
        needsConfig: true,
        error: 'Email não foi enviado. Verifique: 1) Template usando {{ .Token }}, 2) Tipo OTP, 3) SMTP configurado',
        suggestion: 'Verifique Authentication → Email Templates → "Confirm signup" → Source → deve ter {{ .Token }}'
      })
    }

    console.log('✅ Email enviado com sucesso!')
    return NextResponse.json({
      success: true,
      message: 'Código enviado! Verifique seu email (incluindo spam).'
    })
    
  } catch (error: any) {
    console.error('❌ Erro crítico:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error?.message
    }, { status: 500 })
  }
}

