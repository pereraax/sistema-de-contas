-- ============================================
-- RPC para alterar plano de usuário (admin)
-- ============================================
-- Permite que a API altere profiles.plano mesmo sem SUPABASE_SERVICE_ROLE_KEY.
-- A API já valida que quem chama é admin (cookie); esta função roda com
-- SECURITY DEFINER e atualiza a tabela profiles.
-- IMPORTANTE: Esta versão também atualiza plano_status e plano_data_fim para que
-- o app desbloqueie as funções do plano (lib/plano.ts exige status ativo e data_fim futura).
-- Execute no Supabase SQL Editor.
-- ============================================

-- Versão com plano_status e plano_data_fim para o app desbloquear funções (obterPlanoUsuario em lib/plano.ts).
CREATE OR REPLACE FUNCTION admin_update_profile_plano(
  p_user_id UUID,
  p_plano TEXT,
  p_plano_status TEXT DEFAULT NULL,
  p_plano_data_fim TIMESTAMPTZ DEFAULT NULL
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
  v_status TEXT;
  v_data_fim TIMESTAMPTZ;
BEGIN
  v_plano_valido := p_plano IN ('teste', 'basico', 'premium');
  IF NOT v_plano_valido THEN
    RAISE EXCEPTION 'Plano inválido. Use: teste, basico ou premium';
  END IF;

  IF p_plano = 'teste' THEN
    v_status := 'trial';
    v_data_fim := NULL;
  ELSIF p_plano IN ('basico', 'premium') THEN
    v_status := COALESCE(NULLIF(TRIM(p_plano_status), ''), 'ativo');
    IF v_status NOT IN ('ativo', 'trial', 'cancelado', 'expirado') THEN
      v_status := 'ativo';
    END IF;
    v_data_fim := COALESCE(p_plano_data_fim, NOW() + INTERVAL '1 year');
  ELSE
    v_status := COALESCE(NULLIF(TRIM(p_plano_status), ''), 'trial');
    v_data_fim := p_plano_data_fim;
  END IF;

  UPDATE profiles
  SET
    plano = p_plano,
    plano_status = v_status,
    plano_data_fim = v_data_fim
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

GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT, TEXT, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile_plano(UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
COMMENT ON FUNCTION admin_update_profile_plano(UUID, TEXT, TEXT, TIMESTAMPTZ) IS 'Atualiza plano, plano_status e plano_data_fim. Usado pela API /api/admin/alterar-plano.';

-- Versão que aceita id_curto (para quando o front envia o ID curto em vez do UUID). Também seta plano_status e plano_data_fim.
CREATE OR REPLACE FUNCTION admin_update_profile_plano_by_id_curto(
  p_id_curto TEXT,
  p_plano TEXT,
  p_plano_status TEXT DEFAULT NULL,
  p_plano_data_fim TIMESTAMPTZ DEFAULT NULL
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
  v_status TEXT;
  v_data_fim TIMESTAMPTZ;
BEGIN
  v_plano_valido := p_plano IN ('teste', 'basico', 'premium');
  IF NOT v_plano_valido THEN
    RAISE EXCEPTION 'Plano inválido. Use: teste, basico ou premium';
  END IF;

  SELECT profiles.id INTO v_id FROM profiles WHERE profiles.id_curto = p_id_curto LIMIT 1;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com id_curto %', p_id_curto;
  END IF;

  IF p_plano = 'teste' THEN
    v_status := 'trial';
    v_data_fim := NULL;
  ELSIF p_plano IN ('basico', 'premium') THEN
    v_status := COALESCE(NULLIF(TRIM(p_plano_status), ''), 'ativo');
    IF v_status NOT IN ('ativo', 'trial', 'cancelado', 'expirado') THEN
      v_status := 'ativo';
    END IF;
    v_data_fim := COALESCE(p_plano_data_fim, NOW() + INTERVAL '1 year');
  ELSE
    v_status := COALESCE(NULLIF(TRIM(p_plano_status), ''), 'trial');
    v_data_fim := p_plano_data_fim;
  END IF;

  UPDATE profiles
  SET plano = p_plano, plano_status = v_status, plano_data_fim = v_data_fim
  WHERE profiles.id = v_id;

  RETURN QUERY
  SELECT p.id, p.email, p.nome, COALESCE(p.plano, p_plano)::TEXT
  FROM profiles p WHERE p.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_profile_plano_by_id_curto(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated, service_role;
COMMENT ON FUNCTION admin_update_profile_plano_by_id_curto(TEXT, TEXT, TEXT, TIMESTAMPTZ) IS 'Atualiza plano, plano_status e plano_data_fim por id_curto.';
