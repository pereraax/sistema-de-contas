-- ============================================
-- ADICIONAR CAMPO plen_activated NA TABELA whatsapp_sessions
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- Adiciona o campo para controlar se o assistente PLEN está ativado para cada usuário
-- ============================================

-- Adicionar coluna plen_activated na tabela whatsapp_sessions
ALTER TABLE whatsapp_sessions 
ADD COLUMN IF NOT EXISTS plen_activated BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_plen_activated ON whatsapp_sessions(plen_activated);

-- Comentário na coluna
COMMENT ON COLUMN whatsapp_sessions.plen_activated IS 'Indica se o assistente PLEN está ativado para este usuário via WhatsApp';

