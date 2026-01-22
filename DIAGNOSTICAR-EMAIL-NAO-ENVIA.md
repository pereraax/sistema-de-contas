# 🔍 DIAGNOSTICAR: Email de Confirmação Não Está Enviando

## ❌ PROBLEMA

O email de confirmação não está sendo enviado quando o usuário cria uma conta.

---

## 🔍 VERIFICAÇÕES NECESSÁRIAS

### **1️⃣ VERIFICAR LOGS DO SUPABASE**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Authentication → Logs
3. **Procure por:**
   - Tentativas de envio de email
   - Erros relacionados a email
   - Erros de SMTP

**O que procurar:**
- ❌ Erros de SMTP
- ❌ "Email not sent"
- ❌ "SMTP configuration error"

---

### **2️⃣ VERIFICAR CONFIGURAÇÃO SMTP**

1. **Acesse:** Authentication → Settings → SMTP Settings
2. **Verifique se:**
   - ✅ SMTP está configurado (custom SMTP ou usando padrão do Supabase)
   - ✅ Não há erros na configuração

**Se não estiver configurado:**
- Configure SMTP customizado OU
- Use o SMTP padrão do Supabase (pode ter limitações)

---

### **3️⃣ VERIFICAR SE CONFIRMAÇÃO DE EMAIL ESTÁ HABILITADA**

1. **Acesse:** Authentication → Settings → Email Auth
2. **Verifique:**
   - ✅ **"Enable email confirmations"** está **HABILITADO**

**Se não estiver habilitado:**
- O Supabase **não enviará** emails de confirmação

---

### **4️⃣ VERIFICAR TEMPLATE DE EMAIL**

1. **Acesse:** Authentication → Email Templates → "Confirm signup"
2. **Clique na aba:** "Source"
3. **Verifique se tem:**
   - ✅ `{{ .ConfirmationURL }}` (correto)
   - ❌ `{{ .SiteURL }}` (pode causar problemas)

**Se estiver errado:**
- Copie o conteúdo de `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
- Cole no template do Supabase
- Salve

---

### **5️⃣ VERIFICAR LOGS DA APLICAÇÃO**

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP`
3. **Procure por:**
   - `❌ Erro ao enviar:` - mostra o erro específico
   - `✅ Email enviado` - confirma que foi enviado

**Possíveis erros nos logs:**
- Rate limit: "rate limit" - aguardar alguns minutos
- SMTP: "smtp" ou "send" - verificar configuração SMTP
- Email não encontrado: "not found" - problema com usuário
- Email já confirmado: "already" - email já foi confirmado

---

### **6️⃣ VERIFICAR VARIÁVEIS DE AMBIENTE**

Verifique se está configurado no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

---

## ✅ SOLUÇÕES COMUNS

### **SOLUÇÃO 1: Habilitar Confirmação de Email**

Se "Enable email confirmations" não estiver habilitado:

1. **Authentication** → **Settings** → **Email Auth**
2. ✅ **Marque:** "Enable email confirmations"
3. **Salve**

---

### **SOLUÇÃO 2: Configurar SMTP**

Se SMTP não estiver configurado:

1. **Authentication** → **Settings** → **SMTP Settings**
2. **Configure:**
   - Host SMTP
   - Porta (587 ou 465)
   - Usuário
   - Senha
   - Email remetente

**OU**

Use o SMTP padrão do Supabase (limitado, mas funciona para testes)

---

### **SOLUÇÃO 3: Verificar Rate Limiting**

Se houver erro de rate limit:

1. **Aguarde 5-10 minutos**
2. **Tente criar conta novamente**
3. O Supabase tem limite de emails por hora

---

### **SOLUÇÃO 4: Verificar Logs do Supabase**

1. **Authentication** → **Logs**
2. **Veja qual erro específico** está ocorrendo
3. **Erros comuns:**
   - SMTP configuration error
   - Invalid template
   - Rate limit exceeded
   - User not found

---

## 🧪 TESTE APÓS CORRIGIR

1. **Crie uma nova conta de teste**
2. **Verifique os logs** em `/administracaosecr/logs`
3. **Procure por:** `✅ Email enviado`
4. **Verifique a caixa de entrada** (e spam)
5. **Se não chegar:** Verifique logs do Supabase (Authentication → Logs)

---

## 📋 CHECKLIST COMPLETO

- [ ] **Enable email confirmations** está habilitado
- [ ] **SMTP** está configurado (custom ou padrão)
- [ ] **Template** usa `{{ .ConfirmationURL }}`
- [ ] **Logs da aplicação** mostram sucesso ou erro específico
- [ ] **Logs do Supabase** não mostram erros de SMTP
- [ ] **Variáveis de ambiente** estão configuradas
- [ ] **Não há rate limiting** ativo

---

**Comece verificando os logs em `/administracaosecr/logs` e no Supabase Dashboard → Authentication → Logs para ver o erro específico!**
