# 🚨 CORRIGIR ERRO DE DEPLOY NO RENDER

## ❌ PROBLEMA:

O deploy falhou com erro: **"Exited with status 1 while building your code"**

Isso significa que o build do Next.js falhou durante o deploy.

---

## 🔍 PASSO 1: VER OS LOGS DO DEPLOY

### **Como ver os logs:**

1. **Na tela do erro, procure por "View Logs" ou "Deploy Logs"**
2. **OU clique no deploy que falhou**
3. **Role até a seção de logs**
4. **Procure por erros em vermelho**

**Me envie os logs ou uma captura de tela dos erros!**

---

## 🔧 ERROS COMUNS E SOLUÇÕES:

### **ERRO 1: Variáveis de ambiente faltando**

**Sintoma:** Erro sobre variáveis não definidas

**Solução:**
- Verifique se adicionou TODAS as variáveis de ambiente
- Especialmente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

---

### **ERRO 2: Erro de TypeScript**

**Sintoma:** `Type error: ...`

**Solução:**
- O `next.config.js` já tem `ignoreBuildErrors: true`
- Mas pode ser necessário verificar se há erros críticos

---

### **ERRO 3: Dependências não instaladas**

**Sintoma:** `Module not found: ...`

**Solução:**
- Verifique se o `package.json` está correto
- Render instala automaticamente, mas pode haver problema

---

### **ERRO 4: Erro de build do Next.js**

**Sintoma:** `Error occurred prerendering page ...`

**Solução:**
- Pode ser problema com páginas que usam `cookies()` ou `headers()`
- Já adicionamos `export const dynamic = 'force-dynamic'` nas páginas necessárias

---

### **ERRO 5: Memória insuficiente**

**Sintoma:** `JavaScript heap out of memory`

**Solução:**
- Render free tem limite de memória
- Pode ser necessário otimizar o build

---

## ✅ SOLUÇÃO RÁPIDA: VERIFICAR LOGS

### **No Render:**

1. **Clique no deploy que falhou**
2. **Role até "Build Logs" ou "Deploy Logs"**
3. **Procure por linhas em vermelho ou com "ERROR"**
4. **Me envie o erro específico**

---

## 🔧 CORREÇÕES POSSÍVEIS:

### **Se o erro for sobre variáveis de ambiente:**

1. **Volte para "Environment Variables"**
2. **Verifique se adicionou todas:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ASAAS_API_KEY`
   - `ASAAS_API_URL`
   - `APIFACIL_INSTANCE_ID`
   - `APIFACIL_TOKEN`
   - `NODE_ENV=production`
   - `ADMIN_JWT_SECRET`

---

### **Se o erro for de build:**

1. **Verifique se o `package.json` tem os scripts corretos:**
   ```json
   "scripts": {
     "build": "next build",
     "start": "next start"
   }
   ```

2. **Verifique se o `next.config.js` está correto**

---

### **Se o erro for de memória:**

1. **Tente fazer um build local primeiro:**
   ```bash
   npm run build
   ```
   
2. **Se funcionar localmente, o problema pode ser no Render**

---

## 📋 CHECKLIST:

- [ ] Vi os logs do deploy (procure por "View Logs")
- [ ] Identifiquei o erro específico
- [ ] Verifiquei se todas as variáveis de ambiente estão adicionadas
- [ ] Verifiquei se o `package.json` está correto
- [ ] Testei build local (`npm run build`)

---

## 🚀 PRÓXIMOS PASSOS:

1. **Clique em "View Logs" ou "Deploy Logs"**
2. **Procure o erro específico** (geralmente no final dos logs)
3. **Me envie o erro** ou uma captura de tela
4. **Vou te ajudar a corrigir!**

---

**Clique em "View Logs" e me envie o erro específico que aparece!** 🔍

