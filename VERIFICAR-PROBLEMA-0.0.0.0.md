# 🔍 VERIFICAR PROBLEMA: LINK APONTANDO PARA 0.0.0.0:10000

## ⚠️ PROBLEMA
O link de confirmação está apontando para `0.0.0.0:10000` em vez de `https://plenipay.com`.

## 🔍 POSSÍVEIS CAUSAS

### **1️⃣ TEMPLATE DE EMAIL USANDO VARIÁVEL ERRADA**

O template pode estar usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`.

**VERIFIQUE:**
1. Authentication → Email Templates → "Confirm signup" → "Source"
2. Procure por `{{ .SiteURL }}` - **NÃO DEVE TER**
3. Deve ter apenas `{{ .ConfirmationURL }}`

---

### **2️⃣ SITE URL NO SUPABASE ESTÁ ERRADA**

O Supabase pode estar usando a Site URL do dashboard mesmo quando passamos `emailRedirectTo`.

**VERIFIQUE:**
1. Authentication → URL Configuration
2. **Site URL:** Deve ser `https://plenipay.com` (não `0.0.0.0:10000`)
3. Se estiver `0.0.0.0:10000` ou vazia, **MUDE PARA** `https://plenipay.com`
4. **SALVE**

---

### **3️⃣ CONFIGURAÇÃO INTERNA DO SUPABASE**

O Supabase pode ter alguma configuração interna que está sobrescrevendo.

**VERIFIQUE:**
1. Project Settings → API
2. Procure por variáveis de ambiente ou configurações relacionadas a URL
3. Verifique se há alguma configuração de "Default Redirect URL" ou similar

---

### **4️⃣ TEMPLATE NÃO FOI SALVO CORRETAMENTE**

O template pode não ter sido salvo após a edição.

**VERIFIQUE:**
1. Authentication → Email Templates → "Confirm signup"
2. Clique em "Source"
3. Verifique se o template tem `{{ .ConfirmationURL }}`
4. Se não tiver, **COLE O TEMPLATE CORRETO** e **SALVE**

---

## ✅ SOLUÇÃO PASSO A PASSO

### **PASSO 1: Verificar e Corrigir Site URL**

1. Acesse: Authentication → URL Configuration
2. **Site URL:** `https://plenipay.com`
3. **Redirect URLs:**
   - `https://plenipay.com/**`
   - `https://plenipay.com/auth/callback`
   - `http://localhost:3000/**` (para desenvolvimento)
4. **SALVE**

---

### **PASSO 2: Verificar e Corrigir Template**

1. Acesse: Authentication → Email Templates → "Confirm signup"
2. Clique em "Source"
3. **PROCURE POR:**
   - `{{ .SiteURL }}` = **REMOVA** se encontrar
   - `{{ .ConfirmationURL }}` = **DEVE TER** (3 vezes)
4. Se não tiver `{{ .ConfirmationURL }}`, **COLE O TEMPLATE CORRETO**
5. **SALVE**

---

### **PASSO 3: Limpar Cache e Testar**

1. **Crie uma NOVA conta de teste** (não use link antigo)
2. **Verifique o email imediatamente**
3. **O link deve ter:** `https://plenipay.com/auth/callback...`

---

## 🆘 SE AINDA NÃO FUNCIONAR

Me diga:
1. Qual é a Site URL configurada no Supabase Dashboard?
2. O template de email tem `{{ .ConfirmationURL }}` ou `{{ .SiteURL }}`?
3. O que aparece nos logs do servidor quando você cria uma conta?
4. O link no email ainda mostra `0.0.0.0:10000`?

---

## 📋 CHECKLIST COMPLETO

- [ ] Site URL no Supabase = `https://plenipay.com`
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Template usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Template foi salvo corretamente
- [ ] Servidor foi reiniciado
- [ ] Nova conta de teste criada
- [ ] Link no email verificado
