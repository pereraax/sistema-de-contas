    -- Modo teste inicial WhatsApp: coluna para saber se já enviamos "Me diga algo que você gastou hoje".
    -- Rode no Supabase (SQL Editor) se ainda não tiver a coluna.
    ALTER TABLE whatsapp_contatos
    ADD COLUMN IF NOT EXISTS test_intro_sent_at TIMESTAMP WITH TIME ZONE;
