# 📧 Como Renovar Email na Hostinger e Configurar SMTP no Supabase

## 🔴 Problema Identificado

O email da Hostinger está **expirado**, causando falha no envio de emails de confirmação pelo Supabase. Quando o SMTP tenta autenticar com credenciais expiradas, ocorre o erro "Error sending confirmation email".

---

## ✅ SOLUÇÃO PASSO A PASSO

### **PASSO 1: Renovar/Criar Novo Email na Hostinger**

1. **Acesse o Painel Hostinger:**
   - Vá para: https://hpanel.hostinger.com
   - Faça login na sua conta

2. **Acesse Email Accounts:**
   - No menu lateral, clique em **"Email"** ou **"Email Accounts"**
   - Ou procure por **"Contas de Email"** / **"Email Accounts"**

3. **Renovar Email Existente OU Criar Novo:**
   
   **Opção A - Renovar Email Existente:**
   - Se o email ainda existe mas está expirado:
   - Clique em **"Renovar"** ou **"Ativar"** no email
   - Verifique se há período de renovação disponível
   
   **Opção B - Criar Novo Email (Recomendado):**
   - Clique em **"Criar Nova Conta de Email"** ou **"Add Email Account"**
   - Escolha um nome para o email (ex.: `noreply@seudominio.com` ou `sistema@seudominio.com`)
   - Defina uma **senha forte**
   - Anote a senha em local seguro
   - Crie a conta

4. **Verificar Status:**
   - O email deve aparecer como **"Ativo"** ou **"Active"**
   - Aguarde alguns minutos para o email ficar totalmente ativo

---

### **PASSO 2: Configurar SMTP no Supabase**

1. **Acesse Supabase Dashboard:**
   - Vá para: https://app.supabase.com
   - Faça login e selecione seu projeto

2. **Vá para SMTP Settings:**
   - Clique em **⚙️ Project Settings** (engrenagem)
   - No menu lateral, clique em **Authentication**
   - Role até **SMTP Settings** ou clique em **Email**

3. **Configure o SMTP:**
   
   **Enable Custom SMTP:** ✅ **MARQUE ESTA OPÇÃO**
   
   **SMTP Host:**
   ```
   smtp.hostinger.com
   ```
   (Ou `smtp.titan.email` se usar Titan Email)
   
   **SMTP Port:**
   ```
   587
   ```
   (Ou `465` para SSL)
   
   **SMTP User:**
   ```
   seuemail@seudominio.com
   ```
   (Use o email que acabou de criar/renovar)
   
   **SMTP Password:**
   ```
   [SENHA DO EMAIL]
   ```
   (A senha que você definiu ao criar o email)
   
   **Sender Email:**
   ```
   seuemail@seudominio.com
   ```
   (O mesmo email)
   
   **Sender Name:**
   ```
   PLENIPAY
   ```
   (Ou o nome que desejar)

4. **Testar e Salvar:**
   - Clique em **"Save"** ou **"Update"**
   - O Supabase testará a conexão automaticamente
   - Se aparecer erro, verifique as credenciais

---

### **PASSO 3: Verificar Template de Email**

1. No Supabase Dashboard:
   - Vá em **Authentication** → **Email Templates**
   - Selecione **"Confirm signup"**
   - Verifique se contém: **`{{ .ConfirmationURL }}`**
   - Se não tiver, adicione e salve

---

### **PASSO 4: Verificar Configurações de Confirmação**

1. Vá em **Project Settings** → **Authentication** → **URL Configuration**
2. Marque: **"Enable email confirmations"**
3. Em **Site URL**, adicione:
   ```
   http://localhost:3000
   https://seu-dominio.com
   ```
4. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3000/auth/callback
   https://seu-dominio.com/auth/callback
   ```

---

### **PASSO 5: Testar**

1. Após configurar tudo, **teste criando uma nova conta**
2. Verifique se o email de confirmação chega na caixa de entrada
3. Se não chegar, verifique a pasta de **spam/lixo eletrônico**

---

## 🔍 Troubleshooting

### **Erro: "Invalid credentials"**
- Verifique se o email e senha estão corretos
- Verifique se o email está ativo na Hostinger
- Tente criar um novo email

### **Erro: "Connection timeout"**
- Verifique se a porta está correta (587 ou 465)
- Verifique se o SMTP Host está correto (`smtp.hostinger.com`)

### **Email não chega:**
- Verifique a pasta de spam
- Verifique os logs do Supabase em **Authentication → Logs**
- Aguarde alguns minutos (pode haver delay)

---

## 📋 Checklist Rápido

- [ ] Email criado/renovado na Hostinger
- [ ] Email está ativo na Hostinger
- [ ] Senha do email anotada
- [ ] SMTP configurado no Supabase
- [ ] Teste de conexão SMTP passou
- [ ] Template de email configurado
- [ ] "Enable email confirmations" habilitado
- [ ] Site URL e Redirect URLs configurados
- [ ] Teste criando uma nova conta
- [ ] Email de confirmação chegou

---

## ⚡ Solução Temporária

Enquanto renova o email, os usuários podem:
1. Criar conta normalmente (a conta será criada)
2. Usar o botão **"Reenviar link"** no modal
3. Isso tentará enviar via Admin API (mas também falhará se SMTP estiver ruim)

**Após renovar o email e configurar o SMTP:**
- Teste novamente criando uma nova conta
- O email deve ser enviado automaticamente


