-- Status aguardando_atendente: usuário clicou em "Chamar atendente"; Plen para de responder até ele mandar "Chamar assistente plen".
ALTER TABLE crm_contacts
  DROP CONSTRAINT IF EXISTS crm_contacts_status_check;

ALTER TABLE crm_contacts
  ADD CONSTRAINT crm_contacts_status_check CHECK (status IN (
    'novo_lead', 'aguardando_email', 'aguardando_codigo', 'usuario_ativo', 'cliente_pago', 'inativo', 'aguardando_atendente'
  ));

COMMENT ON COLUMN crm_contacts.status IS 'novo_lead | aguardando_email | aguardando_codigo | usuario_ativo | cliente_pago | inativo | aguardando_atendente (Plen pausa até "Chamar assistente plen")';
