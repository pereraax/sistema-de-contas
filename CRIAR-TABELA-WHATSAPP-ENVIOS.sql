-- Criar tabela para rastrear envios de registros via WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_envios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  tipo_registro TEXT NOT NULL, -- 'entrada', 'saida', 'divida'
  UNIQUE(account_owner_id, created_at, tipo_registro)
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_envios_account_owner ON whatsapp_envios(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_envios_created_at ON whatsapp_envios(created_at);

-- Habilitar RLS
ALTER TABLE whatsapp_envios ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios envios
CREATE POLICY "Usuários podem ver seus próprios envios"
  ON whatsapp_envios
  FOR SELECT
  USING (auth.uid() = account_owner_id);

-- Política: apenas o sistema pode inserir (via service role)
CREATE POLICY "Sistema pode inserir envios"
  ON whatsapp_envios
  FOR INSERT
  WITH CHECK (true);



