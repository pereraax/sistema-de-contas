-- Usuários criados pelo WhatsApp (ou sem senha conhecida) precisam definir senha no primeiro acesso.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS precisa_definir_senha BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.precisa_definir_senha IS 'True para contas criadas pelo WhatsApp; no primeiro acesso ao login mostramos "Criar senha" em vez do campo senha.';
