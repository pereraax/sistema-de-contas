# 💻 COMANDOS SSH HOSTINGER - GUIA RÁPIDO

## 🔐 CONECTAR SSH

```bash
ssh usuario@ssh.hostinger.com -p 65002
```

**Substitua:**
- `usuario` = Seu username (ex: `u123456789`)
- `65002` = Porta SSH (verifique no painel)
- `ssh.hostinger.com` = Host SSH (pode variar)

---

## 📁 NAVEGAÇÃO BÁSICA

```bash
# Ver onde está
pwd

# Listar arquivos
ls -la

# Entrar em pasta
cd public_html

# Voltar pasta anterior
cd ..

# Ir para pasta home
cd ~
```

---

## 📦 COMANDOS PARA DEPLOY

### **1. Navegar para pasta do projeto:**

```bash
cd public_html
```

### **2. Ver arquivos enviados:**

```bash
ls -la
```

### **3. Instalar dependências:**

```bash
npm install
```

### **4. Verificar versão Node.js:**

```bash
node -v
npm -v
```

**Deve mostrar:** `v20.x.x`

### **5. Criar arquivo de variáveis:**

```bash
nano .env.production
```

**Cole as variáveis:**

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

**Salvar:** Ctrl+X, depois Y, depois Enter

### **6. Fazer build:**

```bash
npm run build
```

### **7. Verificar se build funcionou:**

```bash
ls -la .next
```

---

## 🚀 INICIAR SERVIDOR

### **Opção A: PM2 (Recomendado)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# Ver status
pm2 status

# Ver logs
pm2 logs sistema-contas

# Salvar configuração
pm2 save

# Configurar para iniciar automaticamente
pm2 startup
```

### **Opção B: Node.js Direto (Teste)**

```bash
npm start
```

(Pressione Ctrl+C para parar)

---

## 📊 COMANDOS ÚTEIS

### **Ver processos rodando:**

```bash
ps aux | grep node
```

### **Ver uso de memória:**

```bash
free -h
```

### **Ver espaço em disco:**

```bash
df -h
```

### **Ver logs do servidor:**

```bash
# Se usar PM2
pm2 logs sistema-contas

# Se usar Node.js direto
tail -f logs/app.log
```

### **Reiniciar servidor (PM2):**

```bash
pm2 restart sistema-contas
```

### **Parar servidor (PM2):**

```bash
pm2 stop sistema-contas
```

### **Desconectar SSH:**

```bash
exit
```

ou pressione **Ctrl+D**

---

## 🔧 RESOLVER PROBLEMAS

### **Erro: "command not found: npm"**

**Solução:**
```bash
# Verificar se Node.js está instalado
which node
which npm

# Se não estiver, instalar Node.js via Hostinger
# Vá em "Advanced" → "Node.js" → "Create Node.js App"
```

### **Erro: "Permission denied"**

**Solução:**
```bash
# Dar permissão de execução
chmod +x server.js

# Ou usar sudo (se necessário)
sudo npm install -g pm2
```

### **Erro: "Port already in use"**

**Solução:**
```bash
# Ver qual processo está usando a porta
lsof -i :3000

# Matar processo (substitua PID pelo número)
kill -9 PID
```

---

## 📝 SEQUÊNCIA COMPLETA DE DEPLOY

```bash
# 1. Conectar SSH
ssh usuario@ssh.hostinger.com -p 65002

# 2. Ir para pasta do projeto
cd public_html

# 3. Verificar arquivos
ls -la

# 4. Instalar dependências
npm install

# 5. Criar variáveis de ambiente
nano .env.production
# (Cole variáveis e salve)

# 6. Fazer build
npm run build

# 7. Instalar PM2
npm install -g pm2

# 8. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# 9. Salvar configuração
pm2 save

# 10. Ver status
pm2 status

# 11. Ver logs
pm2 logs sistema-contas
```

---

## ✅ CHECKLIST:

- [ ] Conectei via SSH
- [ ] Naveguei para `public_html`
- [ ] Instalei dependências (`npm install`)
- [ ] Criei `.env.production`
- [ ] Fiz build (`npm run build`)
- [ ] Instalei PM2
- [ ] Iniciei servidor
- [ ] Verifiquei que está rodando

---

**Guia completo de comandos SSH!** 🚀


