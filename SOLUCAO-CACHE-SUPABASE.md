# 🔧 SOLUÇÃO: Supabase usando cache após mudar Site URL

## ⚠️ PROBLEMA

Você mudou a Site URL no Supabase Dashboard para `https://plenipay.com`, mas o Supabase **ainda está gerando links com `0.0.0.0:10000`**.

**Isso acontece porque:**
- O Supabase pode estar usando **cache** da configuração anterior
- O template de email pode estar usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`
- Pode haver múltiplas configurações conflitantes

---

## ✅ SOLUÇÕES IMPLEMENTADAS NO CÓDIGO

### **1. Correção Automática de Link** ⭐ (NOVO)

O código agora **substitui automaticamente** `0.0.0.0:10000` por `plenipay.com` no link gerado.

**O que faz:**
- Gera o link via `generateLink`
- Se o link contém `0.0.0.0:10000`, **substitui** por `plenipay.com`
- Retorna o link corrigido para uso manual

**Status:** ✅ IMPLEMENTADO

---

## 🔧 SOLUÇÕES MANUAIS NO SUPABASE

### **SOLUÇÃO 1: Limpar Cache do Supabase**

1. **Acesse:** Authentication → URL Configuration
2. **APAGUE** a Site URL (deixe vazio)
3. **SALVE**
4. **Aguarde 5-10 minutos**
5. **COLOQUE** `https://plenipay.com` (sem barra final)
6. **SALVE**
7. **Aguarde mais 5-10 minutos**

**Por que funciona:**
- Força o Supabase a limpar o cache
- Aguardar permite que o Supabase processe a mudança

---

### **SOLUÇÃO 2: Verificar Template de Email (CRÍTICO)**

O template de email pode estar usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`.

1. **Acesse:** Authentication → Email Templates → **"Confirm signup"**
2. **Clique na aba "Source"** (código HTML)
3. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve ter)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (remove se encontrar)

**Se encontrar `{{ .SiteURL }}`:**
1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO** o conteúdo
3. Cole no campo "Source" do template
4. **SALVE**

**Por que é crítico:**
- Se o template usa `{{ .SiteURL }}`, ele sempre usará a Site URL do dashboard
- Mesmo que você mude a Site URL, se o template usa `{{ .SiteURL }}`, o link será gerado com a Site URL
- `{{ .ConfirmationURL }}` usa o `redirect_to` do link, não a Site URL

---

### **SOLUÇÃO 3: Verificar Redirect URLs**

Na mesma página (URL Configuration), verifique as **Redirect URLs**:

- ✅ Deve ter: `https://plenipay.com/**`
- ✅ Deve ter: `https://plenipay.com/auth/callback`
- ❌ **NÃO** deve ter: `http://0.0.0.0:10000/**` ou `https://0.0.0.0:10000/**`

**Se encontrar URLs com `0.0.0.0:10000`:**
1. **REMOVA** essas URLs
2. **SALVE**

---

### **SOLUÇÃO 4: Reiniciar Projeto Supabase (Último Recurso)**

Se nada funcionar, você pode tentar reiniciar o projeto:

1. **Acesse:** Project Settings → General
2. **Procure por opção de "Restart" ou "Refresh"**
3. **OU** aguarde 30-60 minutos para o cache expirar naturalmente

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO

### **Método 1: Verificar Logs do Servidor**

Quando você tentar criar uma conta, procure nos logs por:

```
📧 Link gerado via Admin API: ...
```

**Se o link contém `plenipay.com`:** ✅ Está correto
**Se o link contém `0.0.0.0:10000`:** ❌ Site URL ainda está incorreta ou template está usando `{{ .SiteURL }}`

### **Método 2: Verificar Template de Email**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"** → **"Source"**
2. **PROCURE POR:** `{{ .SiteURL }}`
3. **Se encontrar:** ❌ Este é o problema! Substitua por `{{ .ConfirmationURL }}`

### **Método 3: Testar Manualmente no Supabase**

1. **Acesse:** Authentication → Users
2. **Selecione um usuário**
3. **Clique em "Send password recovery"** (ou qualquer opção que envie email)
4. **Verifique o email** - veja qual URL está no link
5. **Se tiver `0.0.0.0:10000`:** Site URL ou template está incorreto

---

## ✅ CHECKLIST COMPLETO

Antes de testar, verifique:

- [ ] Site URL no Supabase = `https://plenipay.com` (sem barra final)
- [ ] Template de email usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Redirect URLs **NÃO** incluem `0.0.0.0:10000`
- [ ] Aguardou 5-10 minutos após salvar Site URL
- [ ] Aguardou 5-10 minutos após salvar template
- [ ] Criou uma NOVA conta para testar (não use link antigo)
- [ ] Verificou logs do servidor para ver qual URL está sendo gerada

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Limpe o cache do navegador**
2. **Aguarde mais tempo** (30-60 minutos) após salvar
3. **Tente apagar e recolocar** a Site URL:
   - Apague a Site URL (deixe vazio)
   - SALVE
   - Aguarde 10 minutos
   - Coloque `https://plenipay.com`
   - SALVE
   - Aguarde mais 10 minutos
4. **Verifique o template de email** - este é o problema mais comum
5. **Teste manualmente no Supabase** para ver qual URL está sendo gerada
6. **Contate o suporte do Supabase** se o problema persistir

---

## 📝 RESUMO

**O código agora:**
- ✅ Substitui automaticamente `0.0.0.0:10000` por `plenipay.com` no link gerado
- ✅ Retorna o link corrigido para uso manual se necessário

**Mas a solução definitiva é:**
- ⚠️ **Corrigir Site URL no Supabase Dashboard** (aguardar 5-10 minutos após salvar)
- ⚠️ **Verificar template de email** (deve usar `{{ .ConfirmationURL }}`, não `{{ .SiteURL }}`)

**O problema mais comum é o template de email usando `{{ .SiteURL }}` em vez de `{{ .ConfirmationURL }}`.**
