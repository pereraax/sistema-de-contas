# ✅ Comando Correto para Ver Logs

## ❌ Comando Errado
```bash
npx pm2 logs plen-server --lines 0
```
**Problema:** `--lines 0` significa mostrar **0 linhas**, então não aparece nada!

---

## ✅ Comandos Corretos

### **Opção 1: Ver últimas 100 linhas (recomendado)**
```bash
npx pm2 logs plen-server --lines 100
```

### **Opção 2: Ver logs em tempo real (seguir)**
```bash
npx pm2 logs plen-server
```
**Pressione Ctrl+C para parar**

### **Opção 3: Ver apenas últimas 50 linhas sem seguir**
```bash
npx pm2 logs plen-server --lines 50 --nostream
```

### **Opção 4: Ver logs e filtrar apenas erros**
```bash
npx pm2 logs plen-server --lines 100 | grep -i "erro\|error\|❌"
```

---

## 🧪 Como Testar Agora

### 1. **Abrir um terminal**

### 2. **Executar o comando correto:**
```bash
npx pm2 logs plen-server --lines 100
```

### 3. **Enviar uma imagem pelo WhatsApp**

### 4. **Ver os logs aparecerem em tempo real**

---

## 📋 O Que Procurar nos Logs

Quando enviar uma imagem, procure por:

```
🚀 [Apifacil Webhook] WEBHOOK CHAMADO!
📨 [Apifacil Webhook] MENSAGEM RECEBIDA!
✅ [Apifacil Webhook] Mensagem: [conteúdo]
✅ [Apifacil Webhook] Caption: [conteúdo]
🔍 [Apifacil Webhook] Verificando campos de texto para URL de imagem...
🖼️ [Apifacil Webhook] URL de imagem detectada no texto: https://...
```

---

## 💡 Dica

Se quiser ver logs em tempo real enquanto testa:

1. Abra um terminal
2. Execute: `npx pm2 logs plen-server`
3. Deixe rodando
4. Envie uma imagem pelo WhatsApp
5. Os logs aparecerão automaticamente

**Pressione Ctrl+C para parar quando terminar**








