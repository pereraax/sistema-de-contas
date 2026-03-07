-- Plano gratuito: contagem de registros por contato já feita via plen_interaction_logs (acao_executada = test_expense_ok | registro_gasto_ativo).
-- Lembretes PLEN: "preciso pagar dia X" / "preciso receber dia X" → enviar no dia.

CREATE TABLE IF NOT EXISTS plen_lembretes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  descricao TEXT NOT NULL,
  data_lembrete DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plen_lembretes_contact ON plen_lembretes(contact_id);
CREATE INDEX IF NOT EXISTS idx_plen_lembretes_data_status ON plen_lembretes(data_lembrete, status) WHERE status = 'pendente';

ALTER TABLE plen_lembretes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plen_lembretes_service" ON plen_lembretes FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE plen_lembretes IS 'Lembretes criados via PLEN (preciso pagar/receber dia X); envio no dia via cron';

-- Reengajamento: controle da última mensagem de reengajamento por contato
ALTER TABLE plen_user_state
  ADD COLUMN IF NOT EXISTS reengagement_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN plen_user_state.reengagement_sent_at IS 'Última vez que enviamos mensagem de reengajamento (conversa parada)';
