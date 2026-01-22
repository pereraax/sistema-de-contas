# 🔍 DIAGNOSTICAR: Redirect para 0.0.0.0:10000 no Callback

## 🔴 Problema

O link no email está correto (`https://plenipay.com/auth/callback?token_hash=...`), mas quando o usuário clica, o navegador redireciona para `https://0.0.0.0:10000/login?error=...`.

**Supabase está configurado corretamente:**
- ✅ Site URL = `https://plenipay.com`
- ✅ Redirect URLs inclui `https://plenipay.com/**`

---

## 🔍 Possíveis Causas

### **1. O Navegador Está Fazendo Redirect Antes de Chegar ao Servidor**

O problema pode estar acontecendo **no navegador**, antes mesmo de chegar ao servidor:

- O navegador pode ter cache de uma URL antiga
- Algum JavaScript no cliente pode estar fazendo redirect
- O link pode estar sendo interceptado por alguma extensão do navegador

### **2. O Supabase Está Fazendo Redirect Interno**

Mesmo que a Site URL esteja correta, o Supabase pode estar fazendo um redirect interno baseado em:
- Cookies antigos
- Configuração em cache
- Alguma resposta do `verifyOtp` que contém um redirect

### **3. O Middleware Não Está Interceptando**

O middleware pode não estar interceptando se:
- A requisição não passa pelo middleware
- O redirect está acontecendo no cliente (JavaScript)

---

## ✅ Soluções Implementadas

### **1. Verificação Imediata no Callback**

Agora o callback **verifica imediatamente** se a URL recebida contém `0.0.0.0:10000`:

```typescript
if (request.url.includes('0.0.0.0') || request.url.includes(':10000')) {
  // Redirecionar IMEDIATAMENTE para URL correta
  const urlCorreta = new URL('/auth/callback', productionUrl)
  // ... preservar parâmetros ...
  return NextResponse.redirect(urlCorreta.toString(), { status: 307 })
}
```

### **2. Logs Detalhados**

Adicionados logs para rastrear:
- URL recebida
- Host, Referer, Origin
- Se foi necessário redirecionar

### **3. Verificação de Cookies**

O código agora verifica se cookies têm domínio inválido e remove/corrige.

---

## 🧪 Como Diagnosticar

### **1. Verificar Logs no Terminal**

Quando clicar no link, veja o terminal e procure por:

```
🔍 [Callback] ========== CALLBACK INICIADO ==========
🔍 [Callback] URL recebida: https://plenipay.com/auth/callback?token_hash=...
🔍 [Callback] Host: plenipay.com
```

**Se aparecer `0.0.0.0:10000` nos logs:**
```
❌ [Callback] URL recebida contém 0.0.0.0:10000 - REDIRECIONANDO IMEDIATAMENTE!
🔄 [Callback] Redirecionando para: https://plenipay.com/auth/callback?...
```

### **2. Verificar no Console do Navegador (F12)**

Abra o console do navegador e veja:
- Se há algum erro JavaScript
- Se há algum redirect sendo feito pelo JavaScript
- Se há alguma requisição para `0.0.0.0:10000`

### **3. Verificar Network Tab**

No Network tab do DevTools:
1. Clique no link do email
2. Veja todas as requisições
3. Procure por requisições para `0.0.0.0:10000`
4. Veja qual requisição está causando o redirect

---

## 🔧 Soluções Adicionais

### **Solução 1: Limpar Cache do Navegador**

1. Pressione **Ctrl+Shift+Delete** (ou Cmd+Shift+Delete no Mac)
2. Selecione "Cache" ou "Imagens e arquivos em cache"
3. Selecione "Cookies e outros dados do site"
4. Limpe tudo
5. Teste novamente

### **Solução 2: Testar em Modo Anônimo**

1. Abra uma janela anônima/privada
2. Acesse o link do email
3. Veja se o problema persiste

**Se funcionar em modo anônimo:** O problema é cache/cookies do navegador.

### **Solução 3: Verificar Variáveis de Ambiente**

Verifique se há alguma variável de ambiente com `0.0.0.0:10000`:

```bash
# No terminal
grep -r "0.0.0.0" .env.local
grep -r "10000" .env.local
```

**Se encontrar:** Remova ou corrija.

---

## 📊 Checklist de Diagnóstico

- [ ] Verifiquei logs no terminal ao clicar no link
- [ ] Verifiquei console do navegador (F12)
- [ ] Verifiquei Network tab no DevTools
- [ ] Limpei cache do navegador
- [ ] Testei em modo anônimo
- [ ] Verifiquei variáveis de ambiente
- [ ] Verifiquei se há JavaScript fazendo redirect

---

## 🎯 Próximos Passos

1. **Clique no link do email**
2. **Veja o terminal** - copie todos os logs que aparecem
3. **Veja o console do navegador (F12)** - copie qualquer erro ou log
4. **Veja o Network tab** - identifique qual requisição está causando o redirect

**Com essas informações, podemos identificar exatamente onde o redirect está acontecendo!** 🔍
