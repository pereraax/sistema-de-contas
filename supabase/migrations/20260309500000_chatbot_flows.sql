-- Fluxos do Chatbot Builder (construtor visual da assistente Plen)
-- estrutura_json: nodes + edges no formato React Flow

CREATE TABLE IF NOT EXISTS chatbot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  estrutura_json JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_flows_ativo ON chatbot_flows(ativo) WHERE ativo = true;
COMMENT ON TABLE chatbot_flows IS 'Fluxos do construtor visual da assistente Plen (Admin → Chatbot Builder)';
