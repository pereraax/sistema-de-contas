-- ============================================
-- CONFIG GLOBAL: assistente_global_pausada
-- ============================================
-- Usado pelo painel admin para pausar a assistente PLEN para TODOS.
-- Quando true, a assistente não responde a ninguém no WhatsApp.
-- ============================================
-- Requer a tabela platform_config (CRIAR-TABELA-PLATFORM-CONFIG.sql).

INSERT INTO platform_config (key, value, description)
VALUES (
  'assistente_global_pausada',
  'false',
  'Se true, a assistente PLEN não responde para ninguém no WhatsApp. Controle pelo painel admin.'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
