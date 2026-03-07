-- Foto do contato (WhatsApp) para exibir na lista de conversas
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN crm_contacts.avatar_url IS 'URL da foto de perfil do WhatsApp (Z-API)';
