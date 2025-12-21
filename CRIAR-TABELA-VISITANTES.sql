-- ============================================
-- TABELA DE TRACKING DE VISITANTES
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Tabela para rastrear visitantes únicos (por IP)
CREATE TABLE IF NOT EXISTS visitantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT,
  referrer TEXT,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Tabela para rastrear sessões ativas (visitantes online)
CREATE TABLE IF NOT EXISTS sessoes_ativas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_visitantes_session_id ON visitantes(session_id);
CREATE INDEX IF NOT EXISTS idx_visitantes_ip_address ON visitantes(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitantes_user_id ON visitantes(user_id);
CREATE INDEX IF NOT EXISTS idx_visitantes_first_visit_at ON visitantes(first_visit_at);
CREATE INDEX IF NOT EXISTS idx_visitantes_last_visit_at ON visitantes(last_visit_at);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_session_id ON sessoes_ativas(session_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_ip_address ON sessoes_ativas(ip_address);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_last_activity_at ON sessoes_ativas(last_activity_at);

-- Habilitar RLS
ALTER TABLE visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_ativas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para visitantes (permitir leitura pública para estatísticas)
-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Permitir leitura pública de visitantes" ON visitantes;
DROP POLICY IF EXISTS "Permitir inserção de visitantes" ON visitantes;
DROP POLICY IF EXISTS "Permitir atualização de visitantes" ON visitantes;

CREATE POLICY "Permitir leitura pública de visitantes" ON visitantes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de visitantes" ON visitantes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de visitantes" ON visitantes
  FOR UPDATE USING (true);

-- Políticas RLS para sessões ativas
-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Permitir leitura pública de sessões ativas" ON sessoes_ativas;
DROP POLICY IF EXISTS "Permitir inserção de sessões ativas" ON sessoes_ativas;
DROP POLICY IF EXISTS "Permitir atualização de sessões ativas" ON sessoes_ativas;
DROP POLICY IF EXISTS "Permitir deleção de sessões ativas" ON sessoes_ativas;

CREATE POLICY "Permitir leitura pública de sessões ativas" ON sessoes_ativas
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de sessões ativas" ON sessoes_ativas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de sessões ativas" ON sessoes_ativas
  FOR UPDATE USING (true);

CREATE POLICY "Permitir deleção de sessões ativas" ON sessoes_ativas
  FOR DELETE USING (true);

-- Função para limpar sessões inativas (mais de 2 minutos sem atividade)
CREATE OR REPLACE FUNCTION limpar_sessoes_inativas()
RETURNS void AS $$
BEGIN
  DELETE FROM sessoes_ativas 
  WHERE last_activity_at < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_visitantes_updated_at ON visitantes;
CREATE TRIGGER update_visitantes_updated_at 
  BEFORE UPDATE ON visitantes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();













