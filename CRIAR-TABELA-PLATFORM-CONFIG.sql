-- Criar tabela para armazenar configurações globais da plataforma
-- Executar no Supabase SQL Editor
-- Esta tabela armazena configurações como Pixel do Facebook, etc.

CREATE TABLE IF NOT EXISTS platform_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,  -- Ex: 'facebook_pixel_id'
  value TEXT,                 -- Ex: '123456789012345'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_platform_config_key ON platform_config(key);

-- Inserir registro inicial para Pixel do Facebook
INSERT INTO platform_config (key, value, description)
VALUES 
  ('facebook_pixel_id', NULL, 'ID do Pixel do Facebook para rastreamento global da plataforma'),
  ('facebook_pixel_token', NULL, 'Token de acesso do Pixel do Facebook (opcional)')
ON CONFLICT (key) DO NOTHING;

-- Comentários
COMMENT ON TABLE platform_config IS 'Configurações globais da plataforma PLENIPAY';
COMMENT ON COLUMN platform_config.key IS 'Chave única da configuração (ex: facebook_pixel_id)';
COMMENT ON COLUMN platform_config.value IS 'Valor da configuração';
COMMENT ON COLUMN platform_config.description IS 'Descrição da configuração';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_platform_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_config_updated_at
    BEFORE UPDATE ON platform_config
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_config_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver e modificar configurações
-- Nota: Esta política assume que você tem uma função ou tabela de admins
-- Ajuste conforme sua estrutura de autenticação admin
CREATE POLICY "Apenas admins podem gerenciar configurações globais" ON platform_config
  FOR ALL USING (true) WITH CHECK (true);
  -- Nota: A proteção real será feita no middleware/API do Next.js

