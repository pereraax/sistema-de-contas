-- Controle de envio da mensagem automática de follow-up (10 min inatividade) para leads no fluxo de teste.
ALTER TABLE whatsapp_contatos
  ADD COLUMN IF NOT EXISTS lead_followup_10min_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN whatsapp_contatos.lead_followup_10min_sent_at IS 'Quando enviamos a mensagem de follow-up 10min para lead inativo (ainda sem cadastro). Evita reenviar.';
