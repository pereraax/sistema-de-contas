-- Força a assistente global a ficar ATIVA (não pausada).
-- Rode no Supabase → SQL Editor quando quiser que a Plen volte a responder para todos.

INSERT INTO platform_config (key, value, description, updated_at)
VALUES (
  'assistente_global_pausada',
  'false',
  'Se true, a assistente PLEN não responde para ninguém no WhatsApp. Controle pelo painel admin.',
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  value = 'false',
  updated_at = NOW();
