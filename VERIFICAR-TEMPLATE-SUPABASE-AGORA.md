# ⚠️ VERIFICAR TEMPLATE NO SUPABASE - PODE SER O PROBLEMA!

## 🎯 SIM, O PROBLEMA PODE ESTAR NO TEMPLATE!

Se o template no Supabase estiver usando `{{ .SiteURL }}` ao invés de `{{ .ConfirmationURL }}`, **ele vai usar a Site URL do dashboard** (que pode estar com `0.0.0.0:10000` em cache).

---

## 🔍 COMO VERIFICAR O TEMPLATE NO SUPABASE

### **PASSO 1: Acessar o Template**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Authentication → Email Templates
3. **Clique em:** "Confirm signup"
4. **Clique na aba:** "Source" (código HTML)

---

### **PASSO 2: Buscar no Código**

**Pressione:** `Ctrl+F` (ou `Cmd+F` no Mac) e busque:

#### ❌ **ERRADO - REMOVER SE ENCONTRAR:**
```
{{ .SiteURL }}
```

**Se encontrar isso:** ❌ **ESTE É O PROBLEMA!**
- O template está usando a Site URL do dashboard
- Se a Site URL estiver como `0.0.0.0:10000`, o link terá essa URL

#### ✅ **CORRETO - DEVE TER:**
```
{{ .ConfirmationURL }}
```

**Se encontrar isso:** ✅ O template está correto
- Esta variável usa o `redirect_to` que passamos no código
- Respeita o `emailRedirectTo` do código

---

## 🔧 COMO CORRIGIR SE ESTIVER ERRADO

### **SE ENCONTROU `{{ .SiteURL }}`:**

1. **Abra o arquivo:** `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no seu projeto
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **No Supabase:**
   - Selecione TODO o código atual (Ctrl+A)
   - Cole o novo template (Ctrl+V)
4. **SALVE** o template

**O template correto usa:**
- ✅ `{{ .ConfirmationURL }}` (3 vezes no código)
- ❌ NÃO tem `{{ .SiteURL }}`

---

## 🔍 DIFERENÇA ENTRE AS VARIÁVEIS

### **`{{ .SiteURL }}`** ❌ PROBLEMA

**O que faz:**
- Usa **apenas** a Site URL configurada no dashboard
- **IGNORA** o `emailRedirectTo` que passamos no código
- Se a Site URL estiver como `0.0.0.0:10000` (em cache), o link terá essa URL

**Exemplo de código ERRADO:**
```html
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}">
  Confirmar Email
</a>
```
❌ Isso vai gerar: `http://0.0.0.0:10000/auth/callback?token=...`

---

### **`{{ .ConfirmationURL }}`** ✅ CORRETO

**O que faz:**
- Usa o **`redirect_to`** que passamos no código (`emailRedirectTo`)
- **RESPEITA** o `emailRedirectTo: 'https://plenipay.com/auth/callback?next=/home'`
- Mesmo que a Site URL esteja errada, o link será correto

**Exemplo de código CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">
  Confirmar Email
</a>
```
✅ Isso vai gerar: `https://plenipay.com/auth/callback?token_hash=...&next=/home`

---

## 📋 CHECKLIST COMPLETO

- [ ] Acessei Authentication → Email Templates → "Confirm signup" → "Source"
- [ ] Busquei por `{{ .SiteURL }}` - **NÃO deve ter** ❌
- [ ] Busquei por `{{ .ConfirmationURL }}` - **DEVE ter** ✅
- [ ] Se encontrei `{{ .SiteURL }}`, copiei o template correto do projeto
- [ ] Salvei o template no Supabase

---

## 🧪 TESTE APÓS CORRIGIR

1. **Aguarde 1-2 minutos** após salvar
2. **Crie uma NOVA conta de teste**
3. **Verifique o email recebido**
4. **O link deve começar com:** `https://plenipay.com/auth/callback`
5. **NÃO deve ter:** `0.0.0.0:10000` ou `localhost`

---

## 💡 POR QUE ISSO ACONTECE?

Mesmo que você mude a Site URL no dashboard, se o template usar `{{ .SiteURL }}`:
- O Supabase **usa a Site URL** (pode estar em cache)
- **Ignora** o `emailRedirectTo` do código
- Resultado: link errado (`0.0.0.0:10000`)

Com `{{ .ConfirmationURL }}`:
- O Supabase **usa o `redirect_to`** que passamos
- **Respeita** o `emailRedirectTo` do código
- Resultado: link correto (`https://plenipay.com`)

---

**VERIFIQUE O TEMPLATE AGORA! Provavelmente está usando `{{ .SiteURL }}` e isso explica o problema.**
