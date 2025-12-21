# 📁 PASTA PUBLIC_HTML NÃO EXISTE - SOLUÇÃO

## ✅ VOCÊ ESTÁ CONECTADO AO SERVIDOR!

Vejo que você está como `root@srv1156401`, o que significa que está conectado.

A pasta `public_html` não existe ainda. Vamos criar e encontrar seus arquivos!

---

## 🔍 PASSO 1: VERIFICAR ONDE ESTÃO OS ARQUIVOS

Execute estes comandos para encontrar seus arquivos:

```bash
# Ver onde está
pwd

# Ver arquivos na pasta atual
ls -la

# Procurar por next.config.js (arquivo do seu projeto)
find /home -name "next.config.js" 2>/dev/null

# Procurar por package.json
find /home -name "package.json" 2>/dev/null

# Ver estrutura de pastas home
ls -la /home
```

---

## 📁 PASSO 2: CRIAR PASTA PUBLIC_HTML

Se os arquivos estão em outro lugar, vamos criar a estrutura:

```bash
# Criar pasta public_html
mkdir -p /home/public_html

# OU criar na pasta home do usuário
mkdir -p ~/public_html

# Verificar se foi criada
ls -la ~
```

---

## 🔍 PASSO 3: ENCONTRAR ONDE VOCÊ ENVIOU OS ARQUIVOS

Os arquivos podem estar em:

1. **Pasta do usuário web:**
   ```bash
   ls -la /home/u596588143
   ```

2. **Pasta www ou html:**
   ```bash
   ls -la /var/www
   ls -la /var/www/html
   ```

3. **Pasta domains:**
   ```bash
   find / -type d -name "domains" 2>/dev/null
   ```

---

## 📋 PASSO 4: VERIFICAR FILE MANAGER

Se você enviou via File Manager da Hostinger, os arquivos podem estar em:

```bash
# Ver todas as pastas principais
ls -la /

# Ver pasta home do usuário
ls -la /home

# Procurar por pastas comuns
ls -la /home/*/public_html 2>/dev/null
ls -la /home/*/domains 2>/dev/null
```

---

## 🚀 SOLUÇÃO RÁPIDA: CRIAR ESTRUTURA

Execute estes comandos na ordem:

```bash
# 1. Ver onde está
pwd

# 2. Ver arquivos na pasta atual
ls -la

# 3. Procurar arquivos do projeto
find /home -name "package.json" -o -name "next.config.js" 2>/dev/null | head -5

# 4. Se não encontrar, criar estrutura
mkdir -p ~/public_html
cd ~/public_html

# 5. Ver se há arquivos aqui
ls -la
```

---

## 📦 SE OS ARQUIVOS ESTÃO NO FILE MANAGER

Se você enviou via File Manager, eles podem estar em uma pasta específica do domínio.

Execute:

```bash
# Ver todas as pastas em /home
ls -la /home

# Ver pasta do seu usuário (se existir)
ls -la /home/u596588143 2>/dev/null

# Procurar por domínios
find /home -type d -name "*domains*" 2>/dev/null
```

---

## ✅ SOLUÇÃO ALTERNATIVA: CLONAR DO GITHUB

Se não encontrar os arquivos, clone direto do GitHub:

```bash
# Criar pasta
mkdir -p ~/public_html
cd ~/public_html

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# Ver arquivos
ls -la
```

---

## 📝 COMANDOS PARA EXECUTAR AGORA:

Execute estes comandos no terminal SSH (um de cada vez):

```bash
# 1. Ver onde está
pwd

# 2. Ver arquivos
ls -la

# 3. Procurar arquivos do projeto
find /home -name "next.config.js" 2>/dev/null

# 4. Ver estrutura
ls -la /home

# 5. Criar pasta se necessário
mkdir -p ~/public_html
cd ~/public_html
ls -la
```

---

## 🆘 SE AINDA NÃO ENCONTRAR:

Execute este comando para ver TODAS as pastas:

```bash
find / -type d -name "public_html" 2>/dev/null
```

Isso mostra TODAS as pastas `public_html` no servidor.

---

**Execute os comandos acima para encontrar seus arquivos!** 🔍


