-- Tabela para estatísticas de visitantes (admin dashboard).
-- Execute no Supabase: SQL Editor > New query > cole e rode.

CREATE TABLE IF NOT EXISTS visitor_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visitor_hits_ts ON visitor_hits(ts);

-- Opcional: limpar hits muito antigos (ex.: manter últimos 90 dias)
-- Pode ser chamado por um cron ou job periódico:
-- DELETE FROM visitor_hits WHERE ts < now() - interval '90 days';
