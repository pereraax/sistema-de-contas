# 🔧 RESOLVER: "Failed to send confirmation email" no Supabase

## ⚠️ ERRO ATUAL

```
Failed to send confirmation email: Failed to make POST request to 
"https://frhxqgcqmxpjpnghsvoe.supabase.co/auth/v1/magiclink"

Error message: Error sending confirmation email
```

## 🎯 CAUSA PRINCIPAL

O Supabase não consegue enviar emails porque:
1. **SMTP não está configurado** no Supabase Dashboard
2. **Email confirmations está desabilitado**
3. **Configurações SMTP estão incorretas**

---

## ✅ SOLUÇÃO PASSO A PASSO

### **1️⃣ VERIFICAR SE SMTP ESTÁ CONFIGURADO**

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto **PLENIPAY**
3. Vá em: **⚙️ Project Settings** → **Authentication**
4. Procure por: **SMTP Settings**

**O que verificar:**

- ✅ **"Enable Custom SMTP"** deve estar **MARCADO** (checkbox ativado)
- ✅ **SMTP Host** deve estar preenchido
- ✅ **SMTP Port** deve estar preenchido (587 ou 465)
- ✅ **SMTP User** deve estar preenchido (email completo)
- ✅ **SMTP Password** deve estar preenchido
- ✅ **Sender Email** deve estar preenchido

---

### **2️⃣ CONFIGURAR SMTP (SE NÃO ESTIVER CONFIGURADO)**

#### **Para Hostinger:**

1. **Enable Custom SMTP**: ✅ Marque esta opção

2. Preencha os campos:

   **SMTP Host:**
   ```
   smtp.hostinger.com
   ```
   (ou `smtp.titan.email` se você usa Titan Email)

   **SMTP Port:**
   ```
   587
   ```
   (ou `465` se usar SSL)

   **SMTP User:**
   ```
   seu-email@plenipay.com
   ```
   (ou o email completo que você usa na Hostinger)

   **SMTP Password:**
   ```
   [senha do seu email]
   ```
   (a senha do email, não a senha da conta Hostinger)

   **Sender Email:**
   ```
   seu-email@plenipay.com
   ```
   (geralmente o mesmo do SMTP User)

   **Sender Name:**
   ```
   PLENIPAY
   ```
   (nome que aparecerá como remetente)

3. **Clique em "Save"** (Salvar)

---

### **3️⃣ VERIFICAR SE EMAIL CONFIRMATIONS ESTÁ HABILITADO**

1. Ainda em: **⚙️ Project Settings** → **Authentication**
2. Procure por: **Email Auth** ou **Email Configuration**
3. Verifique:

   ✅ **"Enable email confirmations"** deve estar **HABILITADO** (marcado)

   ⚠️ **IMPORTANTE:** Se estiver desabilitado, o Supabase **NÃO enviará** emails de confirmação!

---

### **4️⃣ VERIFICAR URL CONFIGURATION**

1. Em: **⚙️ Project Settings** → **Authentication**
2. Vá em: **URL Configuration**
3. Verifique:

   **Site URL:**
   ```
   https://plenipay.com
   ```
   (sem barra final `/`)

   **Redirect URLs:**
   ```
   https://plenipay.com/**
   ```
   (deve incluir o padrão com `**`)

---

### **5️⃣ TESTAR CONFIGURAÇÃO**

Após configurar:

1. Volte para: **Authentication** → **Users**
2. Selecione um usuário
3. Clique em: **"Send confirmation email"**
4. Se aparecer erro, verifique os logs:

   **Authentication** → **Logs**

   Procure por erros de SMTP como:
   - "SMTP connection failed"
   - "Invalid credentials"
   - "Authentication failed"

---

## 🔍 DIAGNÓSTICO ADICIONAL

### **Se ainda der erro após configurar SMTP:**

1. **Verifique as credenciais:**
   - Senha do email está correta?
   - Email está ativo?
   - Porta está correta? (587 para TLS, 465 para SSL)

2. **Verifique logs do Supabase:**
   - **Authentication** → **Logs**
   - Procure por erros específicos de SMTP

3. **Teste o email manualmente:**
   - Tente enviar um email de teste do seu provedor (Hostinger)
   - Se não funcionar, pode ser problema do provedor

4. **Verifique se o email não está bloqueado:**
   - Alguns provedores bloqueiam SMTP por segurança
   - Verifique na Hostinger se SMTP está habilitado para sua conta

---

## 📝 RESUMO RÁPIDO

1. ✅ **Enable Custom SMTP** = HABILITADO
2. ✅ **SMTP Host** = `smtp.hostinger.com`
3. ✅ **SMTP Port** = `587` ou `465`
4. ✅ **SMTP User** = email completo
5. ✅ **SMTP Password** = senha do email
6. ✅ **Sender Email** = email completo
7. ✅ **Enable email confirmations** = HABILITADO
8. ✅ **Site URL** = `https://plenipay.com`

---

## 🆘 SE NADA FUNCIONAR

Se após seguir todos os passos o erro continuar:

1. **Verifique logs do Supabase:**
   - **Authentication** → **Logs**
   - Veja o erro específico

2. **Entre em contato com suporte da Hostinger:**
   - Verifique se SMTP está habilitado para seu domínio
   - Confirme se a senha está correta
   - Veja se há alguma restrição

3. **Use SMTP próprio (já implementado):**
   - O sistema já tem fallback para SMTP próprio
   - Configure as variáveis `SMTP_*` no `.env.local`
   - O sistema tentará usar isso automaticamente

---

## ✅ PRÓXIMOS PASSOS

Após configurar corretamente:

1. ✅ Teste enviar email manualmente no Dashboard
2. ✅ Teste criar nova conta no sistema
3. ✅ Verifique se o email chega (incluindo spam)
4. ✅ Se funcionar, o erro não deve mais aparecer
