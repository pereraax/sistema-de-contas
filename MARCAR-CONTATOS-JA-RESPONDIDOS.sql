-- Marca como "já respondidos" os contatos que estão na lista de pendentes (welcome_sent_at null).
-- Eles saem da lista de reenvio sem receber as 3 mensagens de novo.
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor).

-- Marcar TODOS os que estão com welcome_sent_at null (limpa a lista de pendentes):
UPDATE whatsapp_contatos
SET welcome_sent_at = NOW(), updated_at = NOW()
WHERE welcome_sent_at IS NULL;

-- Para marcar só números específicos, use em vez do UPDATE acima:
-- UPDATE whatsapp_contatos
-- SET welcome_sent_at = NOW(), updated_at = NOW()
-- WHERE welcome_sent_at IS NULL
--   AND phone IN ('5511999999999', '5521988887777');
