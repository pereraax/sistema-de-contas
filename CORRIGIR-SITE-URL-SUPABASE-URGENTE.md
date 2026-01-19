# 🚨 URGENTE: Corrigir Site URL no Supabase Dashboard

## ⚠️ PROBLEMA CRÍTICO

O link de confirmação está sendo gerado com `0.0.0.0:10000` em vez de `https://plenipay.com`.

**Isso significa que a Site URL no Supabase Dashboard está configurada incorretamente.**

---

## ✅ SOLUÇÃO (FAZER AGORA)

### **1️⃣ ACESSE O SUPABASE DASHBOARD**

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto
3. Vá em: **Authentication** → **URL Configuration**

**Link direto:** `https://app.supabase.com/project/[SEU-PROJETO-ID]/auth/url-configuration`

---

### **2️⃣ CORRIGIR SITE URL (CRÍTICO)**

Na seção **"Site URL"**:

- ❌ **ERRADO:** `0.0.0.0:10000`
- ❌ **ERRADO:** Vazio
- ❌ **ERRADO:** `http://localhost:3000`
- ✅ **CORRETO:** `https://plenipay.com`

**AÇÃO:**
1. Se estiver como `0.0.0.0:10000` → **APAGUE E COLOQUE** `https://plenipay.com`
2. Se estiver vazio → **COLOQUE** `https://plenipay.com`
3. **SALVE** (botão "Save" no final da página)

---

### **3️⃣ VERIFICAR REDIRECT URLS**

Na mesma página, na seção **"Redirect URLs"**, verifique se tem:

- ✅ `https://plenipay.com/**`
- ✅ `https://plenipay.com/auth/callback`
- ✅ `https://plenipay.com/auth/callback?next=/home`

**Se não tiver, ADICIONE:**
1. Clique em **"Add URL"** ou **"+"**
2. Digite: `https://plenipay.com/**`
3. **SALVE**

---

### **4️⃣ VERIFICAR TEMPLATE DE EMAIL**

1. Acesse: **Authentication** → **Email Templates**
2. Clique em: **"Confirm signup"**
3. Clique na aba: **"Source"** (código HTML)
4. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remova se encontrar)

**Se o template estiver errado:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie TODO o conteúdo
3. Cole no campo "Source" do template
4. **SALVE**

---

## 🔍 POR QUE ISSO ACONTECE?

O Supabase usa a **Site URL** do dashboard como base para construir o link de confirmação. Mesmo que o código passe `emailRedirectTo: 'https://plenipay.com/auth/callback'`, o Supabase usa a Site URL do dashboard para construir o link.

**Exemplo:**
- Site URL no dashboard: `0.0.0.0:10000`
- Link gerado: `https://0.0.0.0:10000/auth/callback?...` ❌

**Correto:**
- Site URL no dashboard: `https://plenipay.com`
- Link gerado: `https://plenipay.com/auth/callback?...` ✅

---

## ✅ APÓS CORRIGIR

1. **SALVE** todas as alterações no Supabase
2. **AGUARDE 1-2 minutos** (pode levar um pouco para propagar)
3. **Crie uma NOVA conta de teste** (não use link antigo)
4. **Verifique o email de confirmação**
5. **O link deve ter:** `https://plenipay.com/auth/callback...`

---

## 📸 ONDE ENCONTRAR NO SUPABASE

### **Site URL:**
```
Dashboard → Authentication → URL Configuration → Site URL
```

### **Redirect URLs:**
```
Dashboard → Authentication → URL Configuration → Redirect URLs
```

### **Email Template:**
```
Dashboard → Authentication → Email Templates → Confirm signup → Source
```

---

## ⚠️ IMPORTANTE

- O código está **CORRETO** e forçando `https://plenipay.com`
- O problema está na **configuração do Supabase Dashboard**
- **NÃO** é problema de código, é problema de configuração
- Após corrigir a Site URL, o problema será resolvido

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. Verifique se salvou as alterações no Supabase
2. Aguarde mais 2-3 minutos
3. Limpe o cache do navegador
4. Crie uma NOVA conta (não use link antigo)
5. Verifique os logs do Supabase: **Authentication** → **Logs**
