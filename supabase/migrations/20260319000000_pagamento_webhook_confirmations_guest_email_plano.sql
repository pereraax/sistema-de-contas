-- Guest checkout (Asaas PIX/cartão): precisamos guardar email/plano para ativar automaticamente no /cadastro
-- Idempotente: alguns ambientes podem não ter aplicado antes a migration base
-- que cria `pagamento_webhook_confirmations`.
CREATE TABLE IF NOT EXISTS pagamento_webhook_confirmations (
  subscription_id text PRIMARY KEY,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  email text,
  plano text
);

ALTER TABLE pagamento_webhook_confirmations
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS plano text;

CREATE INDEX IF NOT EXISTS idx_pagamento_webhook_confirmations_email
  ON pagamento_webhook_confirmations(email);

