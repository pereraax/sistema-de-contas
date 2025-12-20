# 🔧 Solução: Assistente Não Está Respondendo

## 🎯 **Problema:**
- ✅ Configuração salva no apifacil.dev
- ❌ Instância **NÃO está conectada** (`connected: false`)
- ❌ Webhook **NÃO está recebendo mensagens** (0 logs)
- ❌ Assistente não responde

---

## ✅ **Solução Passo a Passo:**

### **1. Conectar a Instância no apifacil.dev** ⚠️ **CRÍTICO**

**Este é o problema principal!** Se a instância não está conectada, o WhatsApp não pode receber/enviar mensagens.

1. **Acesse:** https://apifacil.dev
2. **Faça login** na sua conta
3. **Vá na sua instância** (ID: 1041)
4. **Verifique o status:**
   - ❌ Se mostrar "Desconectado" ou "Offline" → Precisa conectar
   - ✅ Se mostrar "Conectado" ou "Online" → Está OK

5. **Se estiver desconectado:**
   - Clique em **"Conectar"** ou **"Gerar QR Code"**
   - **Escaneie o QR Code** com o WhatsApp do celular
   - Aguarde até aparecer **"Conectado"** ou **"Online"**

**⚠️ IMPORTANTE:** Sem conexão, o sistema não funciona!

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

### **3. Verificar URL do Webhook no apifacil.dev**

1. Acesse: https://apifacil.dev
2. Vá na sua instância (ID: 1041)
3. Clique em **"Config. Webhook"** ou **"Webhook"**
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

6. **Se a URL estiver errada:**
   - Copie a URL do túnel
   - Cole no campo "URL do Webhook"
   - Adicione `/api/whatsapp/apifacil/webhook` no final
   - Clique em **"Salvar"**

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

### **6. Verificar Logs do Servidor**

No terminal onde está rodando `npm run dev`, você deve ver:

**Quando enviar uma mensagem pelo WhatsApp:**
```
🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
```

**Se NÃO aparecer isso:**
- O webhook não está sendo chamado
- Verifique se a instância está conectada
- Verifique se a URL do webhook está correta
- Verifique se o túnel está rodando

---

### **7. Testar Envio Manual**

Você pode testar se o envio está funcionando:

```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/test-envio-direto \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "553194467805",
    "message": "Teste de envio"
  }'
```

**Se funcionar:**
- ✅ O envio está OK
- ❌ O problema está no recebimento (webhook não está sendo chamado)

**Se não funcionar:**
- ❌ O problema está no envio
- Verifique se a instância está conectada

---

## 🔍 **Checklist de Verificação:**

- [ ] ✅ Instância está **conectada** no apifacil.dev (status verde/online)
- [ ] ✅ Túnel está rodando (`npm run tunnel`)
- [ ] ✅ URL do túnel copiada corretamente
- [ ] ✅ URL no apifacil.dev termina com `/api/whatsapp/apifacil/webhook`
- [ ] ✅ URL usa HTTPS (não HTTP)
- [ ] ✅ Webhook está ativado no painel
- [ ] ✅ Evento `MENSAGEM_RECEBIDA` está marcado
- [ ] ✅ Webhook está acessível (teste no navegador)
- [ ] ✅ Servidor está rodando (`npm run dev`)
- [ ] ✅ Logs aparecem no terminal quando envia mensagem

---

## ⚠️ **Problemas Comuns:**

### **Problema 1: Instância não conectada** ⚠️ **CRÍTICO**
**Sintoma:** `instanciaConectada: false`

**Solução:** 
1. Acesse https://apifacil.dev
2. Vá na sua instância
3. Gere um novo QR Code
4. Escaneie com o WhatsApp
5. Aguarde até aparecer "Conectado"

**Sem conexão, o sistema não funciona!**

---

### **Problema 2: Túnel não está rodando**
**Sintoma:** Webhook não acessível

**Solução:** 
1. Execute `npm run tunnel`
2. Copie a URL
3. Atualize no apifacil.dev

---

### **Problema 3: URL errada**
**Sintoma:** Webhook não recebe mensagens

**Solução:** 
1. Verifique se a URL termina com `/api/whatsapp/apifacil/webhook`
2. Verifique se usa HTTPS
3. Verifique se não tem barra extra no final

---

### **Problema 4: Webhook não ativado**
**Sintoma:** Mensagens não chegam

**Solução:** 
1. Ative o webhook no painel do apifacil.dev
2. Marque o evento `MENSAGEM_RECEBIDA`

---

## 🧪 **Teste Completo:**

1. **Verificar status:**
   ```bash
   curl http://localhost:3000/api/whatsapp/apifacil/status
   ```
   **Deve mostrar:** `"connected": true`

2. **Testar webhook:**
   ```
   https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook
   ```
   **Deve aparecer:** `{"success": true, "message": "Apifacil Webhook ativo"}`

3. **Enviar "oi" pelo WhatsApp**

4. **Verificar logs no terminal do servidor**
   - Deve aparecer: `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`

5. **Aguardar resposta do assistente**

---

## 📝 **Resumo:**

**O problema principal é que a instância não está conectada!**

1. ✅ Conecte a instância no apifacil.dev (escanear QR Code)
2. ✅ Verifique se o túnel está rodando
3. ✅ Verifique se a URL do webhook está correta
4. ✅ Teste enviando "oi" pelo WhatsApp
5. ✅ Verifique os logs no terminal

**Siga o checklist acima e o sistema deve funcionar!** 🚀








