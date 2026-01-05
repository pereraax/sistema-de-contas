-- ============================================
-- DIAGNÓSTICO: Por que não está inserindo na tabela whatsapp_envios?
-- ============================================

-- PASSO 1: Verificar se a tabela existe mesmo
SELECT 
  '✅ Tabela existe' as status,
  (SELECT COUNT(*) FROM whatsapp_envios) as total_registros
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'whatsapp_envios';

-- Se der erro aqui, a tabela NÃO existe! Execute: CRIAR-TABELA-WHATSAPP-ENVIOS.sql

-- ============================================

-- PASSO 2: Verificar todos os usuários e seus planos
SELECT 
  id,
  email,
  plano,
  whatsapp_key,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- IMPORTANTE: Anote o ID do usuário que está usando o WhatsApp

-- ============================================

-- PASSO 3: Verificar se há algum registro na tabela whatsapp_envios (mesmo que 0)
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT account_owner_id) as usuarios_com_envios
FROM whatsapp_envios;

-- ============================================

-- PASSO 4: Verificar se há políticas RLS bloqueando inserção
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'whatsapp_envios';

-- IMPORTANTE: Deve existir uma política que permite INSERT com WITH CHECK (true)
-- Se não existir, execute:
-- CREATE POLICY "Sistema pode inserir envios"
--   ON whatsapp_envios
--   FOR INSERT
--   WITH CHECK (true);

-- ============================================

-- PASSO 5: Tentar inserir um registro de TESTE manualmente
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID do usuário que está usando o WhatsApp
-- (pegue do PASSO 2)

-- Descomente e execute (substitua o UUID):
/*
INSERT INTO whatsapp_envios (
  account_owner_id,
  tipo_registro,
  created_at
) VALUES (
  'SEU_USER_ID_AQUI',  -- SUBSTITUA pelo ID do seu usuário
  'entrada',
  NOW()
) RETURNING id, account_owner_id, tipo_registro, created_at;
*/

-- Se der erro aqui, significa que:
-- 1. O UUID está errado
-- 2. Há uma constraint bloqueando
-- 3. Há uma política RLS bloqueando

-- ============================================

-- PASSO 6: Verificar se há constraints que podem estar bloqueando
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'whatsapp_envios'::regclass
ORDER BY contype, conname;

-- Se houver constraint UNIQUE problemática, remova:
-- ALTER TABLE whatsapp_envios 
-- DROP CONSTRAINT IF EXISTS whatsapp_envios_account_owner_id_created_at_tipo_registro_key;

-- ============================================

-- PASSO 7: Verificar se o SUPABASE_SERVICE_ROLE_KEY está configurado
-- (Isso você precisa verificar no código/variáveis de ambiente)

-- No código, verifique se está usando createAdminClient() corretamente
-- e se a variável SUPABASE_SERVICE_ROLE_KEY está configurada no Render

-- ============================================

-- RESUMO DO DIAGNÓSTICO:

-- ✅ A tabela existe? (ver PASSO 1)
-- ✅ O usuário tem plano "teste"? (ver PASSO 2)
-- ✅ Há políticas RLS permitindo INSERT? (ver PASSO 4)
-- ✅ Consegue inserir manualmente? (ver PASSO 5)
-- ✅ Há constraints bloqueando? (ver PASSO 6)
-- ✅ SUPABASE_SERVICE_ROLE_KEY está configurada? (verificar no código/ambiente)

