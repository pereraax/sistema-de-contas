import nodemailer from 'nodemailer'

// Garantir que .env.local seja carregado (Next.js já carrega, mas em alguns contextos pode faltar)
if (typeof process !== 'undefined' && !process.env.SMTP_HOST && process.env.NODE_ENV !== 'production') {
  try {
    const path = require('path')
    const fs = require('fs')
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      content.split('\n').forEach((line: string) => {
        const match = line.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let val = match[2].trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
          if (!process.env[key]) process.env[key] = val
        }
      })
    }
  } catch (_) {}
}

export type SendMailArgs = {
  to: string
  subject: string
  html: string
}

function parseEnv(val: string | undefined): string {
  if (!val) return ''
  // Remove aspas do início e fim, mas preserva o conteúdo
  let s = String(val).trim()
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

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [SMTP] Verificando configuração SMTP:')
    console.log('  - SMTP_HOST:', host ? `✅ (${host})` : '❌')
    console.log('  - SMTP_PORT:', portRaw ? `✅ (${portRaw})` : '❌')
    console.log('  - SMTP_USER:', user ? '✅ definido' : '❌')
    console.log('  - SMTP_PASSWORD:', pass ? `✅ (${pass.length} caracteres)` : '❌')
    console.log('  - SMTP_FROM:', from ? '✅ definido' : '❌ (usa SMTP_USER)')
  }

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

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [SMTP] Configuração válida!')
    console.log(`  - Porta: ${port} (${secure ? 'SSL' : 'STARTTLS'})`)
    console.log(`  - From: ${fromFinal}`)
  }
  return { host, port, secure, auth: { user, pass }, from: fromFinal }
}

export function isSmtpConfigured() {
  return !!getSmtpConfig()
}

function createTransporter(cfg: { host: string; port: number; secure: boolean; auth: { user: string; pass: string }; from: string }) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
    connectionTimeout: 20000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    requireTLS: !cfg.secure,
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' as const },
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
  })
}

export async function sendMail({ to, subject, html }: SendMailArgs) {
  const cfg = getSmtpConfig()
  if (!cfg) {
    throw new Error('SMTP não configurado (variáveis SMTP_* ausentes).')
  }

  console.log('📤 [SMTP] Preparando para enviar email...')
  console.log(`  - Para: ${to}`)
  console.log(`  - Host: ${cfg.host}:${cfg.port} (${cfg.secure ? 'SSL' : 'STARTTLS'})`)

  const trySend = async (config: typeof cfg): Promise<any> => {
    const transporter = createTransporter(config)
    return transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    })
  }

  try {
    const result = await trySend(cfg)
    console.log('✅ [SMTP] Email enviado com sucesso!')
    console.log(`  - Message ID: ${result.messageId}`)
    return result
  } catch (error: any) {
    const isAuthError = error.code === 'EAUTH' || error.message?.includes('Invalid login') || error.message?.includes('535') || error.message?.includes('authentication failed')
    
    // Se falhou por autenticação na porta 587, tentar porta 465 (SSL) - comum na Hostinger
    if (isAuthError && cfg.port === 587 && cfg.host.includes('hostinger')) {
      console.warn('⚠️ [SMTP] Autenticação falhou na porta 587. Tentando porta 465 (SSL)...')
      try {
        const cfg465 = { ...cfg, port: 465 as number, secure: true }
        const result = await trySend(cfg465)
        console.log('✅ [SMTP] Email enviado com sucesso via porta 465!')
        return result
      } catch (err465: any) {
        console.error('❌ [SMTP] Porta 465 também falhou:', err465.message)
        // Continua e lança o erro original abaixo
      }
    }

    console.error('❌ [SMTP] Erro ao enviar email:', error.message)
    console.error('❌ [SMTP] Código:', error.code)

    let errorMessage = error.message || 'Erro desconhecido ao enviar email'
    if (error.code === 'EAUTH' || error.message?.includes('Invalid login') || error.message?.includes('535')) {
      errorMessage = 'Erro de autenticação SMTP. Confira no painel da Hostinger: usuário (email completo) e senha do email. Se tiver 2FA, use uma "Senha de app" para SMTP.'
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = `Erro de conexão SMTP. Verifique host (${cfg.host}) e porta (${cfg.port}).`
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Erro no endereço de email. Verifique o formato.'
    }

    const smtpError = new Error(errorMessage)
    ;(smtpError as any).code = error.code
    ;(smtpError as any).originalError = error
    throw smtpError
  }
}

