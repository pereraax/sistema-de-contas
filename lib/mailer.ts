import nodemailer from 'nodemailer'

export type SendMailArgs = {
  to: string
  subject: string
  html: string
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const portRaw = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM

  if (!host || !portRaw || !user || !pass || !from) {
    return null
  }

  const port = Number(portRaw)
  if (!Number.isFinite(port)) return null

  // Hostinger normalmente usa 465 (secure) ou 587 (STARTTLS)
  const secure = port === 465

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

