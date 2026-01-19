# 🔍 DIAGNOSTICAR: Email de Confirmação Não Está Sendo Enviado

## ⚠️ PROBLEMA

O código está retornando sucesso, mas o email não está sendo enviado. Isso indica que o problema está na **configuração do Supabase**, não no código.

---

## ✅ VERIFICAÇÕES OBRIGATÓRIAS NO SUPABASE DASHBOARD

### **1️⃣ SMTP CONFIGURADO (CRÍTICO)**

**Localização:** Project Settings → Auth → SMTP Settings

**Verificar:**
- ✅ "Enable Custom SMTP" deve estar **MARCADO**
- ✅ Host SMTP deve estar preenchido (ex: `smtp.hostinger.com`)
- ✅ Porta SMTP deve estar preenchida (ex: `587` ou `465`)
- ✅ Email do remetente deve estar preenchido
- ✅ Senha do email deve estar correta
- ✅ "Sender name" pode estar preenchido (opcional)

**Como testar:**
1. Vá em: **Authentication** → **Users**
2. Selecione um usuário
3. Clique em **"Send password recovery"**
4. Se o email **NÃO** chegar, o problema é **SMTP**

**Se SMTP não estiver configurado:**
- O Supabase retorna sucesso no `resend`
- Mas o email **NÃO** é enviado
- Não há erro no código, o problema é configuração

---

### **2️⃣ TEMPLATE DE EMAIL CONFIGURADO**

**Localização:** Authentication → Email Templates → "Confirm signup"

**Verificar:**
1. Clique na aba **"Source"** (código HTML)
2. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remova se encontrar)
   - ❌ Qualquer referência a `0.0.0.0` ou `10000` = **ERRADO**

**Se o template estiver errado:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie TODO o conteúdo
3. Cole no campo "Source" do template
4. **SALVE**

---

### **3️⃣ CONFIRMAÇÃO DE EMAIL HABILITADA**

**Localização:** Authentication → URL Configuration

**Verificar:**
- ✅ "Enable email confirmations" deve estar **HABILITADO**
- ✅ "Site URL" deve ser `https://plenipay.com` (não `0.0.0.0:10000`)
- ✅ "Redirect URLs" deve incluir `https://plenipay.com/**`

**Se "Enable email confirmations" estiver desabilitado:**
- O Supabase **NÃO** envia emails de confirmação
- Mesmo que SMTP esteja configurado
- Mesmo que template esteja configurado

---

### **4️⃣ VERIFICAR LOGS DO SUPABASE**

**Localização:** Authentication → Logs

**O que verificar:**
1. Procure por erros relacionados a **SMTP**
2. Procure por erros relacionados a **email sending**
3. Procure por erros relacionados a **template**

**Erros comuns:**
- `SMTP connection failed` = Problema de conexão SMTP
- `Invalid SMTP credentials` = Credenciais SMTP incorretas
- `Template not found` = Template de email não configurado
- `Email confirmations disabled` = Confirmação de email desabilitada

---

## 🔧 TESTE MANUAL NO SUPABASE

### **Teste 1: Enviar Email de Recuperação de Senha**

1. Vá em: **Authentication** → **Users**
2. Selecione um usuário
3. Clique em **"Send password recovery"**
4. **Se o email NÃO chegar:**
   - Problema é **SMTP** (não está configurado ou credenciais incorretas)
   - **NÃO** é problema do código

### **Teste 2: Criar Usuário Manualmente**

1. Vá em: **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha email e senha
4. Marque **"Auto Confirm User"** como **DESMARCADO**
5. Clique em **"Create user"**
6. **Se o email NÃO chegar:**
   - Problema é **SMTP** ou **template de email**
   - **NÃO** é problema do código

---

## 📊 O QUE O CÓDIGO ESTÁ FAZENDO

O código está correto e fazendo o seguinte:

1. ✅ Tenta `resend` com `type: 'signup'`
2. ✅ Se falhar, tenta `resend` com `type: 'email'`
3. ✅ Se falhar, tenta `inviteUserByEmail`
4. ✅ Se falhar, tenta `generateLink` (apenas diagnóstico)

**O problema é que:**
- O Supabase pode retornar **sucesso** no `resend`
- Mas **NÃO** envia o email se SMTP não estiver configurado
- Não há erro no código, o problema é configuração

---

## ✅ SOLUÇÃO

### **Passo 1: Configurar SMTP**

1. Acesse: **Project Settings** → **Auth** → **SMTP Settings**
2. Marque **"Enable Custom SMTP"**
3. Preencha:
   - **Host:** `smtp.hostinger.com` (ou seu provedor)
   - **Port:** `587` (ou `465` para SSL)
   - **Username:** Seu email (ex: `noreply@plenipay.com`)
   - **Password:** Senha do email
   - **Sender email:** Seu email
   - **Sender name:** Nome do remetente (opcional)
4. **SALVE**

### **Passo 2: Verificar Template**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique em **"Source"**
3. Verifique se usa `{{ .ConfirmationURL }}`
4. Se não usar, copie o conteúdo de `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
5. **SALVE**

### **Passo 3: Habilitar Confirmação**

1. Acesse: **Authentication** → **URL Configuration**
2. Marque **"Enable email confirmations"**
3. Verifique **"Site URL"** = `https://plenipay.com`
4. **SALVE**

### **Passo 4: Testar**

1. Crie uma nova conta
2. Verifique se o email chega
3. Se não chegar, verifique os logs do Supabase

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique os logs do Supabase:**
   - Authentication → Logs
   - Procure por erros de SMTP

2. **Teste SMTP manualmente:**
   - Use um cliente de email (Outlook, Thunderbird)
   - Tente enviar email usando as mesmas credenciais SMTP
   - Se não funcionar, problema é nas credenciais SMTP

3. **Verifique se o email do SMTP existe:**
   - O email usado no SMTP deve existir
   - A senha deve estar correta
   - O provedor (Hostinger, etc.) deve permitir SMTP

4. **Contate o suporte do Supabase:**
   - Se tudo estiver configurado corretamente
   - E o email ainda não chegar
   - Pode ser problema no lado do Supabase

---

## 📝 RESUMO

- ✅ O código está **CORRETO**
- ❌ O problema é **configuração do Supabase**
- 🔧 Configure **SMTP** no Supabase Dashboard
- 🔧 Configure **Template de email**
- 🔧 Habilite **"Enable email confirmations"**
- 🔧 Verifique **Site URL** = `https://plenipay.com`
