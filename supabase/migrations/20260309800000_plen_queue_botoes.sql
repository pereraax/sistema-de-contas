-- Botões opcionais na fila: mensagens agendadas (ex.: após delay) podem ser enviadas com botões
ALTER TABLE plen_message_queue
ADD COLUMN IF NOT EXISTS botoes JSONB DEFAULT NULL;

COMMENT ON COLUMN plen_message_queue.botoes IS 'Array de { titulo, link? } para enviar mensagem com botões (Z-API). Ex.: [{"titulo":"Falar com suporte","link":""}]';
    