# ✅ Ativar Webhook - Passo a Passo Visual

## 🎯 O Que Fazer Agora

### **1. Ativar o Webhook**

Na tela que você está vendo:

1. **Encontre "Status do Webhook"** (está mostrando "Desativado")
2. **Clique no dropdown** (seta para baixo ao lado de "Desativado")
3. **Selecione "Ativado"** ou "Ativo"
4. **Clique em "Salvar"** ou "Salvar Configurações"

---

## ✅ Verificações

### **URL do Webhook (Mensagens) - CORRETO ✅**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```
**Esta URL está correta! Não precisa mudar.**

---

### **URLs para Status e API**

Vejo que há URLs apontando para `plenipay.com.br`:
- URL do Webhook (Status): `https://plenipay.com.br/api/whatsapp/apifacil/webhook`
- URL do Webhook (API) (Envio) (Grupo): `https://plenipay.com.br/api/whatsapp/apifacil/webhook`

**Se você não usa o domínio `plenipay.com.br`, atualize para:**
```
https://sistema-de-contas-1.onrender.com/api/whatsapp/apifacil/webhook
```

**Se você usa o domínio `plenipay.com.br` e ele está funcionando, pode deixar como está.**

---

## 🧪 Testar Após Ativar

### **1. Salvar as Configurações**

Após mudar o status para "Ativado", **SALVE** as configurações.

---

### **2. Enviar Mensagem de Teste**

1. Envie uma mensagem pelo WhatsApp
2. Acesse os logs do Render
3. Procure por:
   ```
   🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
   📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
   ```

**Se aparecer = Webhook está funcionando! ✅**

---

### **3. Verificar no Apifacil**

1. Vá em **"Detalhes do Webhook"** ou **"Histórico"**
2. Verifique se o status mudou de `Erro` para `Sucesso`
3. Verifique se o `motivo` não é mais `"webhook_desativado"`

---

## 📋 Checklist Final

Após ativar, verifique:

- [ ] Status do Webhook mudou para **"Ativado"**
- [ ] Configurações foram **salvas**
- [ ] URL do webhook (Mensagens) está correta
- [ ] Enviou mensagem de teste
- [ ] Logs aparecem no Render
- [ ] Assistente responde às mensagens

---

## ✅ Resumo

**Ação necessária:**
1. Clique no dropdown "Status do Webhook"
2. Selecione "Ativado"
3. Salve as configurações

**Isso deve resolver o problema!** 🎉
