-- ============================================
-- VERIFICAR IMAGEM DE PERFIL DOS USUÁRIOS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a coluna imagem_url existe na tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'imagem_url';

-- 2. Ver todos os usuários com suas imagens de perfil
SELECT 
  id,
  nome,
  imagem_url,
  created_at,
  account_owner_id
FROM users
ORDER BY created_at DESC;

-- 3. Verificar usuários que têm imagem_url preenchido
SELECT 
  id,
  nome,
  imagem_url,
  LENGTH(imagem_url) as tamanho_url
FROM users
WHERE imagem_url IS NOT NULL
ORDER BY created_at DESC;

-- 4. Se a coluna não existir, execute este comando:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS imagem_url TEXT;

