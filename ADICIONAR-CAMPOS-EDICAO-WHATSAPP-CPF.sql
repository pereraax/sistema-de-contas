-- Adicionar campos para controlar edições de WhatsApp e CPF
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas para rastrear se já foram editados
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_editado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cpf_editado BOOLEAN DEFAULT FALSE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_editado ON profiles(whatsapp_editado);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf_editado ON profiles(cpf_editado);

-- Comentário: Estes campos controlam se o usuário já editou WhatsApp/CPF uma vez
-- Após a primeira edição, não será mais possível editar










