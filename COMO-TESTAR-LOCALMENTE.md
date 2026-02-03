# 🧪 COMO TESTAR O CALLBACK LOCALMENTE

## ⚠️ PROBLEMA IDENTIFICADO

Você está acessando `https://plenipay.com` no navegador, mas o servidor está rodando **localmente** em `localhost:3000` ou `0.0.0.0:10000`.

**Quando você acessa `plenipay.com`:**
- A requisição vai para o servidor de **produção** (Railway, etc.)
- **NÃO** vai para o servidor local
- Por isso não aparecem logs no terminal local

---

## ✅ SOLUÇÃO: Testar Localmente

### **Opção 1: Acessar localhost:3000**

1. **Verifique se o servidor está rodando:**
   ```bash
   # Deve mostrar algo como "Ready on http://localhost:3000"
   ```

2. **Acesse o link usando localhost:3000:**
   ```
   http://localhost:3000/auth/callback?token_hash=1f68da2989008d3c3bc75ee473640d89d04ed21222e6f3a40dfc895f&type=magiclink&next=%2Fhome
   ```

3. **Agora os logs devem aparecer no terminal!**

---

### **Opção 2: Verificar se o servidor está rodando**

Execute no terminal:
```bash
curl http://localhost:3000
```

**Se funcionar:** O servidor está rodando ✅
**Se não funcionar:** O servidor não está rodando ❌

---

### **Opção 3: Ver logs do servidor de produção**

Se você quer testar em produção (`plenipay.com`), precisa ver os logs do servidor de produção (Railway, etc.), não do servidor local.

---

## 🔍 O QUE FAZER AGORA

1. **Verifique se o servidor local está rodando:**
   - Deve aparecer no terminal: `Ready on http://localhost:3000`

2. **Acesse usando localhost:3000:**
   ```
   http://localhost:3000/auth/callback?token_hash=1f68da2989008d3c3bc75ee473640d89d04ed21222e6f3a40dfc895f&type=magiclink&next=%2Fhome
   ```

3. **Veja os logs no terminal:**
   - Deve aparecer: `🔍 [Callback] ========== CALLBACK INICIADO ==========`

---

**Teste usando localhost:3000 e me diga o que aparece nos logs!** 🚀
