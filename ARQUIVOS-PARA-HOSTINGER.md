# 📦 ARQUIVOS PARA UPLOAD NA HOSTINGER

## ✅ ARQUIVOS QUE DEVEM SER ENVIADOS:

### **Estrutura de Pastas:**
```
SISTEMA DE CONTAS/
├── app/                    ✅ ENVIAR
├── components/             ✅ ENVIAR
├── lib/                    ✅ ENVIAR
├── hooks/                  ✅ ENVIAR
├── public/                 ✅ ENVIAR
├── scripts/                ✅ ENVIAR
├── pages/                  ✅ ENVIAR (se existir)
├── package.json            ✅ ENVIAR
├── package-lock.json       ✅ ENVIAR (se existir)
├── next.config.js          ✅ ENVIAR
├── tailwind.config.js      ✅ ENVIAR
├── tsconfig.json           ✅ ENVIAR
├── postcss.config.js       ✅ ENVIAR (se existir)
├── .nvmrc                  ✅ ENVIAR
├── vercel.json             ✅ ENVIAR (opcional)
├── README.md               ✅ ENVIAR
└── .env.production         ✅ ENVIAR (com variáveis de produção)
```

---

## ❌ ARQUIVOS QUE NÃO DEVEM SER ENVIADOS:

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
```

---

## 📋 MÉTODO 1: UPLOAD MANUAL (File Manager)

### **Passo a Passo:**

1. **Acessar Hostinger:**
   - Vá em: https://hpanel.hostinger.com
   - Faça login

2. **Abrir File Manager:**
   - Clique em **"Files"** → **"File Manager"**
   - Navegue até `public_html` (ou pasta do seu domínio)

3. **Criar Pasta do Projeto (Opcional):**
   - Clique em **"New Folder"**
   - Nome: `sistema-contas` (ou o nome que quiser)

4. **Fazer Upload:**
   - Clique em **"Upload"** ou **"Upload Files"**
   - Selecione **TODOS os arquivos e pastas** (exceto os listados acima)
   - Aguarde upload completar

5. **Instalar Dependências:**
   - Abra **Terminal SSH** (em "Advanced" → "SSH Access")
   - Execute:
     ```bash
     cd public_html/sistema-contas
     npm install
     ```

6. **Configurar Variáveis:**
   - Crie arquivo `.env.production` com todas as variáveis

7. **Fazer Build:**
   ```bash
   npm run build
   ```

8. **Iniciar Servidor:**
   ```bash
   npm start
   ```

---

## 📋 MÉTODO 2: VIA GIT (RECOMENDADO)

### **Passo a Passo:**

1. **Conectar via SSH:**
   ```bash
   ssh usuario@seu-dominio.com
   ```

2. **Navegar para pasta:**
   ```bash
   cd public_html
   ```

3. **Clonar Repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/sistema-de-contas.git .
   ```
   (O ponto `.` clona direto na pasta atual)

4. **Instalar Dependências:**
   ```bash
   npm install
   ```

5. **Configurar Variáveis:**
   ```bash
   nano .env.production
   ```
   (Adicione todas as variáveis e salve com Ctrl+X, Y, Enter)

6. **Fazer Build:**
   ```bash
   npm run build
   ```

7. **Iniciar com PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "sistema-contas" -- start
   pm2 save
   ```

---

## ⚠️ IMPORTANTE - HOSTINGER:

### **Requisitos:**
- ✅ **Plano VPS ou Cloud** (Shared Hosting não funciona com Next.js)
- ✅ **Node.js 20** instalado
- ✅ **PM2** para manter servidor rodando
- ✅ **Porta 3000** (ou outra) liberada

### **Configurar Node.js na Hostinger:**
1. Vá em **"Advanced"** → **"Node.js"**
2. **Node.js Version:** 20.x
3. **Application Root:** `/public_html` (ou pasta do projeto)
4. **Application Startup File:** `server.js` ou configure PM2
5. **Application URL:** Seu domínio

---

## 🔧 CONFIGURAR SERVIDOR NA HOSTINGER:

### **Opção 1: Usar server.js (Já existe)**

O projeto já tem `server.js`. Configure na Hostinger:
- **Startup File:** `server.js`
- **Port:** 3000

### **Opção 2: Usar PM2 (Recomendado)**

```bash
npm install -g pm2
pm2 start server.js --name "sistema-contas"
pm2 save
pm2 startup
```

---

## 📝 VARIÁVEIS DE AMBIENTE NECESSÁRIAS:

Crie arquivo `.env.production` na Hostinger com:

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

---

## ✅ CHECKLIST:

- [ ] Arquivos enviados para Hostinger
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Node.js configurado na Hostinger
- [ ] Build feito (`npm run build`)
- [ ] Servidor iniciado (`npm start` ou PM2)
- [ ] Domínio apontando para aplicação

---

**Pronto para upload na Hostinger!** 🚀


