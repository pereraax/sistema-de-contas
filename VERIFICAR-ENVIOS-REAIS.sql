-- ============================================
-- VERIFICAR ENVIOS REAIS NA TABELA
-- ============================================

-- 1. Contar TOTAL de registros na tabela
SELECT 
  'Total de registros na tabela' as verificacao,
  COUNT(*) as total
FROM whatsapp_envios;

-- 2. Ver TODOS os registros (últimos 20)
SELECT 
  id,
  account_owner_id,
  tipo_registro,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM whatsapp_envios
ORDER BY created_at DESC
LIMIT 20;

-- 3. Contar envios por usuário (account_owner_id)
SELECT 
  account_owner_id,
  COUNT(*) as total_envios,
  COUNT(CASE WHEN tipo_registro = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN tipo_registro = 'saida' THEN 1 END) as saidas,
  COUNT(CASE WHEN tipo_registro = 'divida' THEN 1 END) as dividas,
  MIN(created_at) as primeiro_envio,
  MAX(created_at) as ultimo_envio
FROM whatsapp_envios
GROUP BY account_owner_id
ORDER BY total_envios DESC;

-- 4. Verificar se há registros recentes (últimas 24 horas)
SELECT 
  'Registros nas últimas 24 horas' as verificacao,
  COUNT(*) as total
FROM whatsapp_envios
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 5. Verificar se há algum problema com account_owner_id NULL
SELECT 
  'Registros com account_owner_id NULL' as verificacao,
  COUNT(*) as total
FROM whatsapp_envios
WHERE account_owner_id IS NULL;

