# 🚀 COMO ATUALIZAR A PLATAFORMA NO VERCEL

## 📋 GUIA COMPLETO PASSO A PASSO

---

## 🔄 MÉTODO 1: ATUALIZAÇÃO AUTOMÁTICA (RECOMENDADO)

### **Como Funciona:**
O Vercel detecta automaticamente quando você faz `git push` para o GitHub e inicia um novo deploy.

### **Passos:**

#### **1. Verificar Mudanças Locais**
```bash
# Ver o que foi modificado
git status

# Ver diferenças
git diff
```

#### **2. Adicionar Mudanças ao Git**
```bash
# Adicionar arquivos específicos
git add app/api/admin/whatsapp-instance/qrcode/route.ts
git add app/api/whatsapp/apifacil/webhook/route.ts

# OU adicionar tudo (cuidado!)
git add .
```

#### **3. Criar Commit**
```bash
# Commit com mensagem descritiva
git commit -m "fix: descrição do que foi corrigido"

# Exemplo:
git commit -m "fix: adicionar dynamic=force-dynamic nas rotas que faltavam"
```

#### **4. Enviar para GitHub**
```bash
# Enviar para a branch main
git push origin main
```

#### **5. Aguardar Deploy Automático**
- ⏳ Aguarde 2-3 minutos
- O Vercel detectará o push automaticamente
- Um novo deploy será iniciado

#### **6. Verificar Status**
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto
3. Vá em **Deployments**
4. Veja o status do último deploy:
   - 🟡 **Building** - Aguarde
   - ✅ **Ready** - Deploy concluído com sucesso
   - ❌ **Failed** - Ver logs para corrigir

---

## 🔄 MÉTODO 2: DEPLOY MANUAL VIA DASHBOARD

### **Quando Usar:**
- Auto-deploy está desabilitado
- Quer fazer deploy de uma branch específica
- Quer fazer redeploy de um commit anterior

### **Passos:**

#### **1. Acessar Dashboard do Vercel**
1. Acesse: https://vercel.com/dashboard
2. Faça login (se necessário)
3. Clique no seu projeto

#### **2. Criar Novo Deploy**
1. Vá em **Deployments**
2. Clique em **"Create Deployment"** ou **"Redeploy"**
3. Selecione:
   - **Branch:** `main` (ou outra branch)
   - **Commit:** Último commit ou específico
4. Clique em **"Deploy"**

#### **3. Aguardar Conclusão**
- ⏳ Aguarde 2-5 minutos
- Veja o progresso em tempo real
- Verifique se foi bem-sucedido

---

## 🔄 MÉTODO 3: DEPLOY VIA CLI (TERMINAL)

### **Quando Usar:**
- Quer mais controle sobre o deploy
- Quer ver logs em tempo real
- Prefere usar terminal

### **Passos:**

#### **1. Instalar Vercel CLI (se não tiver)**
```bash
# Instalar globalmente
npm install -g vercel

# OU usar npx (sem instalar)
npx vercel
```

#### **2. Fazer Login**
```bash
# Login no Vercel
vercel login
```

#### **3. Navegar para o Projeto**
```bash
# Ir para a pasta do projeto
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
```

#### **4. Fazer Deploy**
```bash
# Deploy para produção
vercel --prod

# OU deploy para preview
vercel
```

#### **5. Seguir Instruções**
- O CLI perguntará algumas coisas
- Responda conforme necessário
- Aguarde o deploy concluir

---

## 🔍 VERIFICAR STATUS DO DEPLOY

### **No Dashboard:**
1. Acesse: https://vercel.com/dashboard
2. Clique no projeto
3. Vá em **Deployments**
4. Veja o último deploy:
   - **Status:** Building / Ready / Failed
   - **Tempo:** Quanto tempo levou
   - **Commit:** Qual commit foi deployado

### **Ver Logs do Build:**
1. Clique no deploy
2. Vá em **"Build Logs"** ou **"Function Logs"**
3. Veja os logs em tempo real
4. Procure por erros (linhas vermelhas)

---

## ⚠️ TROUBLESHOOTING (RESOLVER PROBLEMAS)

### **Problema 1: Deploy Falhando**

#### **Sintomas:**
- Status: ❌ **Failed**
- Erro nos logs

#### **Solução:**
1. **Ver Build Logs:**
   - Dashboard → Deployments → Último deploy → Build Logs
   - Copie o erro específico

2. **Erros Comuns:**
   - **"Dynamic server usage"** → Adicionar `export const dynamic = 'force-dynamic'`
   - **"Module not found"** → Verificar imports
   - **"Type error"** → Corrigir erros TypeScript
   - **"Build timeout"** → Build muito lento, otimizar

3. **Corrigir e Fazer Novo Deploy:**
   ```bash
   # Corrigir o erro
   # Fazer commit
   git add .
   git commit -m "fix: corrigir erro X"
   git push origin main
   ```

---

### **Problema 2: Auto-Deploy Não Funciona**

#### **Sintomas:**
- Push para GitHub não inicia deploy
- Deploy não aparece no dashboard

#### **Solução:**
1. **Verificar Conexão Git:**
   - Dashboard → Settings → Git
   - Verificar se está conectado ao repositório correto
   - Verificar se **Auto-deploy** está habilitado

2. **Verificar Branch:**
   - Settings → Git → Production Branch
   - Deve ser: `main` (ou sua branch principal)

3. **Reconectar (se necessário):**
   - Settings → Git → Disconnect
   - Conectar novamente
   - Selecionar repositório: `pereraax/plenipay`
   - Branch: `main`

---

### **Problema 3: Variáveis de Ambiente Faltando**

#### **Sintomas:**
- Deploy funciona mas aplicação não
- Erros sobre variáveis não definidas

#### **Solução:**
1. **Adicionar Variáveis:**
   - Dashboard → Settings → Environment Variables
   - Clique em **"Add"**
   - Adicione cada variável:
     - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
     - **Value:** `https://seu-projeto.supabase.co`
     - **Environment:** Production, Preview, Development
   - Clique em **"Save"**

2. **Variáveis Necessárias:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ASAAS_API_KEY
   ASAAS_API_URL
   NEXT_PUBLIC_SITE_URL
   NEXT_PUBLIC_APP_URL
   NODE_ENV=production
   ADMIN_JWT_SECRET
   GEMINI_API_KEY (opcional)
   GROQ_API_KEY (opcional)
   ```

3. **Fazer Novo Deploy:**
   - Após adicionar variáveis, faça novo deploy
   - As variáveis serão aplicadas no próximo build

---

## 📋 CHECKLIST ANTES DE FAZER DEPLOY

### **Antes de Fazer Push:**
- [ ] Build local funciona (`npm run build`)
- [ ] Não há erros TypeScript (`npm run build`)
- [ ] Testei localmente (`npm run dev`)
- [ ] Commits estão prontos
- [ ] Mensagem de commit é clara

### **Após Fazer Push:**
- [ ] Verificar se deploy iniciou no Vercel
- [ ] Aguardar conclusão (2-5 minutos)
- [ ] Verificar status (Ready ou Failed)
- [ ] Se Failed, ver Build Logs
- [ ] Testar aplicação no Vercel

---

## 🎯 FLUXO COMPLETO RECOMENDADO

### **1. Desenvolvimento Local:**
```bash
# Fazer mudanças no código
# Testar localmente
npm run dev

# Verificar se funciona
# Acessar: http://localhost:3000
```

### **2. Verificar Build:**
```bash
# Testar build local
npm run build

# Se houver erros, corrigir
# Repetir até build passar
```

### **3. Commit e Push:**
```bash
# Adicionar mudanças
git add .

# Criar commit
git commit -m "feat: descrição clara do que foi feito"

# Enviar para GitHub
git push origin main
```

### **4. Verificar Deploy:**
1. Acessar: https://vercel.com/dashboard
2. Ver status do deploy
3. Aguardar conclusão
4. Testar aplicação

---

## 💡 DICAS IMPORTANTES

### **✅ Boas Práticas:**
- Sempre teste localmente antes de fazer deploy
- Sempre verifique se `npm run build` passa
- Use mensagens de commit claras
- Verifique logs do Vercel se houver erro
- Mantenha variáveis de ambiente atualizadas

### **❌ Evite:**
- Fazer deploy sem testar localmente
- Fazer deploy com erros de build
- Commits com mensagens vazias
- Ignorar erros do Vercel
- Deletar variáveis de ambiente sem necessidade

---

## 🆘 PRECISA DE AJUDA?

### **Se o Deploy Falhar:**
1. Veja os **Build Logs** no dashboard
2. Copie o erro específico
3. Corrija o erro localmente
4. Teste com `npm run build`
5. Faça novo commit e push

### **Se Não Souber o Erro:**
1. Acesse Build Logs
2. Copie as últimas 50-100 linhas
3. Procure por palavras-chave:
   - "error"
   - "failed"
   - "TypeError"
   - "ModuleNotFoundError"

---

## 📚 RECURSOS ÚTEIS

- **Dashboard Vercel:** https://vercel.com/dashboard
- **Documentação Vercel:** https://vercel.com/docs
- **Status Vercel:** https://www.vercel-status.com/

---

## ✅ RESUMO RÁPIDO

**Para atualizar no Vercel:**

1. **Fazer mudanças no código**
2. **Testar localmente** (`npm run dev`)
3. **Verificar build** (`npm run build`)
4. **Commit e push:**
   ```bash
   git add .
   git commit -m "descrição"
   git push origin main
   ```
5. **Aguardar deploy automático** (2-3 minutos)
6. **Verificar no dashboard** do Vercel

**Pronto!** 🎉



