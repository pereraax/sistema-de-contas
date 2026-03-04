-- Quando o assistente não entende várias vezes seguidas, marca "aguardando humano" e para de responder até suporte responder ou 24h.
ALTER TABLE whatsapp_contatos
ADD COLUMN IF NOT EXISTS aguardando_humano_ate TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consecutive_nao_entendi INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN whatsapp_contatos.aguardando_humano_ate IS 'Se preenchido e no futuro: não enviar resposta automática; aguardar humano. Limpa após 24h ou quando usuário pede "voltar/assistente".';
COMMENT ON COLUMN whatsapp_contatos.consecutive_nao_entendi IS 'Contador de respostas "não entendi" seguidas; zera quando o assistente entende a mensagem.';
