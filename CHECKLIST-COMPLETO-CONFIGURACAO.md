# ✅ CHECKLIST COMPLETO: Configuração de Email de Confirmação

## 📋 BASEADO NA SUA CONFIGURAÇÃO ATUAL

### **✅ JÁ CONFIGURADO (Confirmado):**
- [x] Site URL: `https://plenipay.com` ✅
- [x] Redirect URL: `https://plenipay.com/**` ✅
- [x] Redirect URL: `http://localhost:3000/auth/callback` ✅
- [x] SMTP configurado (confirmado anteriormente) ✅

---

## ❓ O QUE FALTA VERIFICAR:

### **1️⃣ REDIRECT URL ESPECÍFICA** (Recomendado adicionar)

**Status atual:**
- ✅ `https://plenipay.com/**` (wildcard - funciona)
- ❓ `https://plenipay.com/auth/callback` (específico - **FALTA**)

**Ação:**
1. Na tela que você está vendo (URL Configuration)
2. Clique em **"Add URL"**
3. Digite: `https://plenipay.com/auth/callback`
4. Clique em **"Save changes"**

**Por quê?**
- O wildcard `/**` funciona, mas ter a URL específica é mais explícito e pode evitar problemas

---

### **2️⃣ TIPO DE CONFIRMAÇÃO DE EMAIL** ⚠️ CRÍTICO

**Onde verificar:**
- Na mesma página **"URL Configuration"**, procure por **"Email confirmation type"**

**Deve estar como:**
- ✅ **"Email Link"** (para links de confirmação)
- ❌ **NÃO pode estar como "OTP"** (isso é para códigos)

**Se estiver como "OTP":**
1. Mude para **"Email Link"**
2. Clique em **"Save changes"**

---

### **3️⃣ HABILITAR CONFIRMAÇÃO DE EMAIL** ⚠️ CRÍTICO

**Onde verificar:**
- Na mesma página **"URL Configuration"**, procure por **"Enable email confirmations"**

**Deve estar:**
- ✅ **HABILITADO** (checkbox marcado)
- ❌ Se estiver desabilitado, emails não serão enviados

**Se estiver desabilitado:**
1. Marque a checkbox **"Enable email confirmations"**
2. Clique em **"Save changes"**

---

### **4️⃣ TEMPLATE DE EMAIL** ⚠️ MAIS IMPORTANTE

**Onde verificar:**
1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba **"Source"** (código HTML)
3. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** ✅
   - ❌ `{{ .SiteURL }}` = **ERRADO** (se encontrar, substitua)

**Se encontrar `{{ .SiteURL }}`:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO o conteúdo**
3. Cole no campo "Source" do template
4. **SALVE**

**Por quê isso é crítico?**
- `{{ .SiteURL }}` = sempre usa a Site URL do dashboard (pode ter cache de URL antiga)
- `{{ .ConfirmationURL }}` = usa o `emailRedirectTo` do código (sempre correto)

---

## 📋 CHECKLIST FINAL

Marque conforme verificar:

### **URL Configuration:**
- [ ] **Site URL**: `https://plenipay.com` ✅ (já está correto)
- [ ] **Redirect URLs**: Tem `https://plenipay.com/**` ✅ (já está)
- [ ] **Redirect URLs**: Tem `https://plenipay.com/auth/callback` ❓ (adicionar)
- [ ] **Email confirmation type**: Está como **"Email Link"** ❓
- [ ] **Enable email confirmations**: Está **HABILITADO** ❓

### **Email Template:**
- [ ] Template usa `{{ .ConfirmationURL }}` ❓ (VERIFICAR AGORA)
- [ ] Template **NÃO** usa `{{ .SiteURL }}` ❓ (VERIFICAR AGORA)

### **SMTP:**
- [ ] SMTP está configurado ✅ (confirmado anteriormente)

---

## 🔍 ONDE VERIFICAR CADA ITEM

### **Verificar "Email confirmation type" e "Enable email confirmations":**
1. Na tela que você está vendo (**URL Configuration**)
2. Role para baixo ou procure na mesma página
3. Deve ter uma seção sobre **"Email confirmation"**

### **Verificar Template:**
1. Menu lateral → **Authentication** → **Email Templates**
2. Clique em **"Confirm signup"**
3. Clique na aba **"Source"**

---

## ⚠️ IMPORTANTE

**O problema mais comum de URL errada é:**
1. ❌ Template usando `{{ .SiteURL }}` ao invés de `{{ .ConfirmationURL }}`
2. ❌ Email confirmation type está como "OTP" ao invés de "Email Link"
3. ❌ Enable email confirmations está desabilitado

**Verifique estes 3 itens primeiro!**

---

## 🧪 APÓS VERIFICAR

1. **Salve todas as alterações**
2. **Aguarde 2-3 minutos** (Supabase pode ter cache)
3. **Crie uma NOVA conta de teste**
4. **Verifique o email recebido:**
   - ✅ Link deve começar com: `https://plenipay.com/auth/callback?...`
   - ❌ NÃO deve ter: `0.0.0.0:10000` ou `localhost`
