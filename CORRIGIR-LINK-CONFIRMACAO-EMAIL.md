# 🔧 CORRIGIR LINK DE CONFIRMAÇÃO DE EMAIL

## ⚠️ PROBLEMA
O link de confirmação está enviando para `localhost:3000` em vez da URL de produção.

## ✅ SOLUÇÃO - VERIFICAR NO SUPABASE DASHBOARD

### **1️⃣ CONFIGURAR SITE URL NO SUPABASE**

O Supabase usa a **Site URL** configurada no dashboard como base para os links de confirmação, mesmo que você passe `emailRedirectTo` no código.

**PASSO A PASSO:**

1. Acesse: **https://app.supabase.com** → Seu Projeto
2. Vá em: **Project Settings** → **Authentication** → **URL Configuration**
3. **VERIFIQUE/ATUALIZE:**

   **Site URL:**
   ```
   https://plenipay.com.br
   ```
   (ou a URL do Render se for diferente)

   **Redirect URLs:**
   ```
   https://plenipay.com.br/**
   https://plenipay.com.br/auth/callback
   http://localhost:3000/** (para desenvolvimento)
   ```

4. **SALVE** as alterações

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration

---

### **2️⃣ VERIFICAR VARIÁVEL DE AMBIENTE NO RENDER**

1. Acesse o dashboard do Render
2. Vá em **Environment** → **Environment Variables**
3. **VERIFIQUE se existe:**
   - `NEXT_PUBLIC_SITE_URL` = `https://plenipay.com.br` (ou URL do Render)
4. **SE NÃO EXISTIR:**
   - Adicione a variável
   - Valor: `https://plenipay.com.br` (ou a URL do Render)
5. **REINICIE O SERVIÇO** no Render após adicionar/atualizar

---

### **3️⃣ VERIFICAR LOGS DO SERVIDOR**

Após fazer as alterações, verifique os logs do servidor quando um novo usuário se cadastrar:

1. Acesse os logs do Render
2. Procure por: `[getSiteUrl]` ou `emailRedirectTo`
3. **DEVE MOSTRAR:**
   ```
   ✅ [getSiteUrl] Usando NEXT_PUBLIC_SITE_URL: https://plenipay.com.br
   ```
   ou
   ```
   ✅ [getSiteUrl] Em produção, usando URL padrão: https://plenipay.com.br
   ```

---

### **4️⃣ TESTAR**

1. Crie uma nova conta de teste
2. Verifique o email de confirmação
3. **O LINK DEVE SER:**
   ```
   https://frhxqgcqmxpjpnghsvoe.supabase.co/auth/v1/verify?token=...&redirect_to=https://plenipay.com.br/auth/callback?next=/home
   ```
   **NÃO DEVE SER:**
   ```
   ...&redirect_to=http://localhost:3000/auth/callback...
   ```

---

## 🔍 TROUBLESHOOTING

### **Link ainda mostra localhost?**

1. Verifique se a variável `NEXT_PUBLIC_SITE_URL` está configurada no Render
2. Verifique se o serviço foi reiniciado após adicionar a variável
3. Verifique se a **Site URL** no Supabase está correta
4. Verifique os logs do servidor para ver qual URL está sendo usada

### **Link não funciona?**

1. Verifique se a URL está nas **Redirect URLs** do Supabase
2. Verifique se o domínio está acessível
3. Verifique se há algum erro nos logs do servidor

---

## 📝 RESUMO DAS CONFIGURAÇÕES NECESSÁRIAS

### **No Supabase Dashboard:**
- ✅ **Site URL:** `https://plenipay.com.br`
- ✅ **Redirect URLs:** `https://plenipay.com.br/**`

### **No Render (Environment Variables):**
- ✅ **NEXT_PUBLIC_SITE_URL:** `https://plenipay.com.br`

### **No Código:**
- ✅ Função `getSiteUrl()` já está configurada
- ✅ Logs adicionados para debug

---

## ⚠️ IMPORTANTE

**O Supabase prioriza a Site URL configurada no dashboard sobre o `emailRedirectTo` passado no código.**

Por isso, é **ESSENCIAL** configurar a Site URL correta no dashboard do Supabase!
