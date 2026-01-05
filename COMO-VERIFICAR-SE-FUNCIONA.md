# ✅ Como Verificar se o Limite de 7 Mensagens Está Funcionando

## 🎯 Verificação em 3 Passos:

### **PASSO 1: Verificar os Logs na Página `/logs-servidor`**

1. Acesse: `https://seu-servidor.render.com/logs-servidor`
2. Envie uma mensagem via WhatsApp (ex: "ganhei 30 reais")
3. Procure por estes logs **na ordem**:

#### ✅ **Logs que DEVEM aparecer:**

1. **Log do endpoint chamado:**
   ```
   🚀🚀🚀 [PLEN WhatsApp] ENDPOINT CHAMADO!
   ```

2. **Log do profile encontrado:**
   ```
   👤 [PLEN WhatsApp] Profile encontrado - Email: ..., Plano: ...
   ```

3. **Log de detecção de plano (DEBUG):**
   ```
   🔍 [PLEN WhatsApp] DETECÇÃO DE PLANO - DEBUG COMPLETO
   🔍 [PLEN WhatsApp] Profile.plano (raw): teste
   🔍 [PLEN WhatsApp] Plano normalizado: teste
   🔍 [PLEN WhatsApp] É teste? true
   ```

4. **Log crítico do limite (MUITO IMPORTANTE):**
   ```
   🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥
   ```
   - ⚠️ **Se este log NÃO aparecer**, o limite NÃO está funcionando

5. **Log de contagem:**
   ```
   📊 Total de envios: 0 / 7
   ```
   (ou 1/7, 2/7, etc., dependendo de quantos já foram enviados)

6. **Log de inserção:**
   ```
   📝 Inserindo envio: entrada
   ```

7. **Log de sucesso ou erro:**
   - **SUCESSO:**
     ```
     ✅ ENVIO REGISTRADO! ID: [algum-uuid]
     📊 Total após inserção: 1 / 7
     ```
   - **ERRO:**
     ```
     ❌ ERRO AO INSERIR! Código: ..., Mensagem: ...
     ```

### **PASSO 2: Verificar no Banco de Dados**

Execute este SQL no Supabase:

```sql
-- Verificar se o envio foi registrado
SELECT 
  w.id,
  w.account_owner_id,
  w.tipo_registro,
  w.created_at,
  TO_CHAR(w.created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada,
  p.email,
  p.plano
FROM whatsapp_envios w
JOIN profiles p ON w.account_owner_id = p.id
WHERE p.email = 'comerciaal01@gmail.com'
ORDER BY w.created_at DESC
LIMIT 10;
```

#### ✅ **Resultado Esperado:**

- **Se FUNCIONOU:** Deve aparecer pelo menos 1 registro (ou mais, se você já enviou várias mensagens)
- **Se NÃO FUNCIONOU:** Não aparecerá nenhum registro (tabela vazia)

### **PASSO 3: Testar o Limite**

1. **Envie 7 mensagens** via WhatsApp (ex: "ganhei 30", "ganhei 40", etc.)
2. **Após cada mensagem**, execute o SQL acima para verificar a contagem
3. **Envie a 8ª mensagem** - **DEVE SER BLOQUEADA** com a mensagem:
   ```
   ❌ Você excedeu o limite de 7 envios de registros via WhatsApp no plano gratuito.
   
   📊 Você já enviou 7 registro(s) via WhatsApp.
   
   💼 Para continuar usando o assistente WhatsApp sem limites, assine um plano:
   
   🔗 plenipay.com/planos
   ```

## 📋 Checklist de Verificação:

- [ ] Acessei a página `/logs-servidor`
- [ ] Enviei uma mensagem via WhatsApp
- [ ] Apareceu o log `🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥`
- [ ] Apareceu o log `📝 Inserindo envio: entrada`
- [ ] Apareceu o log `✅ ENVIO REGISTRADO! ID: ...`
- [ ] Executei o SQL e apareceu pelo menos 1 registro na tabela
- [ ] Enviei 7 mensagens e todas foram registradas
- [ ] A 8ª mensagem foi bloqueada corretamente

## 🚨 Se NÃO Estiver Funcionando:

### **Problema 1: Log `🔥🔥🔥 PLANO TESTE` NÃO aparece**

**Possíveis causas:**
- O plano não está sendo detectado como "teste"
- Verifique o log `🔍 [PLEN WhatsApp] Profile.plano (raw): ...`
- Se aparecer `null`, `undefined`, ou outro valor, há um problema

**Solução:**
- Verifique o valor do plano no banco de dados:
  ```sql
  SELECT id, email, plano FROM profiles WHERE email = 'comerciaal01@gmail.com';
  ```
- Se o plano estiver NULL ou diferente de "teste", atualize:
  ```sql
  UPDATE profiles SET plano = 'teste' WHERE email = 'comerciaal01@gmail.com';
  ```

### **Problema 2: Log `📝 Inserindo envio` aparece mas `✅ ENVIO REGISTRADO!` NÃO**

**Possíveis causas:**
- Erro na inserção (política RLS, constraint, etc.)
- Verifique o log `❌ ERRO AO INSERIR! ...`

**Solução:**
- Copie o erro completo e vamos corrigir
- Pode ser necessário ajustar políticas RLS ou constraints

### **Problema 3: Tabela continua vazia mesmo com logs de sucesso**

**Possíveis causas:**
- A inserção está falhando silenciosamente
- Política RLS bloqueando mesmo com service role

**Solução:**
- Verifique políticas RLS:
  ```sql
  SELECT policyname, cmd, with_check
  FROM pg_policies
  WHERE tablename = 'whatsapp_envios';
  ```
- Deve existir uma política de INSERT com `with_check = 'true'`

## 🎯 Resumo:

**Para verificar se está funcionando:**

1. ✅ **Logs aparecem** na página `/logs-servidor`
2. ✅ **Registros aparecem** na tabela `whatsapp_envios`
3. ✅ **8ª mensagem é bloqueada** após 7 envios

**Se todos os 3 passos funcionarem, está OK!** ✅

