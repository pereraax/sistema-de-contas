# 🔍 VERIFICAR: SMTP Configurado no Supabase Dashboard

## ⚠️ PROBLEMA ATUAL

O email **NÃO está sendo recebido** mesmo que o código retorne sucesso. Isso indica que o problema está na **configuração do Supabase Dashboard**, não no código.

## ✅ VERIFICAÇÃO OBRIGATÓRIA

### **1️⃣ CONFIGURAR SMTP NO SUPABASE (CRÍTICO)**

**Por que isso é importante:**
- O Supabase **retorna sucesso** no `resend()` mesmo se SMTP não estiver configurado
- **Mas o email NÃO é enviado** se SMTP não estiver configurado
- Sem SMTP, o Supabase não tem como enviar emails

**Como verificar:**

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto
3. Vá em: **⚙️ Project Settings** → **Authentication** → **SMTP Settings**
4. **OU:** Menu lateral → **Authentication** → **Email** → **SMTP Settings**

**Verifique se:**

- ✅ **"Enable Custom SMTP"** está **MARCADO**
- ✅ **SMTP Host** está preenchido (ex: `smtp.hostinger.com`)
- ✅ **SMTP Port** está preenchido (ex: `587` ou `465`)
- ✅ **SMTP User** está preenchido (seu email completo)
- ✅ **SMTP Password** está preenchido (senha do email)
- ✅ **Sender Email** está preenchido
- ✅ **Sender Name** pode estar preenchido (opcional)

**Se NÃO estiver configurado:**

O Supabase retorna sucesso no código, mas o email **NÃO é enviado**. Você precisa configurar SMTP.

---

### **2️⃣ CONFIGURAÇÃO PARA HOSTINGER**

**SMTP Host:** `smtp.hostinger.com` ou `smtp.titan.email`  
**SMTP Port:** `587` (TLS/STARTTLS) ou `465` (SSL)  
**SMTP User:** Seu email completo (ex: `noreply@plenipay.com`)  
**SMTP Password:** Senha do email  
**Sender Email:** Seu email completo  
**Sender Name:** `PLENIPAY` ou `Sistema PLENIPAY`

---

### **3️⃣ VERIFICAR LOGS DO SUPABASE**

**Para confirmar se o email foi realmente enviado:**

1. Acesse: **Authentication** → **Logs**
2. Procure por eventos relacionados ao email
3. Verifique se há erros de SMTP
4. Se aparecer "Email sent successfully", o problema pode ser spam/filtros

**O que procurar:**
- ❌ Erros como "SMTP connection failed"
- ❌ Erros como "Invalid credentials"
- ❌ Erros como "Email not sent"
- ✅ Se aparecer "Email sent successfully", verifique spam

---

### **4️⃣ VERIFICAR TEMPLATE DE EMAIL**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba **"Source"**
3. Verifique se tem: `{{ .ConfirmationURL }}`
4. Remova qualquer referência a `{{ .SiteURL }}` ou `0.0.0.0:10000`

---

### **5️⃣ VERIFICAR CONFIGURAÇÃO DE EMAIL**

1. Acesse: **Authentication** → **URL Configuration**
2. Verifique:
   - ✅ **"Enable email confirmations"** está **HABILITADO**
   - ✅ **"Site URL"** é `https://plenipay.com` (não `0.0.0.0:10000`)
   - ✅ **"Email confirmation type"** é **"Email Link"** (não "OTP")
   - ✅ **"Redirect URLs"** inclui `https://plenipay.com/**`

---

## 📋 RESUMO DO QUE FAZER

1. **Configure SMTP no Supabase Dashboard** (mais importante!)
2. **Verifique os logs do Supabase** para ver se há erros
3. **Verifique o template de email** está correto
4. **Verifique configuração de email** está habilitada

**Se após configurar SMTP o problema persistir:**

- Verifique se as credenciais SMTP estão corretas
- Teste o SMTP manualmente (pode usar o próprio Supabase ou ferramentas externas)
- Verifique se o email não está caindo em spam
- Verifique os logs do Supabase para erros específicos

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard:** https://app.supabase.com
- **Documentação SMTP:** https://supabase.com/docs/guides/auth/auth-smtp
- **Documentação Email Templates:** https://supabase.com/docs/guides/auth/auth-email-templates
