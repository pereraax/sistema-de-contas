-- ============================================
-- VERIFICAÇÃO RÁPIDA - Está funcionando?
-- Execute este SQL após enviar uma mensagem
-- ============================================

-- PASSO 1: Verificar se há registros na tabela
SELECT 
  COUNT(*) as total_envios,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NÃO FUNCIONOU - Tabela vazia'
    ELSE CONCAT('✅ FUNCIONANDO - ', COUNT(*), ' envio(s) registrado(s)')
  END as status
FROM whatsapp_envios;

-- ============================================

-- PASSO 2: Verificar envios do usuário específico
SELECT 
  p.email,
  p.plano,
  COUNT(w.id) as total_envios,
  CASE 
    WHEN COUNT(w.id) = 0 THEN '❌ Nenhum envio registrado'
    WHEN COUNT(w.id) >= 7 THEN '❌ LIMITE ATINGIDO (7/7)'
    WHEN COUNT(w.id) >= 5 THEN '⚠️ PRÓXIMO DO LIMITE'
    ELSE CONCAT('✅ DENTRO DO LIMITE (', COUNT(w.id), '/7)')
  END as status_limite,
  MAX(w.created_at) as ultimo_envio
FROM profiles p
LEFT JOIN whatsapp_envios w ON p.id = w.account_owner_id
WHERE p.email = 'comerciaal01@gmail.com'
GROUP BY p.id, p.email, p.plano;

-- ============================================

-- PASSO 3: Ver últimos 5 envios (se houver)
SELECT 
  w.id,
  w.tipo_registro,
  TO_CHAR(w.created_at, 'DD/MM/YYYY HH24:MI:SS') as quando,
  p.email
FROM whatsapp_envios w
JOIN profiles p ON w.account_owner_id = p.id
WHERE p.email = 'comerciaal01@gmail.com'
ORDER BY w.created_at DESC
LIMIT 5;

-- ============================================

-- RESULTADO ESPERADO:
-- PASSO 1: Deve mostrar pelo menos 1 envio
-- PASSO 2: Deve mostrar o total de envios e status
-- PASSO 3: Deve mostrar os últimos envios (se houver)

-- Se PASSO 1 mostrar "0", o limite NÃO está funcionando ainda

