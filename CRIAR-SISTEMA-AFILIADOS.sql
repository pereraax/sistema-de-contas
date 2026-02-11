-- Sistema de Afiliados: ganhe R$ 3 por indicação, saque a partir de R$ 30
-- Execute no SQL Editor do Supabase

-- 1) Código de afiliado único por usuário (profiles)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_affiliate_code 
ON profiles(affiliate_code) WHERE affiliate_code IS NOT NULL;

COMMENT ON COLUMN profiles.affiliate_code IS 'Código único para link de indicação (ex: cadastro?ref=ABC12345)';

-- 2) Tabela de indicações: quem indicou quem e quando
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at DESC);

COMMENT ON TABLE referrals IS 'Cada linha = 1 indicação (R$ 3 de ganho para o referrer_id)';

-- 3) Solicitações de saque dos afiliados
CREATE TABLE IF NOT EXISTS affiliate_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 30),
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'phone', 'email')),
  pix_key_value TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user ON affiliate_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_created ON affiliate_withdrawal_requests(created_at DESC);

COMMENT ON TABLE affiliate_withdrawal_requests IS 'Solicitações de saque: admin paga manualmente e marca como paid';

-- RLS: usuário só vê suas próprias solicitações; admin vê todas (via service role)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_select_own ON referrals;
CREATE POLICY referrals_select_own ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS referrals_insert_service ON referrals;
CREATE POLICY referrals_insert_service ON referrals
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS affiliate_withdrawals_select_own ON affiliate_withdrawal_requests;
CREATE POLICY affiliate_withdrawals_select_own ON affiliate_withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS affiliate_withdrawals_insert_own ON affiliate_withdrawal_requests;
CREATE POLICY affiliate_withdrawals_insert_own ON affiliate_withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Não criar policy de UPDATE para usuário: apenas service role (admin) pode marcar como pago

-- Gerar affiliate_code para usuários existentes que não têm (opcional, rodar depois)
-- UPDATE profiles SET affiliate_code = UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 8))
-- WHERE affiliate_code IS NULL;
