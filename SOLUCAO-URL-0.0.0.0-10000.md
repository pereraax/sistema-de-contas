# 🔧 Solução: Link Redirecionando para 0.0.0.0:10000

## ❌ Problema

O link de confirmação de email está redirecionando para `https://0.0.0.0:10000/login` ao invés de `https://plenipay.com/auth/callback`.

Isso acontece porque o **Supabase usa a Site URL configurada no Dashboard** ao gerar links de confirmação, mesmo que você passe `emailRedirectTo` no código.

## ✅ Solução PRINCIPAL (Recomendada)

### 1. Corrigir Site URL no Supabase Dashboard

**PASSO A PASSO:**

1. Acesse: https://app.supabase.com → Seu projeto
2. Vá em: **Authentication** → **URL Configuration**
3. **Altere a "Site URL"** para:
   ```
   https://plenipay.com
   ```
4. **Adicione nas "Redirect URLs":**
   ```
   https://plenipay.com/auth/callback
   https://plenipay.com/**
   ```
5. **Clique em "Save"**

**⚠️ IMPORTANTE:** A Site URL deve ser `https://plenipay.com`, NÃO `http://0.0.0.0:10000` ou qualquer outra URL.

### 2. Verificar Email Confirmation Type

Na mesma página:
- ✅ **"Email confirmation type"** deve estar como **"Email Link"** (não "OTP")

---

## 🔧 Solução ALTERNATIVA (Implementada no Código)

Se você não conseguir alterar a Site URL no dashboard, implementei uma solução no código que:

1. **Gera o link manualmente** via Admin API
2. **Extrai o token_hash** do link gerado
3. **Reconstrói o link** com a URL correta (`https://plenipay.com`)
4. **Envia via SMTP próprio** (se configurado) com o link corrigido

**Isso já está implementado em:**
- `app/api/auth/enviar-link-confirmacao/route.ts`

**Para funcionar, você precisa:**
- ✅ Ter SMTP próprio configurado (`lib/mailer.ts`)
- ✅ Ter o template `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` disponível

---

## 📋 Checklist de Verificação

Após corrigir a Site URL, verifique:

- [ ] **Site URL** no Supabase Dashboard = `https://plenipay.com`
- [ ] **Redirect URLs** incluem `https://plenipay.com/auth/callback`
- [ ] **Email confirmation type** = "Email Link"
- [ ] Criar uma nova conta e verificar o link no email
- [ ] Link deve apontar para `https://plenipay.com/auth/callback` (não `0.0.0.0:10000`)

---

## 🧪 Como Testar

1. **Criar uma nova conta:**
   - Preencha o formulário de cadastro
   - Clique em "Criar Conta"

2. **Verificar o email:**
   - Abra a caixa de entrada
   - Procure o email de confirmação
   - **Verifique o link** - deve começar com `https://plenipay.com/auth/callback`
   - **NÃO deve** começar com `https://0.0.0.0:10000`

3. **Clicar no link:**
   - Deve abrir a página correta
   - Deve redirecionar para `/home` ou `/login` corretamente

---

## ⚠️ Por que isso acontece?

O Supabase tem um comportamento onde:
- Se a **Site URL** no dashboard estiver incorreta, os links gerados usarão essa URL
- Mesmo que você passe `emailRedirectTo: 'https://plenipay.com/auth/callback'` no código
- O Supabase pode usar a Site URL do dashboard como base

**Por isso é CRÍTICO** manter a Site URL correta no dashboard.

---

## 📚 Referências

- [Supabase URL Configuration Docs](https://supabase.com/docs/guides/auth/auth-redirect-urls)
- Arquivo modificado: `app/api/auth/enviar-link-confirmacao/route.ts` (implementação alternativa)
- Template usado: `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`

---

**Ação imediata:** Corrigir a Site URL no Supabase Dashboard para `https://plenipay.com` é a solução mais simples e direta!
