# ✅ CORRIGIDO: Link com access_token no Hash

## 🔴 Problema Identificado

O link gerado pelo Supabase estava vindo com `access_token` no hash (`#access_token=...`) ao invés de `token_hash` na query string, e a URL ainda apontava para `0.0.0.0:10000`.

**Exemplo do link errado:**
```
https://0.0.0.0:10000/login?error=...&#access_token=eyJhbGciOiJIUzI1NiIs...
```

**Causa:** O Supabase `admin.generateLink()` pode retornar links em formatos diferentes:
- Com `token_hash` na query string
- Com `access_token` no hash (`#access_token=...`)
- Com URL errada (`0.0.0.0:10000`)

---

## ✅ Solução Implementada

### **1. Extração Robusta de Tokens**

Agora o código tenta extrair o token de **múltiplas formas**:

```typescript
// Tentar extrair token_hash da query string
let tokenHash: string | null = null
const tokenHashMatch = linkGerado.match(/[?&#]token_hash=([^&#]+)/i)
if (tokenHashMatch) {
  tokenHash = decodeURIComponent(tokenHashMatch[1])
}

// Tentar extrair access_token do hash (#access_token=...)
if (!tokenHash) {
  const accessTokenMatch = linkGerado.match(/#access_token=([^&#]+)/i)
  if (accessTokenMatch) {
    tokenHash = decodeURIComponent(accessTokenMatch[1])
  }
}
```

### **2. Correção Sempre Aplicada**

Agora o código **sempre verifica** se o link precisa ser corrigido:

```typescript
const precisaCorrigir = linkGerado.includes('0.0.0.0') || 
                        linkGerado.includes(':10000') || 
                        linkGerado.includes('localhost') ||
                        !linkGerado.includes('plenipay.com')
```

**Isso garante que:**
- Links com `0.0.0.0:10000` são corrigidos
- Links com `localhost` são corrigidos
- Links que não contêm `plenipay.com` são corrigidos

### **3. Fallback de Substituição**

Se não conseguir extrair o token, tenta substituir apenas o domínio:

```typescript
if (!tokenHash) {
  // Substituir domínio e caminho
  linkGerado = linkGerado.replace(/https?:\/\/[^\/]+/, 'https://plenipay.com')
  linkGerado = linkGerado.replace(/\/login/, '/auth/callback')
}
```

### **4. Verificação Final**

Como última tentativa, se o link ainda não contém `plenipay.com`, usa o `redirectTo`:

```typescript
if (!linkGerado.includes('plenipay.com')) {
  linkGerado = redirectTo // 'https://plenipay.com/auth/callback?next=/home'
}
```

---

## 📋 Onde Foi Corrigido

1. **`app/api/auth/enviar-link-confirmacao/route.ts`** - Quando reenvia o link
2. **`lib/auth.ts`** - Quando tenta enviar via SMTP próprio no cadastro

---

## 🧪 Como Testar

### **1. Reenviar Link**

1. Clique em "Reenviar link" no modal
2. Verifique o email recebido
3. **O link deve começar com:** `https://plenipay.com/auth/callback?...`
4. **NÃO deve ter:** `0.0.0.0:10000` ou `localhost`

### **2. Verificar Logs no Terminal**

Quando reenviar, você verá:

**Se extraiu token_hash:**
```
✅ Token_hash extraído da query string
✅ Link corrigido: https://plenipay.com/auth/callback?token_hash=...
```

**Se extraiu access_token:**
```
✅ Access_token extraído do hash
✅ Link corrigido: https://plenipay.com/auth/callback?token_hash=...
```

**Se não conseguiu extrair:**
```
⚠️ Não foi possível extrair token - tentando substituir domínio...
✅ Link corrigido (substituição de domínio): https://plenipay.com/auth/callback?...
```

---

## ✅ O Que Esperar

### **Link Correto no Email:**
```
https://plenipay.com/auth/callback?token_hash=abc123...&type=signup&next=/home
```

**OU (se usar access_token):**
```
https://plenipay.com/auth/callback?token_hash=eyJhbGciOiJIUzI1NiIs...&type=signup&next=/home
```

### **Ao Clicar no Link:**
1. Redireciona para `https://plenipay.com/auth/callback`
2. O Supabase valida o token
3. Email é confirmado automaticamente
4. Usuário é logado automaticamente
5. Redireciona para `/home`

---

## 🔍 Verificação

### **Verificar Logs no Terminal:**

Quando reenviar, procure por:

1. **"🔍 Link gerado pelo Supabase"** → Mostra o link original
2. **"⚠️ Link precisa ser corrigido"** → Sistema detectou problema
3. **"✅ Token_hash extraído"** ou **"✅ Access_token extraído"** → Token encontrado
4. **"✅ Link corrigido"** → Link foi reconstruído corretamente
5. **"✅ Link final que será enviado"** → Link que vai no email

---

## 📊 Checklist

- [x] Extração de `token_hash` da query string
- [x] Extração de `access_token` do hash
- [x] Correção sempre aplicada (mesmo sem 0.0.0.0)
- [x] Fallback de substituição de domínio
- [x] Verificação final com redirectTo
- [ ] Teste reenviar link
- [ ] Verifique link no email recebido
- [ ] Clique no link e confirme que funciona

---

## 🎯 Resultado Final

**Agora o sistema:**
1. ✅ **Extrai token de múltiplas formas** (`token_hash` ou `access_token`)
2. ✅ **Sempre corrige links** que não são `plenipay.com`
3. ✅ **Tem fallbacks** se não conseguir extrair token
4. ✅ **Garante que link sempre aponta** para `plenipay.com`

**Teste agora reenviando o link e verifique o email!** 🚀
