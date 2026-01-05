-- ============================================
-- CORRIGIR USER_ID NA TABELA LEMBRETES (VERSÃO COMPLETA)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script altera a foreign key de user_id para referenciar users(id) ao invés de auth.users(id)
-- E torna user_id nullable para permitir lembretes sem usuário

-- IMPORTANTE: Faça backup antes de executar!

-- 1. Remover a constraint de foreign key antiga
ALTER TABLE lembretes 
DROP CONSTRAINT IF EXISTS lembretes_user_id_fkey;

-- 2. Limpar user_id dos lembretes existentes que não estão na tabela users
-- Isso é necessário porque os valores antigos são auth.uid() que não existem em users(id)
UPDATE lembretes 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM users);

-- 3. Tornar user_id nullable (IMPORTANTE: deve ser feito antes de adicionar a constraint)
ALTER TABLE lembretes 
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Adicionar a nova constraint de foreign key
ALTER TABLE lembretes
ADD CONSTRAINT lembretes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;  -- Usar SET NULL para evitar deletar lembretes se o usuário for deletado

-- 5. Verificar se funcionou
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conname = 'lembretes_user_id_fkey';

-- 6. Verificar se a coluna é nullable
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'lembretes' 
  AND column_name = 'user_id';

-- 7. Verificar quantos lembretes têm user_id NULL vs não NULL
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NULL) AS lembretes_sem_usuario,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS lembretes_com_usuario,
  COUNT(*) AS total
FROM lembretes;

-- NOTA: Após executar este script:
-- - A coluna user_id será nullable (pode ser NULL)
-- - Lembretes existentes com user_id inválido terão user_id = NULL
-- - Novos lembretes podem ter user_id da tabela users ou NULL
-- - O campo user_id agora é opcional no formulário

