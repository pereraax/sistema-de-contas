# ⚙️ CONFIGURAÇÃO: OPENAI_API_KEY

## ❌ **STATUS ATUAL:**

**OPENAI_API_KEY NÃO ESTÁ CONFIGURADA**

Isso significa que o processamento de imagens **não vai funcionar** até você configurar.

---

## 📋 **O QUE PRECISA SER FEITO:**

### **1. Obter a Chave API da OpenAI**

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI (ou crie uma se não tiver)
3. Clique em "Create new secret key"
4. **Copie a chave** (ela só aparece uma vez!)
5. Anote a chave em algum lugar seguro

**Formato da chave:** `sk-...` (começa com `sk-`)

---

### **2. Adicionar no `.env.local`**

Adicione esta linha no arquivo `.env.local`:

```bash
OPENAI_API_KEY=sk-sua-chave-aqui
```

**Exemplo:**
```bash
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

---

### **3. Reiniciar o Servidor**

Após adicionar a chave, reinicie o servidor:

```bash
npx pm2 restart plen-server
```

---

## 🧪 **VERIFICAR SE ESTÁ FUNCIONANDO:**

Após configurar, teste enviando uma imagem pelo WhatsApp. 

Os logs devem mostrar:
```
🖼️ [PLEN WhatsApp] Processando imagem com OpenAI Vision...
🔍 [PLEN WhatsApp] Chamando OpenAI GPT-4o Vision para analisar imagem...
✅ [PLEN WhatsApp] JSON extraído da imagem: {...}
```

---

## 💰 **CUSTOS:**

A OpenAI cobra por uso da API:
- **GPT-4o**: ~$0.01 por imagem (varia)
- **Taxa mínima**: Geralmente $5 de crédito inicial grátis
- **Preços**: https://openai.com/api/pricing/

---

## ⚠️ **IMPORTANTE:**

1. **Nunca compartilhe sua chave API** publicamente
2. **Não commite** o `.env.local` no Git (já deve estar no `.gitignore`)
3. **Mantenha a chave segura** - se alguém tiver acesso, pode usar seus créditos

---

## ✅ **DEPOIS DE CONFIGURAR:**

1. ✅ Adicione `OPENAI_API_KEY=sk-...` no `.env.local`
2. ✅ Reinicie o servidor: `npx pm2 restart plen-server`
3. ✅ Teste enviando uma imagem pelo WhatsApp
4. ✅ Verifique os logs para confirmar que está funcionando

---

## 🆘 **SE TIVER PROBLEMAS:**

1. Verifique se a chave está correta (começa com `sk-`)
2. Verifique se não tem espaços extras
3. Verifique se o servidor foi reiniciado
4. Verifique os logs para ver erros específicos

**Compartilhe os logs se precisar de ajuda!** 🚀










