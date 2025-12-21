# 📦 ARQUIVOS PARA ENVIAR NA HOSTINGER

## ✅ BUILD CONCLUÍDO COM SUCESSO!

Agora você precisa enviar os arquivos para a Hostinger.

---

## 📋 O QUE ENVIAR E O QUE NÃO ENVIAR

### ✅ **ENVIAR ESTES ARQUIVOS:**

```
✅ app/                    (toda a pasta)
✅ components/             (toda a pasta)
✅ lib/                    (toda a pasta)
✅ hooks/                  (toda a pasta)
✅ public/                 (toda a pasta)
✅ pages/                  (toda a pasta, se existir)
✅ types/                  (toda a pasta, se existir)
✅ scripts/                (toda a pasta, se existir)
✅ package.json            (arquivo)
✅ package-lock.json       (arquivo, se existir)
✅ next.config.js          (arquivo)
✅ tailwind.config.js      (arquivo)
✅ tsconfig.json           (arquivo)
✅ postcss.config.js      (arquivo, se existir)
✅ .nvmrc                  (arquivo)
✅ server.js               (arquivo, se existir)
✅ vercel.json             (arquivo, opcional)
✅ README.md               (arquivo, opcional)
```

### ❌ **NÃO ENVIAR ESTES ARQUIVOS:**

```
❌ node_modules/           (será instalado no servidor)
❌ .next/                  (será gerado no servidor)
❌ .git/                   (controle de versão)
❌ .env.local              (variáveis locais)
❌ .env.development.local   (variáveis de desenvolvimento)
❌ .cache/                 (cache)
❌ .turbo/                 (cache)
❌ *.log                   (logs)
❌ .DS_Store               (arquivos do macOS)
❌ deploy-essencial/       (pastas de teste)
❌ deploy-essencial-1/     (pastas de teste)
❌ whatsapp_auth_webjs/    (cache do WhatsApp)
```

---

## 🚀 MÉTODO 1: UPLOAD VIA FILE MANAGER (MAIS FÁCIL)

### **Passo 1: Preparar Arquivos**

1. Abra o Finder no Mac
2. Navegue até: `/Users/charllestabordas/Documents/SISTEMA DE CONTAS`
3. Selecione **TODOS os arquivos e pastas** (exceto os listados acima)
4. Clique com botão direito → **"Comprimir"** (cria um ZIP)

### **Passo 2: Acessar Hostinger**

1. Acesse: **https://hpanel.hostinger.com**
2. Faça login
3. Vá em **"Files"** → **"File Manager"**

### **Passo 3: Navegar para Pasta do Domínio**

1. Clique em **"public_html"** (ou pasta do seu domínio)
2. Se quiser criar uma subpasta: **"New Folder"** → nome: `sistema-contas`

### **Passo 4: Fazer Upload**

1. Clique em **"Upload"** ou **"Upload Files"**
2. Selecione o arquivo ZIP que você criou
3. Aguarde upload completar
4. Clique com botão direito no ZIP → **"Extract"** (extrair)

### **Passo 5: Instalar Dependências**

1. Abra **Terminal SSH** (em "Advanced" → "SSH Access")
2. Execute:

```bash
cd public_html  # ou cd public_html/sistema-contas (se criou subpasta)
npm install
```

### **Passo 6: Configurar Variáveis de Ambiente**

1. No Terminal SSH, execute:

```bash
nano .env.production
```

2. Cole todas as variáveis:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
ASAAS_API_KEY=sua_chave_aqui
APIFACIL_INSTANCE_ID=seu_id_aqui
APIFACIL_TOKEN=seu_token_aqui
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

3. Salve: **Ctrl+X**, depois **Y**, depois **Enter**

### **Passo 7: Fazer Build**

```bash
npm run build
```

### **Passo 8: Iniciar Servidor**

**Opção A: Com PM2 (Recomendado)**

```bash
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 startup
```

**Opção B: Com Node.js App (Hostinger)**

1. Vá em **"Advanced"** → **"Node.js"**
2. Clique em **"Create Node.js App"**
3. Configure:
   - **Node.js Version:** `20.x`
   - **Application Root:** `/public_html` (ou `/public_html/sistema-contas`)
   - **Application Startup File:** `server.js` (ou deixe vazio)
   - **Application URL:** Seu domínio
4. Clique em **"Create"**

---

## 🚀 MÉTODO 2: VIA GIT (RECOMENDADO - MAIS RÁPIDO)

### **Passo 1: Conectar via SSH**

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

### **Passo 2: Navegar para Pasta**

```bash
cd public_html
```

### **Passo 3: Clonar Repositório**

```bash
# Remover arquivos antigos (se houver)
rm -rf *

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# (O ponto . clona direto na pasta atual)
```

### **Passo 4: Instalar e Configurar**

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis
nano .env.production
# (Cole as variáveis e salve)

# Fazer build
npm run build

# Iniciar com PM2
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

## ⚙️ CONFIGURAR NODE.JS NA HOSTINGER

### **Importante: Hostinger precisa ter suporte a Node.js!**

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Advanced"** → **"Node.js"**
3. Clique em **"Create Node.js App"**
4. Configure:
   - **Node.js Version:** `20.x` (ou mais recente)
   - **Application Root:** `/public_html` (ou pasta do projeto)
   - **Application Startup File:** `server.js` (ou deixe vazio se usar PM2)
   - **Application URL:** Seu domínio
5. Clique em **"Create"**

### **Configurar Variáveis de Ambiente:**

Na seção **"Environment Variables"**, adicione todas as variáveis:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ASAAS_API_KEY`
- `APIFACIL_INSTANCE_ID`
- `APIFACIL_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

---

## 🚨 IMPORTANTE - REQUISITOS HOSTINGER:

### **Planos que Funcionam:**
- ✅ **VPS** (Virtual Private Server)
- ✅ **Cloud Hosting**
- ✅ **Dedicated Server**

### **Planos que NÃO Funcionam:**
- ❌ **Shared Hosting** (não tem Node.js)

**Se você tem Shared Hosting, precisa fazer upgrade para VPS ou Cloud!**

---

## ✅ CHECKLIST FINAL:

- [ ] Arquivos enviados para Hostinger (ou clonado via Git)
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env.production` ou no painel)
- [ ] Node.js configurado na Hostinger (versão 20.x)
- [ ] Build feito (`npm run build`)
- [ ] Servidor iniciado (PM2 ou Node.js App)
- [ ] Domínio apontando para aplicação
- [ ] Testar aplicação no navegador

---

## 📝 RESUMO RÁPIDO:

1. **Enviar arquivos** (exceto `node_modules`, `.next`, `.git`)
2. **Instalar dependências:** `npm install`
3. **Configurar variáveis** de ambiente
4. **Fazer build:** `npm run build`
5. **Iniciar servidor:** PM2 ou Node.js App
6. **Testar:** Acesse seu domínio

---

**Pronto para fazer upload na Hostinger!** 🚀

Qual método você prefere usar? (Upload Manual ou Git)


