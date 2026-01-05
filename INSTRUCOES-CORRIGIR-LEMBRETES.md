# Instruções para Corrigir o Campo de Usuário em Lembretes

## ⚠️ IMPORTANTE

Para que o campo de seleção de usuário funcione corretamente nos lembretes, você precisa executar o script SQL **ANTES** de usar o código atualizado.

## 📋 Passo a Passo

### 1. Executar o Script SQL

Execute o script `CORRIGIR-USER-ID-LEMBRETES.sql` no Supabase SQL Editor:

```sql
-- Remover a constraint de foreign key antiga
ALTER TABLE lembretes 
DROP CONSTRAINT IF EXISTS lembretes_user_id_fkey;

-- Adicionar a nova constraint de foreign key
ALTER TABLE lembretes
ADD CONSTRAINT lembretes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
```

### 2. Verificar se Funcionou

Execute este SQL para verificar se a constraint foi alterada corretamente:

```sql
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conname = 'lembretes_user_id_fkey';
```

O resultado deve mostrar que `foreign_table_name` é `users`, não `auth.users`.

### 3. Migrar Dados Existentes (Opcional)

Se você já tem lembretes criados, você pode precisar migrar os dados. Os lembretes existentes terão `user_id` como `auth.uid()`, mas agora precisam ter um ID da tabela `users`.

Você pode criar uma função para migrar ou simplesmente deixar que novos lembretes sejam criados com a nova estrutura.

## ✅ Após executar o script SQL, o campo de seleção de usuário funcionará corretamente!

