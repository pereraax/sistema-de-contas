# 🚀 PRÓXIMOS PASSOS - HOSTINGER

## ✅ REPOSITÓRIO CRIADO COM SUCESSO!

**Repositório:** https://github.com/pereraax/sistema-de-contas

Todo o código foi enviado para o GitHub! 🎉

---

## 📋 AGORA: FAZER UPLOAD NA HOSTINGER

Você tem **2 opções** para colocar o código na Hostinger:

---

## 🔹 OPÇÃO 1: VIA GIT (RECOMENDADO - MAIS FÁCIL)

### **Passo 1: Acessar SSH da Hostinger**

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Advanced"** → **"SSH Access"**
3. Anote suas credenciais SSH:
   - **Host:** (ex: `ssh.hostinger.com`)
   - **Port:** (geralmente `65002`)
   - **Username:** (seu usuário)
   - **Password:** (sua senha)

### **Passo 2: Conectar via SSH**

Abra o terminal e execute:

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

(Substitua pelos seus dados reais)

### **Passo 3: Navegar para pasta do domínio**

```bash
cd public_html
# ou
cd public_html/seu-dominio.com
```

### **Passo 4: Clonar Repositório**

```bash
# Remover arquivos antigos (se houver)
rm -rf *

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# (O ponto . clona direto na pasta atual)
```

### **Passo 5: Instalar Dependências**

```bash
npm install
```

### **Passo 6: Configurar Variáveis de Ambiente**

```bash
nano .env.production
```

Cole todas as variáveis necessárias:

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

### **Passo 7: Fazer Build**

```bash
npm run build
```

### **Passo 8: Iniciar Servidor com PM2**

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

## 🔹 OPÇÃO 2: UPLOAD MANUAL (File Manager)

### **Passo 1: Preparar Arquivos**

**NÃO envie:**
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.git/`
- ❌ `*.zip`
- ❌ `deploy-essencial/`
- ❌ `whatsapp_auth_webjs/`

**ENVIE:**
- ✅ `app/`
- ✅ `components/`
- ✅ `lib/`
- ✅ `public/`
- ✅ `package.json`
- ✅ `next.config.js`
- ✅ `tailwind.config.js`
- ✅ `tsconfig.json`
- ✅ Todos os outros arquivos de configuração

### **Passo 2: Fazer Upload**

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Files"** → **"File Manager"**
3. Navegue até `public_html` (ou pasta do seu domínio)
4. Clique em **"Upload"**
5. Selecione todos os arquivos (exceto os listados acima)
6. Aguarde upload completar

### **Passo 3: Instalar Dependências**

1. Abra **Terminal SSH** (em "Advanced" → "SSH Access")
2. Execute:

```bash
cd public_html
npm install
```

### **Passo 4: Configurar e Build**

Siga os passos 6, 7 e 8 da Opção 1 acima.

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

Na seção **"Environment Variables"**, adicione:
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

- [x] Repositório criado no GitHub
- [x] Código enviado (push)
- [ ] Acessar Hostinger
- [ ] Conectar via SSH (ou fazer upload manual)
- [ ] Clonar repositório (ou fazer upload)
- [ ] Instalar dependências (`npm install`)
- [ ] Configurar variáveis de ambiente
- [ ] Configurar Node.js na Hostinger
- [ ] Fazer build (`npm run build`)
- [ ] Iniciar servidor (PM2 ou Node.js App)
- [ ] Testar aplicação

---

## 🔗 LINKS ÚTEIS:

- **Repositório GitHub:** https://github.com/pereraax/sistema-de-contas
- **Hostinger Panel:** https://hpanel.hostinger.com
- **Documentação Next.js:** https://nextjs.org/docs

---

## 📞 PRÓXIMOS PASSOS:

1. **Acesse a Hostinger** e verifique se tem plano VPS/Cloud
2. **Escolha uma opção** (Git ou Upload Manual)
3. **Siga os passos** acima
4. **Teste a aplicação** no seu domínio

---

**Pronto para fazer upload na Hostinger!** 🚀

Se tiver dúvidas, me avise!


