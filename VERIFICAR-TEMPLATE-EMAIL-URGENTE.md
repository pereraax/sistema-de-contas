# ⚠️ URGENTE: Verificar Template de Email no Supabase

## 🎯 PROBLEMA MAIS COMUM

Mesmo mudando a Site URL para `https://plenipay.com`, o Supabase ainda gera links com `0.0.0.0:10000`.

**A causa mais provável é:** O template de email está usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`.

---

## 🔍 COMO VERIFICAR

### **PASSO 1: Acessar Template de Email**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** → **Email Templates** → **"Confirm signup"**
4. Clique na aba **"Source"** (código HTML)

**Link direto:** `https://app.supabase.com/project/[SEU-PROJETO]/auth/templates`

---

### **PASSO 2: Verificar Variáveis Usadas**

**PROCURE POR no código HTML:**

#### ❌ **ERRADO - NÃO DEVE TER:**
```html
{{ .SiteURL }}
```
**Se encontrar isso:** ❌ Este é o problema! O template está usando a Site URL do dashboard.

#### ✅ **CORRETO - DEVE TER:**
```html
{{ .ConfirmationURL }}
```
**Se encontrar isso:** ✅ O template está correto.

---

### **PASSO 3: Corrigir Template**

**Se encontrar `{{ .SiteURL }}`:**

1. **Abra o arquivo** `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no campo "Source"** do template no Supabase
4. **SALVE**

**O template correto usa:**
- ✅ `{{ .ConfirmationURL }}` - Esta variável usa o `redirect_to` do link, não a Site URL
- ❌ `{{ .SiteURL }}` - Esta variável sempre usa a Site URL do dashboard

---

## 🔍 DIFERENÇA ENTRE AS VARIÁVEIS

### **`{{ .SiteURL }}`** ❌
- Sempre usa a **Site URL** configurada no dashboard
- **Ignora** o `redirect_to` que passamos no código
- Se a Site URL estiver como `0.0.0.0:10000`, o link terá essa URL

### **`{{ .ConfirmationURL }}`** ✅
- Usa o **`redirect_to`** que passamos no código
- **Respeita** o `emailRedirectTo` que enviamos
- Se passarmos `https://plenipay.com/auth/callback`, o link terá essa URL

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Acessei Authentication → Email Templates → "Confirm signup" → "Source"
- [ ] Procurei por `{{ .SiteURL }}` - **NÃO deve ter**
- [ ] Procurei por `{{ .ConfirmationURL }}` - **DEVE ter**
- [ ] Se encontrei `{{ .SiteURL }}`, copiei o template correto do arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
- [ ] Colei o template correto no Supabase
- [ ] SALVEI as alterações
- [ ] Aguardei 2-3 minutos
- [ ] Criei uma NOVA conta para testar

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique se salvou o template** - às vezes o Supabase não salva imediatamente
2. **Aguarde mais tempo** (5-10 minutos) após salvar
3. **Limpe o cache do navegador**
4. **Verifique se o template está realmente salvo:**
   - Volte para Authentication → Email Templates → "Confirm signup" → "Source"
   - Verifique se o conteúdo que você colou ainda está lá
5. **Teste manualmente no Supabase:**
   - Authentication → Users → Selecione usuário
   - Clique em "Send password recovery"
   - Veja qual URL está no email

---

## 📝 RESUMO

**O problema mais comum é:**
- ❌ Template usando `{{ .SiteURL }}` → Sempre usa Site URL do dashboard
- ✅ Template usando `{{ .ConfirmationURL }}` → Usa `redirect_to` do código

**Solução:**
1. Verifique o template no Supabase Dashboard
2. Se encontrar `{{ .SiteURL }}`, substitua pelo template correto
3. Use o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` como referência

**Este é o problema mais comum e a causa raiz do redirect para `0.0.0.0:10000`.**
