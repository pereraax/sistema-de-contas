# ⚠️ SOLUÇÃO URGENTE: Link com 0.0.0.0:10000

## ❌ PROBLEMA ATUAL

Quando você clica no link do email, está indo para `https://0.0.0.0:10000/login?error=...`

**Isso acontece porque:**
- O Supabase está gerando links com `0.0.0.0:10000` no template de email
- O navegador não consegue conectar ao `0.0.0.0:10000`
- O callback nunca recebe a requisição

---

## ✅ SOLUÇÃO IMEDIATA: Verificar Template do Supabase

### **PASSO 1: Verificar Template de Email (CRÍTICO)**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Authentication → Email Templates → "Confirm signup"
3. **Clique na aba:** "Source" (código HTML)
4. **Procure por:** `{{ .SiteURL }}` ou `0.0.0.0`

**Se encontrar `{{ .SiteURL }}` OU `0.0.0.0`:**
- ❌ **ESTE É O PROBLEMA!**
- O template está usando URL errada

**DEVE ter apenas:** `{{ .ConfirmationURL }}`

---

### **PASSO 2: Corrigir Template**

1. **Abra o arquivo:** `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **No Supabase:**
   - Selecione TODO o código atual (Ctrl+A)
   - Cole o novo template (Ctrl+V)
4. **VERIFIQUE** que tem `{{ .ConfirmationURL }}` (deve ter 3 vezes)
5. **NÃO deve ter:** `{{ .SiteURL }}` ou `0.0.0.0`
6. **SALVE**

---

### **PASSO 3: Verificar Site URL**

1. **Authentication** → **URL Configuration**
2. **Site URL** deve ser: `https://plenipay.com` (sem barra final)
3. **Se estiver diferente:**
   - Apague o valor
   - Salve
   - Aguarde 1 minuto
   - Cole `https://plenipay.com`
   - Salve novamente

---

### **PASSO 4: Aguardar e Testar**

1. **Aguarde 2-3 minutos** após salvar
2. **Crie uma NOVA conta de teste**
3. **Verifique o email**
4. **O link deve começar com:** `https://plenipay.com/auth/callback...`
5. **NÃO deve ter:** `0.0.0.0` ou `10000`

---

## 🔍 COMO IDENTIFICAR O PROBLEMA NO TEMPLATE

### **Template ERRADO:**
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .Token }}">
  Confirmar Email
</a>
```
❌ Isso gera: `http://0.0.0.0:10000/auth/callback?token_hash=...`

### **Template CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">
  Confirmar Email
</a>
```
✅ Isso gera: `https://plenipay.com/auth/callback?token_hash=...&type=signup&next=/home`

---

## ⚠️ IMPORTANTE

**O problema não é no código!** O código está correto.

**O problema é no template do Supabase** que está usando `{{ .SiteURL }}` ou tem `0.0.0.0` hardcoded.

**A solução é corrigir o template no Supabase Dashboard.**

---

## 🧪 TESTE APÓS CORRIGIR

1. Copie o template correto (`TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`)
2. Cole no Supabase
3. Salve
4. Aguarde 2-3 minutos
5. Crie conta nova
6. Verifique o link no email
7. Deve funcionar! ✅
