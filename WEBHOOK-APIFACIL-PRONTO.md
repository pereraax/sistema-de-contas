# ✅ Webhook do apifacil.dev - Pronto para Configurar!

## 🎯 **Status Atual**

- ✅ **Rota criada:** `/api/whatsapp/apifacil/webhook`
- ✅ **Handler melhorado:** Suporta múltiplos formatos do apifacil.dev
- ✅ **Integração com PLEN:** Mensagens são processadas automaticamente
- ✅ **Resposta automática:** Envia resposta via apifacil.dev

---

## 📋 **Passo a Passo Rápido**

### **1. Obter URL do Webhook**

#### **Se está em produção:**
```
https://seu-dominio.com/api/whatsapp/apifacil/webhook
```

#### **Se está em desenvolvimento local:**

**Opção A: ngrok (Recomendado)**
```bash
# Instalar (se não tiver)
brew install ngrok  # macOS
# Ou baixe: https://ngrok.com/download

# Expor porta 3000
ngrok http 3000
```

Copie a URL gerada (ex: `https://abc123.ngrok.io`) e use:
```
https://abc123.ngrok.io/api/whatsapp/apifacil/webhook
```

**Opção B: localtunnel**
```bash
npm install -g localtunnel
lt --port 3000
```

Use a URL gerada: `https://xxxxx.loca.lt/api/whatsapp/apifacil/webhook`

---

### **2. Configurar no Painel do apifacil.dev**

1. **Acesse:** https://apifacil.dev
2. **Vá na sua instância** (ID: 1041)
3. **Clique na aba:** "Config. Webhook"
4. **Configure:**

   **URL do Webhook:**
   ```
   https://seu-dominio.com/api/whatsapp/apifacil/webhook
   ```
   (ou a URL do ngrok/localtunnel se estiver em desenvolvimento)

   **Eventos:**
   - ✅ `MENSAGEM_RECEBIDA` (obrigatório)
   - ✅ `MENSAGEM_ENVIADA` (opcional)
   - ✅ `STATUS_MENSAGEM` (opcional)

   **Configurações:**
   - ✅ `webhook_ativo`: `true`
   - ✅ `ativar_delay_envio_resposta`: `true`

5. **Salve** a configuração

---

### **3. Testar o Webhook**

#### **Teste 1: Verificar se está ativo**
```bash
curl https://seu-dominio.com/api/whatsapp/apifacil/webhook
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Apifacil Webhook ativo",
  "service": "PLEN Assistant"
}
```

#### **Teste 2: Simular mensagem recebida**
```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

#### **Teste 3: Enviar mensagem real**
1. Envie uma mensagem do seu WhatsApp para o número conectado
2. Verifique os logs do servidor
3. Verifique se a resposta automática foi enviada

---

## 🔍 **Verificar Logs**

Quando uma mensagem chegar, você verá nos logs:

```
📨 [Apifacil Webhook] Mensagem recebida: {...}
🔄 [Apifacil Webhook] Processando mensagem: { from: '...', textPreview: '...' }
📥 [Apifacil Webhook] Resultado do processamento: { ... }
📤 [Apifacil Webhook] Enviando resposta para: ...
✅ [Apifacil Webhook] Resposta enviada com sucesso para: ...
```

---

## 📝 **Formatos Suportados**

O webhook agora suporta múltiplos formatos do apifacil.dev:

1. **Formato com evento:**
   ```json
   {
     "event": "MENSAGEM_RECEBIDA",
     "data": {
       "from": "5511999999999",
       "text": "Mensagem",
       "timestamp": 1234567890
     }
   }
   ```

2. **Formato direto:**
   ```json
   {
     "from": "5511999999999",
     "text": "Mensagem",
     "timestamp": 1234567890
   }
   ```

3. **Formato com número:**
   ```json
   {
     "numero": "5511999999999",
     "mensagem": "Mensagem"
   }
   ```

---

## ⚠️ **Troubleshooting**

### **Webhook não recebe mensagens:**

1. Verifique se a URL está correta no painel
2. Verifique se o evento `MENSAGEM_RECEBIDA` está marcado
3. Verifique se `webhook_ativo` está `true`
4. Para desenvolvimento, verifique se o túnel (ngrok) está ativo

### **Mensagem recebida mas não processada:**

1. Verifique os logs do servidor
2. Verifique se o formato da mensagem está sendo reconhecido
3. Use a rota de teste: `/api/whatsapp/apifacil/webhook-test`

### **Resposta não é enviada:**

1. Verifique se a instância está conectada:
   ```bash
   curl http://localhost:3000/api/whatsapp/apifacil/test
   ```

2. O endpoint de envio ainda precisa ser descoberto (veja `STATUS-APIFACIL-CONECTADO.md`)

---

## ✅ **Checklist**

- [ ] URL do webhook configurada no painel
- [ ] Evento `MENSAGEM_RECEBIDA` marcado
- [ ] Webhook ativado
- [ ] Teste GET funcionando
- [ ] Teste POST funcionando
- [ ] Mensagem real enviada e recebida
- [ ] Resposta automática funcionando

---

## 📚 **Arquivos Relacionados**

- `CONFIGURAR-WEBHOOK-APIFACIL.md` - Guia completo e detalhado
- `STATUS-APIFACIL-CONECTADO.md` - Status atual da integração
- `app/api/whatsapp/apifacil/webhook/route.ts` - Código do webhook
- `app/api/whatsapp/apifacil/webhook-test/route.ts` - Rota de teste

---

**Pronto! Configure a URL no painel e teste!** 🚀








