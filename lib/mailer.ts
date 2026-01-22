import nodemailer from 'nodemailer'

export type SendMailArgs = {
  to: string
  subject: string
  html: string
}

function parseEnv(val: string | undefined): string {
  if (!val) return ''
  // Remove aspas do início e fim, mas preserva o conteúdo
  let s = val.trim()
  // Remove aspas simples ou duplas apenas se estiverem nas extremidades
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  return s
}

function getSmtpConfig() {
  const host = parseEnv(process.env.SMTP_HOST)
  const portRaw = parseEnv(process.env.SMTP_PORT)
  const user = parseEnv(process.env.SMTP_USER)
  const pass = parseEnv(process.env.SMTP_PASSWORD)
  let from = parseEnv(process.env.SMTP_FROM)
  if (!from && user) from = user

  console.log('🔍 [SMTP] Verificando configuração SMTP:')
  console.log('  - SMTP_HOST:', host ? `✅ (${host})` : '❌')
  console.log('  - SMTP_PORT:', portRaw ? `✅ (${portRaw})` : '❌')
  console.log('  - SMTP_USER:', user ? `✅ (${user})` : '❌')
  console.log('  - SMTP_PASSWORD:', pass ? `✅ (${pass.length} caracteres)` : '❌')
  console.log('  - SMTP_FROM:', from ? `✅ (${from})` : '❌')

  if (!host || !portRaw || !user || !pass) {
    console.warn('⚠️ [SMTP] Faltam variáveis SMTP_* (SMTP_FROM opcional, usa SMTP_USER)')
    return null
  }

  const port = Number(portRaw)
  if (!Number.isFinite(port)) {
    console.error('❌ [SMTP] Porta inválida:', portRaw)
    return null
  }

  const secure = port === 465
  // Para Hostinger, o SMTP_FROM pode causar problemas se tiver formato "Nome <email>"
  // Vamos usar apenas o email para evitar problemas de autenticação
  let fromFinal = from || user
  // Se fromFinal tem formato "Nome <email>", extrair apenas o email
  const emailMatch = fromFinal.match(/<(.+?)>/)
  if (emailMatch) {
    fromFinal = emailMatch[1]
  }

  console.log('✅ [SMTP] Configuração válida!')
  console.log(`  - Porta: ${port} (${secure ? 'SSL' : 'STARTTLS'})`)
  console.log(`  - Usuário: ${user}`)
  console.log(`  - Senha: ${pass.length} caracteres (primeiro: ${pass[0]}, último: ${pass[pass.length - 1]})`)
  console.log(`  - From: ${fromFinal}`)
  console.log(`  ⚠️  Se ainda der EAUTH, a senha "${pass}" está incorreta.`)
  console.log(`  ⚠️  Teste fazer login no webmail com: ${user} / ${pass}`)
  return { host, port, secure, auth: { user, pass }, from: fromFinal }
}

export function isSmtpConfigured() {
  return !!getSmtpConfig()
}

export async function sendMail({ to, subject, html }: SendMailArgs) {
  const cfg = getSmtpConfig()
  if (!cfg) {
    throw new Error('SMTP não configurado (variáveis SMTP_* ausentes).')
  }

  console.log('📤 [SMTP] Preparando para enviar email...')
  console.log(`  - Para: ${to}`)
  console.log(`  - Assunto: ${subject}`)
  console.log(`  - Host: ${cfg.host}:${cfg.port}`)

  // Configurar transporter com opções robustas
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure, // true para 465 (SSL), false para 587 (STARTTLS)
    auth: cfg.auth,
    // Timeouts
    connectionTimeout: 15000, // 15 segundos
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // Para porta 587, garantir STARTTLS
    requireTLS: !cfg.secure,
    tls: {
      rejectUnauthorized: false // Aceitar certificados auto-assinados se necessário
    }
  })

  try {
    console.log('🔍 [SMTP] Verificando conexão SMTP...')
    try {
      await transporter.verify()
      console.log('✅ [SMTP] Conexão SMTP verificada!')
    } catch (verifyError: any) {
      console.error('⚠️ [SMTP] Verificação falhou, mas tentando enviar mesmo assim:', verifyError.message)
      // Continuar mesmo se verificação falhar - pode ser que funcione
    }
    
    console.log('📤 [SMTP] Enviando email...')
    console.log(`  - De: ${cfg.from}`)
    console.log(`  - Para: ${to}`)
    console.log(`  - Assunto: ${subject}`)
    
    const result = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      html,
    })
    
    console.log('✅ [SMTP] Email enviado com sucesso!')
    console.log(`  - Message ID: ${result.messageId}`)
    console.log(`  - Response: ${result.response}`)
    
    return result
  } catch (error: any) {
    console.error('❌ [SMTP] Erro ao enviar email:', error.message)
    console.error('❌ [SMTP] Código:', error.code)
    console.error('❌ [SMTP] Command:', error.command || 'N/A')
    console.error('❌ [SMTP] Response:', error.response || 'N/A')
    console.error('❌ [SMTP] Stack:', error.stack?.substring(0, 300))
    
    // Mensagem de erro mais específica
    let errorMessage = error.message || 'Erro desconhecido ao enviar email'
    if (error.code === 'EAUTH' || error.message?.includes('Invalid login')) {
      errorMessage = 'Erro de autenticação SMTP. Verifique usuário e senha no .env.local'
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = `Erro de conexão SMTP. Verifique host (${cfg.host}) e porta (${cfg.port}).`
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Erro no endereço de email. Verifique o formato.'
    } else if (error.code === 'ECERT') {
      errorMessage = 'Erro de certificado SSL. Verifique a configuração.'
    }
    
    const smtpError = new Error(errorMessage)
    ;(smtpError as any).code = error.code
    ;(smtpError as any).originalError = error
    throw smtpError
  }
}

