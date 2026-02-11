-- ============================================
-- "Visitantes Hoje" com início do dia em Brasília (UTC-3)
-- ============================================
-- Execute no SQL Editor do Supabase.
-- Assim o contador "Hoje" usa 0h–24h no fuso de Brasília.
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
  -- Início do dia de hoje em Brasília (America/Sao_Paulo = UTC-3)
  start_today := ((now() AT TIME ZONE 'America/Sao_Paulo')::date)::timestamp AT TIME ZONE 'America/Sao_Paulo';
  start_month := date_trunc('month', now()) AT TIME ZONE 'UTC';
  two_min_ago := now() - interval '2 minutes';
  week_ago := now() - interval '7 days';

  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= two_min_ago)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= two_min_ago),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_today)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= start_today),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= week_ago)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= week_ago),
    (SELECT COUNT(DISTINCT visitor_ip)::bigint FROM visitor_hits WHERE visitor_ip IS NOT NULL AND ts >= start_month)
    + (SELECT COUNT(*)::bigint FROM visitor_hits WHERE visitor_ip IS NULL AND ts >= start_month);
END;
$$;
