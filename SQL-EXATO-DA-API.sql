-- ============================================
-- SQL EXATO QUE A API ESTÁ EXECUTANDO
-- ============================================
-- Este é o SQL equivalente ao que o endpoint
-- /api/admin/usuario/registros-count está fazendo
-- ============================================

-- SUBSTITUA 'UUID_DO_ACCOUNT_OWNER' pelo UUID do account_owner_id
-- Você pode encontrar este UUID no painel admin ou no perfil do usuário

-- PASSO 1: Buscar usuários (users) que pertencem ao account_owner_id
-- SELECT id, nome, account_owner_id
-- FROM users
-- WHERE account_owner_id = 'UUID_DO_ACCOUNT_OWNER'::uuid;

-- PASSO 2: Buscar total de registros (todos)
-- SELECT COUNT(*)
-- FROM registros
-- WHERE user_id IN (
--   SELECT id FROM users WHERE account_owner_id = 'UUID_DO_ACCOUNT_OWNER'::uuid
-- );

-- PASSO 3: Buscar registros do mês atual usando created_at
-- Este é o SQL mais importante que a API está executando agora:
SELECT 
  COUNT(*) as registros_mes_atual
FROM registros
WHERE user_id IN (
  SELECT id FROM users WHERE account_owner_id = 'UUID_DO_ACCOUNT_OWNER'::uuid
)
AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ============================================
-- VERSÃO COMPLETA COM TODOS OS DADOS
-- ============================================
/*
WITH usuarios_da_conta AS (
  SELECT id as user_id
  FROM users
  WHERE account_owner_id = 'UUID_DO_ACCOUNT_OWNER'::uuid
)
SELECT 
  -- Contagem total
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta)) as total_registros,
  
  -- Contagem do mês atual (usando created_at)
  (
    SELECT COUNT(*) 
    FROM registros 
    WHERE user_id IN (SELECT user_id FROM usuarios_da_conta)
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  ) as registros_mes,
  
  -- Contagem por tipo (todos os registros)
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'entrada') as registros_entrada,
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'saida') as registros_saida,
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'divida') as registros_divida,
  
  -- Período do mês
  DATE_TRUNC('month', CURRENT_DATE) as inicio_mes,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second' as fim_mes;
*/

-- ============================================
-- VERSÃO POR EMAIL (MAIS FÁCIL)
-- ============================================
/*
WITH perfil_usuario AS (
  SELECT id as account_owner_id
  FROM profiles
  WHERE email = 'seu-email@exemplo.com'  -- ⬅️ SUBSTITUA AQUI!
),
usuarios_da_conta AS (
  SELECT id as user_id
  FROM users
  WHERE account_owner_id IN (SELECT account_owner_id FROM perfil_usuario)
)
SELECT 
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta)) as total_registros,
  (
    SELECT COUNT(*) 
    FROM registros 
    WHERE user_id IN (SELECT user_id FROM usuarios_da_conta)
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  ) as registros_mes,
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'entrada') as registros_entrada,
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'saida') as registros_saida,
  (SELECT COUNT(*) FROM registros WHERE user_id IN (SELECT user_id FROM usuarios_da_conta) AND tipo = 'divida') as registros_divida;
*/

