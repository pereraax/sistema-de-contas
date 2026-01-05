-- ============================================
-- VERIFICAR SE REGISTRO VIA WHATSAPP FOI CRIADO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- INSTRUÇÕES IMPORTANTES:
-- 1. Encontre o account_owner_id do usuário no painel admin (é o ID do perfil/profile)
-- 2. Substitua '00000000-0000-0000-0000-000000000000' 
--    pelo UUID real do usuário em TODAS as queries abaixo
-- 3. Exemplo: Se o ID for 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
--    Substitua todas as ocorrências de '00000000-0000-0000-0000-000000000000'
-- ============================================

-- SUBSTITUA O UUID ABAIXO PELO ID REAL DO USUÁRIO:
-- ⬇️ COLE O UUID AQUI ⬇️
-- '00000000-0000-0000-0000-000000000000'

-- 1. Ver todos os registros do usuário (via users que pertencem ao account_owner)
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = '00000000-0000-0000-0000-000000000000'::uuid
)
SELECT 
  r.id,
  r.user_id,
  r.nome,
  r.tipo,
  r.valor,
  r.data_registro,
  r.created_at,
  TO_CHAR(r.data_registro, 'DD/MM/YYYY') as data_evento_formatada,
  TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em_formatado,
  CASE 
    WHEN r.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    THEN 'SIM (mês atual)'
    ELSE 'NÃO (outro mês)'
  END as esta_no_mes_atual
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id
ORDER BY r.created_at DESC
LIMIT 20;

-- 2. Contar registros do mês atual usando created_at
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = '00000000-0000-0000-0000-000000000000'::uuid
)
SELECT 
  COUNT(*) as total_registros_mes_atual_created_at,
  COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as saidas,
  COUNT(CASE WHEN tipo = 'divida' THEN 1 END) as dividas
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id
WHERE r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 3. Ver usuários (users) que pertencem ao account_owner_id
SELECT 
  id,
  nome,
  account_owner_id,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em_formatado
FROM users
WHERE account_owner_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC;

-- 4. Ver o perfil (profile) do usuário
SELECT 
  id,
  email,
  nome,
  plano,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em_formatado
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 5. Contar total de registros (sem filtro de mês)
WITH usuarios_do_owner AS (
  SELECT id FROM users WHERE account_owner_id = '00000000-0000-0000-0000-000000000000'::uuid
)
SELECT 
  COUNT(*) as total_registros_todos,
  MIN(created_at) as primeiro_registro,
  MAX(created_at) as ultimo_registro,
  COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as total_entradas,
  COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as total_saidas,
  COUNT(CASE WHEN tipo = 'divida' THEN 1 END) as total_dividas
FROM registros r
INNER JOIN usuarios_do_owner u ON r.user_id = u.id;

