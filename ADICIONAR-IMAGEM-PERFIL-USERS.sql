-- ============================================
-- ADICIONAR CAMPO DE IMAGEM DE PERFIL NA TABELA USERS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adicionar coluna imagem_url na tabela users (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN users.imagem_url IS 'URL da imagem de perfil do usuário (armazenada no Supabase Storage ou URL externa)';

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_users_imagem_url ON users(imagem_url) WHERE imagem_url IS NOT NULL;

