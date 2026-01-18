# 📧 COMO APLICAR O TEMPLATE DE EMAIL NO SUPABASE

## ✅ TEMPLATE CORRETO

O template fornecido está **CORRETO** e usa `{{ .ConfirmationURL }}` que é a variável certa.

---

## 📋 PASSO A PASSO PARA APLICAR

### **1️⃣ ACESSAR TEMPLATES DE EMAIL**

1. Acesse: **https://app.supabase.com** → Seu Projeto
2. Vá em: **Authentication** → **Email Templates**
3. Clique em: **"Confirm signup"**

---

### **2️⃣ COPIAR O TEMPLATE**

1. Abra o arquivo: `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C ou Cmd+A, Cmd+C)
3. **NÃO modifique nada** - o template já está correto

---

### **3️⃣ COLAR NO SUPABASE**

1. No Supabase, clique na aba: **"Source"** (código HTML)
2. **Selecione TODO o conteúdo** atual (Ctrl+A ou Cmd+A)
3. **Cole o novo template** (Ctrl+V ou Cmd+V)
4. **VERIFIQUE** que tem `{{ .ConfirmationURL }}` em 3 lugares:
   - No botão: `<a href="{{ .ConfirmationURL }}">`
   - No link alternativo (href): `<a href="{{ .ConfirmationURL }}">`
   - No link alternativo (texto): `{{ .ConfirmationURL }}`

---

### **4️⃣ CONFIGURAR ASSUNTO**

1. Clique na aba: **"Message"**
2. No campo **"Subject"**, coloque:
   ```
   Confirme seu Cadastro - PLENIPAY
   ```
3. **SALVE**

---

### **5️⃣ SALVAR O TEMPLATE**

1. Clique no botão **"Save"** ou **"Update"**
2. Aguarde a confirmação de salvamento

---

## ✅ VERIFICAÇÕES FINAIS

### **O template DEVE ter:**
- ✅ `{{ .ConfirmationURL }}` (3 vezes)
- ✅ NÃO deve ter `{{ .SiteURL }}`
- ✅ NÃO deve ter `{{ .Token }}`
- ✅ NÃO deve ter `0.0.0.0` ou `10000`

### **A Site URL DEVE estar:**
- ✅ `https://plenipay.com` (no Supabase Dashboard → Authentication → URL Configuration)

---

## 🧪 TESTAR

1. **Crie uma nova conta de teste**
2. **Verifique o email de confirmação**
3. **O link deve ter:** `https://plenipay.com/auth/callback...`
4. **NÃO deve ter:** `0.0.0.0:10000` ou `localhost:3000`

---

## ⚠️ IMPORTANTE

- **NÃO use** `{{ .SiteURL }}` - isso pode causar o problema de `0.0.0.0:10000`
- **USE sempre** `{{ .ConfirmationURL }}` - esta variável já contém a URL completa com `redirect_to`
- O Supabase substitui automaticamente `{{ .ConfirmationURL }}` pela URL correta baseada no `emailRedirectTo` que enviamos no código

---

## 🆘 SE AINDA NÃO FUNCIONAR

Me diga:
1. O template foi salvo corretamente?
2. A Site URL no Supabase está como `https://plenipay.com`?
3. O que aparece nos logs do servidor quando você cria uma conta?
4. O link no email ainda mostra `0.0.0.0:10000`?
