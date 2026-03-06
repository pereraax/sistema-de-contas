-- Realtime: presença (online, digitando, last seen) e lista de conversas (unread, última mensagem).
-- Frontend assina crm_contacts e crm_conversations para atualizar sem recarregar.

ALTER PUBLICATION supabase_realtime ADD TABLE crm_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE crm_conversations;

DROP POLICY IF EXISTS "crm_contacts_service_only" ON crm_contacts;
CREATE POLICY "crm_contacts_select_anon" ON crm_contacts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "crm_conversations_service_only" ON crm_conversations;
CREATE POLICY "crm_conversations_select_anon" ON crm_conversations
  FOR SELECT USING (true);

COMMENT ON TABLE crm_contacts IS 'CRM: contatos WhatsApp. Realtime SELECT para presença e avatar.';
COMMENT ON TABLE crm_conversations IS 'CRM: conversas. Realtime SELECT para unread e última mensagem.';
