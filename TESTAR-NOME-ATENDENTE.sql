-- ============================================
-- QUERIES PARA TESTAR NOME DO ATENDENTE
-- ============================================
-- Execute estas queries no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se o campo assigned_agent_name existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_conversations' 
  AND column_name = 'assigned_agent_name';

-- 2. Ver TODAS as conversas com seus nomes de atendente
SELECT 
  user_id,
  assigned_agent_name,
  is_closed,
  closed_at,
  created_at,
  updated_at
FROM chat_conversations
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Ver apenas conversas ABERTAS com nome de atendente
SELECT 
  user_id,
  assigned_agent_name,
  created_at,
  updated_at
FROM chat_conversations
WHERE is_closed = false
  AND assigned_agent_name IS NOT NULL
ORDER BY updated_at DESC;

-- 4. Ver conversas SEM nome de atendente (precisam gerar)
SELECT 
  user_id,
  assigned_agent_name,
  is_closed,
  created_at
FROM chat_conversations
WHERE assigned_agent_name IS NULL
  OR assigned_agent_name = ''
ORDER BY created_at DESC;

-- 5. Contar conversas por status
SELECT 
  CASE 
    WHEN assigned_agent_name IS NULL OR assigned_agent_name = '' THEN 'Sem nome'
    ELSE 'Com nome'
  END as status,
  COUNT(*) as total,
  SUM(CASE WHEN is_closed = false THEN 1 ELSE 0 END) as abertas,
  SUM(CASE WHEN is_closed = true THEN 1 ELSE 0 END) as fechadas
FROM chat_conversations
GROUP BY 
  CASE 
    WHEN assigned_agent_name IS NULL OR assigned_agent_name = '' THEN 'Sem nome'
    ELSE 'Com nome'
  END;

-- ============================================
-- Para testar com um usuário específico:
-- ============================================
-- Primeiro, obtenha o user_id de um usuário real:
-- SELECT id, email FROM auth.users LIMIT 5;

-- Depois, substitua 'AQUI-VAI-O-UUID-DO-USUARIO' pelo UUID real:
-- SELECT 
--   user_id,
--   assigned_agent_name,
--   is_closed,
--   created_at
-- FROM chat_conversations
-- WHERE user_id = 'AQUI-VAI-O-UUID-DO-USUARIO';

















