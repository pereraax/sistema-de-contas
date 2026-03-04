-- Controle de envio "indique e ganhe": primeiro após 2 registros, depois a cada 2 ou 3 registros (aleatório).
ALTER TABLE plen_incentive_indication_sent
  ADD COLUMN IF NOT EXISTS last_sent_at_registro_count integer,
  ADD COLUMN IF NOT EXISTS next_send_after_registro_count integer;

COMMENT ON COLUMN plen_incentive_indication_sent.last_sent_at_registro_count IS 'Total de registros da conta quando enviamos a última mensagem de indique e ganhe.';
COMMENT ON COLUMN plen_incentive_indication_sent.next_send_after_registro_count IS 'Próximo envio quando total de registros >= este valor (last_sent + random 2 ou 3).';

-- Linhas antigas (só user_id/sent_at): considerar que já enviamos na marca 2; próxima na 5.
UPDATE plen_incentive_indication_sent
SET last_sent_at_registro_count = 2, next_send_after_registro_count = 5
WHERE last_sent_at_registro_count IS NULL AND next_send_after_registro_count IS NULL;
