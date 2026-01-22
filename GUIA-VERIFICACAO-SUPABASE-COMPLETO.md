# ✅ GUIA COMPLETO: Verificação de Configurações do Supabase

## 🎯 PARTE 5: Verificar Todas as Configurações

Este guia verifica todas as configurações necessárias para a verificação de email funcionar corretamente.

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### **1️⃣ Site URL** ✅

**Localização:** Authentication → URL Configuration

**Configuração:**
- **Site URL:** `https://plenipay.com` (sem barra final)
- ❌ **NÃO pode ser:** `0.0.0.0:10000`, `localhost`, ou vazio

**Como verificar:**
1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em: **Authentication** → **URL Configuration**
3. Verifique se **Site URL** está como `https://plenipay.com`

**Se estiver errado:**
- Apague o valor
- Salve
- Aguarde 1 minuto
- Cole `https://plenipay.com`
- Salve novamente

---

### **2️⃣ Redirect URLs** ✅

**Localização:** Authentication → URL Configuration

**Configuração:**
- Deve incluir: `https://plenipay.com/**`
- Deve incluir: `https://plenipay.com/auth/callback`

**Como verificar:**
1. Na mesma página (URL Configuration)
2. Verifique **Redirect URLs**
3. Certifique-se que tem:
   ```
   https://plenipay.com/**
   https://plenipay.com/auth/callback
   ```

**Se não tiver:**
- Adicione ambas as URLs
- Salve

---

### **3️⃣ Email Confirmation Type** ✅

**Localização:** Authentication → URL Configuration

**Configuração:**
- **Email confirmation type:** Deve estar como **"Email Link"** (não "OTP")

**Como verificar:**
1. Na mesma página (URL Configuration)
2. Verifique **Email confirmation type**
3. Deve estar selecionado: **"Email Link"**

**Se estiver como "OTP":**
- Mude para **"Email Link"**
- Salve

---

### **4️⃣ Enable Email Confirmations** ✅

**Localização:** Authentication → Settings → Email Auth

**Configuração:**
- **"Enable email confirmations"** deve estar **HABILITADO** (checkbox marcado)

**Como verificar:**
1. Acesse: **Authentication** → **Settings** → **Email Auth**
2. Verifique se **"Enable email confirmations"** está marcado

**Se não estiver:**
- Marque a checkbox
- Salve

---

### **5️⃣ SMTP Configuration** ✅

**Localização:** Authentication → Settings → SMTP Settings

**Opções:**
- **Opção A:** Usar SMTP padrão do Supabase (limitado mas funcional)
- **Opção B:** Configurar SMTP customizado (recomendado para produção)

**Como verificar:**
1. Acesse: **Authentication** → **Settings** → **SMTP Settings**
2. Verifique se há configuração ativa

**Se não tiver SMTP customizado:**
- O Supabase usa SMTP padrão (pode ter limitações)
- Para produção, configure SMTP customizado:
  - Host SMTP
  - Porta (587 ou 465)
  - Usuário e senha
  - Email remetente

---

### **6️⃣ Email Template** ✅ (CRÍTICO)

**Localização:** Authentication → Email Templates → "Confirm signup"

**Configuração:**
- **Deve usar:** `{{ .ConfirmationURL }}` no link
- ❌ **NÃO deve usar:** `{{ .SiteURL }}` sozinho

**Como verificar:**
1. Acesse: **Authentication** → **Email Templates**
2. Clique em: **"Confirm signup"**
3. Clique na aba: **"Source"** (código HTML)
4. Procure por links de confirmação
5. **Deve ter:** `<a href="{{ .ConfirmationURL }}">` ou similar

**Se estiver errado:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO** o conteúdo
3. Cole no campo "Source" do template no Supabase
4. **SALVE**

**Por que é crítico:**
- `{{ .ConfirmationURL }}` = usa o `redirect_to` correto
- `{{ .SiteURL }}` = pode usar URL errada (ex: `0.0.0.0:10000`)

---

## 🧪 TESTE FINAL

Após verificar todas as configurações:

1. **Aguarde 2-3 minutos** após fazer mudanças
2. **Crie uma nova conta de teste**
3. **Verifique:**
   - ✅ Email é recebido
   - ✅ Link no email aponta para `https://plenipay.com/auth/callback`
   - ✅ Ao clicar no link, email é confirmado
   - ✅ Usuário é logado automaticamente

---

## 🐛 PROBLEMAS COMUNS

### **Problema 1: Link vai para `0.0.0.0:10000`**

**Causa:** Template usando `{{ .SiteURL }}` ou Site URL em cache

**Solução:**
- Verifique template (passo 6)
- Limpe cache da Site URL (passo 1)

---

### **Problema 2: Email não é enviado**

**Causa:** SMTP não configurado ou "Enable email confirmations" desabilitado

**Solução:**
- Verifique passo 4 (Enable Email Confirmations)
- Verifique passo 5 (SMTP)

---

### **Problema 3: Link inválido/expirado**

**Causa:** Token expirou ou foi usado

**Solução:**
- Solicite novo link via modal (Parte 4)
- Links expiram em 24 horas

---

## ✅ RESUMO

**Configurações obrigatórias:**
- ✅ Site URL = `https://plenipay.com`
- ✅ Redirect URLs incluem `https://plenipay.com/**`
- ✅ Email confirmation type = "Email Link"
- ✅ Enable email confirmations = Habilitado
- ✅ Template usa `{{ .ConfirmationURL }}`
- ✅ SMTP configurado (custom ou padrão)

**Com todas essas configurações corretas, o sistema deve funcionar perfeitamente!**
