import { sendMail, isSmtpConfigured } from '@/lib/mailer'

const APP_NAME = 'PLENIPAY'
const GRADIENT_HEADER = 'linear-gradient(135deg, #2c5aa0 0%, #1e4976 50%, #163a5f 100%)'

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suporte - ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: ${GRADIENT_HEADER}; padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">${APP_NAME}</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Suporte ao vivo</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px;"><strong>${APP_NAME}</strong> - Sua plataforma de gestão financeira</p>
              <p style="margin: 0; color: #adb5bd; font-size: 11px;">Este é um email automático. Para responder, acesse o chat no site.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function getHtmlChatIniciado(nome: string): string {
  const nomeExibido = nome?.trim() || 'Olá'
  const primeiroNome = nomeExibido.split(' ')[0] || nomeExibido
  return baseLayout(`
    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">Chamado de suporte aberto</h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      Olá, <strong>${primeiroNome}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      Seu chat de suporte foi iniciado com sucesso. Nossa equipe já foi notificada e responderá o mais breve possível.
    </p>
    <div style="background-color: #e8eef5; border-left: 4px solid #1e4976; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e4976; font-size: 14px; line-height: 1.5;">
        <strong>Dica:</strong> Mantenha a página do chat aberta ou volte ao site para acompanhar as respostas em tempo real.
      </p>
    </div>
    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Obrigado por entrar em contato. Estamos à disposição!
    </p>
  `)
}

function getHtmlNovaMensagemSuporte(nome: string): string {
  const nomeExibido = nome?.trim() || 'Olá'
  const primeiroNome = nomeExibido.split(' ')[0] || nomeExibido
  return baseLayout(`
    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">Nova mensagem do suporte</h2>
    <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      Olá, <strong>${primeiroNome}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      Você recebeu uma nova mensagem da nossa equipe de suporte. Acesse o chat no site para visualizar e responder.
    </p>
    <div style="background-color: #e8eef5; border-left: 4px solid #1e4976; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e4976; font-size: 14px; line-height: 1.5;">
        <strong>Resposta média:</strong> menos de 1 minuto. Não deixe sua conversa esperando!
      </p>
    </div>
    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Acesse o chat para continuar a conversa.
    </p>
  `)
}

export async function sendEmailChatIniciado(to: string, nome: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn('[chat-emails] SMTP não configurado. Email "Chat iniciado" não enviado.')
    return
  }
  try {
    await sendMail({
      to,
      subject: `[${APP_NAME}] Chat de suporte iniciado`,
      html: getHtmlChatIniciado(nome),
    })
    console.log('[chat-emails] Email "Chat iniciado" enviado para', to)
  } catch (err: any) {
    console.error('[chat-emails] Erro ao enviar email "Chat iniciado":', err?.message)
  }
}

export async function sendEmailNovaMensagemSuporte(to: string, nome: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn('[chat-emails] SMTP não configurado. Email "Nova mensagem suporte" não enviado.')
    return
  }
  try {
    await sendMail({
      to,
      subject: `[${APP_NAME}] Suporte acabou de te enviar uma mensagem`,
      html: getHtmlNovaMensagemSuporte(nome),
    })
    console.log('[chat-emails] Email "Nova mensagem suporte" enviado para', to)
  } catch (err: any) {
    console.error('[chat-emails] Erro ao enviar email "Nova mensagem suporte":', err?.message)
  }
}
