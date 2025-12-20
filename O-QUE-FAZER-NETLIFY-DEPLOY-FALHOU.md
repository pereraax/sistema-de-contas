# 🎯 O QUE FAZER QUANDO O DEPLOY FALHA NO NETLIFY

## 📋 Entendendo os Botões:

### 1. **"Delete deploy"** ❌
- **O que faz:** Remove apenas o **registro** deste deploy falho da lista
- **É seguro?** ✅ SIM, é seguro clicar
- **O que acontece:** O deploy falho desaparece da lista, mas **NÃO afeta**:
  - Seu código
  - Configurações do site
  - Deploys anteriores
  - O site em produção (se houver um deploy anterior funcionando)
- **Quando usar:** Quando você quer limpar a lista de deploys falhos (opcional, não é necessário)

### 2. **"Retry"** 🔄
- **O que faz:** Tenta fazer o deploy novamente **COM AS MESMAS CONFIGURAÇÕES**
- **Problema:** Se as configurações estiverem erradas, vai falhar de novo
- **Quando usar:** Depois de corrigir as configurações

### 3. **"Deploy settings"** ⚙️
- **O que faz:** Abre as configurações de build do projeto
- **Quando usar:** Para corrigir as configurações que estão causando o erro

---

## ✅ O QUE VOCÊ DEVE FAZER AGORA (PASSO A PASSO):

### ⚠️ IMPORTANTE: Corrija as configurações ANTES de tentar fazer deploy novamente!

---

## 📝 PASSO A PASSO DETALHADO:

### **PASSO 1: Ir para as Configurações** ⚙️

1. **Clique no botão "Deploy settings"** (ou vá em: `Site settings` → `Build & deploy` → `Build settings`)

---

### **PASSO 2: Remover Publish Directory** ⚠️ **CRÍTICO - FAÇA ISSO PRIMEIRO!**

1. **Procure por:** `Publish directory` ou `Publish dir`
2. **Se tiver algum valor** (como `.next` ou `/opt/build/repo/.next`):
   - **APAGUE COMPLETAMENTE** - deixe o campo **VAZIO**
3. **Salve as alterações**

**Por quê?** O plugin `@netlify/plugin-nextjs` gerencia isso automaticamente. Se você especificar manualmente, causa conflito!

---

### **PASSO 3: Verificar Build Command** 🔨

1. **Procure por:** `Build command`
2. **Deve estar:**
   - **VAZIO** (deixar em branco) - **RECOMENDADO**
   - **OU** `npm ci --legacy-peer-deps && npm run build`
3. **Se estiver diferente, altere para vazio ou use o comando acima**
4. **Salve**

**Por quê?** O plugin gerencia o build automaticamente. Se você especificar um comando, pode interferir.

---

### **PASSO 4: Verificar Base Directory** 📁

1. **Procure por:** `Base directory`
2. **Deve estar VAZIO** (a menos que seu projeto esteja em uma subpasta do repositório)
3. **Se não estiver vazio e seu projeto está na raiz do repositório, deixe vazio**
4. **Salve**

---

### **PASSO 5: Verificar Node Version** 🟢

1. **Procure por:** `Node version` ou `Node.js version`
2. **Deve ser:** `20` ou `20.x`
3. **Se estiver diferente, altere para `20`**
4. **Salve**

---

### **PASSO 6: Verificar Variáveis de Ambiente** 🔐

1. **Vá em:** `Site settings` → `Environment variables`
2. **Verifique se todas estas variáveis estão configuradas:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `NODE_ENV` (deve ser `production`)
   - `ADMIN_JWT_SECRET`
   - `ASAAS_API_KEY`
   - `ASAAS_API_URL`
   - `APIFACIL_INSTANCE_ID`
   - `APIFACIL_TOKEN`
   - `OPENAI_API_KEY`
   - `GROQ_API_KEY`
3. **Veja o arquivo `VARIAVEIS-AMBIENTE-NETLIFY.txt` para os valores corretos**

---

### **PASSO 7: Limpar Cache e Fazer Novo Deploy** 🚀

**Opção A: Limpar Cache no Netlify (Recomendado)**

1. **Vá em:** `Site settings` → `Build & deploy` → `Build settings`
2. **Role até o final da página**
3. **Procure por:** `Clear cache and deploy site` ou `Clear cache`
4. **Clique no botão**
5. **Aguarde o deploy iniciar**

**Opção B: Fazer Commit e Push (Alternativa)**

1. **No terminal, execute:**
   ```bash
   cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
   git add .
   git commit -m "Fix Netlify build configuration"
   git push origin main
   ```
2. **O Netlify detecta automaticamente e inicia um novo deploy**

---

### **PASSO 8: Aguardar e Verificar** ⏳

1. **Vá em:** `Deploys` (no menu lateral)
2. **Aguarde o novo deploy aparecer**
3. **Clique no deploy para ver os logs**
4. **Se ainda falhar, veja os logs completos** (role até o início para ver o erro real)

---

## 🗑️ SOBRE O "DELETE DEPLOY":

### **Você PODE clicar em "Delete deploy"?**

✅ **SIM, é seguro!**

**O que acontece:**
- O registro do deploy falho é removido da lista
- **NÃO afeta** seu código
- **NÃO afeta** as configurações
- **NÃO afeta** o site em produção (se houver um deploy anterior funcionando)
- É apenas uma limpeza visual da lista

**Quando usar:**
- Quando você quer limpar a lista de deploys falhos
- Quando já corrigiu as configurações e quer começar "limpo"
- É **opcional** - não é necessário para corrigir o problema

**Recomendação:**
- Você pode deletar o deploy falho **depois** de corrigir as configurações
- Ou pode deixar ele lá para referência (não faz mal)

---

## 🔍 SE O DEPLOY AINDA FALHAR DEPOIS DAS CORREÇÕES:

### Verificar Logs Completos:

1. **Vá em:** `Deploys` → Clique no deploy que falhou
2. **Role até o INÍCIO dos logs** (antes do erro do plugin)
3. **Procure por:**
   - ❌ Erros de TypeScript
   - ❌ Erros de importação (`Module not found`)
   - ❌ Erros de dependências
   - ❌ Mensagens como "Cannot find module"
   - ❌ Erros de compilação

4. **Copie os logs completos** e me envie para análise

---

## ✅ RESUMO RÁPIDO:

1. ✅ **Clique em "Deploy settings"** (ou vá em Site settings)
2. ✅ **Remova o Publish directory** (deixe vazio) ⚠️ CRÍTICO
3. ✅ **Verifique Build command** (deixe vazio)
4. ✅ **Verifique Base directory** (deixe vazio)
5. ✅ **Verifique Node version** (deve ser 20)
6. ✅ **Verifique variáveis de ambiente**
7. ✅ **Limpe o cache e faça novo deploy**
8. ✅ **Aguarde e verifique os logs**

**Sobre "Delete deploy":** ✅ Pode clicar, é seguro, mas é opcional. É apenas para limpar a lista visualmente.

---

## 🎯 ORDEM RECOMENDADA:

1. **Primeiro:** Corrija as configurações (Passos 1-6)
2. **Depois:** Limpe cache e faça novo deploy (Passo 7)
3. **Opcional:** Delete o deploy falho antigo (se quiser limpar a lista)

---

## 💡 DICA:

**NÃO** use "Retry" antes de corrigir as configurações - vai falhar de novo!

**SEMPRE** corrija as configurações primeiro, depois faça um novo deploy.
