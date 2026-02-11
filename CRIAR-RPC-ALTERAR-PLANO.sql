-- ============================================
-- RPC para alterar plano de usuário (admin)
-- ============================================
-- Permite que a API altere profiles.plano mesmo sem SUPABASE_SERVICE_ROLE_KEY.
-- A API já valida que quem chama é admin (cookie); esta função roda com
-- SECURITY DEFINER e atualiza a tabela profiles.
-- Execute no Supabase SQL Editor.
-- ============================================

CREATE OR REPLACE FUNCTION admin_update_profile_plano(
  p_user_id UUID,
  p_plano TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  plano TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano_valido BOOLEAN;
BEGIN
  -- Apenas planos permitidos
  v_plano_valido := p_plano IN ('teste', 'basico', 'premium');
  IF NOT v_plano_valido THEN
    RAISE EXCEPTION 'Plano inválido. Use: teste, basico ou premium';
  END IF;

  UPDATE profiles
  SET plano = p_plano
  WHERE profiles.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado com id %', p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.nome,
    COALESCE(p.plano, p_plano)::TEXT
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Chamável por anon e authenticated (a API só chama após validar cookie admin)
GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION admin_update_profile_plano(UUID, TEXT) IS 'Atualiza o plano de um perfil. Usado pela API /api/admin/alterar-plano quando service role key não está configurada.';

-- Versão que aceita id_curto (para quando o front envia o ID curto em vez do UUID)
CREATE OR REPLACE FUNCTION admin_update_profile_plano_by_id_curto(
  p_id_curto TEXT,
  p_plano TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  plano TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_plano_valido BOOLEAN;
BEGIN
  v_plano_valido := p_plano IN ('teste', 'basico', 'premium');
  IF NOT v_plano_valido THEN
    RAISE EXCEPTION 'Plano inválido. Use: teste, basico ou premium';
  END IF;

  SELECT profiles.id INTO v_id FROM profiles WHERE profiles.id_curto = p_id_curto LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com id_curto %', p_id_curto;
  END IF;

  UPDATE profiles SET plano = p_plano WHERE profiles.id = v_id;

  RETURN QUERY
  SELECT p.id, p.email, p.nome, COALESCE(p.plano, p_plano)::TEXT
  FROM profiles p WHERE p.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_profile_plano_by_id_curto(TEXT, TEXT) TO anon, authenticated, service_role;
COMMENT ON FUNCTION admin_update_profile_plano_by_id_curto(TEXT, TEXT) IS 'Atualiza plano por id_curto. Fallback quando a API recebe id_curto em vez de UUID.';
