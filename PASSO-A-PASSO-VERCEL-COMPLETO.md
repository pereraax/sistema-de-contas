# 🚀 PASSO A PASSO COMPLETO - DEPLOY NO VERCEL

## 📋 O QUE VOCÊ VÊ NA TELA:

Você está vendo:
- **"Deploy your first project"**
- Várias opções com botões "Deploy" ou "Import"

## ✅ O QUE VOCÊ DEVE FAZER:

### **PASSO 1: Clicar em "Import Project"** ⭐

1. **Procure pela opção que diz:**
   - **"Import Project"**
   - **Descrição:** "Add a repo from your git provider"
   - **Botão:** "Import" (no lado direito)

2. **CLIQUE no botão "Import"** (não nos outros botões "Deploy")

---

### **PASSO 2: Conectar com GitHub**

Depois de clicar em "Import", você verá uma tela para conectar:

1. **Você verá opções como:**
   - GitHub
   - GitLab
   - Bitbucket

2. **CLIQUE em "GitHub"** (ou no ícone do GitHub)

3. **Se pedir permissão:**
   - Clique em "Authorize" ou "Autorizar"
   - Isso permite o Vercel acessar seus repositórios

---

### **PASSO 3: Selecionar o Repositório**

Depois de conectar o GitHub, você verá uma lista de repositórios:

1. **Procure pelo repositório:** `plenipay` (ou o nome do seu projeto)
2. **CLIQUE no repositório** para selecioná-lo
3. **Clique em "Import"** (ou "Importar")

---

### **PASSO 4: Configurar o Projeto (IMPORTANTE!)**

O Vercel vai mostrar uma tela de configuração. **NÃO PRECISA MUDAR NADA!** Mas verifique:

#### **4.1. Project Name:**
- Deixe como está (ou mude se quiser)
- Exemplo: `sistema-de-contas` ou `plenipay`

#### **4.2. Framework Preset:**
- Deve estar: **"Next.js"** ✅
- Se não estiver, selecione "Next.js"

#### **4.3. Root Directory:**
- Deixe **VAZIO** ou como **`./`** ✅
- (A menos que seu projeto esteja em uma subpasta)

#### **4.4. Build Command:**
- Deve estar: **`npm run build`** ✅
- Se não estiver, digite: `npm run build`

#### **4.5. Output Directory:**
- Deixe **VAZIO** ✅
- O Vercel detecta automaticamente

#### **4.6. Install Command:**
- Deve estar: **`npm install`** ou **`npm ci`** ✅
- Deixe como está

---

### **PASSO 5: Adicionar Variáveis de Ambiente** ⚠️ **CRÍTICO!**

**ANTES de clicar em "Deploy", você precisa adicionar as variáveis de ambiente!**

1. **Na mesma tela de configuração, procure por:**
   - **"Environment Variables"** ou
   - **"Variáveis de Ambiente"** ou
   - Uma seção com um botão **"Add"** ou **"Adicionar"**

2. **Clique em "Add"** para cada variável

3. **Adicione TODAS estas variáveis** (uma por uma):

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Valor: https://frhxqgcqmxpjpnghsvoe.supabase.co
   
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I
   
   SUPABASE_SERVICE_ROLE_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1Mzc1NiwiZXhwIjoyMDc5MjI5NzU2fQ.E0XIp__d2dMeHDviURhdw4_336dW9SHwUprI5XdRQbg
   
   NEXT_PUBLIC_SITE_URL
   Valor: (deixe vazio por enquanto, o Vercel vai gerar uma URL)
   
   NEXT_PUBLIC_APP_URL
   Valor: (deixe vazio por enquanto, o Vercel vai gerar uma URL)
   
   NODE_ENV
   Valor: production
   
   ADMIN_JWT_SECRET
   Valor: h7Ygdyt5/Ht0KzlMpEpxG3UNvJPldKRdjoAAcj8od5c=
   
   ASAAS_API_KEY
   Valor: $aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJiZjU2MDNkLTYzMDUtNGEzZi05MzhhLWM4MzkyNWVjNmJkMTo6JGFhY2hfOGM0NjVlZjUtMGRiMy00YzIwLTkwYzctMTAyOGRhNGNiNjEz
   
   ASAAS_API_URL
   Valor: https://www.asaas.com/api/v3
   
   APIFACIL_INSTANCE_ID
   Valor: 1041
   
   APIFACIL_TOKEN
   Valor: 2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
   
   OPENAI_API_KEY
   Valor: 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
   
   GROQ_API_KEY
   Valor: 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
   ```

4. **Para cada variável:**
   - Digite o **Nome** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Digite o **Valor** (cole o valor correspondente)
   - Clique em **"Save"** ou **"Salvar"**

5. **IMPORTANTE:** Para `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`:
   - Deixe vazio por enquanto
   - Depois do deploy, o Vercel vai te dar uma URL
   - Você pode atualizar essas variáveis depois

---

### **PASSO 6: Fazer o Deploy**

Depois de adicionar todas as variáveis:

1. **Role até o final da página**
2. **Procure pelo botão:** **"Deploy"** (geralmente grande e destacado)
3. **CLIQUE em "Deploy"**

---

### **PASSO 7: Aguardar o Deploy**

1. **Você verá uma tela mostrando o progresso do deploy**
2. **Aguarde alguns minutos** (geralmente 2-5 minutos)
3. **Você verá mensagens como:**
   - "Installing dependencies..."
   - "Building..."
   - "Deploying..."

4. **Quando terminar, você verá:**
   - ✅ "Deployment successful" ou "Deploy concluído"
   - Uma URL do seu site (ex: `https://seu-projeto.vercel.app`)

---

### **PASSO 8: Atualizar URLs (Depois do Deploy)**

Depois que o deploy terminar e você tiver a URL:

1. **Vá em:** **Settings** → **Environment Variables**
2. **Encontre:** `NEXT_PUBLIC_SITE_URL`
3. **Edite o valor** para a URL que o Vercel te deu (ex: `https://seu-projeto.vercel.app`)
4. **Faça o mesmo para:** `NEXT_PUBLIC_APP_URL`
5. **Salve**
6. **O Vercel vai fazer um novo deploy automaticamente** com as URLs atualizadas

---

## ⚠️ SE ALGO DER ERRADO:

### **Erro ao conectar GitHub:**
- Verifique se você está logado no GitHub
- Tente fazer logout e login novamente

### **Repositório não aparece:**
- Verifique se o repositório está público ou se você deu permissão ao Vercel
- Tente fazer refresh na página

### **Deploy falha:**
- Verifique se todas as variáveis de ambiente foram adicionadas
- Veja os logs do deploy clicando no deploy que falhou
- Me envie os logs para eu ajudar

---

## ✅ CHECKLIST FINAL:

Antes de clicar em "Deploy", verifique:

- [ ] Repositório selecionado corretamente
- [ ] Framework: Next.js
- [ ] Build Command: `npm run build`
- [ ] Root Directory: vazio ou `./`
- [ ] TODAS as variáveis de ambiente adicionadas
- [ ] Cliquei em "Deploy"

---

## 🎯 RESUMO RÁPIDO:

1. ✅ Clique em **"Import Project"** → **"Import"**
2. ✅ Conecte com **GitHub**
3. ✅ Selecione o repositório **plenipay**
4. ✅ Verifique configurações (Next.js, `npm run build`)
5. ✅ **Adicione TODAS as variáveis de ambiente** ⚠️ CRÍTICO!
6. ✅ Clique em **"Deploy"**
7. ✅ Aguarde o deploy completar
8. ✅ Atualize `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` com a URL do Vercel

---

## 💡 DICA:

**Não pule o passo das variáveis de ambiente!** Sem elas, o deploy pode funcionar mas o site não vai funcionar corretamente.

**Tempo total:** ~10-15 minutos (a maior parte é esperar o deploy)

---

## 🆘 PRECISA DE AJUDA?

Se em qualquer passo você ficar travado ou não souber o que fazer:
1. **Tire uma captura de tela** do que você está vendo
2. **Me mostre** e eu te ajudo no passo específico!

**Boa sorte! O Vercel é muito mais simples que o Netlify!** 🚀
