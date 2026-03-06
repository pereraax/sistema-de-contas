-- Rastrear quando enviamos última resposta para cada contato (evitar leads "no vácuo").
ALTER TABLE whatsapp_contatos
  ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN whatsapp_contatos.last_reply_at IS 'Quando enviamos a última resposta para este número. Usado pelo cron de revisão para identificar quem ficou no vácuo (last_message_at > last_reply_at).';

CREATE INDEX IF NOT EXISTS idx_whatsapp_contatos_vacuo
  ON whatsapp_contatos(last_message_at)
  WHERE last_message_at IS NOT NULL AND (last_reply_at IS NULL OR last_message_at > last_reply_at);
