-- Lembretes Plen: valor, horário e recorrência (todo dia X); status concluido (usuário disse que pagou)
ALTER TABLE plen_lembretes
  ADD COLUMN IF NOT EXISTS valor NUMERIC(20, 2),
  ADD COLUMN IF NOT EXISTS horario TIME,
  ADD COLUMN IF NOT EXISTS is_recorrente BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dia_recorrente INTEGER CHECK (dia_recorrente IS NULL OR (dia_recorrente >= 1 AND dia_recorrente <= 31));

COMMENT ON COLUMN plen_lembretes.valor IS 'Valor a pagar/receber (ex.: 140 da academia)';
COMMENT ON COLUMN plen_lembretes.horario IS 'Horário do lembrete (ex.: 09:00 para "às 9 horas")';
COMMENT ON COLUMN plen_lembretes.is_recorrente IS 'Se true, repete todo mês no dia_recorrente';
COMMENT ON COLUMN plen_lembretes.dia_recorrente IS 'Dia do mês (1-31) quando is_recorrente = true';

-- Permitir status 'concluido' (usuário respondeu "sim" ao "já pagou?")
ALTER TABLE plen_lembretes DROP CONSTRAINT IF EXISTS plen_lembretes_status_check;
ALTER TABLE plen_lembretes ADD CONSTRAINT plen_lembretes_status_check
  CHECK (status IN ('pendente', 'enviado', 'concluido', 'cancelado'));
