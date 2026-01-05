-- ============================================
-- ADICIONAR CAMPOS VALOR E NOTA NA TABELA LEMBRETES
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna valor (NUMERIC)
ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS valor NUMERIC(20, 2);

-- Adicionar coluna nota (TEXT)
ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS nota TEXT;

-- Comentários
COMMENT ON COLUMN lembretes.valor IS 'Valor que será pago no lembrete (opcional)';
COMMENT ON COLUMN lembretes.nota IS 'Nota ou observação adicional sobre o lembrete (opcional)';

