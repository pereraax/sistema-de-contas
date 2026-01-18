# Criar Tabela de Rastreamento de Envios WhatsApp

## 📋 Instruções

Para implementar o limite de 7 envios via WhatsApp para usuários do plano gratuito, você precisa criar a tabela `whatsapp_envios` no Supabase.

## 🗄️ Passos

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o script `CRIAR-TABELA-WHATSAPP-ENVIOS.sql`

## ✅ O que a tabela faz

- Rastreia todos os envios de registros via WhatsApp
- Permite verificar quantos envios cada usuário já fez
- Bloqueia após 7 envios para usuários do plano gratuito (teste)
- Desbloqueia automaticamente quando o usuário assina um plano (básico/premium)

## 🔄 Como funciona

1. **Usuário do plano TESTE**: Limitado a 7 envios via WhatsApp
2. **Usuário do plano BÁSICO/PREMIUM**: Envios ilimitados
3. **Quando o usuário assina**: O sistema verifica o plano antes de cada envio, então automaticamente permite novos envios

## 📊 Verificação

Após criar a tabela, você pode verificar os envios com:

```sql
SELECT 
  account_owner_id,
  COUNT(*) as total_envios,
  MAX(created_at) as ultimo_envio
FROM whatsapp_envios
GROUP BY account_owner_id
ORDER BY total_envios DESC;
```



