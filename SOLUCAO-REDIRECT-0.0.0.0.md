# 🔧 SOLUÇÃO: Redirect para 0.0.0.0:10000

## ⚠️ PROBLEMA

O link de confirmação no email está **CORRETO** (`redirect_to=https://plenipay.com/auth/callback`), mas quando o usuário clica, o Supabase redireciona para `0.0.0.0:10000` em vez de usar o `redirect_to` do link.

**Isso acontece porque:**
- O Supabase **ignora** o `redirect_to` do link quando faz o redirect final
- Usa a **Site URL** do dashboard para fazer o redirect
- Se a Site URL estiver como `0.0.0.0:10000`, o redirect será para essa URL

---

## ✅ SOLUÇÃO IMPLEMENTADA NO CÓDIGO

O callback handler (`app/auth/callback/route.ts`) já detecta e corrige isso:

1. **Detecta** se a URL contém `0.0.0.0:10000`
2. **Redireciona imediatamente** para `https://plenipay.com/auth/callback` preservando todos os parâmetros
3. **Processa** a confirmação de email na URL correta

**Mas isso só funciona se o callback handler for executado.** Se o Supabase redirecionar para `0.0.0.0:10000` e o navegador não conseguir acessar essa URL, o callback não será executado.

---

## 🔧 SOLUÇÃO DEFINITIVA: CORRIGIR SITE URL NO SUPABASE

A solução definitiva é garantir que a **Site URL** no Supabase Dashboard esteja correta:

### **PASSO 1: Acessar Supabase Dashboard**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** → **URL Configuration**

**Link direto:** `https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration`

### **PASSO 2: Corrigir Site URL**

1. **Encontre o campo "Site URL"**
2. **Verifique o valor atual:**
   - ❌ Se estiver como `0.0.0.0:10000` → **MUDE**
   - ❌ Se estiver vazio → **COLOQUE**
   - ✅ Deve ser: `https://plenipay.com` (sem barra final)

3. **IMPORTANTE:**
   - ✅ Use `https://plenipay.com` (sem barra final)
   - ❌ NÃO use `https://plenipay.com/`
   - ❌ NÃO use `http://plenipay.com` (deve ser HTTPS)
   - ❌ NÃO use `0.0.0.0:10000`

4. **SALVE** as alterações

### **PASSO 3: Aguardar e Testar**

1. **Aguarde 2-3 minutos** após salvar (Supabase precisa processar)
2. **Crie uma NOVA conta** para testar (não use link antigo)
3. **Verifique o email** de confirmação
4. **Clique no link** - deve redirecionar para `https://plenipay.com` (não `0.0.0.0:10000`)

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO

### **Método 1: Verificar no Email**

1. Abra o email de confirmação
2. Veja o link completo (não clique ainda)
3. O link deve ter: `redirect_to=https%3A%2F%2Fplenipay.com%2Fauth%2Fcallback`
4. **Mas o problema é:** Mesmo com `redirect_to` correto, o Supabase pode redirecionar para Site URL

### **Método 2: Verificar Logs do Servidor**

Quando você clicar no link, procure nos logs por:
```
❌ [Callback] URL INVÁLIDA DETECTADA: 0.0.0.0:10000
🔄 [Callback] Redirecionando para: https://plenipay.com/auth/callback...
```

Se você ver isso, significa que:
- ✅ O callback detectou o problema
- ✅ Está redirecionando para a URL correta
- ⚠️ Mas a Site URL no Supabase ainda está incorreta

### **Método 3: Verificar Site URL no Dashboard**

1. Acesse: **Authentication** → **URL Configuration**
2. Verifique o campo **"Site URL"**
3. Deve ser exatamente: `https://plenipay.com` (sem barra final)

---

## 🐛 POR QUE ISSO ACONTECE?

O Supabase tem um comportamento onde:
1. Gera o link com `redirect_to` correto (baseado no que passamos no código)
2. **Mas quando processa o link**, usa a **Site URL** do dashboard para fazer o redirect final
3. Se a Site URL estiver incorreta, o redirect será para a URL incorreta

**Isso é um bug/limitação do Supabase** - ele não respeita completamente o `redirect_to` do link quando faz o redirect final.

---

## ✅ CHECKLIST FINAL

Antes de testar, verifique:

- [ ] Site URL no Supabase = `https://plenipay.com` (sem barra final)
- [ ] Redirect URLs incluem `https://plenipay.com/**`
- [ ] Aguardou 2-3 minutos após salvar
- [ ] Criou uma NOVA conta para testar (não use link antigo)
- [ ] Verificou logs do servidor para ver se callback detectou problema

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Limpe o cache do navegador**
2. **Aguarde mais tempo** (5-10 minutos) após salvar
3. **Tente apagar e recolocar** a Site URL:
   - Apague a Site URL (deixe vazio)
   - SALVE
   - Aguarde 1 minuto
   - Coloque `https://plenipay.com`
   - SALVE
4. **Verifique os logs do servidor** para ver se o callback está sendo executado
5. **Teste manualmente no Supabase:**
   - Authentication → Users → Selecione usuário
   - Clique em "Send password recovery"
   - Veja qual URL é gerada no email

---

## 📝 RESUMO

- ✅ O código está **CORRETO** e detecta o problema
- ❌ O Supabase usa **Site URL** do dashboard para redirect final (não `redirect_to`)
- 🔧 **Solução:** Configurar Site URL corretamente no Supabase Dashboard
- 🛡️ **Proteção:** O callback handler detecta e corrige, mas a solução definitiva é corrigir a Site URL

**O problema NÃO está no código, está na configuração do Supabase Dashboard. O código detecta e corrige, mas a solução definitiva é garantir que a Site URL esteja correta.**
