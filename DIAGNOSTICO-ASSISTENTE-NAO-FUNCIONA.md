# 🔍 Diagnóstico: Assistente Não Está Funcionando

## 🚨 Problema Identificado

A assistente não está respondendo às mensagens no WhatsApp, mesmo que o sistema registre as entradas.

---

## ✅ Checklist de Verificação

### 1. **Verificar ID da Instância no Apifacil**

⚠️ **IMPORTANTE:** O ID da instância mudou de **1041** para **1069**

**Verificar no Render:**
1. Acesse o dashboard do Render
2. Vá em **Environment**
3. Verifique se `APIFACIL_INSTANCE_ID=1069` (não 1041)
4. Se estiver como 1041, **atualize para 1069** e faça redeploy

**Verificar no Apifacil:**
1. Acesse: https://apifacil.dev
2. Confirme qual é o ID da sua instância atual
3. Se for 1069, está correto
4. Se for outro ID, atualize no Render

---

### 2. **Verificar Webhook Configurado no Apifacil**

**URL do Webhook deve ser:**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```

**Passos:**
1. Acesse: https://apifacil.dev
2. Vá na sua instância (ID: 1069)
3. Clique em **"Config. Webhook"** ou **"Webhooks"**
4. Verifique se a URL está configurada corretamente
5. Verifique se o webhook está **ATIVO** (webhook_ativo: true)

**Se não estiver configurado:**
- Cole a URL: `https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook`
- Ative o webhook
- Salve as configurações

---

### 3. **Verificar se o Webhook Está Recebendo Mensagens**

**Teste 1: Verificar logs no Render**
1. Acesse o dashboard do Render
2. Vá em **Logs**
3. Envie uma mensagem pelo WhatsApp
4. Procure por: `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`

**Se aparecer:**
- ✅ O webhook está sendo chamado
- Continue para o próximo passo

**Se NÃO aparecer:**
- ❌ O webhook não está sendo chamado
- Verifique a URL do webhook no Apifacil
- Verifique se o Render está online

---

### 4. **Verificar Processamento da Mensagem**

**Nos logs do Render, procure por:**
```
✅ [Apifacil Webhook] Mensagem RECEBIDA confirmada
🔄 [Apifacil Webhook] INICIANDO PROCESSAMENTO
✅ [Apifacil Webhook] Resultado válido - tem sucesso e mensagem!
📤 [Apifacil Webhook] Enviando resposta
```

**Se aparecer "Resultado null" ou "Sem resposta":**
- O processamento pode estar falhando
- Verifique se há erros nos logs

---

### 5. **Verificar Envio da Resposta**

**Nos logs do Render, procure por:**
```
📤 [Apifacil Webhook] RESULTADO DO ENVIO
✅ [Apifacil Webhook] Resposta enviada com sucesso!
```

**Se aparecer erro:**
- Verifique se `APIFACIL_TOKEN` está correto
- Verifique se a instância está conectada

---

## 🔧 Soluções Rápidas

### Solução 1: Reconfigurar Webhook Automaticamente

Acesse no navegador (após o deploy):
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook
```

**Método POST:**
```bash
curl -X POST https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/configurar-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook"}'
```

---

### Solução 2: Verificar Status da Instância

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

### Solução 3: Testar Webhook Manualmente

Acesse:
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/testar-webhook-apifacil
```

**Método POST:**
```bash
curl -X POST https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/testar-webhook-apifacil \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "553194467805", "message": "teste"}'
```

---

## 📋 Resumo das Ações Necessárias

1. ✅ **Atualizar `APIFACIL_INSTANCE_ID` no Render** para `1069`
2. ✅ **Verificar URL do webhook no Apifacil** está correta
3. ✅ **Verificar se webhook está ATIVO** no Apifacil
4. ✅ **Verificar logs no Render** quando enviar mensagem
5. ✅ **Testar webhook manualmente** para confirmar funcionamento

---

## 🆘 Se Nada Funcionar

1. **Verifique os logs completos no Render:**
   - Procure por erros
   - Procure por "WEBHOOK CHAMADO"
   - Procure por "Mensagem RECEBIDA"

2. **Verifique no painel do Apifacil:**
   - Status da instância (deve estar "conectada")
   - Logs de webhook (se disponível)
   - Histórico de mensagens

3. **Teste manualmente:**
   - Envie uma mensagem simples: "teste"
   - Verifique se aparece nos logs
   - Verifique se há resposta

---

## 📞 Próximos Passos

Após verificar todos os itens acima, envie:
- Screenshot dos logs do Render
- Screenshot da configuração do webhook no Apifacil
- Resultado do teste manual do webhook

Isso ajudará a identificar exatamente onde está o problema.
