-- ============================================
-- CORRIGIR CONTAGEM: incluir linhas sem IP
-- ============================================
-- Execute no SQL Editor do Supabase.
-- A função passa a contar: IPs únicos + cada linha sem IP (visitas novas
-- que o servidor não conseguiu identificar por IP passam a entrar na conta).
-- Assim o número deixa de ficar travado e sobe quando há acesso.
-- ============================================

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
    -- Total: distintos com IP + quantidade de linhas sem IP
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL),
    -- Online (últimos 2 min)
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= two_min_ago)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= two_min_ago),
    -- Hoje
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_today)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= start_today),
    -- Semana
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= week_ago)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= week_ago),
    -- Mês
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_month)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= start_month);
END;
$$;
