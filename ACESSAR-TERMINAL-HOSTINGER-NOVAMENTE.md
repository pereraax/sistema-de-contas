# 🔐 ACESSAR TERMINAL HOSTINGER NOVAMENTE

## ✅ VOCÊ ESTÁ NO TERMINAL DA HOSTINGER

Vejo que você está conectado como `root@srv1156401`. Perfeito!

---

## 📋 COMANDOS PARA EXECUTAR AGORA:

### **1. Ir para pasta do projeto:**

```bash
cd /var/www/plenipay
```

---

### **2. Verificar se está na pasta correta:**

```bash
pwd
ls -la package.json
```

**Deve mostrar:** `/var/www/plenipay` e o arquivo `package.json`

---

### **3. Editar arquivo .env.production:**

```bash
nano .env.production
```

---

### **4. Adicionar variáveis APIFACIL:**

No nano, navegue até o final do arquivo (seta para baixo várias vezes) e adicione estas linhas:

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

**Substitua pelos seus valores reais!**

---

### **5. Salvar arquivo:**

1. Pressione **Ctrl+X**
2. Pressione **Y**
3. Pressione **Enter**

---

### **6. Verificar se foi salvo:**

```bash
cat .env.production | tail -5
```

**Deve mostrar as variáveis APIFACIL que você adicionou.**

---

### **7. Fazer build:**

```bash
npm run build
```

---

### **8. Instalar PM2 (se ainda não instalou):**

```bash
npm install -g pm2
```

---

### **9. Iniciar servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## 📝 SEQUÊNCIA COMPLETA (COPIE E COLE):

```bash
# 1. Ir para pasta do projeto
cd /var/www/plenipay

# 2. Verificar
pwd
ls -la package.json

# 3. Editar arquivo
nano .env.production

# 4. No nano: Navegue até o final e adicione:
# APIFACIL_INSTANCE_ID=seu_id_apifacil
# APIFACIL_TOKEN=seu_token_apifacil
# Depois salve: Ctrl+X, Y, Enter

# 5. Verificar se foi salvo
cat .env.production | tail -5

# 6. Fazer build
npm run build

# 7. Instalar PM2 (se necessário)
npm install -g pm2

# 8. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 status
```

---

## 📋 VARIÁVEIS APIFACIL (PRONTAS PARA COPIAR):

Quando estiver no nano, adicione estas linhas no final do arquivo:

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

**IMPORTANTE:** Substitua `seu_id_apifacil` e `seu_token_apifacil` pelos seus valores reais da APIFACIL!

---

## ✅ CHECKLIST:

- [ ] Executei `cd /var/www/plenipay`
- [ ] Verifiquei que estou na pasta correta
- [ ] Executei `nano .env.production`
- [ ] Naveguei até o final do arquivo
- [ ] Adicionei as variáveis APIFACIL
- [ ] Salvei o arquivo (Ctrl+X, Y, Enter)
- [ ] Verifiquei se foi salvo
- [ ] Executei `npm run build`
- [ ] Iniciei servidor com PM2

---

**Execute os comandos acima na ordem!** 🚀


