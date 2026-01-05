-- ============================================
-- VERIFICAR SE O ENVIO FOI REGISTRADO AGORA
-- Execute este SQL logo após enviar a mensagem
-- ============================================

-- PASSO 1: Verificar se o envio foi registrado para o usuário comercial01@gmail.com
SELECT 
  w.id,
  w.account_owner_id,
  w.tipo_registro,
  w.created_at,
  TO_CHAR(w.created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada_brasil,
  p.email,
  p.plano
FROM whatsapp_envios w
JOIN profiles p ON w.account_owner_id = p.id
WHERE p.email = 'comerciaal01@gmail.com'
ORDER BY w.created_at DESC
LIMIT 10;

-- ============================================

-- PASSO 2: Contar total de envios deste usuário
SELECT 
  p.email,
  p.plano,
  COUNT(w.id) as total_envios,
  COUNT(CASE WHEN w.tipo_registro = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN w.tipo_registro = 'divida' THEN 1 END) as dividas,
  COUNT(CASE WHEN w.tipo_registro = 'saida' THEN 1 END) as saidas,
  MIN(w.created_at) as primeiro_envio,
  MAX(w.created_at) as ultimo_envio,
  CASE 
    WHEN COUNT(w.id) >= 7 THEN '❌ LIMITE ATINGIDO (7/7)'
    WHEN COUNT(w.id) >= 5 THEN '⚠️ PRÓXIMO DO LIMITE'
    ELSE CONCAT('✅ DENTRO DO LIMITE (', COUNT(w.id), '/7)')
  END as status_limite
FROM profiles p
LEFT JOIN whatsapp_envios w ON p.id = w.account_owner_id
WHERE p.email = 'comerciaal01@gmail.com'
GROUP BY p.id, p.email, p.plano;

-- ============================================

-- PASSO 3: Ver TODOS os envios de TODOS os usuários (últimos 20)
SELECT 
  w.id,
  w.account_owner_id,
  w.tipo_registro,
  w.created_at,
  TO_CHAR(w.created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada_brasil,
  p.email,
  p.plano
FROM whatsapp_envios w
LEFT JOIN profiles p ON w.account_owner_id = p.id
ORDER BY w.created_at DESC
LIMIT 20;

-- ============================================

-- PASSO 4: Verificar se a tabela está vazia (deve retornar 0 se estiver vazia)
SELECT 
  COUNT(*) as total_registros_na_tabela,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ TABELA VAZIA - Nenhum envio foi registrado!'
    ELSE CONCAT('✅ TABELA TEM ', COUNT(*), ' REGISTRO(S)')
  END as status
FROM whatsapp_envios;

-- ============================================

-- RESULTADO ESPERADO:
-- Se funcionou, você deve ver pelo menos 1 registro no PASSO 1 e PASSO 2
-- Se não funcionou, o PASSO 4 mostrará "TABELA VAZIA"

