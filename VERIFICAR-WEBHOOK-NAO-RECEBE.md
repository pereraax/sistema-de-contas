# 🔍 Verificar: Webhook Não Está Recebendo Mensagens

## 🎯 **Problema Identificado:**
- ✅ Configuração salva no apifacil.dev
- ❌ Webhook NÃO está recebendo mensagens (0 logs)
- ❌ Instância pode não estar conectada

---

## ✅ **Soluções Imediatas:**

### **1. Verificar se a Instância Está Conectada**

Acesse no navegador:
```
http://localhost:3000/api/whatsapp/apifacil/status
```

**Se mostrar `connected: false`:**
- A instância não está conectada no apifacil.dev
- Você precisa escanear o QR Code novamente

**Solução:**
1. Acesse: https://apifacil.dev
2. Vá na sua instância (ID: 1041)
3. Verifique se está **conectada** (status verde)
4. Se não estiver, gere um novo QR Code e escaneie

---

### **2. Verificar se o Túnel Está Rodando**

Em um terminal separado, execute:
```bash
npm run tunnel
```

**Você deve ver:**
```
your url is: https://xxxxx.loca.lt
```

**IMPORTANTE:**
- ✅ O túnel DEVE estar rodando enquanto você usa o sistema
- ✅ Se fechar o terminal, o túnel para
- ✅ Se o túnel parar, a URL muda e você precisa atualizar no apifacil.dev

---

### **3. Verificar URL no apifacil.dev**

1. Acesse: https://apifacil.dev
2. Vá na sua instância (ID: 1041)
3. Clique em **"Config. Webhook"**
4. Verifique se a URL está **EXATAMENTE**:
   ```
   https://xxxxx.loca.lt/api/whatsapp/apifacil/webhook
   ```
   (Substitua `xxxxx.loca.lt` pela URL atual do seu túnel)

5. **Verifique:**
   - ✅ URL termina com `/api/whatsapp/apifacil/webhook`
   - ✅ Usa HTTPS (não HTTP)
   - ✅ Não tem barra extra no final
   - ✅ É a mesma URL que apareceu no `npm run tunnel`

---

### **4. Testar se o Webhook Está Acessível**

Acesse no navegador (usando a URL do túnel):
```
https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook
```

**Deve aparecer:**
```json
{
  "success": true,
  "message": "Apifacil Webhook ativo",
  "service": "PLEN Assistant"
}
```

**Se aparecer isso = Túnel está funcionando! ✅**

**Se NÃO aparecer ou der erro = Túnel não está funcionando ❌**

---

### **5. Verificar se o Webhook Está Ativado**

No painel do apifacil.dev:
1. Vá em **"Config. Webhook"**
2. Verifique se:
   - ✅ `webhook_ativo`: `true` ou "Ativo"
   - ✅ Eventos: `MENSAGEM_RECEBIDA` está marcado
   - ✅ Status mostra "Ativo" ou "Configurado"

---

### **6. Testar Manualmente o Webhook**

Você pode testar se o webhook está funcionando fazendo uma requisição manual:

```bash
curl -X POST https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "whatsapp_insert",
    "remetente": "553194467805",
    "mensagem": "oi",
    "tipo_envio": "MENSAGEM_RECEBIDA"
  }'
```

**Se funcionar, você deve ver logs no terminal do servidor!**

---

## 🔧 **Checklist de Verificação:**

- [ ] ✅ Instância está conectada no apifacil.dev (status verde)
- [ ] ✅ Túnel está rodando (`npm run tunnel`)
- [ ] ✅ URL do túnel copiada corretamente
- [ ] ✅ URL no apifacil.dev termina com `/api/whatsapp/apifacil/webhook`
- [ ] ✅ URL usa HTTPS (não HTTP)
- [ ] ✅ Webhook está ativado no painel
- [ ] ✅ Evento `MENSAGEM_RECEBIDA` está marcado
- [ ] ✅ Webhook está acessível (teste no navegador)
- [ ] ✅ Servidor está rodando (`npm run dev`)

---

## 🧪 **Teste Completo:**

1. **Verifique status:**
   ```bash
   curl http://localhost:3000/api/whatsapp/apifacil/status
   ```

2. **Teste envio direto:**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/apifacil/test-envio-direto \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"553194467805","message":"Teste"}'
   ```

3. **Envie "oi" pelo WhatsApp**

4. **Verifique os logs no terminal do servidor**

5. **Verifique os logs na página:**
   ```
   http://localhost:3000/whatsapp/send-logs
   ```

---

## ⚠️ **Problemas Comuns:**

### **Problema 1: Instância não conectada**
**Sintoma:** `instanciaConectada: false`

**Solução:** Escaneie o QR Code no painel do apifacil.dev

---

### **Problema 2: Túnel não está rodando**
**Sintoma:** Webhook não acessível

**Solução:** Execute `npm run tunnel` e atualize a URL no apifacil.dev

---

### **Problema 3: URL errada**
**Sintoma:** Webhook não recebe mensagens

**Solução:** Verifique se a URL termina com `/api/whatsapp/apifacil/webhook`

---

### **Problema 4: Webhook não ativado**
**Sintoma:** Mensagens não chegam

**Solução:** Ative o webhook no painel do apifacil.dev

---

**Siga o checklist acima e o sistema deve funcionar!** 🚀








