-- ============================================
-- DIAGNÓSTICO COMPLETO - LIMITE WHATSAPP ENVIOS
-- ============================================

-- 1. Verificar se a tabela existe e estrutura
SELECT 
  'Tabela existe' as verificacao,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_envios'
  ) as resultado;

-- 2. Ver estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_envios'
ORDER BY ordinal_position;

-- 3. Contar TOTAL de registros na tabela (sem filtro)
SELECT 
  'Total de registros na tabela' as verificacao,
  COUNT(*) as resultado
FROM whatsapp_envios;

-- 4. Contar envios por usuário (account_owner_id)
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

-- 5. Ver TODOS os registros (últimos 20)
SELECT 
  id,
  account_owner_id,
  tipo_registro,
  created_at
FROM whatsapp_envios
ORDER BY created_at DESC
LIMIT 20;

-- 6. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Tem condição SELECT'
    ELSE 'Sem condição SELECT'
  END as condicao_select,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Tem condição INSERT'
    ELSE 'Sem condição INSERT'
  END as condicao_insert
FROM pg_policies
WHERE tablename = 'whatsapp_envios'
ORDER BY policyname;

-- 7. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'whatsapp_envios';

-- 8. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'whatsapp_envios';

-- 9. Verificar constraints (especialmente UNIQUE)
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'whatsapp_envios'::regclass;

-- 10. Testar inserção (substitua 'SEU_USER_ID_AQUI' pelo ID real)
-- IMPORTANTE: Execute esta query com SERVICE ROLE KEY para testar inserção
-- Descomente e substitua o ID:
/*
DO $$
DECLARE
  test_user_id UUID := 'SEU_USER_ID_AQUI'::UUID;
  inserted_id UUID;
BEGIN
  INSERT INTO whatsapp_envios (account_owner_id, tipo_registro, created_at)
  VALUES (test_user_id, 'teste', NOW())
  RETURNING id INTO inserted_id;
  
  RAISE NOTICE 'Inserção bem-sucedida! ID: %', inserted_id;
  
  -- Verificar se foi inserido
  IF EXISTS (SELECT 1 FROM whatsapp_envios WHERE id = inserted_id) THEN
    RAISE NOTICE 'Registro confirmado na tabela!';
  ELSE
    RAISE NOTICE 'ERRO: Registro não encontrado após inserção!';
  END IF;
END $$;
*/

-- 11. Verificar se há algum problema com a constraint UNIQUE
-- Se houver muitos registros com mesmo account_owner_id, created_at e tipo_registro
SELECT 
  account_owner_id,
  created_at,
  tipo_registro,
  COUNT(*) as duplicatas
FROM whatsapp_envios
GROUP BY account_owner_id, created_at, tipo_registro
HAVING COUNT(*) > 1;

