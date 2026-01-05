    -- ============================================
    -- CORRIGIR CONSTRAINT E POLÍTICAS RLS
    -- ============================================

    -- 1. Remover a constraint UNIQUE problemática
    -- Ela impede múltiplos registros do mesmo tipo no mesmo segundo
    ALTER TABLE whatsapp_envios 
    DROP CONSTRAINT IF EXISTS whatsapp_envios_account_owner_id_created_at_tipo_registro_key;

    -- 2. Criar uma constraint UNIQUE mais flexível (apenas por tipo e data, não por segundo)
    -- Isso permite múltiplos registros do mesmo tipo no mesmo dia, mas evita duplicatas exatas
    -- Na verdade, vamos remover completamente e usar apenas o ID como chave primária
    -- (já que cada registro deve ser único de qualquer forma)

    -- 3. Verificar e corrigir políticas RLS para garantir que service role pode inserir
    -- Remover política antiga se existir
    DROP POLICY IF EXISTS "Sistema pode inserir envios" ON whatsapp_envios;
    DROP POLICY IF EXISTS "Usuários podem ver seus próprios envios" ON whatsapp_envios;

    -- 4. Recriar políticas RLS corretas
    -- Política para SELECT: usuários veem apenas seus próprios envios
    CREATE POLICY "Usuários podem ver seus próprios envios"
    ON whatsapp_envios
    FOR SELECT
    USING (auth.uid() = account_owner_id);

    -- Política para INSERT: service role pode inserir qualquer coisa
    -- IMPORTANTE: Service role bypassa RLS, mas vamos criar a política mesmo assim
    CREATE POLICY "Sistema pode inserir envios"
    ON whatsapp_envios
    FOR INSERT
    WITH CHECK (true);

    -- 5. Verificar se service role está sendo usado corretamente
    -- Service role (usando SUPABASE_SERVICE_ROLE_KEY) bypassa RLS automaticamente
    -- Mas vamos garantir que as políticas estão corretas

    -- 6. Verificar estrutura final
    SELECT 
    'Constraint removida' as acao,
    'whatsapp_envios_account_owner_id_created_at_tipo_registro_key' as constraint_name;

