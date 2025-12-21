# 🔐 CONECTAR SSH HOSTINGER - SEUS DADOS

## ✅ SUAS CREDENCIAIS SSH:

```
IP: 185.239.210.34
Porta: 65002
Usuário: u596588143
Senha: [Clique em "Alterar" para ver/definir senha]
```

---

## 🚀 PASSO A PASSO PARA CONECTAR:

### **Passo 1: Ver/Definir Senha**

1. Na tela que você está vendo, clique no botão **"Alterar"** ao lado de "Senha"
2. Se já tem senha, ela será mostrada
3. Se não tem, defina uma senha nova
4. **ANOTE A SENHA!** Você vai precisar dela

---

### **Passo 2: Abrir Terminal no Mac**

1. Pressione **Cmd + Espaço** (Command + Barra de Espaço)
2. Digite: `Terminal`
3. Pressione **Enter**

O Terminal vai abrir.

---

### **Passo 3: Conectar via SSH**

No Terminal, execute este comando:

```bash
ssh u596588143@185.239.210.34 -p 65002
```

**Ou usando o hostname:**

```bash
ssh u596588143@ssh.hostinger.com -p 65002
```

---

### **Passo 4: Inserir Senha**

Quando aparecer:

```
u596588143@185.239.210.34's password:
```

1. Digite a senha que você anotou
2. **IMPORTANTE:** A senha não aparece enquanto você digita (é normal!)
3. Pressione **Enter**

---

### **Passo 5: Confirmar Conexão**

Se conectou com sucesso, você verá algo como:

```
Welcome to Hostinger!
[u596588143@hostinger ~]$
```

**✅ Pronto! Você está conectado!**

---

## 📋 DEPOIS DE CONECTAR - COMANDOS PARA DEPLOY:

### **1. Ir para pasta do domínio:**

```bash
cd public_html
```

### **2. Ver arquivos enviados:**

```bash
ls -la
```

Você deve ver os arquivos que você fez upload (ou a pasta `deploy-hostinger` se extraiu o ZIP).

### **3. Se você extraiu o ZIP:**

```bash
# Se extraiu o ZIP, entre na pasta
cd deploy-hostinger
```

### **4. Instalar dependências:**

```bash
npm install
```

Isso vai demorar alguns minutos. Aguarde terminar.

### **5. Verificar versão Node.js:**

```bash
node -v
```

**Deve mostrar:** `v20.x.x` ou superior

Se mostrar versão antiga, você precisa configurar Node.js no painel Hostinger.

### **6. Criar arquivo de variáveis de ambiente:**

```bash
nano .env.production
```

**Cole estas variáveis (substitua pelos seus valores reais):**

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
ASAAS_API_KEY=sua_chave_asaas
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

**Para salvar:**
1. Pressione **Ctrl+X**
2. Depois pressione **Y**
3. Depois pressione **Enter**

### **7. Fazer build:**

```bash
npm run build
```

Isso vai demorar alguns minutos. Aguarde terminar.

### **8. Instalar PM2 (para manter servidor rodando):**

```bash
npm install -g pm2
```

### **9. Iniciar servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
```

### **10. Salvar configuração PM2:**

```bash
pm2 save
```

### **11. Ver status do servidor:**

```bash
pm2 status
```

Você deve ver o servidor rodando!

### **12. Ver logs (opcional):**

```bash
pm2 logs sistema-contas
```

---

## 🔄 COMANDO COMPLETO (COPIE E COLE):

```bash
# Conectar SSH
ssh u596588143@185.239.210.34 -p 65002

# Depois de conectar, execute:
cd public_html
npm install
nano .env.production
# (Cole variáveis e salve: Ctrl+X, Y, Enter)
npm run build
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## ⚠️ IMPORTANTE:

### **Sobre a Senha:**

- Se você não tem senha ou não lembra, clique em **"Alterar"** na tela SSH
- Defina uma senha nova e anote
- A senha não aparece enquanto você digita no Terminal (é normal!)

### **Sobre Node.js:**

- Se `node -v` mostrar versão antiga (menor que 20), você precisa:
  1. Ir em **"Advanced"** → **"Node.js"** no painel Hostinger
  2. Criar uma **Node.js App**
  3. Escolher versão **20.x**

---

## ✅ CHECKLIST:

- [ ] Vi/defini a senha SSH (cliquei em "Alterar")
- [ ] Anotei a senha
- [ ] Abri Terminal no Mac
- [ ] Executei: `ssh u596588143@185.239.210.34 -p 65002`
- [ ] Digitei a senha
- [ ] Conectei com sucesso
- [ ] Naveguei para `public_html`
- [ ] Instalei dependências (`npm install`)
- [ ] Criei `.env.production`
- [ ] Fiz build (`npm run build`)
- [ ] Instalei PM2
- [ ] Iniciei servidor
- [ ] Verifiquei que está rodando

---

## 🆘 PROBLEMAS COMUNS:

### **Erro: "Permission denied"**

**Solução:**
- Verifique se a senha está correta
- Tente clicar em "Alterar" e definir uma senha nova
- Certifique-se de não ter espaços extras ao copiar/colar

### **Erro: "Connection refused"**

**Solução:**
- Verifique se a porta está correta: `65002`
- Tente usar o IP direto: `185.239.210.34`
- Verifique se SSH está habilitado no seu plano

### **Erro: "command not found: npm"**

**Solução:**
- Configure Node.js no painel Hostinger
- Vá em **"Advanced"** → **"Node.js"** → **"Create Node.js App"**
- Escolha versão 20.x

---

**Agora você tem tudo para conectar!** 🚀

Siga os passos acima e me avise se tiver alguma dúvida!


