# 🚨 URGENTE: CONFIGURAR RENDER CORRETAMENTE

## ❌ PROBLEMA IDENTIFICADO:

**Erro nos logs:**
```
Error: Cannot find module '/opt/render/project/src/.next/standalone/server.js'
==> Exited with status 1
```

**Causa:**
- O Render está tentando executar `node .next/standalone/server.js`
- Mas o modo standalone foi **desabilitado**
- O arquivo não existe mais

**Erro na página:**
- HTTP 503 (Service Unavailable)
- Aplicação não está iniciando

---

## ✅ SOLUÇÃO IMEDIATA:

### **1. CONFIGURAR START COMMAND NO RENDER:**

1. Acesse: https://dashboard.render.com
2. Clique no serviço `sistema-de-contas-1`
3. Vá em **Settings → Build & Deploy**
4. Procure **"Start Command"**
5. **DELETE** o comando atual (se houver)
6. **ADICIONE** um destes comandos:

   **OPÇÃO 1 (Recomendado):**
   ```
   npm start
   ```

   **OPÇÃO 2:**
   ```
   node server.js
   ```

   **OPÇÃO 3:**
   ```
   npm run start:render
   ```

7. **SALVE** as alterações
8. O Render vai fazer um **novo deploy automaticamente**

---

### **2. VERIFICAR BUILD COMMAND:**

O Build Command deve ser:
```
npm install && npm run build
```

(Deixe o padrão do Render se já estiver assim)

---

### **3. VERIFICAR VARIÁVEIS DE AMBIENTE:**

Certifique-se de que TODAS estão configuradas:

**Obrigatórias:**
- ✅ `NODE_ENV=production`
- ✅ `NEXT_PUBLIC_SITE_URL=https://sistema-de-contas-1.onrender.com`
- ✅ `NEXT_PUBLIC_APP_URL=https://sistema-de-contas-1.onrender.com`

**Todas as outras do `env-para-copiar.txt`**

---

## 📋 CHECKLIST:

- [ ] Start Command configurado: `npm start` ou `node server.js`
- [ ] Build Command: `npm install && npm run build`
- [ ] Variável `NODE_ENV=production` definida
- [ ] Variáveis `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` configuradas
- [ ] Todas as outras variáveis de ambiente configuradas

---

## 🎯 O QUE FOI CORRIGIDO NO CÓDIGO:

1. ✅ `package.json` - Comando `start` agora usa `node server.js`
2. ✅ `server.js` - Configurado para escutar em `0.0.0.0` no Render
3. ✅ `next.config.js` - Modo standalone desabilitado

---

## ⏱️ PRÓXIMOS PASSOS:

1. **AGORA:** Configure o Start Command no Render (conforme acima)
2. **Aguarde:** O Render vai fazer um novo deploy (2-5 minutos)
3. **Verifique:** Os logs devem mostrar:
   ```
   > Ready on http://0.0.0.0:10000
   > Environment: production
   > PORT: 10000
   ```
4. **Teste:** Acesse `https://sistema-de-contas-1.onrender.com`

---

## ⚠️ IMPORTANTE:

**NÃO use mais:**
- ❌ `node .next/standalone/server.js` (não existe mais)
- ❌ `npm run start:standalone` (não funciona sem standalone)

**USE:**
- ✅ `npm start` (agora aponta para `node server.js`)
- ✅ `node server.js` (direto)
- ✅ `npm run start:render` (também funciona)

---

## 📝 RESUMO:

✅ **Problema:** Render tentando usar arquivo que não existe  
✅ **Causa:** Start Command ainda apontando para standalone  
✅ **Solução:** Alterar Start Command para `npm start` ou `node server.js`  
🚨 **AÇÃO URGENTE:** Configure o Start Command no Render AGORA!
