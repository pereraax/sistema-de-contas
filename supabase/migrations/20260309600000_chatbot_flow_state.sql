-- Estado do contato dentro de um fluxo do Chatbot Builder (qual nó está ativo)
CREATE TABLE IF NOT EXISTS chatbot_flow_state (
  contact_id UUID NOT NULL PRIMARY KEY REFERENCES crm_contacts(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES chatbot_flows(id) ON DELETE CASCADE,
  current_node_id TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_flow_state_flow ON chatbot_flow_state(flow_id);
COMMENT ON TABLE chatbot_flow_state IS 'Posição do contato no fluxo do Chatbot Builder (motor de execução)';
