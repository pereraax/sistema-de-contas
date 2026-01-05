-- ============================================
-- VERIFICAR SE A CONSTRAINT FOI REMOVIDA
-- ============================================

-- Query correta para verificar constraints da tabela whatsapp_envios
SELECT
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as tipo_descricao,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'whatsapp_envios'::regclass
ORDER BY contype, conname;

-- Verificar especificamente se a constraint UNIQUE problemática ainda existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'whatsapp_envios'::regclass 
      AND conname = 'whatsapp_envios_account_owner_id_created_at_tipo_registro_key'
    ) THEN '❌ CONSTRAINT AINDA EXISTE - Execute o script CORRIGIR-CONSTRAINT-WHATSAPP-ENVIOS.sql'
    ELSE '✅ CONSTRAINT FOI REMOVIDA - Pode testar o limite agora!'
  END as status_constraint;

