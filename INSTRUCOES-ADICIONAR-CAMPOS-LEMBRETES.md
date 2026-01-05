# Instruções para Adicionar Campos na Tabela Lembretes

## ⚠️ ERRO ENCONTRADO
O erro "Could not find the 'nota' column of 'lembretes' in the schema cache" indica que as colunas `valor` e `nota` ainda não foram adicionadas à tabela `lembretes`.

## 📋 SOLUÇÃO

### Passo 1: Acessar o Supabase
1. Acesse o painel do Supabase
2. Vá para **SQL Editor**

### Passo 2: Executar o Script SQL
Execute o script que está no arquivo `ADICIONAR-CAMPOS-LEMBRETES.sql`:

```sql
-- Adicionar coluna valor (NUMERIC)
ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS valor NUMERIC(20, 2);

-- Adicionar coluna nota (TEXT)
ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS nota TEXT;

-- Comentários
COMMENT ON COLUMN lembretes.valor IS 'Valor que será pago no lembrete (opcional)';
COMMENT ON COLUMN lembretes.nota IS 'Nota ou observação adicional sobre o lembrete (opcional)';
```

### Passo 3: Verificar
Após executar, verifique se as colunas foram criadas:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lembretes' 
AND column_name IN ('valor', 'nota');
```

## ✅ Após executar o script, o erro será resolvido!

