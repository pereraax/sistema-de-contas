-- ============================================
-- ⚠️ EXECUTE ESTE SCRIPT AGORA NO SUPABASE ⚠️
-- ============================================
-- Copie e cole TODO este código no SQL Editor do Supabase
-- Clique em "Run" para executar
-- 
-- Este script adiciona a coluna 'tipo' na tabela lembretes
-- ============================================

-- Adicionar a coluna tipo (verificando se já existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lembretes' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE lembretes 
    ADD COLUMN tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida'));
    
    RAISE NOTICE '✅ Coluna tipo adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna tipo já existe na tabela lembretes.';
  END IF;
END $$;

-- Garantir que a coluna é nullable (opcional)
ALTER TABLE lembretes 
ALTER COLUMN tipo DROP NOT NULL;

-- Verificar se funcionou
SELECT 
  column_name,
  data_type,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'lembretes' 
  AND column_name = 'tipo';

-- ============================================
-- ✅ Após executar este script:
-- 1. Aguarde 5-10 segundos para o cache do Supabase atualizar
-- 2. Recarregue a página do aplicativo
-- 3. Tente criar um lembrete novamente
-- ============================================


