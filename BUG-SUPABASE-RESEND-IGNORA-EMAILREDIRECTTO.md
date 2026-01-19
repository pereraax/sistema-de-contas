# 🐛 BUG CONHECIDO: Supabase resend() ignora emailRedirectTo

## ⚠️ PROBLEMA IDENTIFICADO

Há um **bug conhecido no Supabase** (issue #802) onde o método `resend()` **ignora o parâmetro `emailRedirectTo`** e usa apenas a **Site URL** configurada no dashboard.

**Isso significa que:**
- Mesmo passando `emailRedirectTo: 'https://plenipay.com/auth/callback'` no código
- O Supabase **ignora** e usa a Site URL do dashboard
- Se a Site URL estiver como `0.0.0.0:10000`, o link terá essa URL

---

## 🔍 COMO VERIFICAR

O código agora gera o link primeiro via `generateLink` para verificar qual URL está sendo usada:

1. **Verifique os logs do servidor** quando solicitar reenvio de email
2. **Procure por:** `📧 Link gerado via Admin API:`
3. **Se o link contém `0.0.0.0:10000`**, o problema é a Site URL no Supabase Dashboard

---

## ✅ SOLUÇÃO DEFINITIVA

### **PASSO 1: Verificar Site URL no Supabase Dashboard**

1. Acesse: **Authentication** → **URL Configuration**
2. **VERIFIQUE a "Site URL":**
   - Deve ser **EXATAMENTE** `https://plenipay.com` (sem barra final)
   - **NÃO** pode ser `0.0.0.0:10000`
   - **NÃO** pode estar vazio

3. **Se estiver incorreta:**
   - **APAGUE** a Site URL (deixe vazio)
   - **SALVE**
   - Aguarde 30 segundos
   - **COLOQUE** `https://plenipay.com` (sem barra final)
   - **SALVE**

### **PASSO 2: Verificar Template de Email (CRÍTICO)**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba **"Source"** (código HTML)
3. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remove se encontrar)
   - ❌ `{{ .RedirectTo }}` = **PODE FUNCIONAR** (mas `{{ .ConfirmationURL }}` é melhor)

**Se encontrar `{{ .SiteURL }}`:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO** o conteúdo
3. Cole no campo "Source" do template
4. **SALVE**

### **PASSO 3: Verificar Redirect URLs**

Na mesma página (URL Configuration), verifique as **Redirect URLs**:
- ✅ Deve ter: `https://plenipay.com/**`
- ✅ Deve ter: `https://plenipay.com/auth/callback`
- ✅ Pode ter: `http://localhost:3000/**` (para desenvolvimento)

**SALVE** se fizer alterações.

---

## 🔧 O QUE O CÓDIGO ESTÁ FAZENDO

O código está **CORRETO** e fazendo:

1. ✅ Forçando `emailRedirectTo: 'https://plenipay.com/auth/callback?next=/home'`
2. ✅ Gerando link primeiro para verificar qual URL está sendo usada
3. ✅ Detectando se o link tem `0.0.0.0:10000`
4. ✅ Retornando aviso se o link tem URL incorreta

**Mas o Supabase está ignorando o `emailRedirectTo` devido ao bug conhecido.**

---

## 📝 BUG DO SUPABASE

**Issue #802:** `resend()` ignora `emailRedirectTo` e usa Site URL do dashboard

**Link:** https://github.com/supabase/supabase-js/issues/802

**Workaround:**
- Configurar Site URL corretamente no Supabase Dashboard
- Usar `{{ .ConfirmationURL }}` no template de email (não `{{ .SiteURL }}`)

---

## ✅ CHECKLIST FINAL

- [ ] Site URL no Supabase = `https://plenipay.com` (sem barra final)
- [ ] Template de email usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Aguardou 2-3 minutos após salvar
- [ ] Criou uma NOVA conta para testar (não use link antigo)
- [ ] Verificou logs do servidor para ver qual URL está sendo gerada

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique os logs do servidor:**
   - Procure por `📧 Link gerado via Admin API:`
   - Veja qual URL está sendo gerada

2. **Teste manualmente no Supabase:**
   - Authentication → Users → Selecione usuário
   - Clique em "Send password recovery"
   - Veja qual URL é gerada no email

3. **Se o link ainda tiver `0.0.0.0:10000`:**
   - O problema é definitivamente a Site URL no Supabase Dashboard
   - Tente apagar e recolocar a Site URL
   - Aguarde mais tempo (5-10 minutos)
   - Limpe cache do navegador

---

## 📝 RESUMO

- ✅ O código está **CORRETO**
- ❌ Há um **bug conhecido** no Supabase onde `resend()` ignora `emailRedirectTo`
- 🔧 **Solução:** Configurar Site URL corretamente no Supabase Dashboard
- 🔧 **Solução:** Usar `{{ .ConfirmationURL }}` no template de email

O problema **NÃO** está no código, está no **bug do Supabase** que ignora `emailRedirectTo`.
