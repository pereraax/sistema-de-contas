# 🔧 CORRIGIR COMANDO DE START NO RENDER

## ❌ PROBLEMA IDENTIFICADO:

O Render está tentando usar `next start`, mas o projeto tem `output: 'standalone'` no `next.config.js`.

**Erro nos logs:**
```
▲ "next start" does not work with "output: standalone" configuration. 
Use "node .next/standalone/server.js" instead.
```

**Erro final:**
```
Port scan timeout reached, failed to detect open port 10000
```

---

## ✅ SOLUÇÃO:

### **Opção 1: Mudar o comando de start no Render (RECOMENDADO)**

1. No Render, vá em **Settings** do seu serviço
2. Procure por **"Start Command"** ou **"Build Command"**
3. Altere o **Start Command** de:
   ```
   npm start
   ```
   ou
   ```
   next start
   ```
   
   Para:
   ```
   npm run start:standalone
   ```
   
   **OU diretamente:**
   ```
   node .next/standalone/server.js
   ```

4. Salve as alterações
5. O Render vai fazer um novo deploy automaticamente

---

### **Opção 2: Remover `output: 'standalone'` (ALTERNATIVA)**

Se você não quiser usar `standalone`, pode remover do `next.config.js`:

1. Abra `next.config.js`
2. Remova ou comente a linha:
   ```javascript
   output: 'standalone',
   ```
3. Faça commit e push:
   ```bash
   git add next.config.js
   git commit -m "Remover output standalone para Render"
   git push
   ```

**⚠️ ATENÇÃO:** Com `standalone`, o build é mais otimizado e menor. Recomendo manter e usar a Opção 1.

---

## 📋 VERIFICAÇÃO:

Após aplicar a correção, os logs devem mostrar:
- ✅ Build completo
- ✅ Servidor iniciado na porta correta
- ✅ "Ready" sem erros de timeout

---

## 🎯 RECOMENDAÇÃO FINAL:

**Use a Opção 1** - é mais eficiente e mantém o build otimizado.

**Comando correto no Render:**
```
node .next/standalone/server.js
```

---

## 📝 ONDE CONFIGURAR NO RENDER:

1. Acesse: https://dashboard.render.com
2. Clique no seu serviço `sistema-de-contas-1`
3. Vá em **"Settings"** (Configurações)
4. Role até **"Build & Deploy"**
5. Procure **"Start Command"**
6. Altere para: `node .next/standalone/server.js`
7. Clique em **"Save Changes"**

O Render vai fazer um novo deploy automaticamente!
