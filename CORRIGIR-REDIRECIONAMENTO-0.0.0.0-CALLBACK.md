# 🔧 CORRIGIR: Redirecionamento para 0.0.0.0:10000 no Callback

## 🔴 Problema Identificado

O link no email está correto (`https://plenipay.com/auth/callback?token_hash=...`), mas quando o usuário clica, o navegador redireciona para `https://0.0.0.0:10000/login?error=...`.

**Causa possível:** O Supabase pode estar usando a Site URL configurada no Dashboard (que pode estar como `0.0.0.0:10000`) para fazer redirecionamentos internos após verificar o token.

---

## ✅ Solução Implementada

### **1. Verificação de URL Antes de Redirecionar**

Agora o código **verifica se a URL de redirecionamento contém `0.0.0.0:10000`** antes de redirecionar:

```typescript
const finalUrl = redirectUrl.toString()

// Verificar se a URL não contém 0.0.0.0:10000
if (finalUrl.includes('0.0.0.0') || finalUrl.includes(':10000')) {
  console.error('❌ URL de redirecionamento contém 0.0.0.0:10000 - CORRIGINDO!')
  const correctedUrl = finalUrl.replace(/https?:\/\/[^\/]+/, productionUrl)
  return NextResponse.redirect(correctedUrl, { status: 307 })
}
```

### **2. Logs Detalhados**

Adicionados logs para rastrear o problema:

```typescript
console.log(`🔍 [Callback] productionUrl: ${productionUrl}`)
console.log(`🔍 [Callback] next: ${next}`)
console.log(`🔍 [Callback] URL final de redirecionamento: ${finalUrl}`)
```

### **3. Garantia de Uso de productionUrl**

Todos os redirecionamentos **sempre usam `productionUrl`** (`https://plenipay.com`), nunca `requestUrl.origin` que pode ser `0.0.0.0:10000`.

---

## 🔍 Verificação Adicional Necessária

### **1. Verificar Site URL no Supabase Dashboard**

O problema pode estar na configuração do Supabase:

1. Acesse: **https://app.supabase.com**
2. Vá em: **⚙️ Project Settings** → **Authentication** → **URL Configuration**
3. Verifique:
   - ✅ **Site URL** = `https://plenipay.com` (NÃO `0.0.0.0:10000`)
   - ✅ **Redirect URLs** inclui `https://plenipay.com/**`

**Se estiver como `0.0.0.0:10000`:**
1. **Altere para:** `https://plenipay.com`
2. **Salve**
3. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
4. **Teste novamente**

### **2. Verificar Logs no Terminal**

Quando clicar no link, veja o terminal e procure por:

```
🔍 [Callback] URL recebida: https://plenipay.com/auth/callback?token_hash=...
🔄 [Callback] Tentando verifyOtp com type: magiclink
✅ [Callback] Email confirmado com sucesso!
🔍 [Callback] URL final de redirecionamento: https://plenipay.com/home?emailConfirmed=true...
```

**Se aparecer `0.0.0.0:10000` nos logs:**
- O problema está na configuração do Supabase
- Corrija a Site URL no Dashboard

---

## 🧪 Como Testar

### **1. Verificar Site URL no Supabase**

1. Acesse o Supabase Dashboard
2. Verifique se Site URL = `https://plenipay.com`
3. Se não estiver, altere e salve

### **2. Limpar Cache do Navegador**

1. Pressione **Ctrl+Shift+Delete** (ou Cmd+Shift+Delete no Mac)
2. Selecione "Cache" ou "Imagens e arquivos em cache"
3. Limpe o cache

### **3. Testar o Link**

1. Reenvie o link de confirmação
2. Abra o email
3. Clique no link
4. **Verifique o terminal** para ver os logs
5. **Verifique a URL** no navegador - deve ser `plenipay.com`, não `0.0.0.0:10000`

---

## ✅ O Que Esperar

### **Se Funcionar:**
```
🔍 [Callback] URL recebida: https://plenipay.com/auth/callback?token_hash=...
✅ [Callback] Email confirmado com sucesso!
🔍 [Callback] URL final de redirecionamento: https://plenipay.com/home?emailConfirmed=true...
```

**Navegador redireciona para:** `https://plenipay.com/home?emailConfirmed=true&mensagem=Email confirmado com sucesso!`

### **Se Ainda Der Erro:**
```
❌ [Callback] URL de redirecionamento contém 0.0.0.0:10000 - CORRIGINDO!
✅ [Callback] URL corrigida: https://plenipay.com/home?...
```

**Nesse caso:** O código corrige automaticamente, mas o problema está na configuração do Supabase.

---

## 📊 Checklist

- [x] Código verifica URL antes de redirecionar
- [x] Código corrige URL se contém 0.0.0.0:10000
- [x] Logs detalhados adicionados
- [ ] Site URL no Supabase = `https://plenipay.com`
- [ ] Redirect URLs inclui `https://plenipay.com/**`
- [ ] Cache do navegador limpo
- [ ] Teste clicando no link do email

---

## 🎯 Resultado Final

**Agora o sistema:**
1. ✅ **Verifica URL antes de redirecionar**
2. ✅ **Corrige automaticamente** se contém `0.0.0.0:10000`
3. ✅ **Sempre usa `productionUrl`** (`https://plenipay.com`)
4. ✅ **Logs detalhados** para diagnóstico

**Mas o problema principal pode estar na configuração do Supabase Dashboard!** Verifique a Site URL. 🔍
