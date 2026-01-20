import nodemailer from 'nodemailer'

export type SendMailArgs = {
  to: string
  subject: string
  html: string
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const portRaw = process.env.SMTP_PORT?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD?.trim() // Remove espaços (problema comum)
  const from = process.env.SMTP_FROM?.trim()

  console.log('🔍 [SMTP] Verificando configuração SMTP:')
  console.log('  - SMTP_HOST:', host ? '✅' : '❌')
  console.log('  - SMTP_PORT:', portRaw ? `✅ (${portRaw})` : '❌')
  console.log('  - SMTP_USER:', user ? '✅' : '❌')
  console.log('  - SMTP_PASSWORD:', pass ? '✅ (***)' : '❌')
  console.log('  - SMTP_FROM:', from ? '✅' : '❌')

  if (!host || !portRaw || !user || !pass || !from) {
    console.warn('⚠️ [SMTP] Alguma variável SMTP está faltando ou vazia')
    return null
  }

  const port = Number(portRaw)
  if (!Number.isFinite(port)) {
    console.error('❌ [SMTP] Porta inválida:', portRaw)
    return null
  }

  // Hostinger normalmente usa 465 (secure) ou 587 (STARTTLS)
  const secure = port === 465

  console.log('✅ [SMTP] Configuração SMTP válida!')
  return { host, port, secure, auth: { user, pass }, from }
}

export function isSmtpConfigured() {
  return !!getSmtpConfig()
}

export async function sendMail({ to, subject, html }: SendMailArgs) {
  const cfg = getSmtpConfig()
  if (!cfg) {
    throw new Error('SMTP não configurado (variáveis SMTP_* ausentes).')
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
  })

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject,
    html,
  })
}

