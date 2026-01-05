    -- Verificar envios de WhatsApp por usuário
    -- Este SQL mostra quantos envios cada usuário já fez via WhatsApp

    SELECT 
    p.id as user_id,
    p.email,
    p.plano,
    COUNT(we.id) as total_envios,
    STRING_AGG(DISTINCT we.tipo_registro, ', ') as tipos_registros,
    MIN(we.created_at) as primeiro_envio,
    MAX(we.created_at) as ultimo_envio
    FROM profiles p
    LEFT JOIN whatsapp_envios we ON we.account_owner_id = p.id
    GROUP BY p.id, p.email, p.plano
    ORDER BY total_envios DESC;

    -- Para ver apenas usuários do plano TESTE com envios:
    SELECT 
    p.email,
    p.plano,
    COUNT(we.id) as total_envios,
    CASE 
        WHEN COUNT(we.id) >= 7 THEN 'LIMITE ATINGIDO'
        ELSE CONCAT(COUNT(we.id), ' / 7')
    END as status_limite
    FROM profiles p
    LEFT JOIN whatsapp_envios we ON we.account_owner_id = p.id
    WHERE p.plano = 'teste'
    GROUP BY p.id, p.email, p.plano
    HAVING COUNT(we.id) > 0
    ORDER BY total_envios DESC;

    -- Para ver todos os envios de um usuário específico (substitua o UUID):
    -- SELECT * FROM whatsapp_envios WHERE account_owner_id = 'UUID_DO_USUARIO_AQUI' ORDER BY created_at DESC;

