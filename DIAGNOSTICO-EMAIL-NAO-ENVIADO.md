# 🔍 Diagnóstico: Email de Confirmação Não Está Sendo Enviado

## ⚠️ Problema

O email de confirmação não está sendo enviado mesmo após criar a conta.

## 🔍 Como Diagnosticar

### 1. **Verificar Logs do Servidor**

Execute o aplicativo e crie uma conta. Verifique os logs do console/terminal:

**Procurar por:**
- `📧 ========== ENVIAR LINK DE CONFIRMAÇÃO ==========`
- `📤 Enviando link de confirmação via resend()...`
- `✅ Email enviado com sucesso via resend`
- `❌ Erro ao enviar link de confirmação`

### 2. **Verificar Configurações no Supabase**

#### A. SMTP Configurado?

1. Acesse: https://app.supabase.com → Seu projeto
2. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
3. **Verifique:**
   - ✅ **"Enable Custom SMTP"** está **marcado**?
   - ✅ Todos os campos estão preenchidos?

**Se não estiver configurado:**
- Configure seu SMTP (Hostinger, etc.)
- Ou use o SMTP padrão do Supabase (verificar se está funcionando)

#### B. Email Confirmation Habilitado?

1. Acesse: **Authentication** → **URL Configuration**
2. **Verifique:**
   - ✅ **"Enable email confirmations"** está **habilitado**?
   - ✅ **"Email confirmation type"** está como **"Email Link"**?

#### C. Template de Email Configurado?

1. Acesse: **Authentication** → **Email Templates**
2. Clique em: **"Confirm signup"**
3. Clique na aba: **"Source"** (código HTML)
4. **Verifique:**
   - ✅ Tem código HTML no template?
   - ✅ Usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)?

### 3. **Verificar Logs do Supabase**

1. Acesse: **Authentication** → **Logs**
2. **Procure por:**
   - Tentativas de envio de email
   - Erros de SMTP
   - Erros de template

### 4. **Testar Manualmente**

1. Acesse: **Authentication** → **Users**
2. Selecione um usuário não confirmado
3. Clique em: **"Send password recovery"** ou similar
4. **Verifique:** Se o email é enviado manualmente

---

## 🔧 Soluções Possíveis

### Solução 1: Verificar se SMTP Está Funcionando

Se usar SMTP próprio, teste:

```bash
# Verificar variáveis de ambiente
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
echo $SMTP_FROM
```

### Solução 2: Usar SMTP Padrão do Supabase

Se SMTP próprio não estiver configurado, o Supabase usa seu SMTP padrão. Verifique se está funcionando.

### Solução 3: Verificar Rate Limiting

O Supabase pode estar bloqueando envios por rate limiting:

- Aguarde alguns minutos
- Tente novamente
- Verifique logs do Supabase

### Solução 4: Verificar se Email Confirmation Está Habilitado

1. **Authentication** → **URL Configuration**
2. Verifique: **"Enable email confirmations"** está **habilitado**

---

## 🧪 Teste Rápido

### Teste 1: Criar Nova Conta

1. Preencha formulário de cadastro
2. Clique em "Criar Conta"
3. **Verifique console:** Deve mostrar `✅ Email enviado com sucesso`
4. **Verifique email:** Deve receber email de confirmação

### Teste 2: Reenviar Link (via Modal)

1. Após criar conta, clique em "Não recebeu? Reenviar link"
2. **Verifique console:** Deve mostrar logs de envio
3. **Verifique email:** Deve receber novo email

---

## 📋 Checklist de Verificação

- [ ] **SMTP configurado** no Supabase Dashboard
- [ ] **Email confirmation habilitado** no Supabase Dashboard
- [ ] **Template de email configurado** com `{{ .ConfirmationURL }}`
- [ ] **Email confirmation type** = "Email Link" (não "OTP")
- [ ] **Site URL** = `https://plenipay.com`
- [ ] **Redirect URLs** incluem `https://plenipay.com/auth/callback`
- [ ] **Logs do servidor** não mostram erros
- [ ] **Logs do Supabase** não mostram erros de SMTP

---

## ❓ O Que Verificar nos Logs

### Se Aparecer `✅ Email enviado com sucesso`:

- ✅ O código está funcionando
- ❌ Problema pode ser:
  - SMTP não está enviando realmente
  - Email está caindo em spam
  - Verificar logs do Supabase (Authentication → Logs)

### Se Aparecer `❌ Erro ao enviar`:

- ❌ Verificar mensagem de erro específica
- ❌ Pode ser:
  - SMTP não configurado
  - Template não configurado
  - Email confirmation desabilitado
  - Rate limiting

---

## 🆘 Próximos Passos

1. **Verifique os logs do servidor** ao criar conta
2. **Copie os logs** aqui para eu ver o erro específico
3. **Verifique SMTP** no Supabase Dashboard
4. **Verifique Logs** do Supabase (Authentication → Logs)

**Me envie:**
- Logs do servidor ao criar conta
- Configurações do Supabase (SMTP, Email confirmation, etc.)
- Qualquer erro que aparecer
