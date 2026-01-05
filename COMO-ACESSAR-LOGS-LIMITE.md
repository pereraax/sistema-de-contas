# 📊 Como Acessar a Página de Logs do Limite

## 🎯 URL da Página:

### **No Servidor Render:**
```
https://sistema-de-contas-1.onrender.com/logs-limite-whatsapp
```

### **Na URL Antiga do Uppmax:**
```
https://webhook.uppmax.store/logs-limite-whatsapp
```

## ✅ O Que a Página Mostra:

1. **Logs em tempo real** relacionados ao limite de 7 mensagens
2. **Estatísticas** (total de logs, logs em memória)
3. **Logs destacados** com cores diferentes:
   - 🔥 **Laranja:** Log crítico do limite
   - 📊 **Ciano:** Contagem de envios
   - ✅ **Verde:** Inserção bem-sucedida
   - ❌ **Vermelho:** Erro na inserção
   - 📝 **Roxo:** Tentativa de inserção

## 🚀 Como Usar:

1. **Acesse:** `https://sistema-de-contas-1.onrender.com/logs-limite-whatsapp`
2. **Envie uma mensagem via WhatsApp** (ex: "ganhei 30 reais")
3. **Observe os logs aparecerem em tempo real**

## 🔍 Logs Que Devem Aparecer:

1. `🚀🚀🚀 [PLEN WhatsApp] ENDPOINT CHAMADO!`
2. `👤 [PLEN WhatsApp] Profile encontrado - Plano: ...`
3. `🔍 [PLEN WhatsApp] DETECÇÃO DE PLANO - DEBUG COMPLETO`
4. `🔥🔥🔥 PLANO TESTE - VERIFICANDO LIMITE 🔥🔥🔥` ← **CRÍTICO**
5. `📊 Total de envios: 0 / 7`
6. `📝 Inserindo envio: entrada`
7. `✅ ENVIO REGISTRADO! ID: ...` ou `❌ ERRO AO INSERIR! ...`

## 💡 Se Nenhum Log Aparecer:

- Verifique se o webhook está configurado corretamente
- Verifique se a mensagem foi enviada do WhatsApp
- Verifique o console do Render para logs diretos

