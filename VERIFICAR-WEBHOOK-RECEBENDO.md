# 🔍 Verificar se Webhook Está Recebendo Mensagens

## 📋 **Checklist:**

### **1. Verificar Logs do Webhook (Mensagens Recebidas)**

Acesse:
```
http://localhost:3000/api/whatsapp/apifacil/logs
```

Ou a página visual:
```
http://localhost:3000/whatsapp/webhook-logs
```

**O que verificar:**
- Se aparecer logs = Webhook está recebendo mensagens ✅
- Se não aparecer logs = Webhook não está sendo chamado ❌

---

### **2. Verificar Logs de Envio (Tentativas de Enviar)**

Acesse:
```
http://localhost:3000/whatsapp/send-logs
```

**O que verificar:**
- Se aparecer logs = Está tentando enviar ✅
- Se não aparecer logs = Não está chegando até o envio ❌

---

### **3. Verificar Terminal do Servidor**

Quando você enviar "oi", deve aparecer:

```
🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
🔄 [Apifacil Webhook] INICIANDO PROCESSAMENTO!
📤 [Apifacil Webhook] ENVIANDO RESPOSTA!
```

**Se NÃO aparecer:**
- Webhook não está sendo chamado
- Verifique URL no apifacil.dev
- Verifique se o túnel está rodando

---

### **4. Verificar URL do Webhook**

No painel do apifacil.dev, a URL deve ser:
```
https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook
```

**Verifique:**
- ✅ Usa HTTPS (não HTTP)
- ✅ Tem `/api/whatsapp/apifacil/webhook` no final
- ✅ O túnel está rodando

---

## 🔧 **Possíveis Problemas:**

1. ❌ **Túnel não está rodando** → Execute: `npm run tunnel`
2. ❌ **URL incorreta** → Verifique no painel
3. ❌ **Servidor não está rodando** → Execute: `npm run dev`
4. ❌ **Webhook não está sendo chamado** → Verifique logs do webhook

---

## 📋 **Me Envie:**

1. ✅ **Resultado de:** `http://localhost:3000/api/whatsapp/apifacil/logs`
2. ✅ **Resultado de:** `http://localhost:3000/whatsapp/send-logs`
3. ✅ **Logs do terminal** quando você enviar "oi"
4. ✅ **URL configurada** no painel do apifacil.dev

Com essas informações, consigo identificar exatamente onde está o problema! 🔍








