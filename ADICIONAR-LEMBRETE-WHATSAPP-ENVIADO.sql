-- ============================================
-- Coluna para marcar envio do lembrete por WhatsApp no dia
-- ============================================
-- Execute no SQL Editor do Supabase para habilitar o cron de lembretes no WhatsApp.

ALTER TABLE lembretes
ADD COLUMN IF NOT EXISTS whatsapp_lembrete_enviado_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN lembretes.whatsapp_lembrete_enviado_at IS 'Quando a Plen enviou mensagem de lembrete no WhatsApp no dia do lembrete (evita reenvio).';

CREATE INDEX IF NOT EXISTS idx_lembretes_whatsapp_enviado
ON lembretes(whatsapp_lembrete_enviado_at)
WHERE whatsapp_lembrete_enviado_at IS NULL;
