# 🔍 DIAGNOSTICAR EMAIL DE CONFIRMAÇÃO NO LOCALHOST

## ⚠️ PROBLEMA
O email de confirmação não está funcionando nem no localhost.

---

## ✅ VERIFICAÇÕES OBRIGATÓRIAS

### **1️⃣ VERIFICAR SE O EMAIL ESTÁ SENDO ENVIADO**

#### **A. Verificar no Console do Terminal**
Quando você cria uma conta, o terminal deve mostrar logs como:

```
📝 Criando conta usando signUp normal do Supabase...
📧 Site URL detectada: http://localhost:3000
📧 emailRedirectTo: http://localhost:3000/auth/callback?next=/home
📬 Resultado do signUp:
   - Usuário criado: true
   - Email confirmado: false
   - Session criada: false
   - Erro: Nenhum
```

**O QUE PROCURAR:**
- ✅ Se `Usuário criado: true` → O Supabase recebeu a requisição
- ✅ Se `Email confirmado: false` → Normal, usuário precisa confirmar
- ✅ Se `Session criada: false` → Normal, precisa confirmar email primeiro
- ❌ Se houver `Erro:` → Problema na configuração

---

### **2️⃣ VERIFICAR NO SUPABASE DASHBOARD**

#### **A. Authentication → URL Configuration**

1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em: **Authentication** → **URL Configuration**
3. **VERIFIQUE:**

   **Site URL:**
   ```
   http://localhost:3000
   ```
   (Deve estar configurado para desenvolvimento)

   **Redirect URLs:**
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

   **Enable email confirmations:**
   - ✅ Deve estar **MARCADO**

   **Email confirmation type:**
   - ✅ Deve estar como **"Email Link"** (não "OTP")

4. **SALVE** se fizer alterações

---

#### **B. Authentication → Email Templates**

1. Vá em: **Authentication** → **Email Templates**
2. Clique em: **"Confirm signup"**
3. Clique na aba: **"Source"** (código HTML)
4. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = CORRETO (para link)
   - ❌ `{{ .Token }}` = ERRADO (para OTP)

**SE ESTIVER USANDO `{{ .Token }}`:**
- O template está configurado para OTP, mas o tipo está como "Email Link"
- **SOLUÇÃO:** Mude o template para usar `{{ .ConfirmationURL }}`

**EXEMPLO CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

---

#### **C. Project Settings → Auth → SMTP Settings**

1. Vá em: **Project Settings** → **Auth** → **SMTP Settings**
2. **VERIFIQUE:**
   - ✅ **Enable Custom SMTP** está marcado?
   - ✅ Todos os campos estão preenchidos?
   - ✅ Host, Port, Username, Password estão corretos?

**SE NÃO ESTIVER CONFIGURADO:**
- O Supabase usa o serviço padrão (com limite muito baixo)
- Pode não estar enviando emails realmente
- **Configure SMTP** (veja guias anteriores)

---

### **3️⃣ VERIFICAR LOGS DO SUPABASE**

1. No Supabase Dashboard, vá em: **Authentication** → **Logs**
2. Procure por eventos de **"Signup"** ou **"Email sent"**
3. **VERIFIQUE:**
   - Se há erros ao enviar email
   - Se o email foi realmente enviado
   - Qual é a mensagem de erro (se houver)

---

### **4️⃣ VERIFICAR CAIXA DE ENTRADA**

1. **Verifique a caixa de entrada** do email usado no cadastro
2. **Verifique a pasta de SPAM/LIXO ELETRÔNICO**
3. **Procure por emails do Supabase** ou do remetente configurado

---

### **5️⃣ TESTAR COM OUTRO EMAIL**

1. Tente criar uma conta com **outro email**
2. Verifique se o problema é específico de um email ou geral

---

## 🔧 SOLUÇÕES COMUNS

### **PROBLEMA 1: Email não está sendo enviado**

**CAUSA:** SMTP não configurado ou incorreto

**SOLUÇÃO:**
1. Configure SMTP no Supabase Dashboard
2. Use as credenciais da Hostinger (ou outro provedor)
3. Teste a conexão SMTP

---

### **PROBLEMA 2: Link está errado (localhost em produção)**

**CAUSA:** Site URL no Supabase está configurada incorretamente

**SOLUÇÃO:**
1. No Supabase Dashboard → Authentication → URL Configuration
2. Configure:
   - **Site URL:** `http://localhost:3000` (para desenvolvimento)
   - **Redirect URLs:** `http://localhost:3000/**`

---

### **PROBLEMA 3: Template de email está errado**

**CAUSA:** Template usando `{{ .Token }}` em vez de `{{ .ConfirmationURL }}`

**SOLUÇÃO:**
1. No Supabase Dashboard → Authentication → Email Templates
2. Edite o template "Confirm signup"
3. Substitua `{{ .Token }}` por `{{ .ConfirmationURL }}`
4. Salve

---

### **PROBLEMA 4: Tipo de confirmação está errado**

**CAUSA:** Tipo configurado como "OTP" em vez de "Email Link"

**SOLUÇÃO:**
1. No Supabase Dashboard → Authentication → URL Configuration
2. Mude **Email confirmation type** para **"Email Link"**
3. Salve

---

## 🧪 TESTE RÁPIDO

### **1. Criar uma conta de teste**
```
Email: teste@exemplo.com
Senha: Teste123!@#
```

### **2. Verificar logs no terminal**
Procure por:
- ✅ `Usuário criado: true`
- ✅ `Email confirmado: false`
- ✅ `Session criada: false`
- ❌ Sem erros

### **3. Verificar email**
- Verifique caixa de entrada
- Verifique spam
- Verifique logs do Supabase

---

## 📋 CHECKLIST COMPLETO

- [ ] SMTP configurado no Supabase
- [ ] Site URL configurada como `http://localhost:3000`
- [ ] Redirect URLs incluem `http://localhost:3000/**`
- [ ] Enable email confirmations está marcado
- [ ] Email confirmation type está como "Email Link"
- [ ] Template de email usa `{{ .ConfirmationURL }}`
- [ ] Logs do terminal mostram usuário criado
- [ ] Logs do Supabase mostram email enviado
- [ ] Email chegou na caixa de entrada (ou spam)

---

## 🆘 AINDA NÃO FUNCIONA?

Me diga:
1. O que aparece nos logs do terminal quando você cria uma conta?
2. O que aparece nos logs do Supabase (Authentication → Logs)?
3. O SMTP está configurado?
4. O template de email está correto?
5. O tipo de confirmação está como "Email Link"?
