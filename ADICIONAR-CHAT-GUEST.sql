-- ============================================
-- SUPORTE A VISITANTES (GUEST) NO CHAT
-- ============================================
-- Execute no SQL Editor do Supabase para permitir
-- que usuários não logados iniciem conversa de suporte.
-- ============================================

-- 1. chat_conversations: permitir conversas sem user_id (visitante)
ALTER TABLE chat_conversations
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Índice para buscar conversa de visitante por email
CREATE INDEX IF NOT EXISTS idx_chat_conversations_guest_email
  ON chat_conversations(guest_email)
  WHERE guest_email IS NOT NULL;

-- 2. chat_messages: permitir mensagens de visitante
ALTER TABLE chat_messages
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_messages_guest_email
  ON chat_messages(guest_email)
  WHERE guest_email IS NOT NULL;

-- 3. Constraint: conversa deve ter user_id OU guest_email
ALTER TABLE chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_user_or_guest;

ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_user_or_guest
  CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

-- ============================================
-- Pronto. Use as APIs /api/chat/guest/* para visitantes.
-- ============================================
