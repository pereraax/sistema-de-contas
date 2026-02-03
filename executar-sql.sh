#!/bin/bash

# Script para executar SQL no Supabase
# Este script apenas exibe as instruções, pois não temos acesso direto ao Supabase

echo "============================================"
echo "INSTRUÇÕES PARA EXECUTAR O SQL NO SUPABASE"
echo "============================================"
echo ""
echo "1. Abra o painel do Supabase: https://app.supabase.com"
echo "2. Selecione seu projeto"
echo "3. Vá em 'SQL Editor' (no menu lateral)"
echo "4. Clique em 'New query'"
echo "5. Copie e cole o conteúdo do arquivo: supabase-auth-schema-simples.sql"
echo "6. Clique em 'Run' ou pressione Ctrl+Enter"
echo ""
echo "OU execute apenas o trigger:"
echo ""
cat << 'EOF'
-- Cole este código no SQL Editor do Supabase:

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, telefone, whatsapp, plano)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'email')::TEXT, ''),
    COALESCE((NEW.raw_user_meta_data->>'nome')::TEXT, 'Usuário'),
    (NEW.raw_user_meta_data->>'telefone')::TEXT,
    (NEW.raw_user_meta_data->>'whatsapp')::TEXT,
    COALESCE((NEW.raw_user_meta_data->>'plano')::TEXT, 'teste')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EOF

echo ""
echo "============================================"





