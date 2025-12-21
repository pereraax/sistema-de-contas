# 🚀 PRÓXIMOS PASSOS COMPLETOS - HOSTINGER

## ✅ PASSO 1: ARQUIVOS PREPARADOS

Os arquivos foram preparados em:
```
~/Desktop/sistema-contas-upload
```

**Total:** 561 arquivos prontos para upload!

---

## 📋 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### **2.1. Abrir a pasta:**

1. Abra o **Finder**
2. Vá em **Desktop** → **sistema-contas-upload**
3. Abra o arquivo **`.env.production`** com um editor de texto

### **2.2. Preencher as variáveis:**

Edite o arquivo e adicione seus valores reais:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
ASAAS_API_KEY=sua_chave_asaas_aqui
APIFACIL_INSTANCE_ID=seu_instance_id_aqui
APIFACIL_TOKEN=seu_token_apifacil_aqui
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

**Salve o arquivo!**

---

## 📤 PASSO 3: FAZER UPLOAD NA HOSTINGER

### **3.1. Acessar Hostinger:**

1. Acesse: **https://hpanel.hostinger.com**
2. Faça login na sua conta

### **3.2. Abrir File Manager:**

1. Clique em **"Files"** no menu lateral
2. Clique em **"File Manager"**
3. Navegue até **`public_html`** (ou pasta do seu domínio)

### **3.3. Fazer Upload:**

1. Clique no botão **"Upload"** ou **"Upload Files"**
2. Selecione **TODA a pasta** `sistema-contas-upload` do Desktop
   - Ou selecione todos os arquivos dentro dela
3. Aguarde o upload completar (pode demorar alguns minutos)

---

## 🔧 PASSO 4: CONFIGURAR NO SERVIDOR (SSH)

### **4.1. Acessar SSH:**

1. Na Hostinger, vá em **"Advanced"** → **"SSH Access"**
2. Anote suas credenciais:
   - **Host:** (ex: `ssh.hostinger.com`)
   - **Port:** (geralmente `65002`)
   - **Username:** (seu usuário)
   - **Password:** (sua senha)

### **4.2. Conectar via Terminal:**

Abra o terminal no Mac e execute:

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

(Substitua pelos seus dados reais)

### **4.3. Navegar para pasta do projeto:**

```bash
cd public_html
```

### **4.4. Instalar Dependências:**

```bash
npm install
```

**Isso pode demorar alguns minutos!**

### **4.5. Configurar Variáveis de Ambiente:**

```bash
nano .env.production
```

Cole todas as variáveis que você configurou no Passo 2.

Salve com: **Ctrl+X**, depois **Y**, depois **Enter**

### **4.6. Fazer Build:**

```bash
npm run build
```

**Isso pode demorar 5-10 minutos!**

### **4.7. Instalar PM2:**

```bash
npm install -g pm2
```

### **4.8. Iniciar Servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 startup
```

---

## ⚙️ PASSO 5: CONFIGURAR NODE.JS NA HOSTINGER

### **5.1. Acessar Node.js:**

1. Na Hostinger, vá em **"Advanced"** → **"Node.js"**

### **5.2. Criar Aplicação Node.js:**

1. Clique em **"Create Node.js App"**
2. Configure:
   - **Node.js Version:** `20.x` (ou mais recente)
   - **Application Root:** `/public_html`
   - **Application Startup File:** `server.js`
   - **Application URL:** Seu domínio (ex: `https://seu-dominio.com`)
3. Clique em **"Create"**

### **5.3. Configurar Variáveis de Ambiente:**

Na seção **"Environment Variables"**, adicione todas as variáveis do `.env.production`.

---

## ✅ PASSO 6: TESTAR APLICAÇÃO

### **6.1. Acessar no Navegador:**

Abra seu navegador e acesse:
```
https://seu-dominio.com
```

### **6.2. Verificar se está funcionando:**

- ✅ Página inicial carrega
- ✅ Login funciona
- ✅ Conexão com banco funciona
- ✅ Sem erros no console

---

## 🚨 IMPORTANTE - REQUISITOS:

### **Planos que Funcionam:**
- ✅ **VPS** (Virtual Private Server)
- ✅ **Cloud Hosting**
- ✅ **Dedicated Server**

### **Planos que NÃO Funcionam:**
- ❌ **Shared Hosting** (não tem Node.js)

**Se você tem Shared Hosting, precisa fazer upgrade!**

---

## 📋 CHECKLIST FINAL:

- [ ] Arquivos preparados em `~/Desktop/sistema-contas-upload`
- [ ] Variáveis de ambiente configuradas (`.env.production`)
- [ ] Upload feito na Hostinger
- [ ] Conectado via SSH
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis configuradas no servidor
- [ ] Build feito (`npm run build`)
- [ ] PM2 instalado e servidor iniciado
- [ ] Node.js configurado na Hostinger
- [ ] Aplicação acessível no domínio

---

## 🆘 PROBLEMAS COMUNS:

### **Erro: "npm: command not found"**
- Node.js não está instalado na Hostinger
- Verifique se tem plano VPS/Cloud

### **Erro: "Cannot find module"**
- Execute `npm install` novamente

### **Erro: "Port 3000 already in use"**
- Pare o servidor anterior: `pm2 stop sistema-contas`
- Ou use outra porta

### **Aplicação não carrega**
- Verifique se PM2 está rodando: `pm2 list`
- Verifique logs: `pm2 logs sistema-contas`

---

## 📞 PRÓXIMOS PASSOS:

1. ✅ Configurar variáveis de ambiente
2. ✅ Fazer upload na Hostinger
3. ✅ Configurar no servidor
4. ✅ Testar aplicação

---

**Pronto para fazer upload!** 🚀

Se tiver dúvidas em algum passo, me avise!
