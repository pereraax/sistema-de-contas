# 📦 INSTALAR NODE.JS 20 - PASSO A PASSO

## ✅ VERSÃO NECESSÁRIA: **Node.js 20.x (LTS)**

O projeto está configurado para usar **Node.js 20** (conforme arquivo `.nvmrc`).

---

## 🔹 MÉTODO 1: VIA NVM (RECOMENDADO)

### **Passo 1: Instalar NVM (se não tiver)**

No terminal, execute:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

Depois, feche e abra o terminal novamente, ou execute:

```bash
source ~/.zshrc
```

### **Passo 2: Instalar Node.js 20**

```bash
# Instalar Node.js 20 (LTS)
nvm install 20

# Usar Node.js 20
nvm use 20

# Definir como padrão
nvm alias default 20
```

### **Passo 3: Verificar Instalação**

```bash
node -v
# Deve mostrar: v20.x.x

npm -v
# Deve mostrar a versão do npm
```

---

## 🔹 MÉTODO 2: DOWNLOAD DIRETO DO SITE

### **Passo 1: Acessar Site do Node.js**

1. Vá em: **https://nodejs.org**
2. Na página de download, procure por **"Previous Releases"** ou **"LTS"**
3. Procure por **Node.js 20.x LTS**

### **Passo 2: Baixar e Instalar**

1. Baixe o instalador para **macOS**
2. Execute o instalador
3. Siga as instruções
4. Reinicie o terminal

### **Passo 3: Verificar**

```bash
node -v
# Deve mostrar: v20.x.x
```

---

## 🔹 MÉTODO 3: VIA HOMEBREW (macOS)

```bash
# Instalar Node.js 20 via Homebrew
brew install node@20

# Adicionar ao PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar
node -v
```

---

## ✅ VERIFICAR SE ESTÁ CORRETO

Após instalar, execute:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
node -v
```

**Deve mostrar:** `v20.x.x` (qualquer versão 20.x está OK)

---

## 🚨 IMPORTANTE:

- ✅ **Use Node.js 20.x** (não 24.x ou 25.x)
- ✅ **Versão LTS** (Long Term Support) é recomendada
- ✅ **20.18.0** ou superior está perfeito

---

## 📝 APÓS INSTALAR:

1. Verifique a versão: `node -v`
2. Instale dependências: `npm install`
3. Teste o projeto: `npm run dev`

---

**Instale Node.js 20.x!** 🚀


