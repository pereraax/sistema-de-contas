-- ============================================
-- TESTAR SE A TABELA LEMBRETES ESTÁ FUNCIONANDO
-- ============================================
-- Execute este script no SQL Editor do Supabase para testar

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lembretes'
) AS tabela_existe;

-- 2. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lembretes'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
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
WHERE tablename = 'lembretes';

-- 4. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'lembretes';

-- 5. Testar inserção (usando service_role - deve funcionar)
-- Descomente a linha abaixo para testar:
-- INSERT INTO lembretes (user_id, account_owner_id, descricao, data_lembrete, horario, status)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'Teste',
--   NOW(),
--   '10:00:00',
--   'pendente'
-- );






