-- ============================================
-- TESTAR INSERÇÃO DIRETA NA TABELA
-- ============================================
-- IMPORTANTE: Execute este script com SERVICE ROLE KEY no Supabase
-- Ou desabilite RLS temporariamente para testar

-- 1. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'whatsapp_envios';

-- 2. Verificar políticas RLS atuais
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'whatsapp_envios';

-- 3. Testar inserção (substitua 'SEU_USER_ID_AQUI' pelo ID real)
-- Descomente e execute:
/*
INSERT INTO whatsapp_envios (account_owner_id, tipo_registro, created_at)
VALUES (
  'SEU_USER_ID_AQUI'::UUID,
  'teste',
  NOW()
)
RETURNING *;
*/

-- 4. Se a inserção acima falhar, tente desabilitar RLS temporariamente:
-- ATENÇÃO: Isso remove a segurança, use apenas para teste!
/*
ALTER TABLE whatsapp_envios DISABLE ROW LEVEL SECURITY;

-- Testar inserção novamente
INSERT INTO whatsapp_envios (account_owner_id, tipo_registro, created_at)
VALUES (
  'SEU_USER_ID_AQUI'::UUID,
  'teste',
  NOW()
)
RETURNING *;

-- Reabilitar RLS após teste
ALTER TABLE whatsapp_envios ENABLE ROW LEVEL SECURITY;
*/

-- 5. Verificar se a política de INSERT está correta
-- A política deve permitir INSERT com WITH CHECK (true)
SELECT 
  'Política INSERT' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'whatsapp_envios' 
      AND cmd = 'INSERT'
      AND with_check = 'true'
    ) THEN '✅ Política INSERT existe e permite tudo'
    ELSE '❌ Política INSERT não encontrada ou restritiva'
  END as status;

