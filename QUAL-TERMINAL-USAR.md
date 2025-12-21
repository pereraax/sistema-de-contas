# 💻 QUAL TERMINAL USAR? MAC OU SERVIDOR?

## ✅ VOCÊ ESTÁ NO TERMINAL CORRETO!

O terminal que você está usando (`u596588143@br-asc-web818`) é o **TERMINAL SSH DO SERVIDOR HOSTINGER**.

**Isso está CORRETO!** ✅

---

## 🔍 POR QUE AS PASTAS NÃO EXISTEM?

As pastas `deploy-hostinger` e `public_html` não existem porque:

1. ❌ Os arquivos **ainda não foram enviados** para o servidor
2. ❌ Você precisa fazer **upload primeiro** via File Manager
3. ❌ OU clonar do GitHub direto no servidor

---

## 📋 ONDE EXECUTAR CADA COISA:

### **TERMINAL DO MAC (Local):**
- ✅ Conectar SSH: `ssh u596588143@185.239.210.34 -p 65002`
- ✅ Preparar arquivos localmente
- ❌ **NÃO** executar comandos do servidor aqui

### **TERMINAL SSH (Servidor - Onde você está agora):**
- ✅ Navegar pastas: `cd public_html`
- ✅ Instalar dependências: `npm install`
- ✅ Fazer build: `npm run build`
- ✅ Iniciar servidor: `pm2 start`
- ✅ **TODOS os comandos do deploy**

---

## 🚀 O QUE FAZER AGORA:

### **OPÇÃO 1: Fazer Upload via File Manager (Mais Fácil)**

#### **No Mac (Terminal ou Finder):**

1. Abra o Finder
2. Navegue até: `/Users/charllestabordas/Documents/SISTEMA DE CONTAS/deploy-hostinger`
3. Clique com botão direito → **"Comprimir"** (cria ZIP)

#### **No Navegador (Painel Hostinger):**

1. Acesse: https://hpanel.hostinger.com
2. Vá em **"Files"** → **"File Manager"**
3. Navegue até `public_html` (ou crie se não existir)
4. Clique em **"Upload"**
5. Selecione o arquivo `deploy-hostinger.zip`
6. Extraia o ZIP (botão direito → Extract)

#### **Voltar ao Terminal SSH (Servidor):**

Agora execute no terminal SSH (onde você está):

```bash
# Ver onde está
pwd

# Ir para public_html
cd public_html

# Ver arquivos
ls -la

# Se viu deploy-hostinger:
cd deploy-hostinger

# Ver arquivos
ls -la
```

---

### **OPÇÃO 2: Clonar do GitHub (Mais Rápido)**

No terminal SSH (onde você está agora), execute:

```bash
# Criar pasta public_html se não existir
mkdir -p public_html
cd public_html

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# Ver arquivos
ls -la
```

Agora os arquivos estarão lá!

---

## ✅ RESUMO:

### **Terminal do Mac:**
- Usar apenas para: **conectar SSH**
- Comando: `ssh u596588143@185.239.210.34 -p 65002`

### **Terminal SSH (Servidor - Onde você está):**
- Usar para: **TODOS os comandos do deploy**
- Comandos: `cd`, `npm install`, `npm run build`, `pm2 start`, etc.

---

## 🎯 AÇÃO IMEDIATA:

**Você tem 2 opções:**

### **Opção A: Upload Manual**
1. Comprimir pasta `deploy-hostinger` no Mac
2. Fazer upload via File Manager Hostinger
3. Extrair ZIP
4. Voltar ao terminal SSH e executar comandos

### **Opção B: Clonar GitHub (Recomendado)**
No terminal SSH (onde você está), execute:

```bash
mkdir -p public_html
cd public_html
git clone https://github.com/pereraax/sistema-de-contas.git .
ls -la
```

---

## 📝 SEQUÊNCIA COMPLETA:

### **1. No Terminal SSH (Onde você está):**

```bash
# Criar pasta se não existir
mkdir -p public_html

# Entrar na pasta
cd public_html

# Clonar do GitHub (ou fazer upload manual)
git clone https://github.com/pereraax/sistema-de-contas.git .

# Ver arquivos
ls -la

# Instalar dependências
npm install

# Criar variáveis de ambiente
nano .env.production
# (Cole variáveis e salve: Ctrl+X, Y, Enter)

# Fazer build
npm run build

# Instalar PM2
npm install -g pm2

# Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# Salvar
pm2 save
```

---

## ✅ CONCLUSÃO:

- ✅ Você está no terminal **CORRETO** (SSH do servidor)
- ❌ As pastas não existem porque arquivos não foram enviados
- ✅ **Solução:** Fazer upload OU clonar do GitHub
- ✅ **Recomendado:** Clonar do GitHub (mais rápido)

---

**Execute no terminal SSH (onde você está):**

```bash
mkdir -p public_html
cd public_html
git clone https://github.com/pereraax/sistema-de-contas.git .
```

Isso vai baixar todos os arquivos do GitHub direto no servidor! 🚀


