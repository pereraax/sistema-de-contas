-- Criar tabela para armazenar configuração do WhatsApp
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Configuração Evolution API
  evolution_api_url TEXT NOT NULL,
  evolution_api_key TEXT NOT NULL,
  evolution_instance_name TEXT NOT NULL DEFAULT 'plenipay',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_disconnected_at TIMESTAMP WITH TIME ZONE,
  connected_phone_number TEXT
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_active ON whatsapp_config(is_active) WHERE is_active = true;

-- Comentários
COMMENT ON TABLE whatsapp_config IS 'Configuração do WhatsApp/Evolution API para o PleniPay';
COMMENT ON COLUMN whatsapp_config.evolution_api_url IS 'URL da Evolution API (ex: https://evolution-api-vbbp.onrender.com)';
COMMENT ON COLUMN whatsapp_config.evolution_api_key IS 'API Key da Evolution API';
COMMENT ON COLUMN whatsapp_config.evolution_instance_name IS 'Nome da instância WhatsApp (ex: plenipay)';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_config_updated_at
    BEFORE UPDATE ON whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();










