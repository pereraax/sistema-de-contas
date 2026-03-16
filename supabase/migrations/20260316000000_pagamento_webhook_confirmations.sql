-- Cache de confirmação de pagamento via webhook Asaas (PAYMENT_RECEIVED)
-- status-guest consulta esta tabela primeiro para retornar pago: true na hora
CREATE TABLE IF NOT EXISTS pagamento_webhook_confirmations (
  subscription_id text PRIMARY KEY,
  confirmed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE pagamento_webhook_confirmations IS 'Assinaturas já confirmadas por webhook Asaas ou por polling; evita delay na mensagem de pagamento concluído';
