-- Adicionar coluna imagem_url na tabela profiles (foto de perfil)
-- Execute no SQL Editor do Supabase se o upload de foto não funcionar

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

COMMENT ON COLUMN profiles.imagem_url IS 'URL da imagem de perfil (Supabase Storage ou URL externa)';
