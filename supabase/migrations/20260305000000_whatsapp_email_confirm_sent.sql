-- Marca quando enviamos "Enviei um link para confirmar seu email" para o contato.
-- Usado para reconhecer respostas "pronto/verifiquei" e responder "Ok, confirmado!" em vez de genérico.
ALTER TABLE whatsapp_contatos
  ADD COLUMN IF NOT EXISTS email_confirm_link_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN whatsapp_contatos.email_confirm_link_sent_at IS 'Quando enviamos a mensagem de link de confirmação de email (cadastro WhatsApp). Respostas "pronto/verifiquei" são tratadas como confirmação.';
