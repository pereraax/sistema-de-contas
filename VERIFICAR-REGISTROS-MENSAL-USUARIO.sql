-- ============================================
-- VERIFICAR REGISTROS MENSAL DE UM USUÁRIO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- Substitua 'USER_ID_AQUI' pelo ID do usuário que você quer verificar
-- ============================================

-- 1. Ver todos os registros do mês atual de um usuário específico
-- Substitua 'USER_ID_AQUI' pelo account_owner_id do usuário
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = 'USER_ID_AQUI'::uuid
)
SELECT 
  r.id,
  r.user_id,
  r.tipo,
  r.valor,
  r.data_registro,
  r.created_at,
  TO_CHAR(r.data_registro, 'DD/MM/YYYY') as data_formatada,
  TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em,
  CASE 
    WHEN r.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    THEN 'SIM'
    ELSE 'NÃO'
  END as esta_no_mes_atual
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id
WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY r.created_at DESC;

-- 2. Contar total de registros do mês atual
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = 'USER_ID_AQUI'::uuid
)
SELECT 
  COUNT(*) as total_registros_mes_atual,
  COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as saidas,
  COUNT(CASE WHEN tipo = 'divida' THEN 1 END) as dividas
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id
WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 3. Verificar plano do usuário
SELECT 
  id,
  email,
  plano,
  plano_status,
  registros_mes_atual,
  registros_mes_referencia,
  TO_CHAR(registros_mes_referencia, 'DD/MM/YYYY') as data_referencia_formatada
FROM profiles
WHERE id = 'USER_ID_AQUI'::uuid;

-- 4. Ver todos os registros (sem filtro de mês) para debug
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = 'USER_ID_AQUI'::uuid
)
SELECT 
  COUNT(*) as total_registros_todos,
  MIN(created_at) as primeiro_registro,
  MAX(created_at) as ultimo_registro
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id;

