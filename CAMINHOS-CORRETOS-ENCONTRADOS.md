# ✅ ARQUIVOS ENCONTRADOS - CAMINHOS CORRETOS

## 🎯 CAMINHOS ENCONTRADOS:

Vejo que os arquivos estão em **2 lugares possíveis**:

1. **`/root/domains/plenipay.com/public_html/`** ✅ (Parece ser o principal)
2. **`/var/www/plenipay/`** ✅ (Alternativo)

---

## ❌ ERRO COMUM:

Você tentou fazer `cd` em um **ARQUIVO** (`package.json`), mas precisa fazer `cd` em uma **PASTA**.

**Errado:**
```bash
cd /var/www/plenipay/.next/types/package.json  # ❌ Isso é um ARQUIVO
```

**Correto:**
```bash
cd /var/www/plenipay  # ✅ Isso é uma PASTA
```

---

## ✅ CAMINHOS CORRETOS PARA USAR:

### **OPÇÃO 1: `/root/domains/plenipay.com/public_html/`**

```bash
# Ir para pasta
cd /root/domains/plenipay.com/public_html

# Ver arquivos
ls -la

# Verificar se tem package.json na raiz
ls -la package.json
```

---

### **OPÇÃO 2: `/var/www/plenipay/`**

```bash
# Ir para pasta
cd /var/www/plenipay

# Ver arquivos
ls -la

# Verificar se tem package.json na raiz
ls -la package.json
```

---

## 🔍 VERIFICAR QUAL É O CORRETO:

Execute estes comandos para ver qual tem os arquivos do projeto:

### **Testar Opção 1:**

```bash
cd /root/domains/plenipay.com/public_html
ls -la
ls -la package.json
ls -la next.config.js
```

**Se aparecer `package.json` e `next.config.js`, este é o correto!** ✅

---

### **Testar Opção 2:**

```bash
cd /var/www/plenipay
ls -la
ls -la package.json
ls -la next.config.js
```

**Se aparecer `package.json` e `next.config.js`, este é o correto!** ✅

---

## 📋 SEQUÊNCIA COMPLETA:

Execute no terminal SSH (um comando por vez):

```bash
# 1. Tentar Opção 1 primeiro
cd /root/domains/plenipay.com/public_html

# 2. Ver arquivos
ls -la

# 3. Verificar se tem package.json na raiz
ls -la package.json

# 4. Se aparecer, este é o correto!
# Se não aparecer, tente Opção 2:
cd /var/www/plenipay
ls -la
ls -la package.json
```

---

## ✅ DEPOIS DE ENCONTRAR A PASTA CORRETA:

Quando você estiver na pasta correta (que tem `package.json` e `next.config.js` na raiz), execute:

```bash
# Verificar Node.js
node -v
npm -v

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
pm2 save
pm2 status
```

---

## 🎯 RESUMO:

1. ✅ **Arquivos encontrados!**
2. ✅ **Caminhos possíveis:**
   - `/root/domains/plenipay.com/public_html/`
   - `/var/www/plenipay/`
3. ✅ **Teste ambos** para ver qual tem os arquivos na raiz
4. ✅ **Use o que tiver `package.json` e `next.config.js` na raiz**

---

## ⚠️ IMPORTANTE:

- ❌ **NÃO faça `cd` em arquivos** (como `package.json`)
- ✅ **Faça `cd` em PASTAS** (como `/var/www/plenipay`)
- ✅ **A pasta correta tem `package.json` e `next.config.js` na raiz**

---

**Teste os dois caminhos acima e me diga qual tem os arquivos na raiz!** 🚀


