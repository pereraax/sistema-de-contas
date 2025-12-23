# 🔧 RESOLVER ERRO 502 NO RENDER

## ❌ PROBLEMA:

O serviço inicia corretamente, mas ao acessar a URL aparece **HTTP ERROR 502**.

**Causa:** O servidor pode não estar escutando corretamente ou há problema de configuração.

---

## ✅ SOLUÇÕES:

### **1. Verificar Start Command no Render:**

No Render, vá em **Settings → Build & Deploy** e configure:

**Start Command:**
```
npm run start:standalone
```

**OU diretamente:**
```
node server-standalone.js
```

---

### **2. Verificar Variável PORT:**

No Render, vá em **Environment** e adicione/verifique:

**Key:** `PORT`  
**Value:** `10000`

(O Render geralmente define isso automaticamente, mas verifique)

---

### **3. Verificar Variáveis de Ambiente:**

Certifique-se de que TODAS as variáveis estão configuradas:

- ✅ `NEXT_PUBLIC_SITE_URL=https://sistema-de-contas-1.onrender.com`
- ✅ `NEXT_PUBLIC_APP_URL=https://sistema-de-contas-1.onrender.com`
- ✅ `NODE_ENV=production`
- ✅ Todas as outras variáveis do `env-para-copiar.txt`

---

### **4. Verificar Logs no Render:**

1. No Render, vá em **Logs**
2. Procure por erros após "Ready"
3. Verifique se há mensagens de erro de conexão

---

### **5. Verificar Build:**

O servidor standalone só funciona se o build foi feito corretamente:

1. Verifique se o build completou sem erros
2. Verifique se existe `.next/standalone/server.js` após o build

---

## 🔍 DIAGNÓSTICO:

### **Se o servidor inicia mas dá 502:**

1. **Verifique os logs** - Procure por erros após "Ready"
2. **Verifique a porta** - Deve estar escutando na porta definida por `PORT`
3. **Verifique o hostname** - Deve escutar em `0.0.0.0` (não `localhost`)

### **Se o servidor não inicia:**

1. **Verifique o Start Command** - Deve ser `npm run start:standalone`
2. **Verifique o build** - Deve ter completado sem erros
3. **Verifique as dependências** - Todas devem estar instaladas

---

## 📋 CHECKLIST:

- [ ] Start Command configurado: `npm run start:standalone`
- [ ] Variável `PORT` definida (ou deixar o Render definir automaticamente)
- [ ] Variável `NODE_ENV=production` definida
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build completou sem erros
- [ ] Logs mostram "Ready" sem erros

---

## 🎯 PRÓXIMOS PASSOS:

1. **Configure o Start Command** no Render (se ainda não fez)
2. **Verifique todas as variáveis de ambiente**
3. **Aguarde o novo deploy**
4. **Verifique os logs** após o deploy
5. **Teste a URL** novamente

---

## 💡 NOTA:

O servidor standalone do Next.js **já escuta em 0.0.0.0 automaticamente** quando a variável `PORT` está definida. O script `server-standalone.js` garante que tudo está configurado corretamente.

Se ainda assim der erro 502, verifique os logs para identificar o problema específico.
