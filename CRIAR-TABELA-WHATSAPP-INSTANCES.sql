-- Criar tabela para armazenar instâncias WhatsApp próprias
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identificação
  instance_name TEXT NOT NULL UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
  
  -- Dados de conexão
  phone_number TEXT,
  qr_code TEXT,
  
  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name ON whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

-- Comentários
COMMENT ON TABLE whatsapp_instances IS 'Instâncias WhatsApp próprias do PleniPay';
COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Nome único da instância (ex: plenipay)';
COMMENT ON COLUMN whatsapp_instances.status IS 'Status: disconnected, connecting, connected, error';
COMMENT ON COLUMN whatsapp_instances.phone_number IS 'Número de telefone conectado';
COMMENT ON COLUMN whatsapp_instances.qr_code IS 'QR Code atual (base64)';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_instances_updated_at
    BEFORE UPDATE ON whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();













