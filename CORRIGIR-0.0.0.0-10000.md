# 🔧 CORRIGIR: Link apontando para 0.0.0.0:10000

## ⚠️ PROBLEMA
O link de confirmação está redirecionando para `0.0.0.0:10000` em vez de `https://plenipay.com`.

## 🔍 CAUSA
O Supabase está usando a **Site URL** configurada no dashboard (`0.0.0.0:10000`) em vez do `emailRedirectTo` que passamos no código.

## ✅ SOLUÇÃO - CORRIGIR NO SUPABASE DASHBOARD

### **1️⃣ CORRIGIR SITE URL (CRÍTICO)**

1. Acesse: **Authentication** → **URL Configuration**
2. **VERIFIQUE a "Site URL":**
   - Se estiver como `0.0.0.0:10000` → **MUDE PARA** `https://plenipay.com`
   - Se estiver vazia → **COLOQUE** `https://plenipay.com`
3. **SALVE**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration

---

### **2️⃣ VERIFICAR REDIRECT URLS**

Na mesma página, verifique as **Redirect URLs**:

- ✅ Deve ter: `https://plenipay.com/**`
- ✅ Deve ter: `https://plenipay.com/auth/callback`
- ✅ Pode ter: `http://localhost:3000/**` (para desenvolvimento)

**SALVE** se fizer alterações.

---

### **3️⃣ VERIFICAR TEMPLATE DE EMAIL (CRÍTICO)**

O template pode estar usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`.

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba: **"Source"**
3. **PROCURE POR:**
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remove se encontrar)
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
4. Se não tiver `{{ .ConfirmationURL }}`, **COLE O TEMPLATE CORRETO**
5. **SALVE**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/templates

---

## 🔧 O QUE O CÓDIGO ESTÁ FAZENDO

O código está correto e enviando:

```typescript
emailRedirectTo: 'https://plenipay.com/auth/callback?next=/home'
```

Mas o Supabase está **ignorando** isso e usando a Site URL do dashboard.

---

## ✅ APÓS CORRIGIR

1. **SALVE** todas as alterações no Supabase
2. **Crie uma NOVA conta de teste**
3. **Verifique o email de confirmação**
4. **O link deve ter:** `https://plenipay.com/auth/callback...`
5. **NÃO deve ter:** `0.0.0.0:10000`

---

## 📋 CHECKLIST

- [ ] Site URL no Supabase = `https://plenipay.com` (não `0.0.0.0:10000`)
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Template usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Template foi salvo corretamente
- [ ] Nova conta de teste criada
- [ ] Link no email verificado

---

## ⚠️ IMPORTANTE

**O Supabase prioriza a Site URL do dashboard sobre o `emailRedirectTo` do código.**

Por isso, é **ESSENCIAL** que a Site URL no Supabase Dashboard seja `https://plenipay.com` e não `0.0.0.0:10000`.
