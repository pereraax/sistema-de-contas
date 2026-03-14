-- Permite à fila PLEN associar um item ao lembrete; o worker marca o lembrete como enviado só após envio real
ALTER TABLE plen_message_queue
  ADD COLUMN IF NOT EXISTS lembrete_id UUID;

COMMENT ON COLUMN plen_message_queue.lembrete_id IS 'Se preenchido, ao marcar item como sent o worker também marca plen_lembretes(id) como enviado';
