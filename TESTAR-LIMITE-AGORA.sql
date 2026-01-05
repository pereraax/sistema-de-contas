-- ============================================
-- TESTAR LIMITE DE ENVIOS WHATSAPP
-- ============================================

-- 1. Ver TODOS os registros na tabela whatsapp_envios
SELECT 
  id,
  account_owner_id,
  tipo_registro,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada_brasil
FROM whatsapp_envios
ORDER BY created_at DESC;

-- 2. Contar envios por usuário (account_owner_id)
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

-- 3. Verificar se há registros para um usuário específico
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID real do usuário que está testando
-- Para encontrar o ID, veja na query acima
/*
SELECT 
  'Verificando envios do usuário' as verificacao,
  COUNT(*) as total_envios,
  CASE 
    WHEN COUNT(*) >= 7 THEN '❌ LIMITE EXCEDIDO - Deve bloquear próximos envios'
    WHEN COUNT(*) = 6 THEN '⚠️ ATENÇÃO - Próximo envio será o 7º (último permitido)'
    ELSE '✅ DENTRO DO LIMITE - Pode enviar mais'
  END as status
FROM whatsapp_envios
WHERE account_owner_id = 'SEU_USER_ID_AQUI'::UUID;
*/

-- 4. Verificar se a tabela está vazia (nenhum registro)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ TABELA VAZIA - Nenhum envio foi registrado ainda!'
    ELSE CONCAT('✅ TABELA TEM ', COUNT(*), ' REGISTRO(S)')
  END as status_tabela
FROM whatsapp_envios;

-- 5. Verificar últimos 10 registros com detalhes
SELECT 
  ROW_NUMBER() OVER (ORDER BY created_at DESC) as numero_envio,
  tipo_registro,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as quando,
  account_owner_id
FROM whatsapp_envios
ORDER BY created_at DESC
LIMIT 10;

