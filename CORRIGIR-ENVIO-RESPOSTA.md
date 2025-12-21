# 🔧 Corrigir Envio de Resposta Automática

## ✅ **O Que Já Está Funcionando:**

1. ✅ **Webhook recebendo:** Mensagens estão chegando no formato correto
2. ✅ **Formato detectado:** `event: "whatsapp_insert"` e `tipo_envio: "MENSAGEM_RECEBIDA"`
3. ✅ **Processamento:** Mensagem está sendo processada pelo PLEN
4. ✅ **Resposta gerada:** O PLEN está gerando a resposta

## ❌ **O Que NÃO Está Funcionando:**

1. ❌ **Envio da resposta:** O endpoint de envio não está funcionando
2. ❌ **Endpoint incorreto:** Todos os endpoints testados retornam 405 (Method Not Allowed)

---

## 🔍 **Diagnóstico:**

### **Formato Recebido (Correto):**
```json
{
  "event": "whatsapp_insert",
  "mensagem": "Oi",
  "origem": "553194467805",
  "tipo_envio": "MENSAGEM_RECEBIDA",
  ...
}
```

### **Problema:**
O endpoint para **enviar** mensagens ainda não foi descoberto. Todos os testes retornam 405.

---

## 🧪 **Próximos Passos:**

### **1. Verificar Logs do Servidor**

Olhe o terminal onde está rodando `npm run dev`. Você deve ver:

```
📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
✅ [Apifacil Webhook] Formato apifacil.dev detectado (whatsapp_insert)
✅ [Apifacil Webhook] Mensagem formatada: { phoneNumber: '...', text: 'Oi' }
🔄 [Apifacil Webhook] Processando mensagem: ...
📥 [Apifacil Webhook] Resultado do processamento: { success: true, hasMessage: true }
📤 [Apifacil Webhook] ENVIANDO RESPOSTA!
❌ [Apifacil Webhook] FALHOU ao enviar resposta: ...
```

### **2. Verificar Documentação do apifacil.dev**

Acesse: https://apifacil.dev/documentacao/whatsapp

Procure pela seção de **"Enviar Mensagem"** ou **"Send Message"** para descobrir o endpoint correto.

### **3. Testar Endpoint Correto**

Baseado na busca, o endpoint pode ser:
```
POST https://apifacil.dev/api/v1/whatsapp/mensagem
```

Com payload:
```json
{
  "instancia_id": 1041,
  "numero_destino": "553194467805",
  "mensagem": "Resposta automática"
}
```

---

## 🔧 **O Que Foi Corrigido:**

1. ✅ **Formato do webhook:** Agora detecta `whatsapp_insert` corretamente
2. ✅ **Extração de dados:** Extrai `origem` e `mensagem` corretamente
3. ✅ **Logs melhorados:** Logs muito mais detalhados
4. ✅ **Múltiplos endpoints:** Tenta vários endpoints de envio

---

## 📋 **Ação Necessária:**

**Você precisa descobrir o endpoint correto de envio no painel do apifacil.dev:**

1. Acesse: https://apifacil.dev
2. Vá em **"Enviar Mensagem"** ou **"Como usar"**
3. Veja qual endpoint é usado para enviar mensagens
4. Me diga qual é o endpoint correto

**OU**

1. Envie uma mensagem manualmente pelo painel
2. Veja qual requisição é feita (inspecione a rede no navegador)
3. Me diga qual endpoint foi usado

---

**Enquanto isso, verifique os logs do servidor para ver se a mensagem está sendo processada!** 🔍










