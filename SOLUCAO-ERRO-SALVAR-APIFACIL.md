# 🔧 Solução: Erro ao Salvar no apifacil.dev

## 🎯 **Problema:**
Você está vendo erros:
- "Erro de conexão"
- "Erro ao salvar configurações da instância"

---

## ✅ **Solução: Configurar Manualmente no Painel**

O apifacil.dev **NÃO permite** salvar configurações via API diretamente. Você precisa configurar **manualmente no painel** deles.

---

## 📋 **Passo a Passo para Configurar:**

### **1. Obter URL do Túnel**

Em um terminal, execute:
```bash
npm run tunnel
```

Você verá algo como:
```
your url is: https://xxxxx.loca.lt
```

**Copie essa URL completa!**

---

### **2. Configurar no Painel do apifacil.dev**

1. **Acesse:** https://apifacil.dev
2. **Faça login** na sua conta
3. **Vá na sua instância** (ID: 1041)
4. **Clique na aba:** "Config. Webhook" ou "Configurações"
5. **No campo "URL do Webhook (Mensagens)":**
   ```
   https://xxxxx.loca.lt/api/whatsapp/apifacil/webhook
   ```
   (Substitua `xxxxx.loca.lt` pela URL do seu túnel)

6. **IMPORTANTE - Verifique:**
   - ✅ URL termina com `/api/whatsapp/apifacil/webhook`
   - ✅ Usa HTTPS (não HTTP)
   - ✅ Não tem barra extra no final
   - ✅ É a mesma URL que apareceu no `npm run tunnel`

7. **Eventos (se houver opção):**
   - ✅ `MENSAGEM_RECEBIDA` (obrigatório)
   - ✅ `MENSAGEM_ENVIADA` (opcional)
   - ✅ `STATUS_MENSAGEM` (opcional)

8. **Configurações (se houver):**
   - ✅ `webhook_ativo`: `true` ou "Ativo"
   - ✅ `ativar_delay_envio_resposta`: `true` (opcional)

9. **Clique em "Salvar" ou "Atualizar"**

---

### **3. Se Ainda Der Erro no Painel**

**Possíveis causas:**
- ❌ URL inválida (não termina com `/api/whatsapp/apifacil/webhook`)
- ❌ Túnel não está rodando
- ❌ URL usa HTTP ao invés de HTTPS
- ❌ Instância não está conectada

**Soluções:**
1. Verifique se o túnel está rodando
2. Teste a URL no navegador: `https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook`
3. Se aparecer `{"success":true,"message":"Apifacil Webhook ativo"}`, a URL está correta
4. Verifique se a instância está conectada no painel

---

### **4. Alternativa: Usar API (Se Disponível)**

Se o painel não funcionar, você pode tentar configurar via API:

```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/configurar-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook"
  }'
```

**Nota:** Isso tenta vários endpoints, mas pode não funcionar se o apifacil.dev não permitir configuração via API.

---

## 🔍 **Verificar se Está Funcionando:**

### **1. Testar Webhook**

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

### **2. Enviar Mensagem de Teste**

1. Envie "oi" pelo WhatsApp para o número conectado
2. Verifique o terminal do servidor
3. Deve aparecer: `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`

---

## ⚠️ **IMPORTANTE:**

**O apifacil.dev NÃO permite salvar configurações via API diretamente!**

Você **DEVE** configurar manualmente no painel deles. O erro que você está vendo é porque:

1. A interface pode estar tentando salvar via API (que não funciona)
2. Ou há um problema de conexão com o painel

**Solução:** Configure manualmente no painel do apifacil.dev seguindo os passos acima.

---

## 📝 **Resumo:**

1. ✅ Execute `npm run tunnel` (copie a URL)
2. ✅ Acesse https://apifacil.dev
3. ✅ Vá na sua instância
4. ✅ Clique em "Config. Webhook"
5. ✅ Cole a URL: `https://xxxxx.loca.lt/api/whatsapp/apifacil/webhook`
6. ✅ Salve manualmente
7. ✅ Teste enviando "oi" pelo WhatsApp

**Não tente salvar via API - configure manualmente no painel!** 🎯








