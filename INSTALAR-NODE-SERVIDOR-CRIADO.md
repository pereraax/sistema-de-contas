# 🔧 INSTALAR NODE.JS NO SERVIDOR JÁ CRIADO

## ✅ SEU SERVIDOR:

- **Sistema:** Ubuntu 22.04 LTS
- **Acesso SSH:** `root@31.97.27.20`
- **Status:** Servidor já criado e rodando

---

## 🚀 MÉTODO 1: INSTALAR NODE.JS 20 VIA NVM (RECOMENDADO)

### **Passo 1: Conectar via SSH**

No terminal do Mac, execute:

```bash
ssh root@31.97.27.20
```

Digite a senha root quando pedir.

---

### **Passo 2: Instalar NVM (Node Version Manager)**

Execute no servidor:

```bash
# Baixar e instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

---

### **Passo 3: Carregar NVM**

```bash
# Carregar NVM no terminal atual
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

---

### **Passo 4: Instalar Node.js 20**

```bash
# Instalar Node.js 20 (LTS)
nvm install 20

# Usar Node.js 20
nvm use 20

# Definir como padrão
nvm alias default 20
```

---

### **Passo 5: Verificar Instalação**

```bash
node -v
npm -v
```

**Deve mostrar:** `v20.x.x` e versão do npm

---

### **Passo 6: Tornar NVM Permanente**

Para que NVM funcione em novos terminais:

```bash
# Adicionar ao .bashrc
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Recarregar
source ~/.bashrc
```

---

## 🚀 MÉTODO 2: INSTALAR NODE.JS DIRETO (SEM NVM)

### **Passo 1: Atualizar Sistema**

```bash
apt update
apt upgrade -y
```

---

### **Passo 2: Instalar Node.js 20**

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt install -y nodejs
```

---

### **Passo 3: Verificar Instalação**

```bash
node -v
npm -v
```

---

## 📋 SEQUÊNCIA COMPLETA (MÉTODO 1 - RECOMENDADO):

Execute no terminal SSH (um comando por vez):

```bash
# 1. Conectar (se ainda não conectou)
ssh root@31.97.27.20

# 2. Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

# 3. Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 4. Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# 5. Verificar
node -v
npm -v

# 6. Tornar permanente
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

---

## ✅ DEPOIS DE INSTALAR NODE.JS:

### **1. Ir para pasta do projeto:**

```bash
cd /home/u596588143/domains/plenipay.com
```

### **2. Instalar dependências:**

```bash
npm install
```

Agora deve funcionar! ✅

### **3. Continuar com build:**

```bash
nano .env.production
# (Configure variáveis)
npm run build
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

## 🔍 VERIFICAR SE JÁ TEM NODE.JS:

Antes de instalar, verifique se já tem:

```bash
node -v
npm -v
which node
which npm
```

Se já tiver, mas versão antiga, use NVM para trocar:

```bash
nvm install 20
nvm use 20
```

---

## ⚠️ IMPORTANTE:

### **Se usar NVM:**

- Sempre carregue NVM antes de usar node/npm
- Ou adicione ao `.bashrc` para carregar automaticamente
- NVM permite ter múltiplas versões instaladas

### **Se instalar direto:**

- Node.js será instalado globalmente
- Mais simples, mas não permite múltiplas versões
- Funciona em todos os terminais automaticamente

---

## 🆘 PROBLEMAS COMUNS:

### **Erro: "command not found: nvm"**

**Solução:**
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### **Erro: "Permission denied"**

**Solução:**
- Você está como root, então não deve ter esse problema
- Se estiver como outro usuário, use `sudo`

---

## ✅ CHECKLIST:

- [ ] Conectei via SSH (`ssh root@31.97.27.20`)
- [ ] Instalei NVM ou Node.js direto
- [ ] Verifiquei versão (`node -v` mostra 20.x.x)
- [ ] Verifiquei npm (`npm -v` funciona)
- [ ] Fui para pasta do projeto
- [ ] Instalei dependências (`npm install`)
- [ ] Funcionou! ✅

---

## 📝 RESUMO RÁPIDO:

1. ✅ Conecte: `ssh root@31.97.27.20`
2. ✅ Instale NVM: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash`
3. ✅ Carregue: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
4. ✅ Instale Node 20: `nvm install 20 && nvm use 20 && nvm alias default 20`
5. ✅ Verifique: `node -v`
6. ✅ Instale dependências: `cd /home/u596588143/domains/plenipay.com && npm install`

---

**Execute os comandos acima no servidor para instalar Node.js 20!** 🚀


