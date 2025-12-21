# 📦 O QUE ENVIAR PARA HOSTINGER - GUIA COMPLETO

## ✅ BUILD CONCLUÍDO COM SUCESSO!

O build foi bem-sucedido! Agora você precisa enviar os arquivos corretos para a Hostinger.

---

## 📋 ARQUIVOS QUE DEVEM SER ENVIADOS ✅

### **Estrutura Completa:**

```
sistema-de-contas/
├── app/                    ✅ ENVIAR (todo o conteúdo)
├── components/             ✅ ENVIAR (todo o conteúdo)
├── lib/                    ✅ ENVIAR (todo o conteúdo)
├── hooks/                  ✅ ENVIAR (todo o conteúdo)
├── public/                 ✅ ENVIAR (todo o conteúdo)
├── pages/                   ✅ ENVIAR (se existir)
├── types/                  ✅ ENVIAR (se existir)
├── scripts/                ✅ ENVIAR (se existir)
│
├── package.json            ✅ ENVIAR (OBRIGATÓRIO)
├── package-lock.json       ✅ ENVIAR (se existir)
├── next.config.js          ✅ ENVIAR (OBRIGATÓRIO)
├── tailwind.config.js      ✅ ENVIAR (OBRIGATÓRIO)
├── tsconfig.json           ✅ ENVIAR (OBRIGATÓRIO)
├── postcss.config.js       ✅ ENVIAR (se existir)
├── .nvmrc                  ✅ ENVIAR (recomendado)
├── server.js               ✅ ENVIAR (se existir)
├── vercel.json             ✅ ENVIAR (opcional)
│
└── .env.production         ✅ ENVIAR (com variáveis de produção)
```

---

## ❌ ARQUIVOS QUE NÃO DEVEM SER ENVIADOS

```
❌ node_modules/           (será instalado no servidor)
❌ .next/                  (será gerado no servidor)
❌ .git/                   (controle de versão)
❌ .env.local              (variáveis locais)
❌ .env.development.local  (variáveis de desenvolvimento)
❌ .cache/                 (cache)
❌ .turbo/                 (cache)
❌ *.log                   (logs)
❌ .DS_Store               (arquivos do macOS)
❌ deploy-essencial/       (pastas de teste)
❌ deploy-essencial-1/      (pastas de teste)
❌ whatsapp_auth_webjs/   (cache do WhatsApp)
```

---

## 🚀 MÉTODO 1: UPLOAD MANUAL (File Manager)

### **Passo 1: Preparar Arquivos**

1. **Criar uma pasta temporária** (opcional, para organizar):
   ```bash
   mkdir ~/Desktop/sistema-contas-upload
   ```

2. **Copiar apenas os arquivos necessários:**
   ```bash
   cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
   
   # Copiar estrutura (excluindo node_modules, .next, .git)
   rsync -av --exclude 'node_modules' \
              --exclude '.next' \
              --exclude '.git' \
              --exclude '.cache' \
              --exclude '.turbo' \
              --exclude 'deploy-essencial' \
              --exclude 'deploy-essencial-1' \
              --exclude 'whatsapp_auth_webjs' \
              --exclude '*.log' \
              --exclude '.DS_Store' \
              . ~/Desktop/sistema-contas-upload/
   ```

### **Passo 2: Acessar Hostinger File Manager**

1. Acesse: **https://hpanel.hostinger.com**
2. Faça login
3. Vá em **"Files"** → **"File Manager"**
4. Navegue até `public_html` (ou pasta do seu domínio)

### **Passo 3: Fazer Upload**

1. Clique em **"Upload"** ou **"Upload Files"**
2. Selecione **TODA a pasta** `sistema-contas-upload` (ou arquivos individuais)
3. Aguarde upload completar

### **Passo 4: Instalar Dependências (via SSH)**

1. Acesse **Terminal SSH** (em "Advanced" → "SSH Access")
2. Execute:

```bash
cd public_html
npm install
```

### **Passo 5: Configurar Variáveis de Ambiente**

```bash
nano .env.production
```

Cole todas as variáveis:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_chave
ASAAS_API_KEY=sua_chave
APIFACIL_INSTANCE_ID=seu_id
APIFACIL_TOKEN=seu_token
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

Salve com: **Ctrl+X**, depois **Y**, depois **Enter**

### **Passo 6: Fazer Build no Servidor**

```bash
npm run build
```

### **Passo 7: Iniciar Servidor**

```bash
# Instalar PM2 (se não tiver)
npm install -g pm2

# Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# Salvar configuração
pm2 save

# Configurar para iniciar automaticamente
pm2 startup
```

---

## 🚀 MÉTODO 2: VIA GIT (RECOMENDADO - MAIS FÁCIL)

### **Passo 1: Conectar via SSH**

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

### **Passo 2: Navegar para pasta do domínio**

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

Siga os passos 4, 5, 6 e 7 do Método 1 acima.

---

## 📋 CHECKLIST COMPLETO

### **Antes de Enviar:**
- [ ] Build local funcionando (`npm run build`)
- [ ] Arquivos preparados (sem node_modules, .next, .git)
- [ ] Variáveis de ambiente anotadas

### **Upload:**
- [ ] Arquivos enviados para Hostinger
- [ ] Estrutura de pastas correta

### **Configuração no Servidor:**
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env.production`)
- [ ] Node.js configurado na Hostinger (versão 20)
- [ ] Build feito no servidor (`npm run build`)
- [ ] Servidor iniciado (PM2 ou Node.js App)

### **Teste:**
- [ ] Aplicação acessível no domínio
- [ ] Páginas carregando corretamente
- [ ] Conexão com banco funcionando

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

Na seção **"Environment Variables"**, adicione todas as variáveis necessárias.

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

## 📝 RESUMO RÁPIDO:

1. ✅ **Build concluído** (já feito!)
2. 📤 **Enviar arquivos** (exceto node_modules, .next, .git)
3. 🔧 **Instalar dependências** (`npm install`)
4. ⚙️ **Configurar variáveis** (`.env.production`)
5. 🏗️ **Fazer build no servidor** (`npm run build`)
6. 🚀 **Iniciar servidor** (PM2 ou Node.js App)

---

**Pronto para fazer upload na Hostinger!** 🚀
