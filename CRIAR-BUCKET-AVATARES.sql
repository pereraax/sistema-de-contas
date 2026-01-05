-- ============================================
-- CRIAR BUCKET PARA AVATARES/PERFIS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- 
-- Este script cria um bucket no Supabase Storage para armazenar
-- as imagens de perfil dos usuários.
--
-- IMPORTANTE: Você também precisa criar o bucket manualmente no
-- Supabase Dashboard > Storage > Create Bucket
-- 
-- Nome do bucket: "avatares"
-- Público: Sim (para permitir acesso às imagens)
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
-- ============================================

-- Nota: A criação de buckets via SQL não é suportada diretamente.
-- Você precisa criar o bucket manualmente no Supabase Dashboard.
--
-- Passos:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em Storage
-- 3. Clique em "New bucket"
-- 4. Configure:
--    - Name: avatares
--    - Public bucket: Sim (marcado)
--    - File size limit: 2097152 (2MB em bytes)
--    - Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp,image/gif
-- 5. Clique em "Create bucket"
--
-- Após criar o bucket, você pode usar as políticas RLS abaixo
-- para controlar o acesso (opcional):

-- Política para permitir leitura pública (já que o bucket é público)
-- CREATE POLICY "Permitir leitura pública de avatares"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatares');

-- Política para permitir upload apenas para usuários autenticados
-- CREATE POLICY "Permitir upload de avatares para usuários autenticados"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'avatares' AND auth.role() = 'authenticated');

-- Política para permitir atualização apenas para o dono do arquivo
-- CREATE POLICY "Permitir atualização de avatares pelo dono"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir exclusão apenas para o dono do arquivo
-- CREATE POLICY "Permitir exclusão de avatares pelo dono"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

