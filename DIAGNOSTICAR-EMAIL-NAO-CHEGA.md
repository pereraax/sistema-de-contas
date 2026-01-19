# 🔍 DIAGNOSTICAR: Email não está chegando (mas sistema diz que foi enviado)

## ⚠️ PROBLEMA
O sistema está reportando que o email foi enviado com sucesso, mas o email não está chegando na caixa de entrada.

## ✅ VERIFICAÇÕES OBRIGATÓRIAS NO SUPABASE

### **1️⃣ VERIFICAR LOGS DO SUPABASE (CRÍTICO)**

1. Acesse: **Authentication** → **Logs**
2. **PROCURE POR:**
   - Eventos de "Signup" ou "Email sent"
   - Erros relacionados a SMTP
   - Mensagens de erro ao enviar email
3. **VERIFIQUE:**
   - Se há erros ao enviar email
   - Qual é a mensagem de erro específica
   - Se o email foi realmente tentado ser enviado

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/logs

**O QUE PROCURAR:**
- ❌ Erros como "SMTP connection failed"
- ❌ Erros como "Invalid credentials"
- ❌ Erros como "Email not sent"
- ✅ Se aparecer "Email sent successfully", o problema pode ser spam ou filtros

---

### **2️⃣ VERIFICAR SMTP CONFIGURADO**

1. Acesse: **Project Settings** → **Auth** → **SMTP Settings**
2. **VERIFIQUE:**
   - ✅ **"Enable Custom SMTP"** está **MARCADO**?
   - ✅ Todos os campos estão preenchidos?
   - ✅ Host, Port, Username, Password estão corretos?
   - ✅ Teste a conexão SMTP (se houver botão de teste)

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/settings/auth

**SE NÃO ESTIVER CONFIGURADO:**
- O Supabase usa o serviço padrão (com limite muito baixo)
- Pode não estar enviando emails realmente
- **Configure SMTP** (veja guias anteriores)

**CONFIGURAÇÃO HOSTINGER:**
- **Host:** `smtp.hostinger.com`
- **Port:** `465` (SSL) ou `587` (TLS)
- **Username:** Seu email completo (ex: `noreply@plenipay.com`)
- **Password:** Senha do email
- **Sender email:** Seu email completo
- **Sender name:** Nome do remetente (ex: "Plenipay")

---

### **3️⃣ VERIFICAR TEMPLATE DE EMAIL**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba: **"Source"**
3. **VERIFIQUE:**
   - ✅ Tem `{{ .ConfirmationURL }}` no template?
   - ❌ NÃO deve ter `{{ .SiteURL }}` sozinho
   - ✅ O template está completo e formatado corretamente?

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/templates

**EXEMPLO CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

---

### **4️⃣ VERIFICAR ENABLE EMAIL CONFIRMATIONS**

1. Acesse: **Authentication** → **Providers** → **Email**
2. **VERIFIQUE:**
   - ✅ **"Enable email confirmations"** está **HABILITADO**?
   - ❌ Se estiver desabilitado, **HABILITE AGORA**

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/providers

---

### **5️⃣ VERIFICAR SITE URL E REDIRECT URLS**

1. Acesse: **Authentication** → **URL Configuration**
2. **VERIFIQUE:**
   - **Site URL:** Deve ser `https://plenipay.com`
   - **Redirect URLs:** Deve incluir `https://plenipay.com/**`

**Link direto:** https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration

---

### **6️⃣ TESTAR ENVIO MANUAL**

1. Acesse: **Authentication** → **Users**
2. Selecione um usuário não confirmado
3. Clique em **"Send password recovery"** ou **"Resend confirmation email"**
4. **VERIFIQUE:**
   - Se o email chega
   - Se há erro ao enviar
   - Se aparece nos logs do Supabase

**SE NÃO FUNCIONAR:**
- O problema é de configuração SMTP
- Verifique credenciais do SMTP
- Verifique se o email do SMTP existe e a senha está correta

---

## 🔧 VERIFICAÇÕES NO EMAIL

### **1️⃣ VERIFICAR SPAM/LIXO ELETRÔNICO**

- Verifique a pasta de **SPAM**
- Verifique a pasta de **LIXO ELETRÔNICO**
- Verifique filtros do email

### **2️⃣ VERIFICAR FILTROS DO EMAIL**

- Verifique se há filtros bloqueando emails do Supabase
- Verifique se há regras de bloqueio automático
- Verifique se o domínio do remetente está bloqueado

### **3️⃣ TESTAR COM OUTRO EMAIL**

- Tente criar conta com outro email
- Verifique se o problema é específico de um email ou geral

---

## 📋 CHECKLIST COMPLETO

- [ ] Logs do Supabase verificados (Authentication → Logs)
- [ ] SMTP configurado e testado (Project Settings → Auth → SMTP Settings)
- [ ] Template de email configurado corretamente (Authentication → Email Templates)
- [ ] "Enable email confirmations" habilitado (Authentication → Providers → Email)
- [ ] Site URL configurada corretamente (Authentication → URL Configuration)
- [ ] Teste manual realizado (Authentication → Users → Send password recovery)
- [ ] Pasta de spam verificada
- [ ] Filtros do email verificados
- [ ] Testado com outro email

---

## 🚨 PROBLEMAS COMUNS

### **PROBLEMA 1: SMTP não configurado**
**SINTOMA:** Sistema diz que enviou, mas email não chega
**SOLUÇÃO:** Configure SMTP no Supabase Dashboard

### **PROBLEMA 2: Credenciais SMTP incorretas**
**SINTOMA:** Erro nos logs do Supabase sobre autenticação SMTP
**SOLUÇÃO:** Verifique username e password do SMTP

### **PROBLEMA 3: Email indo para spam**
**SINTOMA:** Email enviado mas não aparece na caixa de entrada
**SOLUÇÃO:** Verifique pasta de spam e configure SPF/DKIM no domínio

### **PROBLEMA 4: Template de email incorreto**
**SINTOMA:** Email enviado mas link não funciona
**SOLUÇÃO:** Verifique se template usa `{{ .ConfirmationURL }}`

---

## 📞 PRÓXIMOS PASSOS

1. **Verifique os logs do Supabase primeiro** - isso mostrará o erro real
2. **Configure SMTP se não estiver configurado**
3. **Teste envio manual** para confirmar que SMTP funciona
4. **Verifique pasta de spam** do email
5. **Se ainda não funcionar**, compartilhe os logs do Supabase para diagnóstico
