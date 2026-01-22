# 🧪 TESTAR LINK DIRETO

## 🔍 Problema

Não aparecem requisições no Network tab quando você clica no link do email.

Isso pode significar:
1. O link não está funcionando
2. O Gmail está bloqueando/modificando o link
3. O link está malformado

---

## ✅ TESTE 1: Copiar e Colar o Link Diretamente

### **Passo a Passo:**

1. **Abra o email**
2. **Copie o link completo** (não clique, copie o texto)
   - O link deve ser algo como: `https://plenipay.com/auth/callback?token_hash=...&type=magiclink&next=/home`
3. **Cole diretamente na barra de endereço do navegador**
4. **Pressione Enter**
5. **Veja o Network tab** - deve aparecer uma requisição

**Se aparecer requisição:**
- O link está funcionando
- O problema pode ser o Gmail modificando o link ao clicar

**Se não aparecer requisição:**
- O link pode estar malformado
- Verifique se começa com `https://`

---

## ✅ TESTE 2: Verificar Link no Email

### **Passo a Passo:**

1. **Abra o email**
2. **Clique com botão direito** no link
3. **Selecione "Copiar endereço do link"** (ou "Copy link address")
4. **Cole em um editor de texto** (Bloco de Notas, etc.)
5. **Verifique:**
   - Começa com `https://plenipay.com`? ✅
   - Contém `token_hash=...`? ✅
   - Contém `type=magiclink`? ✅
   - **NÃO contém `0.0.0.0:10000`?** ✅

**Se o link estiver correto:**
- O problema pode ser o Gmail modificando ao clicar
- Tente copiar e colar diretamente na barra de endereço

**Se o link contém `0.0.0.0:10000`:**
- O problema está na geração do link
- Verifique os logs do terminal quando reenviar

---

## ✅ TESTE 3: Abrir em Modo Anônimo

1. **Abra uma janela anônima/privada** (Ctrl+Shift+N)
2. **Acesse o Gmail** (ou seu email)
3. **Abra o email de confirmação**
4. **Clique no link**
5. **Veja o Network tab**

**Se funcionar em modo anônimo:**
- O problema pode ser cache/extensões do navegador

---

## ✅ TESTE 4: Verificar Console do Navegador

1. **Abra DevTools (F12)**
2. **Vá na aba Console**
3. **Clique no link do email**
4. **Veja se aparecem erros ou logs**

**Procure por:**
- Erros JavaScript
- Logs do nosso código (começam com `🔍 [Callback]` ou `🔍 [ConfirmPage]`)
- Erros de CORS
- Erros de rede

---

## 🎯 O Que Me Enviar

Depois de fazer os testes, me diga:

1. **O link copiado está correto?** (começa com `https://plenipay.com`?)
2. **Quando cola na barra de endereço, funciona?**
3. **Aparecem erros no Console?**
4. **Aparecem requisições no Network tab quando cola diretamente?**

---

**Faça esses testes e me diga o resultado!** 🔍
