-- Log dos últimos eventos do webhook Z-API (para debug no CRM Configurações)
CREATE TABLE IF NOT EXISTS crm_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'ignored', 'error')),
  detail TEXT,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  payload_preview TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_webhook_logs_received_at ON crm_webhook_logs(received_at DESC);

ALTER TABLE crm_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_webhook_logs_service" ON crm_webhook_logs FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE crm_webhook_logs IS 'Últimos eventos do webhook Z-API para debug no CRM';
