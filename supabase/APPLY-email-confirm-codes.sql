-- Cole este SQL no Supabase Dashboard > SQL Editor > New query e execute (Run).
-- Código de confirmação de email (cadastro pelo WhatsApp): usuário recebe código por email e envia na conversa.
CREATE TABLE IF NOT EXISTS email_confirm_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  code TEXT NOT NULL,
  phone TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_confirm_codes_code_phone ON email_confirm_codes (code, phone);
CREATE INDEX IF NOT EXISTS idx_email_confirm_codes_expires ON email_confirm_codes (expires_at);

COMMENT ON TABLE email_confirm_codes IS 'Códigos de 6 dígitos enviados por email no cadastro via WhatsApp. Usuário digita o código na conversa para confirmar o email.';
