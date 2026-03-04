-- Controle de envio do incentivo de indicação na assistente Plen (após 2 gastos).
CREATE TABLE IF NOT EXISTS plen_incentive_indication_sent (
  user_id uuid PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE plen_incentive_indication_sent IS 'Usuários que já receberam a mensagem de incentivo à indicação após registrar 2 gastos via Plen/WhatsApp.';
