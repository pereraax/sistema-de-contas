-- ============================================
-- ADICIONAR plen_activated_by_admin NA TABELA profiles
-- ============================================
-- Permite que o admin ative a assistente PLEN manualmente para um usuário.
-- Quando o usuário enviar mensagem do número cadastrado (telefone/whatsapp),
-- o sistema identifica e responde normalmente.
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plen_activated_by_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.plen_activated_by_admin IS 'Se true, o admin ativou a assistente PLEN; mensagens do número do usuário serão atendidas mesmo sem autenticação prévia via WhatsApp';

CREATE INDEX IF NOT EXISTS idx_profiles_plen_activated_by_admin ON profiles(plen_activated_by_admin) WHERE plen_activated_by_admin = true;
