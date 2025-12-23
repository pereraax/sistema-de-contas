-- ============================================
-- ADICIONAR CAMPO WHATSAPP_KEY NA TABELA PROFILES
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna whatsapp_key na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_key TEXT;

-- 2. Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_key ON profiles(whatsapp_key);

-- 3. Criar tabela para armazenar sessões WhatsApp (conexão temporária)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Criar índice para busca rápida por número
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);

-- 5. Habilitar RLS na tabela whatsapp_sessions
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Política: Usuários podem ver suas próprias sessões
CREATE POLICY "Usuários podem ver suas próprias sessões WhatsApp" ON whatsapp_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Política: Sistema pode inserir/atualizar sessões (via Admin API)
CREATE POLICY "Sistema pode gerenciar sessões WhatsApp" ON whatsapp_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION limpar_sessoes_whatsapp_expiradas()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_sessions 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários
COMMENT ON COLUMN profiles.whatsapp_key IS 'Chave única para autenticação via WhatsApp. Gerada nas configurações do usuário.';
COMMENT ON TABLE whatsapp_sessions IS 'Armazena sessões ativas de usuários autenticados via WhatsApp.';











