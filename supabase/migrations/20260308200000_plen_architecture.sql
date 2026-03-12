-- Arquitetura PLEN: estado do usuário, fila de mensagens, logs e anti-loop
-- Estados: NEW_LEAD | TEST_EXPENSE | WAITING_NAME | WAITING_EMAIL | WAITING_CODE | USER_ACTIVE

-- Estado do usuário (por contact_id) para o fluxo da assistente PLEN
CREATE TABLE IF NOT EXISTS plen_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'NEW_LEAD' CHECK (state IN (
    'NEW_LEAD', 'TEST_EXPENSE', 'WAITING_NAME', 'WAITING_EMAIL', 'WAITING_CODE', 'USER_ACTIVE'
  )),
  payload JSONB DEFAULT '{}',
  consecutive_bot_replies INT NOT NULL DEFAULT 0,
  last_user_message_at TIMESTAMP WITH TIME ZONE,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id)
);

CREATE INDEX IF NOT EXISTS idx_plen_user_state_contact ON plen_user_state(contact_id);
CREATE INDEX IF NOT EXISTS idx_plen_user_state_blocked ON plen_user_state(blocked_until) WHERE blocked_until IS NOT NULL;

-- Fila de mensagens: todas as respostas da PLEN passam por aqui (anti-spam)
CREATE TABLE IF NOT EXISTS plen_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  send_after TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plen_message_queue_pending ON plen_message_queue(send_after) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_plen_message_queue_contact ON plen_message_queue(contact_id);

-- Logs detalhados da interação PLEN (intent, estado, ação, resposta)
CREATE TABLE IF NOT EXISTS plen_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  mensagem_recebida TEXT,
  estado_usuario TEXT,
  intent_detectada TEXT,
  acao_executada TEXT,
  resposta_enviada TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plen_interaction_logs_contact ON plen_interaction_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_plen_interaction_logs_timestamp ON plen_interaction_logs(timestamp DESC);

-- RLS: acesso apenas via service role
ALTER TABLE plen_user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE plen_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE plen_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plen_user_state_service" ON plen_user_state FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "plen_message_queue_service" ON plen_message_queue FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "plen_interaction_logs_service" ON plen_interaction_logs FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE plen_user_state IS 'Estado do fluxo PLEN por contato (NEW_LEAD até USER_ACTIVE)';
COMMENT ON TABLE plen_message_queue IS 'Fila de envio de mensagens PLEN (delay 2s, anti-spam)';
COMMENT ON TABLE plen_interaction_logs IS 'Log de cada interação: mensagem, estado, intent, resposta';
