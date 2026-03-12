-- Realtime: frontend recebe novos inserts em crm_messages (evento new_message).
-- A página Conversas assina e atualiza lista + chat sem recarregar.
-- Escrita (INSERT/UPDATE/DELETE) continua apenas via service role (backend).

ALTER PUBLICATION supabase_realtime ADD TABLE crm_messages;

DROP POLICY IF EXISTS "crm_messages_service_only" ON crm_messages;
CREATE POLICY "crm_messages_select_anon" ON crm_messages
  FOR SELECT USING (true);

COMMENT ON TABLE crm_messages IS 'CRM: mensagens WhatsApp. Realtime SELECT para frontend.';
