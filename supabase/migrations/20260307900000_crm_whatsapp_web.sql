-- CRM estilo WhatsApp Web: presença, não lidas, status de mensagem
-- Z-API: online, last_seen, typing, unread_count, message status (sent/delivered/read)

-- Contatos: presença e "digitando"
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS typing_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN crm_contacts.last_seen_at IS 'Última vez visto (presence.update)';
COMMENT ON COLUMN crm_contacts.is_online IS 'Online agora (presence.update)';
COMMENT ON COLUMN crm_contacts.typing_until IS 'Indicador digitando: válido até este horário';

-- Conversas: contagem de não lidas
ALTER TABLE crm_conversations
  ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN crm_conversations.unread_count IS 'Mensagens não lidas (entrada)';

-- Mensagens: status enviado/entregue/lido
-- status_envio já existe; usar valores: sent | delivered | read
COMMENT ON COLUMN crm_messages.status_envio IS 'Status envio: sent, delivered, read';

-- Índices para presença
CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_seen_at ON crm_contacts(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_is_online ON crm_contacts(is_online);
