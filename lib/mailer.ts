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

/** Resend (API HTTP) funciona em produção quando a rede bloqueia SMTP (ex.: Railway → ETIMEDOUT). */
export function isResendConfigured() {
  return !!parseEnv(process.env.RESEND_API_KEY)
}

function getResendFrom(): string {
  const from = parseEnv(process.env.RESEND_FROM)
  if (from) return from
  const user = parseEnv(process.env.SMTP_USER)
  if (user) return user
  return 'PleniPay <noreply@plenipay.com>'
}

async function sendMailViaResend({ to, subject, html }: SendMailArgs): Promise<{ messageId?: string }> {
  const apiKey = parseEnv(process.env.RESEND_API_KEY)
  if (!apiKey) throw new Error('RESEND_API_KEY não configurado.')
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const from = getResendFrom()
  const { data, error } = await resend.emails.send({ from, to: [to], subject, html })
  if (error) throw new Error(error.message || 'Resend falhou')
  return { messageId: data?.id }
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
  // SMTP em primeiro lugar: quem configura SMTP_* usa só SMTP (sem Resend)
  const cfg = getSmtpConfig()
  if (cfg) {

  if (process.env.NODE_ENV === 'development') {
    console.log('📤 [SMTP] Preparando para enviar email...')
    console.log(`  - Para: ${to}`)
    console.log(`  - Host: ${cfg.host}:${cfg.port} (${cfg.secure ? 'SSL' : 'STARTTLS'})`)
  } else {
    console.warn(`[SMTP] Tentando envio para ${cfg.host}:${cfg.port} (${cfg.secure ? 'SSL' : 'STARTTLS'}) destino: ${to}`)
  }

  const trySend = async (config: typeof cfg): Promise<any> => {
    const transporter = createTransporter(config)
    return transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    })
  }

  // Em produção a porta 587 costuma dar timeout (ETIMEDOUT). Hostinger aceita 465 (SSL).
  // Se SMTP_PORT=465 falhar (ex.: Railway bloqueia 465), tentar 587 como fallback.
  const try465First = cfg.port === 587 && process.env.NODE_ENV === 'production'
  const try587AsFallback = cfg.port === 465 && process.env.NODE_ENV === 'production'
  let configsToTry: Array<{ host: string; port: number; secure: boolean; auth: { user: string; pass: string }; from: string }> = [cfg]
  if (try465First) configsToTry = [{ ...cfg, port: 465, secure: true }, cfg]
  else if (try587AsFallback) configsToTry = [cfg, { ...cfg, port: 587, secure: false }]

  let lastError: any = null
  for (let i = 0; i < configsToTry.length; i++) {
    const c = configsToTry[i]
    try {
      if (try465First && i === 0) {
        console.warn('[SMTP] Em produção com porta 587 configurada: tentando primeiro porta 465 (SSL) para evitar timeout.')
      }
      const result = await trySend(c)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [SMTP] Email enviado com sucesso!')
        console.log(`  - Message ID: ${result.messageId}`)
      } else {
        console.warn('[SMTP] Email enviado com sucesso.')
      }
      return result
    } catch (error: any) {
      lastError = error
      const isConnectionError = error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')
      const isAuthError = error.code === 'EAUTH' || error.message?.includes('Invalid login') || error.message?.includes('535') || error.message?.includes('authentication failed')
      const nextIs465 = try465First && i === 0
      const nextIs587 = try587AsFallback && i === 0
      if (nextIs465 && (isConnectionError || isAuthError)) {
        const reason = isConnectionError ? 'conexão' : 'autenticação'
        console.warn(`[SMTP] Porta 465 falhou (${reason}). Tentando porta 587...`)
        continue
      }
      if (nextIs587 && (isConnectionError || isAuthError)) {
        console.warn('[SMTP] Porta 465 falhou. Tentando porta 587 (STARTTLS)...')
        continue
      }
      if (cfg.port === 587 && !try465First && !try587AsFallback && (isAuthError || isConnectionError)) {
        const reason = isConnectionError ? 'conexão' : 'autenticação'
        console.warn(`[SMTP] Falha de ${reason} na porta 587. Tentando porta 465 (SSL)...`)
        try {
          const result = await trySend({ ...cfg, port: 465 as number, secure: true })
          if (process.env.NODE_ENV === 'development') console.log('✅ [SMTP] Email enviado com sucesso via porta 465!')
          return result
        } catch (err465: any) {
          console.error('[SMTP] Porta 465 também falhou:', err465.message)
        }
      }
      break
    }
  }

  const error = lastError
  if (error) {
    console.error('[SMTP] Erro ao enviar email:', error.message)
    console.error('[SMTP] Código:', error.code)

    const isConnectionError = error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')
    if (process.env.NODE_ENV === 'production' && isConnectionError && isResendConfigured()) {
      console.warn('[SMTP] Conexão falhou (rede pode bloquear SMTP). Tentando Resend...')
      try {
        const result = await sendMailViaResend({ to, subject, html })
        console.warn('[Resend] Email enviado com sucesso (fallback).')
        return result
      } catch (resendErr: any) {
        console.error('[Resend] Fallback falhou:', resendErr.message)
      }
    }

    let errorMessage = error.message || 'Erro desconhecido ao enviar email'
    if (error.code === 'EAUTH' || error.message?.includes('Invalid login') || error.message?.includes('535')) {
      errorMessage = 'Erro de autenticação SMTP. Confira no painel da Hostinger: usuário (email completo) e senha do email. Se tiver 2FA, use uma "Senha de app" para SMTP.'
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = `Erro de conexão SMTP. Verifique host (${cfg.host}) e porta (${cfg.port}). Em produção (ex.: Railway) a rede pode bloquear SMTP: configure RESEND_API_KEY para fallback.`
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Erro no endereço de email. Verifique o formato.'
    }

    const smtpError = new Error(errorMessage)
    ;(smtpError as any).code = error.code
    ;(smtpError as any).originalError = error
    throw smtpError
  }
  }

  // Sem SMTP: tentar Resend se configurado (comum em produção onde SMTP é bloqueado)
  if (isResendConfigured()) {
    return sendMailViaResend({ to, subject, html })
  }

  throw new Error('Email não configurado. Adicione SMTP_* ou RESEND_API_KEY no painel (ex.: Railway). Para produção, RESEND_API_KEY evita bloqueio de SMTP.')
}

