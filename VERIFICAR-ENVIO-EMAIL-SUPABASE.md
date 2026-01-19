# 🔍 VERIFICAR: Por que o email não está sendo enviado pelo Supabase

## ⚠️ PROBLEMA
O email de confirmação não está sendo enviado automaticamente após criar a conta.

## ✅ VERIFICAÇÕES NO SUPABASE DASHBOARD

### **1️⃣ ENABLE EMAIL CONFIRMATIONS (CRÍTICO)**

1. Acesse: **Authentication** → **Providers** → **Email**
2. **VERIFIQUE:**
   - ✅ **"Enable email confirmations"** está **HABILITADO**?
   - ❌ Se estiver desabilitado, **HABILITE AGORA**
3. **SALVE**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/providers

---

### **2️⃣ SITE URL CONFIGURADA**

1. Acesse: **Authentication** → **URL Configuration**
2. **VERIFIQUE:**
   - **Site URL:** Deve ser `https://plenipay.com`
   - **Redirect URLs:** Deve incluir `https://plenipay.com/**`
3. **SALVE**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration

---

### **3️⃣ SMTP CONFIGURADO**

1. Acesse: **Project Settings** → **Auth** → **SMTP Settings**
2. **VERIFIQUE:**
   - ✅ SMTP está configurado?
   - ✅ Ou está usando SMTP padrão do Supabase?
3. Se não estiver configurado, configure ou use o padrão

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/settings/auth

---

### **4️⃣ TEMPLATE DE EMAIL**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba: **"Source"**
3. **VERIFIQUE:**
   - ✅ Tem `{{ .ConfirmationURL }}` no template?
   - ❌ NÃO deve ter `{{ .SiteURL }}` sozinho
4. **SALVE**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/templates

---

### **5️⃣ LOGS DO SUPABASE**

1. Acesse: **Authentication** → **Logs**
2. **VERIFIQUE:**
   - Há tentativas de envio de email?
   - Há erros relacionados a email?
   - O email está sendo enviado mas não chegando?

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/logs

---

## 🔧 O QUE O CÓDIGO ESTÁ FAZENDO

O código está correto e fazendo:

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { nome, telefone, whatsapp, plano, email },
    emailRedirectTo: 'https://plenipay.com/auth/callback?next=/home',
  }
})
```

Isso **DEVE** fazer o Supabase enviar o email automaticamente.

---

## ❓ SE AINDA NÃO FUNCIONAR

Se após verificar tudo acima o email ainda não for enviado:

1. **Verifique os logs do servidor** - o que aparece quando você cria uma conta?
2. **Verifique os logs do Supabase** - há erros?
3. **Teste criando uma conta** e veja o que aparece nos logs

---

## 📋 CHECKLIST COMPLETO

- [ ] "Enable email confirmations" está HABILITADO
- [ ] Site URL = `https://plenipay.com`
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] SMTP está configurado (ou usando padrão)
- [ ] Template usa `{{ .ConfirmationURL }}`
- [ ] Template foi salvo corretamente
- [ ] Verificou logs do Supabase
