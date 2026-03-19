-- Guest checkout (Asaas PIX/cartão): precisamos guardar email/plano para ativar automaticamente no /cadastro
ALTER TABLE pagamento_webhook_confirmations
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS plano text;

CREATE INDEX IF NOT EXISTS idx_pagamento_webhook_confirmations_email
  ON pagamento_webhook_confirmations(email);

