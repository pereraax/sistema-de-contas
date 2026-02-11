-- ============================================
-- VISITANTES POR IP ÚNICO (pessoa única = 1 IP)
-- ============================================
-- Execute no SQL Editor do Supabase.
-- Permite que "Visitantes Hoje" e "Visitantes Online" contem
-- uma única vez por IP (pessoa única), atualizando em tempo real.
-- ============================================

-- 1. Adicionar coluna para identificar visitante único (IP)
ALTER TABLE visitor_hits
  ADD COLUMN IF NOT EXISTS visitor_ip TEXT;

-- Índice para filtrar por período e contar distintos
CREATE INDEX IF NOT EXISTS idx_visitor_hits_ts_ip
  ON visitor_hits(ts) WHERE visitor_ip IS NOT NULL;

-- 2. Função que retorna estatísticas por IP distinto (em sincronia com "online")
CREATE OR REPLACE FUNCTION get_visitor_stats_by_ip()
RETURNS TABLE (total bigint, online bigint, hoje bigint, semana bigint, mes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_today timestamptz;
  start_month timestamptz;
  two_min_ago timestamptz;
  week_ago timestamptz;
BEGIN
  start_today := date_trunc('day', now()) AT TIME ZONE 'UTC';
  start_month := date_trunc('month', now()) AT TIME ZONE 'UTC';
  two_min_ago := now() - interval '2 minutes';
  week_ago := now() - interval '7 days';

  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= two_min_ago),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_today),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= week_ago),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_month);
END;
$$;

-- 3. (Opcional) Incluir visitas antigas na contagem
--    Se você já tinha dados em visitor_hits, rode o script BACKFILL-VISITOR-IP.sql
--    para que Total / Hoje / Semana voltem a refletir o histórico.

-- ============================================
-- Pronto. O painel passará a usar contagem por IP único.
-- ============================================
