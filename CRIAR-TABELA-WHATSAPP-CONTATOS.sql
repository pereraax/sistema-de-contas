-- Contatos WhatsApp para identificar quem enviou "quero utilizar plenipay" e ainda não recebeu as 3 mensagens de boas-vindas.
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS whatsapp_contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  welcome_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contatos_phone ON whatsapp_contatos(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contatos_welcome_sent ON whatsapp_contatos(welcome_sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contatos_last_message_at ON whatsapp_contatos(last_message_at DESC);

-- RLS: acesso apenas via service role (API admin e webhook usam createAdminClient)
ALTER TABLE whatsapp_contatos ENABLE ROW LEVEL SECURITY;

-- Política que nega acesso anônimo; admin e webhook usam service role que bypassa RLS
CREATE POLICY "Apenas service role" ON whatsapp_contatos
  FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE whatsapp_contatos IS 'Contatos que enviaram mensagem no WhatsApp; welcome_sent_at preenchido quando as 3 mensagens de boas-vindas foram enviadas.';
