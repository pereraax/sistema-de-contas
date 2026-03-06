-- Sincronização Z-API: message_id para deduplicação e Realtime
ALTER TABLE crm_messages
  ADD COLUMN IF NOT EXISTS zapi_message_id TEXT,
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_messages_zapi_message_id
  ON crm_messages(zapi_message_id) WHERE zapi_message_id IS NOT NULL;

-- Para Realtime: no dashboard Supabase > Database > Replication, adicione crm_messages à publicação supabase_realtime (e ajuste RLS se usar anon).

COMMENT ON COLUMN crm_messages.zapi_message_id IS 'ID da mensagem na Z-API para evitar duplicatas';
