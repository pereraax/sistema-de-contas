# 🔧 SOLUÇÃO DEFINITIVA: Link com 0.0.0.0:10000

## ❌ Problema

Mesmo com a **Site URL** configurada corretamente como `https://plenipay.com` no Supabase Dashboard, o link de confirmação ainda está redirecionando para `https://0.0.0.0:10000`.

## 🔍 Causa Raiz

O problema pode estar em **3 lugares**:

### 1. **Template de Email do Supabase** (MAIS COMUM)
- O template pode estar usando `{{ .SiteURL }}` ao invés de `{{ .ConfirmationURL }}`
- `{{ .SiteURL }}` sempre usa a Site URL do dashboard (mesmo que esteja correta, pode ter cache)
- `{{ .ConfirmationURL }}` já contém a URL completa com redirect_to correta

### 2. **Cache do Supabase**
- O Supabase pode estar usando cache da configuração antiga
- Mesmo mudando a Site URL, pode levar alguns minutos para atualizar

### 3. **Bug do Supabase**
- Há um bug conhecido onde `resend()` às vezes ignora `emailRedirectTo`
- E usa apenas a Site URL do dashboard

---

## ✅ SOLUÇÃO IMPLEMENTADA NO CÓDIGO

### Correção Automática no Callback ✅

O callback route agora **intercepta e corrige automaticamente** qualquer URL com `0.0.0.0:10000`:

```typescript
// Se detectar 0.0.0.0:10000, extrai parâmetros e reconstrói com domínio correto
if (requestUrlString.includes('0.0.0.0') || requestUrlString.includes(':10000')) {
  // Extrai pathname + search (parâmetros)
  // Reconstrói com https://plenipay.com
  // Redireciona corretamente
}
```

**Status:** ✅ **IMPLEMENTADO** em `app/auth/callback/route.ts`

---

## 🔧 AÇÕES NECESSÁRIAS NO SUPABASE

### **AÇÃO 1: Verificar Template de Email (CRÍTICO)** ⭐

1. **Acesse:** https://app.supabase.com → Seu projeto
2. **Vá em:** Authentication → Email Templates
3. **Clique em:** "Confirm signup"
4. **Clique na aba:** "Source" (código HTML)
5. **PROCURE POR:**
   - ✅ `{{ .ConfirmationURL }}` = **CORRETO** (deve estar assim)
   - ❌ `{{ .SiteURL }}` = **ERRADO** (se encontrar, remova)

**Se encontrar `{{ .SiteURL }}`:**

1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. **Copie TODO o conteúdo**
3. **Cole** no campo "Source" do template no Supabase
4. **Verifique** que tem `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
5. **SALVE**

**Por que é crítico:**
- Se o template usa `{{ .SiteURL }}`, ele sempre usará a Site URL do dashboard
- Mesmo que a Site URL esteja correta, pode ter cache antigo
- `{{ .ConfirmationURL }}` já contém a URL completa correta

---

### **AÇÃO 2: Limpar Cache do Supabase**

Se mesmo com o template correto ainda não funcionar:

1. **Acesse:** Authentication → URL Configuration
2. **APAGUE** a Site URL (deixe completamente vazio)
3. **SALVE**
4. **Aguarde 5-10 minutos**
5. **COLOQUE** `https://plenipay.com` (sem barra final, sem espaços)
6. **SALVE**
7. **Aguarde mais 5-10 minutos**

---

### **AÇÃO 3: Verificar Variáveis de Ambiente**

Verifique se não há variáveis de ambiente conflitantes:

```bash
# Verificar se há algo com 0.0.0.0:10000
echo $NEXT_PUBLIC_SITE_URL
echo $SUPABASE_URL
```

Se encontrar `0.0.0.0:10000`, remova ou corrija.

---

## 🧪 Como Testar

### Teste 1: Verificar o Link no Email

1. **Criar uma nova conta**
2. **Abrir o email de confirmação**
3. **Verificar o link:**
   - ✅ Deve começar com `https://plenipay.com/auth/callback`
   - ❌ NÃO deve começar com `https://0.0.0.0:10000`

### Teste 2: Clicar no Link

1. **Mesmo que o link tenha `0.0.0.0:10000`**
2. **O callback deve interceptar e corrigir automaticamente**
3. **Deve redirecionar para `https://plenipay.com/auth/callback`**
4. **E processar a confirmação corretamente**

---

## 📋 Checklist Final

- [ ] **Template de email** usa `{{ .ConfirmationURL }}` (não `{{ .SiteURL }}`)
- [ ] **Site URL** no Supabase Dashboard = `https://plenipay.com`
- [ ] **Redirect URLs** incluem `https://plenipay.com/auth/callback`
- [ ] **Email confirmation type** = "Email Link"
- [ ] **Testou criar conta** e verificar link no email
- [ ] **Link no email** começa com `https://plenipay.com` (não `0.0.0.0:10000`)

---

## 💡 Solução Temporária (Já Implementada)

Mesmo que o link venha com `0.0.0.0:10000`, o **callback route agora intercepta e corrige automaticamente**:

1. **Detecta** se a URL contém `0.0.0.0:10000`
2. **Extrai** os parâmetros (token_hash, type, next)
3. **Reconstrói** a URL com `https://plenipay.com`
4. **Redireciona** corretamente

**Mas a solução definitiva ainda é corrigir o template de email no Supabase!**

---

## 🎯 Próximos Passos

1. **Verificar template de email** no Supabase (AÇÃO 1 acima)
2. **Se não funcionar**, limpar cache (AÇÃO 2)
3. **Testar** criando nova conta
4. **Verificar** se link no email está correto

**O código já tem proteção contra `0.0.0.0:10000`, mas corrigir o template resolve o problema na origem!**
