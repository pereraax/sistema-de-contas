# 🔄 Atualizar Baileys para Versão Estável

## ⚠️ **PROBLEMA:**

Você está usando `@whiskeysockets/baileys@7.0.0-rc.9` (release candidate), que pode ter bugs na geração de QR Code.

---

## ✅ **SOLUÇÃO:**

### **Atualizar para versão estável:**

```bash
npm install @whiskeysockets/baileys@latest
```

Ou especificar versão estável:
```bash
npm install @whiskeysockets/baileys@^6.6.0
```

---

## 🔍 **Verificar versão:**

```bash
npm list @whiskeysockets/baileys
```

---

## 📋 **APÓS ATUALIZAR:**

1. ✅ Pare o servidor (Ctrl+C)
2. ✅ Delete `whatsapp_auth`: `rm -rf whatsapp_auth`
3. ✅ Delete `.next`: `rm -rf .next` (cache)
4. ✅ Reinicie: `npm run dev`
5. ✅ Tente conectar novamente

---

**Teste após atualizar!** 🚀










