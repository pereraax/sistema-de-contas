-- ============================================
-- ADICIONAR CAMPO TIPO NA TABELA LEMBRETES
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script adiciona a coluna 'tipo' para classificar lembretes como 'entrada' ou 'saida'
-- Quando um lembrete for concluído, o sistema criará automaticamente um registro no saldo

-- IMPORTANTE: Faça backup antes de executar!

-- 1. Adicionar a coluna tipo (verificando se já existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lembretes' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE lembretes 
    ADD COLUMN tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida'));
    
    RAISE NOTICE 'Coluna tipo adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna tipo já existe na tabela lembretes.';
  END IF;
END $$;

-- 2. Garantir que a coluna é nullable (opcional)
ALTER TABLE lembretes 
ALTER COLUMN tipo DROP NOT NULL;

-- 3. Verificar se funcionou
SELECT 
  column_name,
  data_type,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'lembretes' 
  AND column_name = 'tipo';

-- NOTA: Após executar este script:
-- - Lembretes existentes terão tipo = NULL
-- - Novos lembretes podem ter tipo = 'entrada' ou 'saida' ou NULL
-- - Quando um lembrete com valor e tipo for concluído, será criado um registro automaticamente
-- - Aguarde alguns segundos para o cache do Supabase atualizar

