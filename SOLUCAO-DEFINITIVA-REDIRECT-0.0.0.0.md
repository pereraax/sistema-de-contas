# 🔧 SOLUÇÃO DEFINITIVA: Redirect para 0.0.0.0:10000

## 🔴 Problema Persistente

O link no email está correto (`https://plenipay.com/auth/callback?token_hash=...`), mas quando o usuário clica, o navegador redireciona para `https://0.0.0.0:10000/login?error=...`.

**Testado em outro navegador e o problema persiste** → Não é cache do navegador.

---

## 🔍 Possíveis Causas

### **1. O Supabase Está Fazendo Redirect Interno**

O `verifyOtp` do Supabase pode estar fazendo um redirect interno baseado em:
- Configuração em cache no Supabase
- Cookies antigos com URL errada
- Alguma resposta que contém redirect para `0.0.0.0:10000`

### **2. O Next.js Está Usando URL Base Errada**

O Next.js pode estar usando `request.url` ou `requestUrl.origin` que pode ser `0.0.0.0:10000` se:
- O servidor está rodando em `0.0.0.0:10000`
- Há alguma variável de ambiente com URL errada
- O Next.js está inferindo a URL base incorretamente

### **3. O NextResponse.redirect Está Usando URL Relativa**

Se `NextResponse.redirect()` receber uma URL relativa, ele pode usar a URL base da requisição (que pode ser `0.0.0.0:10000`).

---

## ✅ Soluções Implementadas

### **1. Garantir URLs Absolutas**

Todos os redirects agora **sempre usam URLs absolutas completas**:

```typescript
// ANTES (pode usar URL base errada)
return NextResponse.redirect('/home', { status: 307 })

// AGORA (sempre URL absoluta)
const redirectUrl = new URL('/home', productionUrl)
const finalUrl = redirectUrl.toString() // https://plenipay.com/home
if (!finalUrl.startsWith('http')) {
  // Converter para absoluta se necessário
  const absoluteUrl = new URL(finalUrl, productionUrl).toString()
  return NextResponse.redirect(absoluteUrl, { status: 307 })
}
return NextResponse.redirect(finalUrl, { status: 307 })
```

### **2. Verificação da Resposta do verifyOtp**

O código agora verifica se a resposta do `verifyOtp` contém `0.0.0.0:10000`:

```typescript
if (data && typeof data === 'object') {
  const dataStr = JSON.stringify(data)
  if (dataStr.includes('0.0.0.0') || dataStr.includes('10000')) {
    console.error('❌ Resposta do verifyOtp contém 0.0.0.0:10000!')
  }
}
```

### **3. Logs Detalhados**

Adicionados logs para rastrear:
- URL recebida
- Host, Referer, Origin
- Resposta do verifyOtp
- URL final de redirecionamento
- Se URL é absoluta ou relativa

---

## 🧪 Como Diagnosticar

### **1. Verificar Logs no Terminal**

Quando clicar no link, veja o terminal e procure por:

```
🔍 [Callback] ========== CALLBACK INICIADO ==========
🔍 [Callback] URL recebida: https://plenipay.com/auth/callback?token_hash=...
🔍 [Callback] Host: plenipay.com
🔄 [Callback] Tentando verifyOtp com type: magiclink
🔍 [Callback] verifyOtp retornou: { hasUser: true, hasSession: true, ... }
✅ [Callback] Email confirmado com sucesso!
🔍 [Callback] URL final de redirecionamento: https://plenipay.com/home?...
🔍 [Callback] Verificando se URL é absoluta: true
✅ [Callback] Redirecionando para URL absoluta: https://plenipay.com/home?...
```

**Se aparecer `0.0.0.0:10000` em qualquer lugar:**
- Copie os logs completos
- Identifique onde está aparecendo

### **2. Verificar Network Tab no Navegador**

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Clique no link do email
4. Veja todas as requisições:
   - Qual requisição está indo para `0.0.0.0:10000`?
   - Qual é o status code?
   - Qual é a resposta?

### **3. Verificar Headers da Resposta**

No Network tab, clique na requisição para `/auth/callback` e veja:
- **Response Headers** → Procure por `Location` ou `redirect`
- Se houver um header `Location` com `0.0.0.0:10000`, esse é o problema

---

## 🔧 Soluções Adicionais

### **Solução 1: Verificar Variáveis de Ambiente**

Verifique se há alguma variável com `0.0.0.0:10000`:

```bash
# No terminal
grep -r "0.0.0.0" .env.local
grep -r "10000" .env.local
```

**Se encontrar:** Remova ou corrija.

### **Solução 2: Verificar Se Servidor Está Rodando em 0.0.0.0:10000**

Se o servidor Next.js estiver rodando em `0.0.0.0:10000`, isso pode causar o problema:

```bash
# Verificar em qual porta o servidor está rodando
lsof -i :3000
lsof -i :10000
```

**Se estiver em `0.0.0.0:10000`:**
- Pare o servidor
- Inicie com: `npm run dev` (deve usar porta 3000)

### **Solução 3: Verificar Se Há Proxy ou Load Balancer**

Se houver um proxy ou load balancer na frente, ele pode estar adicionando headers com URL errada.

---

## 📊 Checklist de Diagnóstico

- [ ] Verifiquei logs no terminal ao clicar no link
- [ ] Verifiquei Network tab no DevTools
- [ ] Verifiquei Response Headers (procure por `Location`)
- [ ] Verifiquei variáveis de ambiente
- [ ] Verifiquei em qual porta o servidor está rodando
- [ ] Verifiquei se há proxy/load balancer

---

## 🎯 Próximos Passos

1. **Clique no link do email**
2. **Veja o terminal** - copie TODOS os logs que aparecem
3. **Veja o Network tab** - identifique qual requisição está causando o redirect
4. **Veja os Response Headers** - procure por `Location` ou `redirect`

**Com essas informações, podemos identificar exatamente onde o redirect está acontecendo!** 🔍

---

## ⚠️ IMPORTANTE

Se o problema persistir mesmo após todas as correções, pode ser que:

1. **O Supabase está fazendo redirect no lado do servidor** (não podemos interceptar)
2. **Há um proxy/load balancer** que está modificando os redirects
3. **O servidor está rodando em `0.0.0.0:10000`** e o Next.js está usando isso como base

**Nesses casos, precisamos ver os logs completos para identificar a causa exata.**
