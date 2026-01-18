# 🔧 CORRIGIR LINK APONTANDO PARA 0.0.0.0:10000

## ⚠️ PROBLEMA
O link de confirmação está apontando para `0.0.0.0:10000` em vez de `https://plenipay.com`.

## 🔍 CAUSA
O Supabase pode estar usando uma configuração interna ou o template de email pode estar usando uma variável incorreta.

## ✅ SOLUÇÃO

### **1️⃣ VERIFICAR TEMPLATE DE EMAIL NO SUPABASE**

O template de email pode estar usando uma variável incorreta ou o Supabase pode estar ignorando o `emailRedirectTo`.

**PASSO A PASSO:**

1. Acesse: **https://app.supabase.com** → Seu Projeto
2. Vá em: **Authentication** → **Email Templates**
3. Clique em: **"Confirm signup"**
4. Clique na aba: **"Source"** (código HTML)
5. **PROCURE POR:**
   - `{{ .ConfirmationURL }}` = CORRETO ✅
   - `{{ .SiteURL }}` = Pode estar errado ❌
   - Qualquer referência a `0.0.0.0` ou `10000` = ERRADO ❌

**SE O TEMPLATE ESTIVER ERRADO:**

O template deve usar `{{ .ConfirmationURL }}` que já contém a URL completa de confirmação.

**EXEMPLO CORRETO:**
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

**NÃO DEVE TER:**
```html
<a href="{{ .SiteURL }}/auth/callback">Confirmar Email</a>
```

---

### **2️⃣ VERIFICAR SITE URL NO SUPABASE**

1. Vá em: **Authentication** → **URL Configuration**
2. **VERIFIQUE:**
   - **Site URL:** Deve ser `https://plenipay.com` (sem `.br`, sem `0.0.0.0`)
   - **Redirect URLs:** Devem incluir `https://plenipay.com/**`
3. **SALVE** se fizer alterações

---

### **3️⃣ LIMPAR CACHE E TESTAR NOVAMENTE**

1. **Crie uma NOVA conta de teste** (não use link antigo)
2. **Verifique o email imediatamente**
3. **O link deve ter:** `https://plenipay.com/auth/callback...`

---

### **4️⃣ SE AINDA NÃO FUNCIONAR**

O problema pode ser que o Supabase está usando uma configuração de desenvolvimento. Tente:

1. **Verificar se há variáveis de ambiente no Supabase:**
   - Project Settings → API → Environment Variables
   - Procure por qualquer referência a `0.0.0.0` ou `10000`

2. **Verificar logs do Supabase:**
   - Authentication → Logs
   - Veja se há erros ou avisos sobre URLs

3. **Usar Admin API diretamente:**
   - O código já tenta usar `inviteUserByEmail` que força a URL correta
   - Verifique os logs do servidor para ver qual URL está sendo enviada

---

## 🆘 VERIFICAÇÃO RÁPIDA

Me diga:
1. O template de email no Supabase usa `{{ .ConfirmationURL }}`?
2. A Site URL no Supabase está como `https://plenipay.com`?
3. O que aparece nos logs do servidor quando você cria uma conta?
