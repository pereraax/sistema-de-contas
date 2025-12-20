# 🧪 Teste Rápido do Sistema

## **Passo 1: Testar Sistema de Logs**

Acesse no navegador:
```
http://localhost:3000/api/whatsapp/apifacil/test-webhook-simples
```

**O que deve aparecer:**
```json
{
  "success": true,
  "message": "Logs de teste criados com sucesso!",
  "stats": {
    "webhookLogs": 1,
    "sendLogs": 1
  }
}
```

---

## **Passo 2: Verificar Logs na Página**

Acesse:
```
http://localhost:3000/whatsapp/logs-completos
```

**O que deve aparecer:**
- ✅ Logs de teste na seção "Logs do Webhook"
- ✅ Logs de teste na seção "Logs de Envio"

**Se aparecer = Sistema de logs está funcionando! ✅**

**Se não aparecer = Problema no sistema de logs ❌**

---

## **Passo 3: Verificar Webhook**

Acesse:
```
http://localhost:3000/api/whatsapp/apifacil/webhook
```

**O que deve aparecer:**
```json
{
  "success": true,
  "message": "Apifacil Webhook ativo",
  "service": "PLEN Assistant"
}
```

**Se aparecer = Endpoint está funcionando! ✅**

---

## **Passo 4: Verificar Diagnóstico Completo**

Acesse:
```
http://localhost:3000/api/whatsapp/apifacil/diagnostico-completo
```

**O que deve aparecer:**
- Status do sistema
- Configuração do apifacil
- Quantidade de logs
- Instruções

---

## **Passo 5: Testar com Mensagem Real**

1. **Verifique se o túnel está rodando:**
   ```bash
   npm run tunnel
   ```

2. **Verifique se a URL está correta no apifacil.dev:**
   - URL deve ser: `https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook`

3. **Envie "oi" pelo WhatsApp**

4. **Verifique o terminal:**
   - Deve aparecer: `🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`

5. **Verifique a página de logs:**
   - Deve aparecer log na seção "Logs do Webhook"
   - Deve aparecer log na seção "Logs de Envio"

---

## **🔴 Se Nada Funcionar:**

1. **Verifique console do navegador (F12):**
   - Veja quais erros aparecem
   - Me diga quais são

2. **Verifique terminal do servidor:**
   - Está rodando? (`npm run dev`)
   - Aparecem erros?

3. **Verifique túnel:**
   - Está rodando? (`npm run tunnel`)
   - URL está correta?

---

## **📋 Me Envie:**

1. ✅ Resultado do Passo 1 (test-webhook-simples)
2. ✅ Aparecem logs no Passo 2?
3. ✅ Resultado do Passo 3 (webhook GET)
4. ✅ Quando você envia "oi", aparece algo no terminal?
5. ✅ Quais erros aparecem no console (F12)?








