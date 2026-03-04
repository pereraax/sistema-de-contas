-- Fluxo de criação de conta pelo WhatsApp: estado (nome -> email) por número.
CREATE TABLE IF NOT EXISTS whatsapp_signup_pending (
  phone TEXT PRIMARY KEY,
  step TEXT NOT NULL CHECK (step IN ('nome', 'email')),
  nome TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_signup_pending IS 'Estado do cadastro via WhatsApp: aguardando nome ou email antes de criar a conta.';
