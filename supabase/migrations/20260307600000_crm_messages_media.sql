-- Mídia nas mensagens (imagem, áudio, vídeo, documento)
ALTER TABLE crm_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT;

COMMENT ON COLUMN crm_messages.media_url IS 'URL da mídia (Z-API storage; expira em 30 dias)';
