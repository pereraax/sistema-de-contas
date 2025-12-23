# 🚀 COMO FAZER DEPLOY NO RAILWAY - GUIA COMPLETO

## 🎯 POR QUE RAILWAY?

✅ **Mais simples que Render/Fly.io**  
✅ **Funciona bem com Next.js** (sem erros de build)  
✅ **Gratuito suficiente** ($5/mês de crédito grátis)  
✅ **Zero configuração** - Detecta Next.js automaticamente  
✅ **Deploy automático** - Conecta com GitHub  

---

## 📋 PASSO A PASSO COMPLETO:

### **PASSO 1: Preparar o Repositório**

Certifique-se de que tudo está commitado e no GitHub:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# Verificar status
git status

# Se houver mudanças, fazer commit
git add -A
git commit -m "Preparar para deploy no Railway"
git push origin main
```

---

### **PASSO 2: Criar Conta no Railway**

1. **Acesse:** https://railway.app
2. **Clique em:** "Start a New Project" ou "Login"
3. **Escolha:** "Login with GitHub"
4. **Autorize** o Railway a acessar seus repositórios
5. **Pronto!** Conta criada

---

### **PASSO 3: Criar Novo Projeto**

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Se for a primeira vez, autorize o Railway
4. **Escolha seu repositório:** `pereraax/sistema-de-contas`
5. Railway vai detectar automaticamente que é Next.js

---

### **PASSO 4: Configurar Build (Automático)**

Railway detecta Next.js automaticamente e configura:
- ✅ Build Command: `npm run build`
- ✅ Start Command: `npm start`
- ✅ Node.js version: Detecta automaticamente

**Você não precisa fazer nada!** Railway já sabe como buildar Next.js.

---

### **PASSO 5: Adicionar Variáveis de Ambiente**

**IMPORTANTE:** Adicione TODAS as variáveis do seu `.env.local`:

1. No projeto Railway, clique em **"Variables"** (ou "Env" tab)
2. Clique em **"New Variable"**
3. Adicione cada variável:

**Variáveis obrigatórias:**
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
ASAAS_API_KEY=sua_chave_aqui
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
NEXT_PUBLIC_SITE_URL=https://seu-dominio.railway.app
NEXT_PUBLIC_APP_URL=https://seu-dominio.railway.app
```

**E todas as outras variáveis que você tem no `.env.local`!**

**Dica:** Você pode copiar todas de uma vez:
1. Abra seu `.env.local` local
2. Copie todas as linhas
3. No Railway, clique em "Raw Editor"
4. Cole todas as variáveis
5. Salve

---

### **PASSO 6: Aguardar Deploy**

1. Railway inicia o deploy automaticamente
2. Você pode ver os logs em tempo real
3. Aguarde 5-10 minutos
4. Quando terminar, aparece **"Deployed"** ✅

---

### **PASSO 7: Acessar sua Aplicação**

1. No projeto Railway, você verá uma URL tipo:
   - `https://seu-projeto.up.railway.app`
2. Clique na URL para acessar
3. **Pronto!** Sua aplicação está online! 🎉

---

### **PASSO 8: Configurar Domínio Personalizado (Opcional)**

Se você tem um domínio (ex: `plenipay.com`):

1. No projeto Railway, clique em **"Settings"**
2. Vá em **"Domains"**
3. Clique em **"Custom Domain"**
4. Digite seu domínio: `plenipay.com`
5. Railway mostra as instruções de DNS:
   - Adicione um registro CNAME apontando para a URL do Railway
6. Aguarde propagação DNS (5-30 minutos)
7. Pronto! Seu domínio funcionando

---

## 🔧 CONFIGURAÇÕES ADICIONAIS (OPCIONAL):

### **Ajustar Recursos (se necessário):**

1. No projeto Railway, clique em **"Settings"**
2. Vá em **"Resources"**
3. Ajuste:
   - **CPU:** 0.5 vCPU (suficiente para começar)
   - **RAM:** 1GB (suficiente para começar)
   - **Disco:** 1GB (suficiente)

**Padrão já é suficiente!** Só ajuste se precisar.

---

## 📊 MONITORAMENTO:

### **Ver Logs:**
1. No projeto Railway, clique em **"Deployments"**
2. Clique no deploy mais recente
3. Veja logs em tempo real

### **Ver Métricas:**
1. No projeto Railway, clique em **"Metrics"**
2. Veja:
   - CPU usage
   - Memory usage
   - Network traffic

---

## 🔄 DEPLOY AUTOMÁTICO:

Railway faz deploy automático toda vez que você faz push no GitHub:

```bash
# Fazer mudanças no código
git add .
git commit -m "Minhas mudanças"
git push origin main

# Railway detecta automaticamente e faz novo deploy!
```

---

## 🐛 TROUBLESHOOTING:

### **Erro de Build:**
1. Veja os logs no Railway
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Verifique se o código está correto

### **Aplicação não inicia:**
1. Verifique os logs
2. Verifique se `NEXT_PUBLIC_SITE_URL` está correto
3. Verifique se todas as variáveis estão configuradas

### **Erro 500:**
1. Veja os logs do Railway
2. Verifique variáveis de ambiente (Supabase, Asaas, etc.)
3. Verifique se o banco de dados está acessível

---

## 💰 CUSTOS:

### **Free Tier:**
- $5 de crédito grátis/mês
- ~500 horas de uso
- Para projetos pequenos: **SUFICIENTE**

### **Se precisar mais:**
- Plano Hobby: $5/mês
- Plano Pro: $20/mês

**Para começar, o free tier é suficiente!**

---

## ✅ VANTAGENS DO RAILWAY:

1. ✅ **Zero configuração** - Funciona out-of-the-box
2. ✅ **Deploy automático** - Toda vez que você faz push
3. ✅ **Logs em tempo real** - Vê o que está acontecendo
4. ✅ **Rollback fácil** - Volta versão anterior com 1 clique
5. ✅ **Variáveis seguras** - Criptografadas
6. ✅ **HTTPS automático** - SSL gratuito
7. ✅ **Suporte Next.js** - Funciona perfeitamente
8. ✅ **Interface visual** - Fácil de usar

---

## 🎯 PRÓXIMOS PASSOS:

1. ✅ Acesse https://railway.app
2. ✅ Faça login com GitHub
3. ✅ Crie novo projeto
4. ✅ Conecte seu repositório
5. ✅ Adicione variáveis de ambiente
6. ✅ Aguarde deploy
7. ✅ Pronto! 🎉

---

## 📞 PRECISA DE AJUDA?

Se tiver qualquer dúvida durante o deploy, me avise que eu te ajudo! 😊

**Railway é realmente a opção mais simples e confiável!** 🚀
