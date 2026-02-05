-- ============================================
-- DIAGNÓSTICO: REGISTROS E CONTA (WHATSAPP vs WEB)
-- ============================================
-- Execute no SQL Editor do Supabase.
-- Substitua SEU_EMAIL@exemplo.com pelo email da conta que usa o WhatsApp.
-- ============================================

-- 1) Perfil (id = account_owner usado no WhatsApp e no login web)
SELECT id, email, nome, created_at
FROM profiles
WHERE email = 'SEU_EMAIL@exemplo.com';

-- 2) Pessoas (users) dessa conta
SELECT u.id, u.nome, u.account_owner_id
FROM users u
WHERE u.account_owner_id = (SELECT id FROM profiles WHERE email = 'SEU_EMAIL@exemplo.com' LIMIT 1)
ORDER BY u.nome;

-- 3) Todos os registros dessas pessoas (o que deveria aparecer em "Todos os registros")
SELECT r.id, r.nome, r.tipo, r.valor, r.data_registro, r.user_id, u.nome AS usuario_nome
FROM registros r
JOIN users u ON u.id = r.user_id
WHERE u.account_owner_id = (SELECT id FROM profiles WHERE email = 'SEU_EMAIL@exemplo.com' LIMIT 1)
ORDER BY r.data_registro DESC
LIMIT 50;

-- 4) Se os registros acima existirem mas não aparecerem no site:
--    - Confirme que no servidor (Railway/Hostinger) a variável SUPABASE_SERVICE_ROLE_KEY está definida.
--    - Ou execute o script CORRIGIR-RLS-REGISTROS-VER-TODOS.sql para ajustar as políticas RLS.
