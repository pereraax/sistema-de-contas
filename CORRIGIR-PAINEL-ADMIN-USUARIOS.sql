-- ============================================
-- CORRIGIR PAINEL ADMIN - MOSTRAR USUÁRIOS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- 
-- Este script garante que o painel admin possa ver todos os usuários
-- ============================================

-- 1. Criar ou substituir função que retorna todos os perfis (bypassa RLS)
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (
  id UUID,
  id_curto TEXT,
  email TEXT,
  nome TEXT,
  telefone TEXT,
  whatsapp TEXT,
  plano TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.id_curto,
    p.email,
    p.nome,
    p.telefone,
    p.whatsapp,
    p.plano,
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar ou substituir função para usuários assinantes
CREATE OR REPLACE FUNCTION get_subscriber_profiles()
RETURNS TABLE (
  id UUID,
  id_curto TEXT,
  email TEXT,
  nome TEXT,
  telefone TEXT,
  whatsapp TEXT,
  plano TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.id_curto,
    p.email,
    p.nome,
    p.telefone,
    p.whatsapp,
    p.plano,
    p.created_at
  FROM profiles p
  WHERE p.plano IN ('basico', 'premium')
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Garantir que as funções são executáveis por qualquer usuário (incluindo anônimo)
GRANT EXECUTE ON FUNCTION get_all_profiles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_subscriber_profiles() TO anon, authenticated;

-- 4. Verificar se as funções foram criadas
SELECT 
  'Funções criadas com sucesso' as status,
  proname as nome_funcao,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname IN ('get_all_profiles', 'get_subscriber_profiles');

-- 5. Testar a função (deve retornar todos os perfis)
SELECT COUNT(*) as total_usuarios FROM get_all_profiles();

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Se ainda não funcionar, você precisa configurar a
-- SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local
--
-- Como obter:
-- 1. Acesse o painel do Supabase
-- 2. Vá em Settings > API
-- 3. Copie a "service_role" key (NÃO a anon key!)
-- 4. Adicione no .env.local:
--    SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
-- ============================================















