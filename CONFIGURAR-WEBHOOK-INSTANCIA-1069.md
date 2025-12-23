# 🔧 Configurar Webhook para Instância 1069

## ✅ Status Atual

- ✅ **ID da Instância:** 1069 (correto)
- ✅ **Mensagem Recebida:** Apifacil está recebendo mensagens
- ❌ **Webhook:** Não configurado ou não está sendo chamado

---

## 🎯 Solução: Configurar Webhook Manualmente

### **URL do Webhook:**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```

---

## 📋 Passo a Passo

### **1. Acessar Painel do Apifacil**

1. Acesse: https://apifacil.dev
2. Faça login na sua conta
3. Vá na instância **1069**

---

### **2. Configurar Webhook**

1. **Clique em "Config. Webhook"** ou **"Webhooks"** (pode estar em uma aba ou menu)
2. **Cole a URL do webhook:**
   ```
   https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
   ```
3. **Ative o webhook:**
   - Marque a opção **"Webhook Ativo"** ou **"Ativar Webhook"**
   - Ou configure `webhook_ativo: true`
4. **Configure os eventos:**
   - ✅ **MENSAGEM_RECEBIDA** (obrigatório)
   - ✅ **MENSAGEM_ENVIADA** (opcional, mas recomendado)
   - ✅ **STATUS_MENSAGEM** (opcional)
5. **Salve a configuração**

---

### **3. Verificar Configuração**

Após salvar, verifique:
- ✅ URL está correta (sem espaços, sem barras extras)
- ✅ Webhook está **ATIVO**
- ✅ Eventos estão marcados

---

## 🧪 Testar o Webhook

### **Teste 1: Verificar se o Endpoint Está Acessível**

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

### **Teste 2: Enviar Mensagem de Teste**

1. **Envie uma mensagem pelo WhatsApp** para o número conectado
2. **Acesse os logs do Render:**
   - Dashboard do Render → **Logs**
3. **Procure por:**
   ```
   🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
   📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
   ✅ [Apifacil Webhook] Mensagem RECEBIDA confirmada
   ```

**Se aparecer = Webhook está funcionando! ✅**

**Se NÃO aparecer = Webhook não está sendo chamado ❌**
- Verifique se a URL está correta no Apifacil
- Verifique se o webhook está ATIVO
- Verifique se os eventos estão configurados

---

## 🔄 Configurar Webhook Automaticamente (Alternativa)

Se preferir configurar via API, acesse:

```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook
```

**Método POST:**
```bash
curl -X POST https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook"}'
```

**Nota:** A configuração automática pode não funcionar se a API do Apifacil não permitir. Nesse caso, configure manualmente no painel.

---

## ⚠️ Problemas Comuns

### **Problema 1: Webhook não está sendo chamado**

**Soluções:**
1. Verifique se a URL está **EXATAMENTE** como mostrado acima
2. Verifique se usa **HTTPS** (não HTTP)
3. Verifique se não tem barra extra no final
4. Verifique se o webhook está **ATIVO** no painel

---

### **Problema 2: Webhook retorna erro 404**

**Causa:** URL incorreta ou endpoint não existe

**Solução:**
1. Teste a URL no navegador primeiro
2. Verifique se o Render está online
3. Verifique se o deploy foi concluído

---

### **Problema 3: Webhook é chamado mas não processa**

**Verifique nos logs:**
- Se aparece `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`
- Se aparece `✅ [Apifacil Webhook] Mensagem RECEBIDA confirmada`
- Se aparece algum erro após isso

**Se aparecer erro:**
- Verifique se `APIFACIL_TOKEN` está correto no Render
- Verifique se `APIFACIL_INSTANCE_ID` está como `1069` no Render

---

## 📊 Verificar Status da Instância

Acesse:
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/status
```

**Deve retornar:**
```json
{
  "success": true,
  "connected": true
}
```

**Se retornar `connected: false`:**
- A instância não está conectada
- Escaneie o QR Code no painel do Apifacil

---

## ✅ Checklist Final

Após configurar, verifique:

- [ ] URL do webhook está correta no Apifacil
- [ ] Webhook está ATIVO no Apifacil
- [ ] Eventos estão configurados (MENSAGEM_RECEBIDA)
- [ ] Endpoint está acessível (teste no navegador)
- [ ] Logs aparecem quando envia mensagem
- [ ] Assistente responde às mensagens

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs completos no Render**
2. **Envie uma mensagem de teste**
3. **Procure por erros nos logs**
4. **Verifique se a instância está conectada no Apifacil**

Se o problema persistir, envie:
- Screenshot da configuração do webhook no Apifacil
- Screenshot dos logs do Render após enviar mensagem
- Resultado do teste do endpoint
