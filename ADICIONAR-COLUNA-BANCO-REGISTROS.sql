-- Adiciona a coluna banco na tabela registros para associar cada registro a um banco (Inter, Nubank, etc.)
-- Execute no SQL Editor do Supabase se a coluna ainda não existir.

ALTER TABLE registros
ADD COLUMN IF NOT EXISTS banco text;

COMMENT ON COLUMN registros.banco IS 'Identificador do banco (ex: inter, nubank, itau, c6bank, santander, picpay, mercadopago, bradesco, caixa)';
