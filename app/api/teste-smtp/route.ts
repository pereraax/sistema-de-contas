import { NextRequest, NextResponse } from 'next/server'
import { isSmtpConfigured, sendMail } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    console.error('🧪 ========== TESTE SMTP ==========')
    console.error(`📧 Email de teste: ${email}`)

    if (!isSmtpConfigured()) {
      return NextResponse.json({ 
        error: 'SMTP não configurado',
        suggestion: 'Verifique as variáveis SMTP_* no .env.local'
      }, { status: 500 })
    }

    console.error('📤 Enviando email de teste...')
    await sendMail({
      to: email,
      subject: 'Teste SMTP - PLENIPAY',
      html: '<h1>Teste de SMTP</h1><p>Se você recebeu este email, o SMTP está funcionando corretamente!</p>'
    })

    console.error('✅ Email de teste enviado!')
    return NextResponse.json({
      success: true,
      message: 'Email de teste enviado! Verifique sua caixa de entrada.'
    })

  } catch (error: any) {
    console.error('❌ Erro no teste SMTP:', error.message)
    console.error('❌ Código:', error.code)
    return NextResponse.json({
      error: `Erro ao enviar email de teste: ${error.message}`,
      code: error.code,
      suggestion: 'Verifique as credenciais SMTP no .env.local'
    }, { status: 500 })
  }
}
