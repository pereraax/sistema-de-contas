-- ============================================
-- ADICIONAR CAMPO PARA NOME DO ATENDENTE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- Este campo armazena o nome fictício brasileiro do atendente
-- que foi atribuído automaticamente quando o suporte enviou a primeira mensagem
-- ============================================

-- 1. Adicionar coluna assigned_agent_name na tabela chat_conversations
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS assigned_agent_name TEXT;

-- 2. Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_agent_name 
ON chat_conversations(assigned_agent_name);

-- 3. Verificar se a coluna foi criada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_conversations' 
  AND column_name = 'assigned_agent_name';

-- ============================================
-- Campo adicionado com sucesso!
-- ============================================
-- Agora o sistema pode:
-- 1. Gerar um nome brasileiro fictício quando o suporte enviar a primeira mensagem
-- 2. Armazenar esse nome na conversa
-- 3. Exibir "João Silva está te atendendo agora" no chat do cliente
-- ============================================















