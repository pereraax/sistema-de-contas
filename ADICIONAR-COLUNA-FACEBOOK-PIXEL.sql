-- Script para adicionar coluna facebook_pixel_id na tabela profiles
-- Execute este script no SQL Editor do Supabase

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;

-- Comentário explicativo
COMMENT ON COLUMN profiles.facebook_pixel_id IS 'ID do Pixel do Facebook para rastreamento de conversões';

