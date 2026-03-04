-- Modo teste inicial: marcar quando enviamos a mensagem "Me diga algo que você gastou hoje"
-- para saber que a próxima mensagem do usuário pode ser um gasto simples.
ALTER TABLE whatsapp_contatos
ADD COLUMN IF NOT EXISTS test_intro_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN whatsapp_contatos.test_intro_sent_at IS 'Quando a mensagem inicial do modo teste foi enviada (antes de criar conta).';
