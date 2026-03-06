-- CRM Plenipay: contatos, conversas, mensagens e logs de interação (WhatsApp/Z-API)
-- Status de contato: novo_lead | aguardando_email | aguardando_codigo | usuario_ativo | cliente_pago | inativo
-- Status de conversa: aberta | em_atendimento | fechada

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL,
  nome TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'novo_lead' CHECK (status IN (
    'novo_lead', 'aguardando_email', 'aguardando_codigo', 'usuario_ativo', 'cliente_pago', 'inativo'
  )),
  origem TEXT DEFAULT 'whatsapp',
  data_primeiro_contato TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_cadastrado BOOLEAN DEFAULT FALSE,
  data_cadastro TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telefone)
);

CREATE TABLE IF NOT EXISTS crm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  status_conversa TEXT NOT NULL DEFAULT 'aberta' CHECK (status_conversa IN ('aberta', 'em_atendimento', 'fechada')),
  ultima_mensagem TEXT,
  ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES crm_conversations(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  mensagem TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  origem TEXT NOT NULL DEFAULT 'whatsapp' CHECK (origem IN ('whatsapp', 'sistema', 'automacao')),
  status_envio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  detalhes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_contacts_telefone ON crm_contacts(telefone);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_ultima_interacao ON crm_contacts(ultima_interacao DESC);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_contact_id ON crm_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_ultima_interacao ON crm_conversations(ultima_interacao DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_contact_id ON crm_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation_id ON crm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_timestamp ON crm_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crm_interaction_logs_contact_id ON crm_interaction_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_interaction_logs_timestamp ON crm_interaction_logs(timestamp DESC);

-- RLS: acesso apenas via service role (admin e webhook)
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contacts_service_only" ON crm_contacts FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_conversations_service_only" ON crm_conversations FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_messages_service_only" ON crm_messages FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_interaction_logs_service_only" ON crm_interaction_logs FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE crm_contacts IS 'CRM Plenipay: contatos que interagiram via WhatsApp';
COMMENT ON TABLE crm_conversations IS 'CRM Plenipay: conversas por contato';
COMMENT ON TABLE crm_messages IS 'CRM Plenipay: mensagens entrada/saída';
COMMENT ON TABLE crm_interaction_logs IS 'CRM Plenipay: log de atividades do sistema';
