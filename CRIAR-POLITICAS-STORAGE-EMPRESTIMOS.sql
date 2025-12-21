-- ============================================
-- POLÍTICAS RLS PARA STORAGE BUCKET 'emprestimos'
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Isso permitirá uploads e leitura de arquivos no bucket 'emprestimos'

-- ═══════════════════════════════════════════════════════════════
-- 1️⃣ REMOVER POLÍTICAS EXISTENTES (se houver)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public Access Read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read emprestimos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload emprestimos" ON storage.objects;

-- ═══════════════════════════════════════════════════════════════
-- 2️⃣ PERMITIR LEITURA PÚBLICA (para todos os arquivos)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Public read emprestimos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'emprestimos');

-- ═══════════════════════════════════════════════════════════════
-- 3️⃣ PERMITIR UPLOAD PARA USUÁRIOS AUTENTICADOS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Authenticated upload emprestimos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'emprestimos' 
  AND auth.role() = 'authenticated'
);

-- ═══════════════════════════════════════════════════════════════
-- 4️⃣ PERMITIR ATUALIZAÇÃO PARA USUÁRIOS AUTENTICADOS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Authenticated update emprestimos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'emprestimos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'emprestimos' 
  AND auth.role() = 'authenticated'
);

-- ═══════════════════════════════════════════════════════════════
-- 5️⃣ PERMITIR DELEÇÃO PARA USUÁRIOS AUTENTICADOS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Authenticated delete emprestimos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'emprestimos' 
  AND auth.role() = 'authenticated'
);

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════
-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

















