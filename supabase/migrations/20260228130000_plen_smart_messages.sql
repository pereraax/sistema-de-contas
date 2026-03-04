-- Atividade do usuário para mensagens inteligentes (AHA moments).
-- Atualizado a cada mensagem recebida; usado pelo cron para eventos 10min / 1h / 24h.
CREATE TABLE IF NOT EXISTS plen_user_activity (
  account_owner_id uuid PRIMARY KEY,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE plen_user_activity IS 'Última interação do usuário com a Plen (WhatsApp). Usado para enviar mensagens inteligentes após 10min/1h/24h sem interação.';

-- Mensagens inteligentes já enviadas (evita repetição e spam).
CREATE TABLE IF NOT EXISTS plen_smart_messages_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb,
  UNIQUE(user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_plen_smart_messages_sent_user_sent ON plen_smart_messages_sent(user_id, sent_at DESC);
COMMENT ON TABLE plen_smart_messages_sent IS 'Registro de mensagens inteligentes já enviadas (10min, 1h, 24h, 10_registros, 20_registros, categoria_*).';
