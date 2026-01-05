-- ============================================
-- TESTAR LIMITE DE 7 MENSAGENS - CHECKLIST COMPLETO
-- ============================================

-- PASSO 1: Verificar se a tabela existe
SELECT 
  '✅ Tabela existe' as status,
  COUNT(*) as total_registros
FROM whatsapp_envios;

-- Se der erro, execute primeiro: CRIAR-TABELA-WHATSAPP-ENVIOS.sql

-- ============================================

-- PASSO 2: Verificar constraints (NÃO deve ter UNIQUE problemática)
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'whatsapp_envios'::regclass
ORDER BY contype, conname;

-- Se houver constraint UNIQUE com created_at, remova:
-- ALTER TABLE whatsapp_envios 
-- DROP CONSTRAINT IF EXISTS whatsapp_envios_account_owner_id_created_at_tipo_registro_key;

-- ============================================

-- PASSO 3: Ver TODOS os envios registrados (últimos 20)
SELECT 
  id,
  account_owner_id,
  tipo_registro,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada_brasil
FROM whatsapp_envios
ORDER BY created_at DESC
LIMIT 20;

-- ============================================

-- PASSO 4: Contar envios por usuário (VERIFICAR LIMITE)
SELECT 
  account_owner_id,
  COUNT(*) as total_envios,
  COUNT(CASE WHEN tipo_registro = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN tipo_registro = 'divida' THEN 1 END) as dividas,
  COUNT(CASE WHEN tipo_registro = 'saida' THEN 1 END) as saidas,
  MIN(created_at) as primeiro_envio,
  MAX(created_at) as ultimo_envio,
  CASE 
    WHEN COUNT(*) >= 7 THEN '❌ LIMITE ATINGIDO OU EXCEDIDO'
    WHEN COUNT(*) >= 5 THEN '⚠️ PRÓXIMO DO LIMITE (6 ou 7)'
    ELSE '✅ DENTRO DO LIMITE'
  END as status_limite
FROM whatsapp_envios
GROUP BY account_owner_id
ORDER BY total_envios DESC;

-- ============================================

-- PASSO 5: Verificar plano do usuário (SUBSTITUA O UUID)
-- Substitua 'SEU_USER_ID_AQUI' pelo account_owner_id que aparece no PASSO 4
SELECT 
  id,
  plano,
  email,
  CASE 
    WHEN plano = 'teste' THEN '✅ Plano TESTE - Limite de 7 mensagens ATIVO'
    WHEN plano = 'basico' THEN '✅ Plano BÁSICO - SEM limite'
    WHEN plano = 'premium' THEN '✅ Plano PREMIUM - SEM limite'
    ELSE '⚠️ Plano desconhecido'
  END as status_limite
FROM profiles
WHERE id IN (
  SELECT DISTINCT account_owner_id 
  FROM whatsapp_envios
  LIMIT 5
);

-- OU para ver TODOS os usuários com envios:
SELECT 
  p.id,
  p.plano,
  p.email,
  COUNT(w.id) as total_envios_whatsapp,
  CASE 
    WHEN p.plano = 'teste' AND COUNT(w.id) >= 7 THEN '❌ LIMITE EXCEDIDO'
    WHEN p.plano = 'teste' AND COUNT(w.id) >= 5 THEN '⚠️ PRÓXIMO DO LIMITE'
    WHEN p.plano = 'teste' THEN '✅ DENTRO DO LIMITE (7 mensagens)'
    ELSE '✅ SEM LIMITE (plano básico/premium)'
  END as status_limite
FROM profiles p
LEFT JOIN whatsapp_envios w ON p.id = w.account_owner_id
WHERE w.id IS NOT NULL
GROUP BY p.id, p.plano, p.email
ORDER BY total_envios_whatsapp DESC;

-- ============================================

-- PASSO 6: Verificar se há erros na tabela (duplicatas estranhas)
SELECT 
  account_owner_id,
  tipo_registro,
  created_at,
  COUNT(*) as quantidade
FROM whatsapp_envios
GROUP BY account_owner_id, tipo_registro, created_at
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- Se aparecer resultados aqui, há duplicatas (pode ser problema)

-- ============================================

-- PASSO 7: RESUMO GERAL
SELECT 
  '📊 RESUMO GERAL' as titulo,
  (SELECT COUNT(*) FROM whatsapp_envios) as total_envios_sistema,
  (SELECT COUNT(DISTINCT account_owner_id) FROM whatsapp_envios) as usuarios_com_envios,
  (SELECT COUNT(*) FROM whatsapp_envios WHERE created_at >= NOW() - INTERVAL '24 hours') as envios_ultimas_24h,
  (SELECT COUNT(*) FROM whatsapp_envios WHERE created_at >= NOW() - INTERVAL '1 hour') as envios_ultima_hora;

-- ============================================

-- PASSO 8: LIMPAR TESTES (OPCIONAL - USE COM CUIDADO!)
-- Descomente apenas se quiser limpar os envios de teste:

-- DELETE FROM whatsapp_envios 
-- WHERE account_owner_id = 'SEU_USER_ID_AQUI'
-- AND created_at >= NOW() - INTERVAL '1 day';

-- ============================================

-- ✅ CHECKLIST:
-- [ ] Tabela existe e tem registros
-- [ ] Não há constraint UNIQUE problemática
-- [ ] Usuário tem plano "teste"
-- [ ] Contagem de envios está correta
-- [ ] Após 7 envios, o próximo deve ser bloqueado


