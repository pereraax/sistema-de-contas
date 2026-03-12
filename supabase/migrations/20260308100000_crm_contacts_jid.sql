-- JID do WhatsApp para envio correto (Evolution API)
-- phone = número limpo; jid = número@s.whatsapp.net (usado no POST /message/sendText)
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS jid TEXT;

COMMENT ON COLUMN crm_contacts.jid IS 'JID WhatsApp para envio: número@s.whatsapp.net (ex: 5511999999999@s.whatsapp.net)';
CREATE INDEX IF NOT EXISTS idx_crm_contacts_jid ON crm_contacts(jid) WHERE jid IS NOT NULL;
