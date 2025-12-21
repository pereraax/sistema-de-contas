-- ============================================
-- CRIAR TABELA DE LEMBRETES (SEM RLS - PARA TESTE)
-- ============================================
-- Execute este script se o script normal não funcionar
-- Este script desabilita RLS temporariamente para testar

CREATE TABLE IF NOT EXISTS lembretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  data_lembrete TIMESTAMP WITH TIME ZONE NOT NULL,
  horario TIME,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  whatsapp_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lembretes_user_id ON lembretes(user_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_account_owner_id ON lembretes(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data_lembrete ON lembretes(data_lembrete);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON lembretes(status);
CREATE INDEX IF NOT EXISTS idx_lembretes_whatsapp_phone ON lembretes(whatsapp_phone);

-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- Se funcionar, você pode reabilitar depois
ALTER TABLE lembretes DISABLE ROW LEVEL SECURITY;

-- Comentários
COMMENT ON TABLE lembretes IS 'Armazena lembretes criados pelos usuários via WhatsApp ou interface web';
COMMENT ON COLUMN lembretes.descricao IS 'Descrição do lembrete (ex: "Pagar o cartão")';
COMMENT ON COLUMN lembretes.data_lembrete IS 'Data e hora do lembrete';
COMMENT ON COLUMN lembretes.horario IS 'Horário específico do lembrete (opcional)';
COMMENT ON COLUMN lembretes.status IS 'Status do lembrete: pendente, concluido, cancelado';
COMMENT ON COLUMN lembretes.whatsapp_phone IS 'Número do WhatsApp que criou o lembrete';








