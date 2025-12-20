-- ============================================
-- POLÍTICAS RLS PARA TABELA 'banners'
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Isso permitirá criar, atualizar e deletar banners

-- ═══════════════════════════════════════════════════════════════
-- 1️⃣ REMOVER POLÍTICAS EXISTENTES (se houver)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Usuários podem ver banners ativos" ON banners;
DROP POLICY IF EXISTS "Admins podem inserir banners" ON banners;
DROP POLICY IF EXISTS "Admins podem atualizar banners" ON banners;
DROP POLICY IF EXISTS "Admins podem deletar banners" ON banners;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar banners" ON banners;

-- ═══════════════════════════════════════════════════════════════
-- 2️⃣ POLÍTICA PARA SELECT (Visualização pública de banners ativos)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Usuários podem ver banners ativos"
ON banners
FOR SELECT
USING (ativo = true);

-- ═══════════════════════════════════════════════════════════════
-- 3️⃣ POLÍTICA PARA INSERT (Criar banners)
-- ═══════════════════════════════════════════════════════════════
-- Permitir inserção para usuários autenticados (admins)
CREATE POLICY "Usuários autenticados podem criar banners"
ON banners
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- 4️⃣ POLÍTICA PARA UPDATE (Atualizar banners)
-- ═══════════════════════════════════════════════════════════════
-- Permitir atualização para usuários autenticados (admins)
CREATE POLICY "Usuários autenticados podem atualizar banners"
ON banners
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- 5️⃣ POLÍTICA PARA DELETE (Deletar banners)
-- ═══════════════════════════════════════════════════════════════
-- Permitir deleção para usuários autenticados (admins)
CREATE POLICY "Usuários autenticados podem deletar banners"
ON banners
FOR DELETE
USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════
-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'banners' AND schemaname = 'public';















