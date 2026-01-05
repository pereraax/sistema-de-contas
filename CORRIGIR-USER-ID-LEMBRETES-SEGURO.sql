-- ============================================
-- CORRIGIR USER_ID NA TABELA LEMBRETES (VERSÃO SEGURA)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script altera a foreign key de user_id para referenciar users(id) ao invés de auth.users(id)
-- E lida com dados existentes de forma segura

-- IMPORTANTE: Faça backup antes de executar!

-- 1. Remover a constraint de foreign key antiga
ALTER TABLE lembretes 
DROP CONSTRAINT IF EXISTS lembretes_user_id_fkey;

-- 2. Tornar user_id nullable temporariamente para poder migrar
ALTER TABLE lembretes 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Limpar user_id dos lembretes existentes que não estão na tabela users
-- Isso é necessário porque os valores antigos são auth.uid() que não existem em users(id)
UPDATE lembretes 
SET user_id = NULL 
WHERE user_id NOT IN (SELECT id FROM users);

-- 4. Adicionar a nova constraint de foreign key (agora nullable)
ALTER TABLE lembretes
ADD CONSTRAINT lembretes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;  -- Usar SET NULL ao invés de CASCADE para evitar deletar lembretes se o usuário for deletado

-- 5. Verificar se funcionou
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conname = 'lembretes_user_id_fkey';

-- NOTA: Após executar este script, os lembretes existentes terão user_id = NULL
-- Novos lembretes podem ter user_id da tabela users ou NULL

