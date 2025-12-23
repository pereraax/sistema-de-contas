# 🚨 URGENTE: Webhook Desativado - Ativar Agora!

## ❌ Problema Identificado

**O webhook está DESATIVADO no Apifacil!**

**Evidência:**
- Status: `Erro`
- Payload mostra: `"motivo": "webhook_desativado"`
- Mensagens são recebidas mas não processadas

---

## ✅ Solução Imediata

### **1. Acessar Painel do Apifacil**

1. Acesse: https://apifacil.dev
2. Faça login
3. Vá na instância **1069**

---

### **2. Ativar o Webhook**

1. **Clique em "Config. Webhook"** ou **"Webhooks"**
2. **Verifique a URL do webhook:**
   ```
   https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
   ```
3. **ATIVAR o webhook:**
   - ✅ Marque **"Webhook Ativo"** ou **"Ativar Webhook"**
   - ✅ Ou configure `webhook_ativo: true`
   - ✅ Ou desmarque "Desativado" se estiver marcado
4. **Salve a configuração**

---

### **3. Verificar Configuração**

Após ativar, verifique:

- ✅ **Webhook está ATIVO** (não desativado)
- ✅ **URL está correta:**
   ```
   https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
   ```
- ✅ **Eventos configurados:**
   - `MENSAGEM_RECEBIDA` (obrigatório)
   - `MENSAGEM_ENVIADA` (opcional)

---

## 🧪 Testar Após Ativar

### **1. Enviar Mensagem de Teste**

1. Envie uma mensagem pelo WhatsApp
2. Acesse os logs do Render
3. Procure por:
   ```
   🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
   📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
   ```

**Se aparecer = Webhook está funcionando! ✅**

**Se NÃO aparecer = Verifique se realmente ativou**

---

### **2. Verificar Detalhes do Webhook no Apifacil**

1. No painel do Apifacil, vá em **"Detalhes do Webhook"** ou **"Histórico"**
2. Verifique se o status mudou de `Erro` para `Sucesso`
3. Verifique se o `motivo` não é mais `"webhook_desativado"`

---

## 🔄 Tentar Configurar Automaticamente

Se preferir, tente configurar via API:

**Acesse no navegador (após o deploy):**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook
```

**Método POST (via curl ou Postman):**
```bash
curl -X POST https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook"}'
```

**Nota:** A configuração automática pode não funcionar. Nesse caso, **configure manualmente no painel**.

---

## ⚠️ Verificações Importantes

### **1. URL do Webhook**

A URL deve ser **EXATAMENTE:**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```

**Verifique:**
- ✅ Usa **HTTPS** (não HTTP)
- ✅ Não tem barra extra no final
- ✅ Não tem espaços
- ✅ Está completa (com `/api/whatsapp/apifacil/webhook`)

---

### **2. Status do Webhook**

No painel do Apifacil, o webhook deve mostrar:
- ✅ **Status:** Ativo (não Desativado)
- ✅ **Webhook Ativo:** `true` (não `false`)
- ✅ **URL:** Configurada corretamente

---

### **3. Testar Endpoint**

Antes de ativar, teste se o endpoint está acessível:

Acesse no navegador:
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```

**Deve retornar:**
```json
{
  "success": true,
  "message": "Apifacil Webhook ativo",
  "service": "PLEN Assistant"
}
```

**Se retornar isso = Endpoint está funcionando! ✅**

---

## 📋 Checklist de Ativação

Após ativar o webhook, verifique:

- [ ] Webhook está **ATIVO** no painel do Apifacil
- [ ] URL está correta e completa
- [ ] Eventos estão configurados (MENSAGEM_RECEBIDA)
- [ ] Endpoint está acessível (teste no navegador)
- [ ] Enviou mensagem de teste
- [ ] Logs aparecem no Render quando envia mensagem
- [ ] Assistente responde às mensagens

---

## 🆘 Se Ainda Não Funcionar

### **1. Verificar Logs no Render**

1. Acesse o dashboard do Render
2. Vá em **Logs**
3. Envie uma mensagem pelo WhatsApp
4. Procure por:
   - `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`
   - `📨 [Apifacil Webhook] MENSAGEM RECEBIDA!`
   - Qualquer erro

---

### **2. Verificar no Apifacil**

1. Vá em **"Detalhes do Webhook"** ou **"Histórico"**
2. Verifique o status da última tentativa
3. Verifique o payload enviado
4. Verifique se o `motivo` ainda é `"webhook_desativado"`

**Se ainda mostrar `"webhook_desativado"`:**
- O webhook não foi ativado corretamente
- Tente desativar e ativar novamente
- Verifique se salvou as configurações

---

### **3. Verificar Variáveis de Ambiente no Render**

1. Acesse o dashboard do Render
2. Vá em **Environment**
3. Verifique:
   - ✅ `APIFACIL_INSTANCE_ID=1069`
   - ✅ `APIFACIL_TOKEN` está configurado
   - ✅ `NEXT_PUBLIC_APP_URL=https://sistema-de-contas-1.onrender.com`

---

## ✅ Resumo da Solução

**Problema:** Webhook está desativado (`"motivo": "webhook_desativado"`)

**Solução:**
1. Acesse o painel do Apifacil
2. Vá na instância 1069
3. Ative o webhook
4. Configure a URL correta
5. Salve as configurações
6. Teste enviando uma mensagem

---

## 🎯 Próximos Passos

1. **Ativar webhook no Apifacil** (URGENTE)
2. **Testar enviando mensagem**
3. **Verificar logs no Render**
4. **Confirmar que assistente responde**

Após ativar, a assistente deve começar a funcionar imediatamente!
