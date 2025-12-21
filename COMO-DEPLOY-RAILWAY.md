# 🚀 COMO FAZER DEPLOY NO RAILWAY (PASSO A PASSO)

## 🎯 RAILWAY É A MAIS SIMPLES!

---

## 📋 PASSO A PASSO COMPLETO:

### **PASSO 1: Criar Conta no Railway**

1. **Acesse:** https://railway.app
2. **Clique em "Start a New Project"**
3. **Escolha "Login with GitHub"** (mais fácil)
4. **Autorize Railway** a acessar seu GitHub

---

### **PASSO 2: Conectar Repositório**

1. **Clique em "New Project"**
2. **Selecione "Deploy from GitHub repo"**
3. **Se seu repositório não aparecer:**
   - Clique em "Configure GitHub App"
   - Selecione o repositório `sistema-de-contas` (ou o nome que você deu)
   - Clique em "Install"
4. **Selecione seu repositório** na lista
5. **Railway detecta automaticamente que é Next.js!** ✅

---

### **PASSO 3: Configurar Variáveis de Ambiente**

1. **Clique no projeto criado**
2. **Clique na aba "Variables"** (ou "Env Vars")
3. **Adicione cada variável uma por uma:**

Clique em "New Variable" e adicione:

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
NODE_ENV
ADMIN_JWT_SECRET
OPENAI_API_KEY (se usar)
GROQ_API_KEY (se usar)
```

**Valores:** Copie do seu arquivo `.env.production` ou `env-template.txt`

---

### **PASSO 4: Configurar Domínio (Opcional)**

1. **Clique na aba "Settings"**
2. **Role até "Domains"**
3. **Clique em "Generate Domain"**
4. **Railway gera um domínio gratuito** (ex: `plenipay.up.railway.app`)
5. **OU adicione seu domínio customizado:**
   - Clique em "Custom Domain"
   - Digite: `plenipay.com`
   - Siga as instruções de DNS

---

### **PASSO 5: Aguardar Deploy**

1. **Railway faz deploy automaticamente!**
2. **Você pode ver o progresso na aba "Deployments"**
3. **Quando terminar, aparece "Deployed"** ✅

---

### **PASSO 6: Testar**

1. **Clique no domínio gerado** (ou use o seu)
2. **A plataforma deve estar funcionando!** 🎉

---

## 🔧 CONFIGURAÇÕES IMPORTANTES:

### **Build Settings (geralmente automático):**

Railway detecta automaticamente:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18.x ou 20.x

**Se não detectar, configure manualmente:**
- Clique em "Settings" → "Build & Deploy"
- Build Command: `npm run build`
- Start Command: `npm start`

---

## 📊 MONITORAMENTO:

### **Ver Logs:**

1. **Clique na aba "Deployments"**
2. **Clique no deploy mais recente**
3. **Veja os logs em tempo real**

### **Ver Métricas:**

1. **Clique na aba "Metrics"**
2. **Veja CPU, Memória, etc.**

---

## 💰 CUSTOS:

### **Plano Gratuito:**
- ✅ $5 grátis por mês
- ✅ Suficiente para começar
- ✅ Sempre online

### **Quando você usa:**
- Build: ~$0.01 por build
- Runtime: ~$0.000463 por GB/hora

**Exemplo:** Se usar 1GB de memória 24/7 = ~$0.33/mês

---

## 🚨 PROBLEMAS COMUNS:

### **Problema 1: Build falha**

**Solução:**
- Verifique os logs na aba "Deployments"
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se `package.json` tem `build` e `start` scripts

---

### **Problema 2: Variáveis de ambiente não funcionam**

**Solução:**
- Certifique-se de que adicionou todas as variáveis
- Verifique se não tem espaços extras
- Reinicie o deploy (clique em "Redeploy")

---

### **Problema 3: Domínio não funciona**

**Solução:**
- Aguarde alguns minutos (DNS pode demorar)
- Verifique se o domínio está configurado corretamente
- Use o domínio gerado pelo Railway primeiro para testar

---

## ✅ CHECKLIST:

- [ ] Conta criada no Railway
- [ ] Repositório conectado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy concluído com sucesso
- [ ] Domínio configurado (opcional)
- [ ] Plataforma testada e funcionando

---

## 🎯 RESUMO:

1. ✅ Crie conta no Railway (com GitHub)
2. ✅ Conecte repositório
3. ✅ Adicione variáveis de ambiente
4. ✅ Railway faz deploy automaticamente
5. ✅ Pronto! 🚀

---

**Railway é a opção mais simples! Tente agora!** ⚡

