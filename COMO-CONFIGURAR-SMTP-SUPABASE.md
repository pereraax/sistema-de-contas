# 📧 Como Configurar SMTP no Supabase

## 🎯 Passo a Passo Completo

### **1. Acessar o Supabase Dashboard**

1. Acesse: **https://app.supabase.com**
2. Faça login na sua conta
3. Selecione seu projeto

---

### **2. Configurar SMTP Settings**

#### **Caminho 1: Via Project Settings**

1. Clique em **⚙️ Project Settings** (ícone de engrenagem no canto inferior esquerdo)
2. No menu lateral esquerdo, clique em **Authentication**
3. Role para baixo até **SMTP Settings**
4. Ou clique em **Email** no menu lateral

#### **Caminho 2: Direto**

1. No menu lateral esquerdo, clique em **Authentication**
2. Clique em **Email** ou **SMTP Settings**

---

### **3. Habilitar e Configurar Custom SMTP**

Na seção **SMTP Settings**, você verá:

#### **✅ Enable Custom SMTP**
- **Marque esta opção** para usar seu próprio servidor SMTP

#### **📝 Preencha os campos:**

**SMTP Host:**
- Gmail: `smtp.gmail.com`
- Hostinger: `smtp.hostinger.com` ou `smtp.titan.email`
- Office365: `smtp.office365.com`
- Outro: consulte seu provedor de email

**SMTP Port:**
- `587` (TLS/STARTTLS) - **Recomendado**
- `465` (SSL)
- `25` (não recomendado)

**SMTP User:**
- Seu endereço de email completo (ex.: `seuemail@gmail.com`)

**SMTP Password:**
- **Senha do email** OU
- **Senha de app** (se usar Gmail, é necessário criar senha de app)

**Sender Email:**
- Email que aparecerá como remetente (geralmente o mesmo do SMTP User)

**Sender Name:**
- Nome que aparecerá como remetente (ex.: `PLENIPAY` ou `Sistema PLENIPAY`)

---

### **4. Exemplos de Configuração por Provedor**

#### **📧 Gmail:**

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: seuemail@gmail.com
SMTP Password: [Senha de App - veja como criar abaixo]
Sender Email: seuemail@gmail.com
Sender Name: PLENIPAY
```

**⚠️ IMPORTANTE para Gmail:**
- Você precisa criar uma **Senha de App** (não pode usar a senha normal)
- Como criar: https://support.google.com/accounts/answer/185833
- Ative a verificação em 2 etapas primeiro

---

#### **📧 Hostinger:**

```
SMTP Host: smtp.hostinger.com
SMTP Port: 587
SMTP User: seuemail@seudominio.com
SMTP Password: [Senha do email]
Sender Email: seuemail@seudominio.com
Sender Name: PLENIPAY
```

**⚠️ Para Hostinger:**
- Use o email da sua hospedagem
- Use a senha do email (não a senha do painel Hostinger)

---

#### **📧 Office365/Microsoft 365:**

```
SMTP Host: smtp.office365.com
SMTP Port: 587
SMTP User: seuemail@seudominio.com
SMTP Password: [Senha do email]
Sender Email: seuemail@seudominio.com
Sender Name: PLENIPAY
```

---

### **5. Testar Configuração SMTP**

1. Após preencher todos os campos, clique em **"Save"** ou **"Update"**
2. O Supabase testará a conexão automaticamente
3. Se houver erro, verifique:
   - Se as credenciais estão corretas
   - Se a porta está correta
   - Se o firewall não está bloqueando
   - Se está usando senha de app (Gmail)

---

### **6. Configurar Template de Email**

1. No menu lateral, clique em **Authentication**
2. Clique em **Email Templates**
3. Selecione **"Confirm signup"**
4. Verifique se o template contém: **`{{ .ConfirmationURL }}`**

**Exemplo de template correto:**

```html
<h2>Confirme seu email</h2>
<p>Clique no link abaixo para confirmar seu cadastro:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
```

5. Clique em **"Save"**

---

### **7. Habilitar Confirmação de Email**

1. Vá em **Project Settings** → **Authentication**
2. Role até **URL Configuration**
3. **Marque:** "Enable email confirmations"
4. Clique em **"Save"**

---

### **8. Verificar Logs (Se ainda não funcionar)**

1. No menu lateral, clique em **Authentication**
2. Clique em **Logs**
3. Procure por:
   - Erros relacionados a email
   - Tentativas de envio de email
   - Erros de SMTP

---

### **9. URLs de Redirecionamento**

1. Em **Project Settings** → **Authentication** → **URL Configuration**
2. Em **Site URL**, adicione:
   ```
   http://localhost:3000
   https://seu-dominio.com
   ```
3. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3000/auth/callback
   https://seu-dominio.com/auth/callback
   ```

---

## ✅ Checklist de Verificação

- [ ] Custom SMTP habilitado
- [ ] SMTP Host configurado corretamente
- [ ] SMTP Port configurada (587 ou 465)
- [ ] SMTP User preenchido
- [ ] SMTP Password correta (senha de app para Gmail)
- [ ] Sender Email configurado
- [ ] Sender Name configurado
- [ ] Template de email contém `{{ .ConfirmationURL }}`
- [ ] "Enable email confirmations" habilitado
- [ ] Site URL configurado
- [ ] Redirect URLs configuradas
- [ ] Teste de envio realizado
- [ ] Sem erros nos logs

---

## 🔍 Troubleshooting

### **Email não está sendo enviado:**

1. Verifique os logs em **Authentication → Logs**
2. Verifique se o SMTP está habilitado
3. Teste a conexão SMTP manualmente
4. Verifique se a senha está correta
5. Para Gmail, use senha de app

### **Erro: "Invalid credentials"**

- Verifique usuário e senha
- Para Gmail, crie senha de app
- Verifique se a autenticação em 2 fatores está ativa (Gmail)

### **Erro: "Connection timeout"**

- Verifique se a porta está correta (587 ou 465)
- Verifique se o firewall não está bloqueando
- Teste com telnet ou openssl

### **Email vai para spam:**

- Configure SPF/DKIM no seu domínio
- Use um email do seu próprio domínio (não Gmail pessoal)
- Evite palavras como "confirmação", "verificação" no assunto

---

## 📚 Recursos Adicionais

- Documentação Supabase: https://supabase.com/docs/guides/auth/auth-smtp
- Como criar senha de app Gmail: https://support.google.com/accounts/answer/185833
- Testar SMTP online: https://www.gmass.co/smtp-test

---

## 💡 Dica Final

Se você está usando **Gmail pessoal**, recomendamos:
1. Criar uma **senha de app**
2. Ou usar um **email profissional** do seu próprio domínio
3. Configurar **SPF/DKIM** no DNS do domínio

Isso evitará problemas de bloqueio e emails indo para spam.


