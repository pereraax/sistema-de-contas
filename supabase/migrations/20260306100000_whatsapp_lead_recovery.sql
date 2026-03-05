-- Sistema de recuperação de leads que abandonaram após o pedido de e-mail (follow-up em 5m, 10m, 15h, 24h, 48h).
CREATE TABLE IF NOT EXISTS whatsapp_lead_recovery (
  phone TEXT PRIMARY KEY,
  status_conversa TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status_conversa IN ('ativo', 'aguardando_email', 'follow_up', 'cadastro_concluido')),
  email_requested_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timestamp_ultima_mensagem_usuario TIMESTAMP WITH TIME ZONE,
  etapa_followup INTEGER NOT NULL DEFAULT 0 CHECK (etapa_followup >= 0 AND etapa_followup <= 5),
  mensagens_followup_enviadas TEXT[] DEFAULT '{}',
  cadastro_finalizado BOOLEAN NOT NULL DEFAULT false,
  email_recebido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_lead_recovery IS 'Estado da recuperação de leads que pararam de responder após o pedido de e-mail no cadastro WhatsApp.';
COMMENT ON COLUMN whatsapp_lead_recovery.status_conversa IS 'ativo=usuário respondeu; aguardando_email=pedimos email e aguardamos; follow_up=enviamos pelo menos 1 follow-up; cadastro_concluido=conta criada.';
COMMENT ON COLUMN whatsapp_lead_recovery.email_requested_at IS 'Momento em que a assistente enviou "Qual seu e-mail?". Base para os intervalos 5m, 10m, 15h, 24h, 48h.';
COMMENT ON COLUMN whatsapp_lead_recovery.etapa_followup IS 'Última etapa enviada: 0=nenhuma, 1=5min, 2=10min, 3=15h, 4=24h, 5=48h.';
COMMENT ON COLUMN whatsapp_lead_recovery.mensagens_followup_enviadas IS 'Textos das mensagens já enviadas nesta conversa, para não repetir.';

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_recovery_status
  ON whatsapp_lead_recovery(status_conversa)
  WHERE cadastro_finalizado = false AND email_recebido = false;

CREATE INDEX IF NOT EXISTS idx_whatsapp_lead_recovery_email_requested
  ON whatsapp_lead_recovery(email_requested_at)
  WHERE status_conversa IN ('aguardando_email', 'follow_up');
