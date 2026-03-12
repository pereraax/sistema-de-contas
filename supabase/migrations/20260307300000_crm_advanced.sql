-- CRM avançado: tags, templates, campanhas, fluxos, atividades
-- Tags
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contact_tags (
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

-- Templates de mensagem (Mensagens / Copys)
CREATE TABLE IF NOT EXISTS crm_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'whatsapp',
  variaveis TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campanhas (envio em massa)
CREATE TABLE IF NOT EXISTS crm_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  template_id UUID REFERENCES crm_message_templates(id) ON DELETE SET NULL,
  mensagem_texto TEXT,
  agendado_para TIMESTAMP WITH TIME ZONE,
  enviado_em TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'cancelada')),
  limite_por_minuto INT DEFAULT 10,
  filtro_status TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  enviado_em TIMESTAMP WITH TIME ZONE,
  entregue BOOLEAN,
  respondido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, contact_id)
);

-- Fluxos (automações simples)
CREATE TABLE IF NOT EXISTS crm_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  trigger_tipo TEXT NOT NULL CHECK (trigger_tipo IN ('nova_mensagem', 'novo_lead', 'cadastro_iniciado', 'cadastro_completo')),
  condicoes JSONB DEFAULT '[]',
  acoes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas internas do contato
CREATE TABLE IF NOT EXISTS crm_contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  autor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_contact_tags_contact ON crm_contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_contact_tags_tag ON crm_contact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_crm_message_templates_categoria ON crm_message_templates(categoria);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON crm_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_crm_campaign_sends_campaign ON crm_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_flows_ativo ON crm_flows(ativo);
CREATE INDEX IF NOT EXISTS idx_crm_contact_notes_contact ON crm_contact_notes(contact_id);

-- RLS
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_tags_service" ON crm_tags FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_contact_tags_service" ON crm_contact_tags FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_message_templates_service" ON crm_message_templates FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_campaigns_service" ON crm_campaigns FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_campaign_sends_service" ON crm_campaign_sends FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_flows_service" ON crm_flows FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "crm_contact_notes_service" ON crm_contact_notes FOR ALL USING (false) WITH CHECK (false);
