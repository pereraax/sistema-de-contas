# ✅ VARIÁVEIS APIFACIL - VALORES REAIS

## 🎯 CREDENCIAIS ENCONTRADAS NO PROJETO:

```env
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
```

---

## 📋 COMANDOS PARA ADICIONAR NO TERMINAL HOSTINGER:

### **1. Ir para pasta do projeto:**

```bash
cd /var/www/plenipay
```

---

### **2. Editar arquivo .env.production:**

```bash
nano .env.production
```

---

### **3. No nano, adicionar no final do arquivo:**

Navegue até o final (seta para baixo várias vezes) e adicione estas linhas:

```env
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
```

---

### **4. Salvar arquivo:**

1. Pressione **Ctrl+X**
2. Pressione **Y**
3. Pressione **Enter**

---

### **5. Verificar se foi salvo:**

```bash
cat .env.production | tail -3
```

**Deve mostrar as variáveis APIFACIL!**

---

### **6. Fazer build:**

```bash
npm run build
```

---

### **7. Instalar e iniciar PM2:**

```bash
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## 📝 SEQUÊNCIA COMPLETA (COPIE E COLE):

```bash
# 1. Ir para pasta
cd /var/www/plenipay

# 2. Editar arquivo
nano .env.production

# 3. No nano: Navegue até o final e adicione:
# APIFACIL_INSTANCE_ID=1041
# APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
# Depois salve: Ctrl+X, Y, Enter

# 4. Verificar
cat .env.production | tail -3

# 5. Fazer build
npm run build

# 6. Instalar PM2
npm install -g pm2

# 7. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## ✅ VALORES PARA COPIAR:

Quando estiver no nano, adicione estas linhas no final:

```
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
```

---

## 🎯 RESUMO RÁPIDO:

1. ✅ `cd /var/www/plenipay`
2. ✅ `nano .env.production`
3. ✅ Adicione no final:
   - `APIFACIL_INSTANCE_ID=1041`
   - `APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb`
4. ✅ Salve: Ctrl+X → Y → Enter
5. ✅ `npm run build`
6. ✅ `pm2 start npm --name "sistema-contas" -- start`

---

**Agora você tem os valores reais! Adicione no arquivo e salve!** 🚀


