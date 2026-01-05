-- ============================================
-- TESTE SIMPLES - JÁ COM O EMAIL PREENCHIDO
-- ============================================
-- Este é o SQL mais simples para testar
-- Email: contacomerciaal01@gmail.com
-- ============================================

SELECT 
  -- Total de registros
  (SELECT COUNT(*) 
   FROM registros r
   INNER JOIN users u ON r.user_id = u.id
   INNER JOIN profiles p ON u.account_owner_id = p.id
   WHERE p.email = 'contacomerciaal01@gmail.com') as total_registros,
  
  -- Registros do mês atual
  (SELECT COUNT(*) 
   FROM registros r
   INNER JOIN users u ON r.user_id = u.id
   INNER JOIN profiles p ON u.account_owner_id = p.id
   WHERE p.email = 'contacomerciaal01@gmail.com'
     AND r.created_at >= DATE_TRUNC('month', CURRENT_DATE)
     AND r.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month') as registros_mes_atual,
  
  -- Por tipo (todos)
  (SELECT COUNT(*) 
   FROM registros r
   INNER JOIN users u ON r.user_id = u.id
   INNER JOIN profiles p ON u.account_owner_id = p.id
   WHERE p.email = 'contacomerciaal01@gmail.com' AND r.tipo = 'entrada') as entradas,
   
  (SELECT COUNT(*) 
   FROM registros r
   INNER JOIN users u ON r.user_id = u.id
   INNER JOIN profiles p ON u.account_owner_id = p.id
   WHERE p.email = 'contacomerciaal01@gmail.com' AND r.tipo = 'saida') as saidas,
   
  (SELECT COUNT(*) 
   FROM registros r
   INNER JOIN users u ON r.user_id = u.id
   INNER JOIN profiles p ON u.account_owner_id = p.id
   WHERE p.email = 'contacomerciaal01@gmail.com' AND r.tipo = 'divida') as dividas,
  
  -- Informações do período
  DATE_TRUNC('month', CURRENT_DATE) as inicio_mes,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second' as fim_mes;

