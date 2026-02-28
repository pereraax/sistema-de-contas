-- ============================================
-- ADICIONAR assistente_pausada NA TABELA profiles
-- ============================================
-- Quando true, a assistente PLEN não responde automaticamente a esse usuário
-- no WhatsApp; um humano pode atender a conversa. Ao despausar, a assistente
-- volta a responder.
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS assistente_pausada BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.assistente_pausada IS 'Se true, a assistente não responde no WhatsApp para este usuário; humano pode conversar. Despausar para a assistente voltar a responder.';

CREATE INDEX IF NOT EXISTS idx_profiles_assistente_pausada ON profiles(assistente_pausada) WHERE assistente_pausada = true;
