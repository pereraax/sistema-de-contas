# 🔧 SOLUÇÃO FINAL: Verificar Template no Supabase

## ❌ PROBLEMA

Mesmo que o template local esteja correto (`{{ .ConfirmationURL }}`), o template **no Supabase** pode estar diferente, causando o erro `0.0.0.0:10000`.

---

## 🔍 VERIFICAÇÃO CRÍTICA NO SUPABASE

### **PASSO 1: Acessar Template no Supabase**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Authentication → Email Templates
3. **Clique em:** "Confirm signup"
4. **Clique na aba:** "Source" (código HTML)

---

### **PASSO 2: Buscar no Código HTML**

**No campo "Source", pressione `Ctrl+F` (ou `Cmd+F`) e busque:**

#### ❌ **BUSQUE POR (ERRO):**
```
{{ .SiteURL }}
```

**Se encontrar:** ❌ **ESTE É O PROBLEMA!**
- O template no Supabase está usando a Site URL
- Mesmo que você mude a Site URL, se estiver em cache, terá `0.0.0.0:10000`

#### ✅ **BUSQUE POR (CORRETO):**
```
{{ .ConfirmationURL }}
```

**Deve aparecer pelo menos 2-3 vezes:**
- Uma vez no botão: `<a href="{{ .ConfirmationURL }}">`
- Uma vez no link alternativo

---

### **PASSO 3: Se Encontrar `{{ .SiteURL }}`**

**CORREÇÃO:**

1. **No seu projeto, abra:** `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **No Supabase, no campo "Source":**
   - Selecione TODO (Ctrl+A)
   - Cole o novo conteúdo (Ctrl+V)
4. **VERIFIQUE** que aparecem 3 ocorrências de `{{ .ConfirmationURL }}`
5. **SALVE** o template

---

## 🎯 DIFERENÇA CRÍTICA

### **`{{ .SiteURL }}`** ❌
```html
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}">
```
- Usa apenas Site URL do dashboard
- Pode estar em cache como `0.0.0.0:10000`
- **Resultado:** Link errado

### **`{{ .ConfirmationURL }}`** ✅
```html
<a href="{{ .ConfirmationURL }}">
```
- Usa o `redirect_to` que passamos no código
- Respeita `emailRedirectTo: 'https://plenipay.com/auth/callback'`
- **Resultado:** Link correto

---

## 📋 CHECKLIST FINAL

- [ ] Acessei Authentication → Email Templates → "Confirm signup" → "Source"
- [ ] Busquei por `{{ .SiteURL }}` - **NÃO deve ter** ❌
- [ ] Busquei por `{{ .ConfirmationURL }}` - **DEVE ter 2-3 vezes** ✅
- [ ] Se encontrei `{{ .SiteURL }}`, copiei o template correto do projeto
- [ ] Salvei o template no Supabase
- [ ] Aguardei 1-2 minutos

---

## 🧪 TESTE APÓS CORRIGIR

1. **Crie uma NOVA conta de teste**
2. **Verifique o email recebido**
3. **O link deve começar com:** `https://plenipay.com/auth/callback`
4. **NÃO deve ter:** `0.0.0.0:10000`

---

## ⚠️ IMPORTANTE

**O template no Supabase PODE estar diferente do template local!**

Mesmo que você tenha o arquivo correto no projeto, o Supabase pode estar usando uma versão antiga ou diferente. **SEMPRE verifique o template no Supabase diretamente!**

---

**FAÇA ESSA VERIFICAÇÃO AGORA - É A CAUSA MAIS PROVÁVEL DO PROBLEMA!**
