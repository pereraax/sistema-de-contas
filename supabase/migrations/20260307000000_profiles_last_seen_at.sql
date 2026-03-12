-- Presença: usuários online (last_seen_at atualizado a cada ping do app)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON profiles(last_seen_at);

COMMENT ON COLUMN profiles.last_seen_at IS 'Última atividade na plataforma; usado para contar usuários online no dashboard admin.';
