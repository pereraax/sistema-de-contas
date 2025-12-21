# ❌ NPM NÃO ENCONTRADO - SOLUÇÃO

## 🔍 PROBLEMA:

O erro `npm: command not found` significa que **Node.js não está instalado** ou não está no PATH do servidor.

---

## ✅ SOLUÇÃO 1: CONFIGURAR NODE.JS NO PAINEL HOSTINGER (RECOMENDADO)

### **Passo 1: Acessar Painel Hostinger**

1. Acesse: **https://hpanel.hostinger.com**
2. Faça login

### **Passo 2: Configurar Node.js**

1. Vá em **"Advanced"** → **"Node.js"**
2. Clique em **"Create Node.js App"** ou **"Add Node.js App"**

### **Passo 3: Configurar Aplicação**

Preencha os campos:

- **Node.js Version:** `20.x` (ou a mais recente disponível)
- **Application Root:** `/home/u596588143/domains/plenipay.com`
- **Application Startup File:** `server.js` (ou deixe vazio se usar PM2)
- **Application URL:** `https://plenipay.com` (ou seu domínio)
- **Port:** `3000` (ou outra porta disponível)

### **Passo 4: Criar Aplicação**

1. Clique em **"Create"** ou **"Save"**
2. Aguarde a criação

### **Passo 5: Verificar se Funcionou**

Volte ao terminal SSH e execute:

```bash
node -v
npm -v
```

Agora deve mostrar as versões!

---

## ✅ SOLUÇÃO 2: INSTALAR NODE.JS MANUALMENTE (AVANÇADO)

Se a Solução 1 não funcionar, instale manualmente:

### **Usando NVM (Node Version Manager):**

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar
node -v
npm -v
```

### **Adicionar ao PATH permanentemente:**

```bash
# Adicionar ao .bashrc
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Recarregar
source ~/.bashrc

# Verificar
node -v
npm -v
```

---

## ✅ SOLUÇÃO 3: USAR NODE.JS DO PAINEL (MAIS FÁCIL)

Alguns planos Hostinger têm Node.js pré-instalado, mas precisa ser ativado:

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Advanced"** → **"Node.js"**
3. Se ver opção **"Enable Node.js"**, clique
4. Escolha versão **20.x**
5. Salve

---

## 🔍 VERIFICAR SE JÁ ESTÁ INSTALADO:

Execute no terminal SSH:

```bash
# Verificar se node existe em algum lugar
which node
which npm

# Verificar se está no PATH
echo $PATH

# Procurar por node
find /usr -name "node" 2>/dev/null
find /opt -name "node" 2>/dev/null

# Verificar versões alternativas
/usr/bin/node -v 2>/dev/null
/usr/local/bin/node -v 2>/dev/null
```

---

## 📋 DEPOIS DE INSTALAR NODE.JS:

Quando `node -v` e `npm -v` funcionarem, execute:

```bash
# Ir para pasta do projeto
cd /home/u596588143/domains/plenipay.com

# Instalar dependências
npm install

# Verificar se funcionou
ls -la node_modules
```

---

## ⚠️ IMPORTANTE:

### **Requisitos do Plano:**

- ✅ **VPS/Cloud:** Tem suporte a Node.js
- ❌ **Shared Hosting:** Não tem Node.js (precisa fazer upgrade)

### **Se seu plano não tem Node.js:**

Você precisa fazer upgrade para VPS ou Cloud Hosting.

---

## 🚀 SOLUÇÃO RÁPIDA (RECOMENDADA):

1. **Acesse painel Hostinger:**
   - https://hpanel.hostinger.com
   - **"Advanced"** → **"Node.js"**

2. **Crie Node.js App:**
   - Versão: **20.x**
   - Root: `/home/u596588143/domains/plenipay.com`
   - Startup: `server.js`

3. **Volte ao terminal e teste:**
   ```bash
   node -v
   npm -v
   ```

4. **Se funcionar, instale dependências:**
   ```bash
   cd /home/u596588143/domains/plenipay.com
   npm install
   ```

---

## ✅ CHECKLIST:

- [ ] Acessei painel Hostinger
- [ ] Fui em "Advanced" → "Node.js"
- [ ] Criei Node.js App (versão 20.x)
- [ ] Configurei Application Root
- [ ] Voltei ao terminal SSH
- [ ] Executei `node -v` (funcionou!)
- [ ] Executei `npm -v` (funcionou!)
- [ ] Executei `npm install` (funcionou!)

---

**Configure Node.js no painel Hostinger primeiro!** 🚀

Depois volte ao terminal e tente `npm install` novamente.


