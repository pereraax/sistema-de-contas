-- ============================================
-- ADICIONAR REPETIÇÃO MENSAL AOS LEMBRETES
-- ============================================
-- Execute este script no SQL Editor do Supabase

ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS is_recorrente_mensal BOOLEAN DEFAULT FALSE;

ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS recorrencia_dia_mes INTEGER DEFAULT NULL CHECK (recorrencia_dia_mes >= 1 AND recorrencia_dia_mes <= 31);

COMMENT ON COLUMN lembretes.is_recorrente_mensal IS 'Se true, o lembrete se repete todo mês no dia especificado em recorrencia_dia_mes';
COMMENT ON COLUMN lembretes.recorrencia_dia_mes IS 'Dia do mês (1-31) em que o lembrete se repete quando is_recorrente_mensal = true';
