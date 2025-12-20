# 🧹 Como Limpar Build Cache no Vercel

## 📍 ONDE VOCÊ ESTÁ:

Você está em **"Caches"** e vê:
- **Purge CDN Cache** (para conteúdo já deployado)
- **Purge Data Cache** (para dados em cache)

**Essas opções NÃO são para Build Cache!**

---

## ✅ SOLUÇÃO: Fazer Redeploy (Limpa Build Cache Automaticamente)

O Vercel **limpa o Build Cache automaticamente** quando você faz um redeploy!

### **PASSO 1: Ir para Deploys**

1. **No menu lateral esquerdo, clique em "Deploys"**
   - Ou procure por "Deploys" no topo da página

---

### **PASSO 2: Fazer Redeploy**

1. **Você verá uma lista de deploys**
2. **Clique no deploy que falhou** (o mais recente)
3. **Na página do deploy, procure pelo botão "Redeploy"**
   - Geralmente está no canto superior direito
4. **Clique em "Redeploy"**

**OU**

1. **Na lista de deploys, procure pelos três pontos (...)** ao lado do deploy
2. **Clique nos três pontos**
3. **Clique em "Redeploy"**

---

### **PASSO 3: Aguardar**

1. **Aguarde o deploy iniciar**
2. **Aguarde alguns minutos** (geralmente 2-5 minutos)
3. **Verifique se o deploy funcionou**

---

## 🔍 POR QUE ISSO FUNCIONA:

Quando você faz um **Redeploy**, o Vercel:
1. ✅ **Limpa o Build Cache automaticamente**
2. ✅ **Reinstala as dependências**
3. ✅ **Faz o build do zero**
4. ✅ **Deploya novamente**

**Não precisa limpar cache manualmente!** O redeploy já faz isso.

---

## 💡 SOBRE AS OPÇÕES QUE VOCÊ VIU:

- **Purge CDN Cache:** Limpa cache de conteúdo já deployado (não ajuda com erro de build)
- **Purge Data Cache:** Limpa cache de dados (não ajuda com erro de build)

**Para erro de build, você precisa fazer Redeploy!**

---

## 🎯 RESUMO:

1. ✅ **Vá em "Deploys"** (menu lateral)
2. ✅ **Clique no deploy que falhou**
3. ✅ **Clique em "Redeploy"**
4. ✅ **Aguarde o deploy completar**

**O Build Cache será limpo automaticamente!** 🚀

---

## ⚠️ SE AINDA FALHAR:

Depois do redeploy, se ainda falhar:
1. **Veja os logs completos do build**
2. **Procure por erros específicos**
3. **Me envie os logs** para eu investigar mais

---

## ✅ CHECKLIST:

- [ ] Fui em "Deploys"
- [ ] Cliquei no deploy que falhou
- [ ] Cliquei em "Redeploy"
- [ ] Aguardei o deploy completar
- [ ] Verifiquei se funcionou

**É isso! O redeploy limpa o build cache automaticamente!** 🎉
