-- ============================================
-- BACKFILL: incluir visitas antigas na contagem
-- ============================================
-- Execute no SQL Editor do Supabase UMA VEZ.
-- Os registros antigos não tinham visitor_ip, então não entravam
-- na contagem. Este script preenche com um identificador único
-- para que Total, Hoje, Semana e Mês voltem a refletir o histórico.
-- Novas visitas continuam sendo contadas por IP real (pessoa única).
-- ============================================

UPDATE visitor_hits
SET visitor_ip = 'legacy-' || id::text
WHERE visitor_ip IS NULL;

-- Verificar: deve retornar a quantidade de linhas atualizadas
-- SELECT COUNT(*) FROM visitor_hits WHERE visitor_ip LIKE 'legacy-%';
