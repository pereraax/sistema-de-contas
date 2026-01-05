-- ============================================
-- VERIFICAR REGISTROS POR EMAIL (MAIS FÁCIL!)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'seu-email@exemplo.com' pelo email do usuário
-- 2. Execute a query pressionando "Run"
-- 3. Isso vai mostrar todos os registros desse usuário
-- ============================================

-- ⬇️ SUBSTITUA O EMAIL ABAIXO PELO EMAIL DO USUÁRIO ⬇️
-- Exemplo: 'usuario@email.com'

-- 1. Ver TODOS os registros do usuário (via email)
SELECT 
  r.id,
  r.user_id,
  r.nome,
  r.tipo,
  r.valor,
  r.data_registro,
  r.created_at,
  TO_CHAR(r.data_registro, 'DD/MM/YYYY') as data_evento,
  TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI:SS') as criado_em,
  CASE 
    WHEN r.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    THEN 'SIM ✅ (mês atual)'
    ELSE 'NÃO ❌ (outro mês)'
  END as esta_no_mes_atual
FROM registros r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN profiles p ON u.account_owner_id = p.id
WHERE p.email = 'contacomerciaal01@gmail.com'
ORDER BY r.created_at DESC
LIMIT 50;

-- 2. Contar registros do mês atual
SELECT 
  COUNT(*) as total_registros_mes_atual,
  COUNT(CASE WHEN r.tipo = 'entrada' THEN 1 END) as entradas,
  COUNT(CASE WHEN r.tipo = 'saida' THEN 1 END) as saidas,
  COUNT(CASE WHEN r.tipo = 'divida' THEN 1 END) as dividas
FROM registros r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN profiles p ON u.account_owner_id = p.id
WHERE p.email = 'contacomerciaal01@gmail.com'
  AND r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 3. Ver informações do usuário
SELECT 
  p.id as account_owner_id,
  p.email,
  p.nome,
  p.plano,
  COUNT(DISTINCT u.id) as total_usuarios_na_conta,
  COUNT(r.id) as total_registros_todos
FROM profiles p
LEFT JOIN users u ON u.account_owner_id = p.id
LEFT JOIN registros r ON r.user_id = u.id
WHERE p.email = 'contacomerciaal01@gmail.com'
GROUP BY p.id, p.email, p.nome, p.plano;

