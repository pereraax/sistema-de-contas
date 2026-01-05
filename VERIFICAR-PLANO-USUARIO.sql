-- ============================================
-- VERIFICAR PLANO DO USUÁRIO E SE DEVE TER LIMITE
-- ============================================

-- PASSO 1: Ver TODOS os usuários e seus planos
SELECT 
  id,
  email,
  plano,
  whatsapp_key,
  CASE 
    WHEN plano = 'teste' THEN '✅ TEM limite de 7 mensagens WhatsApp'
    WHEN plano = 'basico' THEN '✅ SEM limite (plano básico)'
    WHEN plano = 'premium' THEN '✅ SEM limite (plano premium)'
    ELSE '⚠️ Plano desconhecido'
  END as status_limite_whatsapp,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ============================================

-- PASSO 2: Verificar usuários que têm whatsapp_key configurada (provavelmente os que usam WhatsApp)
SELECT 
  id,
  email,
  plano,
  whatsapp_key,
  CASE 
    WHEN plano = 'teste' THEN '✅ DEVE ter limite de 7 mensagens'
    ELSE '✅ SEM limite'
  END as deve_ter_limite,
  created_at
FROM profiles
WHERE whatsapp_key IS NOT NULL
  AND whatsapp_key != ''
ORDER BY created_at DESC;

-- ============================================

-- PASSO 3: Verificar se há envios registrados para cada usuário
SELECT 
  p.id,
  p.email,
  p.plano,
  COUNT(w.id) as total_envios_whatsapp,
  CASE 
    WHEN p.plano = 'teste' AND COUNT(w.id) = 0 THEN '⚠️ Plano TESTE mas NENHUM envio registrado (PROBLEMA!)'
    WHEN p.plano = 'teste' AND COUNT(w.id) < 7 THEN CONCAT('✅ Plano TESTE, enviou ', COUNT(w.id), '/7')
    WHEN p.plano = 'teste' AND COUNT(w.id) >= 7 THEN '❌ LIMITE ATINGIDO'
    WHEN p.plano != 'teste' THEN '✅ SEM limite (não precisa inserir na tabela)'
    ELSE '❓ Status desconhecido'
  END as status
FROM profiles p
LEFT JOIN whatsapp_envios w ON p.id = w.account_owner_id
WHERE p.whatsapp_key IS NOT NULL
  AND p.whatsapp_key != ''
GROUP BY p.id, p.email, p.plano
ORDER BY total_envios_whatsapp DESC;

-- ============================================

-- PASSO 4: Verificar qual usuário está usando WhatsApp AGORA
-- (usuário com whatsapp_key configurada e mais recente)
SELECT 
  id,
  email,
  plano,
  whatsapp_key,
  created_at,
  '👆 Este é provavelmente o usuário que está usando WhatsApp' as observacao
FROM profiles
WHERE whatsapp_key IS NOT NULL
  AND whatsapp_key != ''
ORDER BY created_at DESC
LIMIT 1;

-- ============================================

-- PASSO 5: Se você souber o email do usuário, verifique especificamente:
-- (Substitua 'email@exemplo.com' pelo email real)
/*
SELECT 
  id,
  email,
  plano,
  whatsapp_key,
  CASE 
    WHEN plano = 'teste' THEN '✅ DEVE inserir na tabela whatsapp_envios'
    ELSE '✅ NÃO insere na tabela (sem limite)'
  END as deve_inserir_na_tabela
FROM profiles
WHERE email = 'email@exemplo.com';
*/

