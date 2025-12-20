-- ============================================
-- CORRIGIR RLS PARA BANNERS - VISUALIZAÇÃO PÚBLICA
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Isso permitirá que banners ativos sejam visíveis publicamente

-- ═══════════════════════════════════════════════════════════════
-- 1️⃣ REMOVER POLÍTICA ANTIGA (se houver)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Usuários podem ver banners ativos" ON banners;

-- ═══════════════════════════════════════════════════════════════
-- 2️⃣ CRIAR POLÍTICA PÚBLICA PARA SELECT (Visualização pública)
-- ═══════════════════════════════════════════════════════════════
-- Esta política permite que QUALQUER pessoa (autenticada ou não) veja banners ativos
CREATE POLICY "Banners ativos são públicos"
ON banners
FOR SELECT
USING (ativo = true);

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════
-- Execute esta query para verificar se a política foi criada:
-- SELECT * FROM pg_policies WHERE tablename = 'banners' AND schemaname = 'public';















