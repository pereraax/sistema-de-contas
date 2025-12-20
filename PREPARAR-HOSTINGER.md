# 🚀 PREPARAR PROJETO PARA HOSTINGER

## ✅ PASSO A PASSO COMPLETO:

---

## 📋 PASSO 1: CRIAR REPOSITÓRIO NO GITHUB

### **1.1. Acessar GitHub:**
- Vá em: https://github.com
- Faça login na sua conta

### **1.2. Criar Novo Repositório:**
1. Clique no botão **"+"** no canto superior direito
2. Selecione **"New repository"**
3. **Nome do repositório:** `sistema-de-contas` (ou o nome que quiser)
4. **Descrição:** "Sistema de Controle Financeiro - PLENIPAY"
5. **Visibilidade:** Escolha **Private** (recomendado) ou **Public**
6. **NÃO marque** "Add a README file"
7. **NÃO marque** "Add .gitignore"
8. **NÃO marque** "Choose a license"
9. Clique em **"Create repository"**

### **1.3. Copiar URL do Repositório:**
- Após criar, copie a URL (ex: `https://github.com/seu-usuario/sistema-de-contas.git`)

---

## 📋 PASSO 2: INICIALIZAR GIT LOCAL

### **2.1. Verificar se já tem Git:**
```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
git status
```

**Se aparecer erro:** Git não está inicializado, vamos inicializar.

**Se aparecer "On branch main":** Git já está inicializado, pule para o Passo 3.

### **2.2. Inicializar Git (se necessário):**
```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
git init
git branch -M main
```

---

## 📋 PASSO 3: ADICIONAR ARQUIVOS E FAZER COMMIT

### **3.1. Adicionar todos os arquivos:**
```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
git add .
```

### **3.2. Fazer commit:**
```bash
git commit -m "Initial commit - Sistema de Contas PLENIPAY"
```

---

## 📋 PASSO 4: CONECTAR COM GITHUB

### **4.1. Adicionar remote:**
```bash
git remote add origin https://github.com/SEU-USUARIO/sistema-de-contas.git
```

**Substitua `SEU-USUARIO` pelo seu usuário do GitHub!**

### **4.2. Fazer push:**
```bash
git push -u origin main
```

**Se pedir autenticação:**
- Use seu **token de acesso pessoal** do GitHub (não a senha)
- Ou configure SSH keys

---

## 📋 PASSO 5: PREPARAR PARA HOSTINGER

### **5.1. Arquivos que NÃO devem ir para Hostinger:**
- `node_modules/` (será instalado no servidor)
- `.next/` (será gerado no servidor)
- `.env.local` (variáveis locais)
- `.git/` (controle de versão)

### **5.2. Arquivos que DEVEM ir:**
- ✅ Todo o código fonte (`app/`, `components/`, `lib/`, etc.)
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `tailwind.config.js`
- ✅ `tsconfig.json`
- ✅ `.env.production` (se tiver, com variáveis de produção)
- ✅ Arquivos de configuração

---

## 📋 PASSO 6: UPLOAD NA HOSTINGER

### **6.1. Via Gerenciador de Arquivos:**

1. **Acessar Hostinger:**
   - Vá em: https://hpanel.hostinger.com
   - Faça login

2. **Acessar File Manager:**
   - Vá em **"Files"** → **"File Manager"**
   - Navegue até a pasta do seu domínio (ex: `public_html`)

3. **Fazer Upload:**
   - Clique em **"Upload"** ou **"Upload Files"**
   - Selecione **TODOS os arquivos** do projeto (exceto `node_modules`, `.next`, `.git`)
   - Aguarde upload completar

### **6.2. Via Git (Recomendado - Mais Fácil):**

1. **Acessar Terminal SSH na Hostinger:**
   - Vá em **"Advanced"** → **"SSH Access"**
   - Anote suas credenciais SSH

2. **Conectar via SSH:**
   ```bash
   ssh usuario@seu-dominio.com
   ```

3. **Clonar Repositório:**
   ```bash
   cd public_html
   git clone https://github.com/SEU-USUARIO/sistema-de-contas.git .
   ```

4. **Instalar Dependências:**
   ```bash
   npm install
   ```

5. **Configurar Variáveis de Ambiente:**
   ```bash
   nano .env.production
   ```
   (Adicione todas as variáveis necessárias)

6. **Fazer Build:**
   ```bash
   npm run build
   ```

7. **Iniciar Servidor:**
   ```bash
   npm start
   ```

---

## 📋 PASSO 7: CONFIGURAR HOSTINGER PARA NODE.JS

### **7.1. Verificar se Node.js está disponível:**
- Hostinger precisa ter suporte a Node.js
- Verifique em **"Advanced"** → **"Node.js"**

### **7.2. Configurar Aplicação Node.js:**
1. Vá em **"Advanced"** → **"Node.js"**
2. **Node.js Version:** Escolha **20.x** (ou a mais recente)
3. **Application Root:** `/public_html` (ou pasta do projeto)
4. **Application URL:** Seu domínio
5. **Application Startup File:** `server.js` ou `package.json` (com script start)
6. Clique em **"Create"**

### **7.3. Configurar Variáveis de Ambiente:**
- Na seção **"Environment Variables"**
- Adicione todas as variáveis:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ASAAS_API_KEY`
  - `APIFACIL_INSTANCE_ID`
  - `APIFACIL_TOKEN`
  - E outras que você usa

---

## 📋 PASSO 8: CONFIGURAR PM2 (OPCIONAL - RECOMENDADO)

Para manter o servidor rodando:

```bash
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 startup
```

---

## ✅ CHECKLIST FINAL:

- [ ] Repositório criado no GitHub
- [ ] Git inicializado localmente
- [ ] Arquivos commitados
- [ ] Push feito para GitHub
- [ ] Arquivos enviados para Hostinger (ou clonado via Git)
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Build feito (`npm run build`)
- [ ] Servidor iniciado (`npm start` ou PM2)

---

## 🚨 IMPORTANTE:

1. **Hostinger precisa ter suporte a Node.js** (planos VPS ou Cloud)
2. **Shared Hosting não funciona** com Next.js (precisa de servidor Node.js)
3. **Use PM2** para manter servidor rodando
4. **Configure domínio** apontando para a aplicação

---

## 📝 PRÓXIMOS PASSOS:

1. Criar repositório no GitHub
2. Fazer push do código
3. Configurar Node.js na Hostinger
4. Clonar repositório ou fazer upload
5. Instalar dependências e fazer build
6. Iniciar servidor

---

**Vamos começar criando o repositório Git!** 🚀
