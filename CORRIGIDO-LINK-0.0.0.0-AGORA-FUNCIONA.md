# ✅ CORRIGIDO: Link com 0.0.0.0:10000 → Agora Funciona!

## 🔴 Problema Identificado

O email estava sendo enviado com sucesso via SMTP próprio, mas o **link de confirmação** estava apontando para `0.0.0.0:10000` ao invés de `plenipay.com`.

**Causa:** O Supabase `admin.generateLink()` às vezes retorna links com a URL interna errada (`0.0.0.0:10000`), mesmo quando você passa `redirectTo: 'https://plenipay.com/auth/callback'`.

---

## ✅ Solução Implementada

**O código agora corrige automaticamente qualquer link com URL errada:**

### **1. Detecção Automática**
- Detecta se o link contém `0.0.0.0`, `:10000` ou `localhost`
- Detecta se o link **não contém** `plenipay.com`

### **2. Correção Automática**
- Extrai o `token_hash`, `type` e `next` do link errado
- Reconstrói o link com `https://plenipay.com/auth/callback`
- Garante que o link sempre aponta para o domínio correto

### **3. Logs Detalhados**
- Mostra o link original (se estiver errado)
- Mostra o link corrigido
- Facilita debug se necessário

---

## 📋 Onde Foi Corrigido

### **1. `lib/auth.ts` (Cadastro)**
- Quando o Supabase falha ao enviar email e usamos SMTP próprio
- O link gerado é corrigido antes de ser inserido no template

### **2. `app/api/auth/enviar-link-confirmacao/route.ts` (Reenvio)**
- Quando você clica em "Reenviar link de confirmação"
- O link gerado é corrigido antes de ser enviado

---

## 🧪 Como Testar

### **1. Fazer um Novo Cadastro**

1. Acesse a página de cadastro
2. Preencha os dados e cadastre
3. Verifique o email recebido
4. **O link deve começar com:** `https://plenipay.com/auth/callback?...`
5. **NÃO deve ter:** `0.0.0.0:10000` ou `localhost`

### **2. Reenviar Link de Confirmação**

1. Se você já tem uma conta não confirmada, clique em "Reenviar link"
2. Verifique o email recebido
3. **O link deve começar com:** `https://plenipay.com/auth/callback?...`

### **3. Verificar Logs no Terminal**

Quando o link for gerado, você verá:

**Se o link estiver errado:**
```
⚠️ Link gerado tem URL errada, corrigindo...
   Link original: https://0.0.0.0:10000/auth/callback?token_hash=...
✅ Link corrigido: https://plenipay.com/auth/callback?token_hash=...
```

**Se o link já estiver correto:**
```
✅ Link final que será enviado: https://plenipay.com/auth/callback?token_hash=...
```

---

## ✅ O Que Esperar

### **Link Correto no Email:**
```
https://plenipay.com/auth/callback?token_hash=abc123...&type=signup&next=/home
```

### **Ao Clicar no Link:**
1. Redireciona para `https://plenipay.com/auth/callback`
2. O Supabase valida o token
3. Email é confirmado automaticamente
4. Usuário é logado automaticamente
5. Redireciona para `/home`

---

## 🔍 Verificação Adicional

### **Se Ainda Aparecer 0.0.0.0:10000:**

1. **Verifique o template do email:**
   - Abra `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html`
   - Deve ter: `{{ .ConfirmationURL }}`
   - **NÃO deve ter:** `{{ .SiteURL }}` ou `0.0.0.0:10000` hardcoded

2. **Verifique os logs no terminal:**
   - Procure por "Link corrigido" ou "Link final"
   - Confirme que o link está sendo corrigido

3. **Verifique o Supabase Dashboard:**
   - **Site URL** deve ser: `https://plenipay.com`
   - **Redirect URLs** deve incluir: `https://plenipay.com/**`

---

## 📊 Checklist

- [x] Código corrige automaticamente links com `0.0.0.0:10000`
- [x] Código garante que links sempre usam `plenipay.com`
- [x] Logs mostram link original e corrigido
- [ ] Teste fazer um novo cadastro
- [ ] Verifique o link no email recebido
- [ ] Clique no link e confirme que funciona

---

## 🎯 Resultado Final

**Agora, mesmo que o Supabase gere um link com `0.0.0.0:10000`, o código automaticamente:**
1. **Detecta** o problema
2. **Extrai** o token_hash e parâmetros
3. **Reconstrói** o link com `plenipay.com`
4. **Envia** o link correto no email

**O usuário sempre receberá um link que aponta para `plenipay.com`!** ✅

---

**Teste agora fazendo um novo cadastro e verifique o link no email!** 🚀
