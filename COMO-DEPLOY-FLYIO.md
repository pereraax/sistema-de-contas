# 🚀 COMO FAZER DEPLOY NO FLY.IO - PASSO A PASSO

## 📋 TELA DE CONFIGURAÇÃO DO DEPLOY

Você está na tela de configuração. Veja o que fazer:

---

## ✅ PASSO 1: VERIFICAR CONFIGURAÇÕES

Na tela que você está vendo, verifique:

### **App name:**
- ✅ Deve estar: `sistema-de-contas`
- **Pode deixar assim** ou mudar para `plenipay` se quiser

### **Organization:**
- ✅ Deve estar: `Personal`
- **Está correto!** ✅

### **Branch to deploy:**
- ✅ Deve estar: `main`
- **Está correto!** ✅

### **Current Working Directory:**
- ✅ Deve estar: `repository root`
- **Está correto!** ✅ (seu projeto está na raiz)

### **Config path:**
- ✅ Deve estar: `fly.toml`
- **Está correto!** ✅ (Fly.io vai criar automaticamente)

---

## 🚀 PASSO 2: CLICAR EM "DEPLOY"

**Opção 1: Deploy Rápido (Recomendado)**
- ✅ **Clique no botão roxo "Deploy"** (com estrela)
- Fly.io vai criar o `fly.toml` automaticamente
- Vai fazer o deploy

**Opção 2: Customizar (Se quiser ajustar algo)**
- Clique em "Customize deploy"
- Você pode ajustar configurações avançadas
- Depois clique em "Deploy"

---

## ⏳ PASSO 3: AGUARDAR DEPLOY

Depois de clicar em "Deploy":

1. **Fly.io vai:**
   - Criar arquivo `fly.toml` automaticamente
   - Fazer build da aplicação
   - Fazer deploy

2. **Isso pode levar 5-10 minutos**

3. **Você verá o progresso na tela**

---

## 🔧 PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

**IMPORTANTE:** Depois que o deploy iniciar, você precisa adicionar variáveis de ambiente!

### **Como adicionar:**

1. **Após o deploy iniciar, você verá a tela do app**
2. **Clique na aba "Secrets"** (ou "Environment Variables")
3. **Adicione cada variável:**

Clique em "Add Secret" e adicione:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ASAAS_API_KEY
ASAAS_API_URL
APIFACIL_INSTANCE_ID
APIFACIL_TOKEN
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_URL
NODE_ENV=production
ADMIN_JWT_SECRET
```

**Valores:** Copie do seu arquivo `.env.production` ou `env-template.txt`

---

## 📋 RESUMO DO QUE FAZER AGORA:

1. ✅ **Verifique as configurações** (já estão corretas!)
2. ✅ **Clique no botão roxo "Deploy"**
3. ⏳ **Aguarde o deploy** (5-10 minutos)
4. 🔧 **Adicione variáveis de ambiente** (na aba "Secrets")
5. ✅ **Teste a aplicação!**

---

## 🎯 O QUE ESPERAR:

### **Durante o Deploy:**
- Você verá logs do build
- Pode levar alguns minutos
- Não feche a página!

### **Após o Deploy:**
- Fly.io vai gerar uma URL (ex: `sistema-de-contas.fly.dev`)
- Você pode acessar a aplicação nessa URL
- **MAS:** Precisa adicionar variáveis de ambiente primeiro!

---

## ⚠️ IMPORTANTE:

**NÃO ESQUEÇA DE ADICIONAR AS VARIÁVEIS DE AMBIENTE!**

Sem elas, a aplicação não vai funcionar corretamente.

---

## ✅ CHECKLIST:

- [ ] Verifiquei as configurações (estão corretas)
- [ ] Cliquei em "Deploy"
- [ ] Aguardei o deploy completar
- [ ] Adicionei todas as variáveis de ambiente (na aba "Secrets")
- [ ] Testei a aplicação na URL gerada

---

**Clique em "Deploy" agora e aguarde!** 🚀

