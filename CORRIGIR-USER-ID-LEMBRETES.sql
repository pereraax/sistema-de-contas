-- ============================================
-- CORRIGIR USER_ID NA TABELA LEMBRETES
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script altera a foreign key de user_id para referenciar users(id) ao invés de auth.users(id)

-- IMPORTANTE: Faça backup antes de executar!

-- 1. Remover a constraint de foreign key antiga
ALTER TABLE lembretes 
DROP CONSTRAINT IF EXISTS lembretes_user_id_fkey;

-- 2. Alterar a coluna user_id para referenciar users(id)
-- Primeiro, precisamos garantir que todos os valores existentes são válidos
-- Se houver dados, você pode precisar fazer uma migração manual

-- 3. Adicionar a nova constraint de foreign key
ALTER TABLE lembretes
ADD CONSTRAINT lembretes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 4. Verificar se funcionou
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conname = 'lembretes_user_id_fkey';

