-- Reseta um contato para receber de novo a mensagem inicial do modo teste.
-- Troque '5531994467805' pelo número que você está testando (com DDI 55, sem +).
-- Rode no Supabase → SQL Editor.

UPDATE whatsapp_contatos
SET welcome_sent_at = NULL,
    test_intro_sent_at = NULL,
    updated_at = NOW()
WHERE phone = '5531994467805';
