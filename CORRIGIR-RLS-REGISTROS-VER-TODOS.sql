-- ============================================
-- CORRIGIR RLS: REGISTROS VISÍVEIS NA LISTA (INCLUINDO WHATSAPP)
-- ============================================
-- Execute no SQL Editor do Supabase.
-- Isso garante que "Todos os registros" mostre todos os registros da conta,
-- incluindo os criados pelo WhatsApp (mesmo user_id = pessoa da conta).
-- ============================================

-- Remover políticas antigas de SELECT em registros que possam estar restritivas
DROP POLICY IF EXISTS "Permitir todas as operações em registros" ON registros;
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios registros" ON registros;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios registros" ON registros;

-- Política correta: usuário vê registros cujo user_id pertence a uma pessoa (users) da sua conta
CREATE POLICY "Usuários veem registros da própria conta"
  ON registros FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE account_owner_id = auth.uid()
    )
  );

-- Manter políticas de INSERT/UPDATE/DELETE se existirem; senão criar
DROP POLICY IF EXISTS "Usuários podem criar registros" ON registros;
DROP POLICY IF EXISTS "Usuários podem atualizar seus registros" ON registros;
DROP POLICY IF EXISTS "Usuários podem deletar seus registros" ON registros;

CREATE POLICY "Usuários podem criar registros"
  ON registros FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE account_owner_id = auth.uid())
  );

CREATE POLICY "Usuários podem atualizar seus registros"
  ON registros FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE account_owner_id = auth.uid())
  );

CREATE POLICY "Usuários podem deletar seus registros"
  ON registros FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE account_owner_id = auth.uid())
  );

-- Garantir que RLS está ativo
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
