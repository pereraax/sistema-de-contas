# 🔧 SOLUÇÃO: URL do Email Sempre Vai Errada

## ❌ PROBLEMA

Mesmo que o Site URL no Supabase esteja configurado como `https://plenipay.com`, a URL do email de confirmação está vindo errada (ex: `0.0.0.0:10000` ou `localhost`).

## 🔍 CAUSA RAIZ

O Supabase constrói o link de confirmação usando **uma combinação** de:
1. **Site URL** (configurado no Dashboard)
2. **emailRedirectTo** (passado no código)
3. **Template de Email** (como a URL é construída no template)

### Problemas Comuns:

1. **Template usando `{{ .SiteURL }}` ao invés de `{{ .ConfirmationURL }}`**
   - `{{ .SiteURL }}` = apenas o domínio base
   - `{{ .ConfirmationURL }}` = URL completa com token e redirect

2. **Site URL não está nas Redirect URLs permitidas**
   - Se `https://plenipay.com/**` não estiver na lista, pode usar URL padrão

3. **Cache do Supabase**
   - Às vezes o Supabase mantém cache da URL antiga

## ✅ SOLUÇÕES

### **1. VERIFICAR TEMPLATE DE EMAIL**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba **"Source"** (código HTML)
3. **VERIFIQUE:**
   - ✅ Deve usar: `{{ .ConfirmationURL }}`
   - ❌ NÃO deve usar: `{{ .SiteURL }}` sozinho
   - ❌ NÃO deve ter URLs hardcoded como `0.0.0.0:10000`

**Exemplo CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

**Exemplo ERRADO:**
```html
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}">Confirmar Email</a>
```

---

### **2. VERIFICAR REDIRECT URLs**

1. Acesse: **Authentication** → **URL Configuration**
2. Verifique **"Redirect URLs"**:
   - ✅ Deve incluir: `https://plenipay.com/**`
   - ✅ Deve incluir: `https://plenipay.com/auth/callback`

Se não estiver, **ADICIONE AGORA**.

---

### **3. VERIFICAR SITE URL**

1. Acesse: **Authentication** → **URL Configuration**
2. Verifique **"Site URL"**:
   - ✅ Deve ser: `https://plenipay.com`
   - ❌ NÃO pode ser: `http://localhost:3000` ou `0.0.0.0:10000`

---

### **4. CÓDIGO ESTÁ CORRETO**

O código está passando `emailRedirectTo: 'https://plenipay.com/auth/callback?next=/home'` corretamente.

**O que o Supabase faz:**
- Usa o `emailRedirectTo` para construir o link completo
- Combina com o token_hash para criar `{{ .ConfirmationURL }}`
- Se o template usar `{{ .ConfirmationURL }}`, a URL será correta

---

### **5. CORREÇÃO NO CALLBACK (JÁ IMPLEMENTADA)**

O arquivo `app/auth/callback/route.ts` já tem código para corrigir URLs incorretas:
- Detecta URLs com `0.0.0.0:10000`
- Extrai os parâmetros (token_hash, type, next)
- Reconstrói a URL com `https://plenipay.com`
- Redireciona para a URL correta

Isso garante que mesmo se o email vier com URL errada, o callback corrige automaticamente.

---

## 🧪 COMO TESTAR

### **Teste 1: Verificar Template**

1. Acesse o template de email no Supabase
2. Procure por `{{ .ConfirmationURL }}`
3. Se encontrar `{{ .SiteURL }}` sozinho, substitua por `{{ .ConfirmationURL }}`

### **Teste 2: Verificar Link no Email**

1. Crie uma conta de teste
2. Abra o email recebido
3. Verifique o link:
   - ✅ Deve começar com: `https://plenipay.com/auth/callback?...`
   - ❌ NÃO deve ter: `0.0.0.0:10000` ou `localhost`

### **Teste 3: Verificar Callback**

1. Mesmo se o link vier errado, clique nele
2. O callback deve corrigir automaticamente
3. Deve redirecionar para `https://plenipay.com/home` após confirmar

---

## 📋 CHECKLIST

Marque cada item conforme verificar:

- [ ] Template usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Site URL está como `https://plenipay.com`
- [ ] Redirect URLs inclui `https://plenipay.com/**`
- [ ] Código está passando `emailRedirectTo` corretamente
- [ ] Callback está corrigindo URLs erradas (já implementado)

---

## 🔗 LINKS ÚTEIS

- **Template de Email:** https://app.supabase.com/project/[SEU-PROJETO]/auth/templates
- **URL Configuration:** https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration

---

## 💡 IMPORTANTE

**O problema mais comum é o template usar `{{ .SiteURL }}` ao invés de `{{ .ConfirmationURL }}`.**

Use sempre `{{ .ConfirmationURL }}` no template - ele já contém a URL completa com token e redirect configurado!
