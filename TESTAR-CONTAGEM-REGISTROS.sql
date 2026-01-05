-- ============================================
-- TESTAR CONTAGEM DE REGISTROS DO MÊS ATUAL
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- INSTRUÇÕES:
-- 1. Execute a query (pressione "Run")
-- 2. Veja os resultados
-- Email: contacomerciaal01@gmail.com (já preenchido)
-- ============================================

WITH perfil_usuario AS (
  -- Buscar o perfil pelo email
  SELECT id as account_owner_id
  FROM profiles
  WHERE email = 'contacomerciaal01@gmail.com'
),
usuarios_da_conta AS (
  -- Buscar usuários (users) que pertencem a este account_owner_id
  SELECT u.id as user_id
  FROM users u
  INNER JOIN perfil_usuario p ON u.account_owner_id = p.account_owner_id
),
registros_todos AS (
  -- Buscar TODOS os registros desses usuários
  SELECT 
    r.id,
    r.user_id,
    r.nome,
    r.tipo,
    r.valor,
    r.created_at,
    r.data_registro
  FROM registros r
  INNER JOIN usuarios_da_conta u ON r.user_id = u.user_id
),
registros_mes_atual AS (
  -- Filtrar registros do mês atual usando created_at
  SELECT *
  FROM registros_todos
  WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
)
-- MOSTRAR RESULTADOS
SELECT 
  (SELECT COUNT(*) FROM registros_todos) as total_registros_todos,
  (SELECT COUNT(*) FROM registros_mes_atual) as registros_mes_atual,
  (SELECT COUNT(*) FROM registros_todos WHERE tipo = 'entrada') as total_entradas,
  (SELECT COUNT(*) FROM registros_todos WHERE tipo = 'saida') as total_saidas,
  (SELECT COUNT(*) FROM registros_todos WHERE tipo = 'divida') as total_dividas,
  (SELECT COUNT(*) FROM registros_mes_atual WHERE tipo = 'entrada') as entradas_mes,
  (SELECT COUNT(*) FROM registros_mes_atual WHERE tipo = 'saida') as saidas_mes,
  (SELECT COUNT(*) FROM registros_mes_atual WHERE tipo = 'divida') as dividas_mes,
  DATE_TRUNC('month', CURRENT_DATE) as inicio_mes,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second' as fim_mes;

-- ============================================
-- QUERY ALTERNATIVA: Ver os registros do mês
-- ============================================
/*
WITH perfil_usuario AS (
  SELECT id as account_owner_id
  FROM profiles
  WHERE email = 'contacomerciaal01@gmail.com'
),
usuarios_da_conta AS (
  SELECT u.id as user_id
  FROM users u
  INNER JOIN perfil_usuario p ON u.account_owner_id = p.account_owner_id
)
SELECT 
  r.id,
  r.nome,
  r.tipo,
  r.valor,
  r.created_at,
  r.data_registro,
  TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em_formatado,
  CASE 
    WHEN r.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    THEN 'SIM ✅'
    ELSE 'NÃO ❌'
  END as esta_no_mes_atual
FROM registros r
INNER JOIN usuarios_da_conta u ON r.user_id = u.user_id
ORDER BY r.created_at DESC
LIMIT 50;
*/

