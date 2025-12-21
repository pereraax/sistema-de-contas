# 📁 NAVEGAR PASTAS SSH - ONDE ESTÃO OS ARQUIVOS?

## ✅ VOCÊ ESTÁ CONECTADO!

Você está na pasta **home** (`~`), mas os arquivos do site estão em outra pasta.

---

## 🔍 ONDE ESTÃO OS ARQUIVOS?

Os arquivos do seu site geralmente estão em:

```
public_html
```

---

## 📋 COMANDOS PARA NAVEGAR:

### **1. Ver onde você está:**

```bash
pwd
```

Isso mostra o caminho completo da pasta atual.

### **2. Ver arquivos e pastas na pasta atual:**

```bash
ls -la
```

Isso lista todos os arquivos e pastas.

### **3. Ir para pasta do site:**

```bash
cd public_html
```

### **4. Ver arquivos na pasta do site:**

```bash
ls -la
```

Agora você deve ver os arquivos que você fez upload.

---

## 🚀 SEQUÊNCIA COMPLETA:

Execute estes comandos na ordem:

```bash
# 1. Ver onde está
pwd

# 2. Ver arquivos na pasta atual
ls -la

# 3. Ir para pasta do site
cd public_html

# 4. Ver arquivos do site
ls -la

# 5. Se você fez upload do ZIP e extraiu:
# Você verá a pasta deploy-hostinger aqui
cd deploy-hostinger
```

---

## 📦 SE OS ARQUIVOS NÃO FORAM ENVIADOS AINDA:

### **Opção 1: Fazer Upload via File Manager**

1. Acesse: https://hpanel.hostinger.com
2. Vá em **"Files"** → **"File Manager"**
3. Navegue até `public_html`
4. Faça upload do arquivo ZIP `deploy-hostinger.zip`
5. Extraia o ZIP (botão direito → Extract)

### **Opção 2: Clonar via Git**

Se você já tem o código no GitHub:

```bash
cd public_html
git clone https://github.com/pereraax/sistema-de-contas.git .
```

---

## 🔍 VERIFICAR ONDE ESTÃO OS ARQUIVOS:

Execute:

```bash
# Ver estrutura de pastas
ls -la

# Procurar por public_html
find ~ -name "public_html" -type d 2>/dev/null

# Ver todas as pastas principais
ls -la /
```

---

## ✅ COMANDOS RÁPIDOS:

```bash
# Ir para pasta do site
cd public_html

# Ver arquivos
ls -la

# Se viu a pasta deploy-hostinger:
cd deploy-hostinger

# Se não viu, os arquivos podem estar direto em public_html
```

---

## 📝 PRÓXIMOS PASSOS:

1. ✅ Execute: `cd public_html`
2. ✅ Execute: `ls -la`
3. ✅ Veja se há arquivos ou pasta `deploy-hostinger`
4. ✅ Se houver, entre na pasta: `cd deploy-hostinger`
5. ✅ Se não houver, você precisa fazer upload primeiro

---

**Execute `cd public_html` e depois `ls -la` para ver os arquivos!** 📁


