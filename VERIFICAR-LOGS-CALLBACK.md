# 🔍 VERIFICAR LOGS DO CALLBACK

## 📋 O Que Fazer Agora

1. **Abra o terminal onde o servidor está rodando**
2. **Cole o link na barra de endereço:**
   ```
   https://plenipay.com/auth/callback?token_hash=1f68da2989008d3c3bc75ee473640d89d04ed21222e6f3a40dfc895f&type=magiclink&next=%2Fhome
   ```
3. **Pressione Enter**
4. **Veja os logs no terminal**

## 🔍 O Que Procurar nos Logs

Procure por estas mensagens:

### ✅ Se o callback está sendo chamado:
```
🔍 [Callback] ========== CALLBACK INICIADO ==========
🔍 [Callback] URL recebida: https://plenipay.com/auth/callback?...
```

### ✅ Se o token está sendo extraído:
```
🔍 [Callback] Parâmetros extraídos: { token_hash: '1f68da2989008d3c3bc75ee473640d89d04ed21222e6f3a40dfc895f...', type: 'magiclink', next: '/home' }
```

### ✅ Se o verifyOtp está sendo chamado:
```
🔄 [Callback] Tentando verifyOtp com type: magiclink
🔍 [Callback] Token_hash: 1f68da2989008d3c3bc75ee473640d89d04ed21222e6f3a40dfc895f...
```

### ✅ Se o verifyOtp retornou:
```
🔍 [Callback] verifyOtp retornou: { hasUser: true/false, hasSession: true/false, hasError: true/false, errorMessage: '...' }
```

### ❌ Se há erro:
```
❌ [Callback] Erro ao verificar link: ...
❌ [Callback] Erro completo: ...
```

### ✅ Se está redirecionando:
```
🔍 [Callback] Redirecionando para login (erro): https://plenipay.com/login?error=...
```
ou
```
✅ [Callback] Sessão criada - redirecionando para home
🔍 [Callback] URL final de redirecionamento: https://plenipay.com/home?emailConfirmed=true
```

## ⚠️ IMPORTANTE

**NÃO deve aparecer `0.0.0.0:10000` em NENHUM lugar nos logs!**

Se aparecer, me envie os logs completos.

---

**Cole o link, veja os logs e me diga o que aparece!** 📋
