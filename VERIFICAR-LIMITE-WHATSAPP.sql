-- Script para verificar se a tabela whatsapp_envios existe e diagnosticar problemas

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'whatsapp_envios'
) as tabela_existe;

-- 2. Se a tabela existir, mostrar estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_envios'
ORDER BY ordinal_position;

-- 3. Contar total de envios por usuário
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

-- 4. Verificar políticas RLS
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

-- 5. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'whatsapp_envios';

-- 6. Testar inserção (substitua 'SEU_USER_ID_AQUI' pelo ID real do usuário)
-- Descomente e execute apenas para testar:
/*
INSERT INTO whatsapp_envios (account_owner_id, tipo_registro, created_at)
VALUES ('SEU_USER_ID_AQUI', 'teste', NOW())
RETURNING *;
*/

