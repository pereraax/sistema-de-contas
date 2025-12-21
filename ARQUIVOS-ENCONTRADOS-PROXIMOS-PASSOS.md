# ✅ ARQUIVOS ENCONTRADOS - PRÓXIMOS PASSOS

## 🎉 ARQUIVOS ESTÃO EM:

```
/home/u596588143/domains/plenipay.com/
```

---

## 📋 EXECUTE ESTES COMANDOS (UM POR VEZ):

### **1. Ir para pasta dos arquivos:**

```bash
cd /home/u596588143/domains/plenipay.com
```

### **2. Ver arquivos:**

```bash
ls -la
```

Você deve ver:
- `app/`
- `components/`
- `next.config.js`
- `package.json`
- etc.

---

### **3. Instalar dependências:**

```bash
npm install
```

**Isso vai demorar alguns minutos.** Aguarde terminar.

---

### **4. Verificar versão Node.js:**

```bash
node -v
npm -v
```

**Deve mostrar:** `v20.x.x` ou superior

**Se mostrar versão antiga:**
- Configure Node.js no painel Hostinger
- Vá em **"Advanced"** → **"Node.js"** → **"Create Node.js App"**
- Escolha versão **20.x**
- Application Root: `/home/u596588143/domains/plenipay.com`

---

### **5. Criar arquivo de variáveis de ambiente:**

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
NEXT_PUBLIC_SITE_URL=https://plenipay.com
```

**Para salvar:**
1. Pressione **Ctrl+X**
2. Depois pressione **Y**
3. Depois pressione **Enter**

---

### **6. Fazer build:**

```bash
npm run build
```

**Isso vai demorar alguns minutos.** Aguarde terminar.

---

### **7. Instalar PM2 (para manter servidor rodando):**

```bash
npm install -g pm2
```

---

### **8. Iniciar servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
```

---

### **9. Salvar configuração PM2:**

```bash
pm2 save
```

---

### **10. Ver status do servidor:**

```bash
pm2 status
```

Você deve ver o servidor rodando! ✅

---

### **11. Ver logs (opcional):**

```bash
pm2 logs sistema-contas
```

---

## 📝 SEQUÊNCIA COMPLETA (COPIE E COLE):

```bash
# 1. Ir para pasta dos arquivos
cd /home/u596588143/domains/plenipay.com

# 2. Ver arquivos
ls -la

# 3. Instalar dependências
npm install

# 4. Verificar Node.js
node -v

# 5. Criar variáveis de ambiente
nano .env.production
# (Cole variáveis e salve: Ctrl+X, Y, Enter)

# 6. Fazer build
npm run build

# 7. Instalar PM2
npm install -g pm2

# 8. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# 9. Salvar
pm2 save

# 10. Ver status
pm2 status
```

---

## ⚙️ CONFIGURAR NODE.JS NO PAINEL (SE NECESSÁRIO):

Se `node -v` mostrar versão antiga:

1. Acesse: https://hpanel.hostinger.com
2. Vá em **"Advanced"** → **"Node.js"**
3. Clique em **"Create Node.js App"**
4. Configure:
   - **Node.js Version:** `20.x`
   - **Application Root:** `/home/u596588143/domains/plenipay.com`
   - **Application Startup File:** `server.js` (ou deixe vazio se usar PM2)
   - **Application URL:** `https://plenipay.com`
5. Clique em **"Create"**

---

## ✅ CHECKLIST:

- [x] Arquivos encontrados em `/home/u596588143/domains/plenipay.com/`
- [ ] Naveguei para a pasta (`cd /home/u596588143/domains/plenipay.com`)
- [ ] Instalei dependências (`npm install`)
- [ ] Verifiquei versão Node.js (20.x)
- [ ] Criei `.env.production` com variáveis
- [ ] Fiz build (`npm run build`)
- [ ] Instalei PM2
- [ ] Iniciei servidor (`pm2 start`)
- [ ] Salvei configuração (`pm2 save`)
- [ ] Verifiquei que está rodando (`pm2 status`)

---

## 🚀 PRÓXIMOS PASSOS:

1. ✅ Execute: `cd /home/u596588143/domains/plenipay.com`
2. ✅ Execute: `npm install`
3. ✅ Configure variáveis de ambiente
4. ✅ Execute: `npm run build`
5. ✅ Execute: `pm2 start npm --name "sistema-contas" -- start`

---

**Agora execute os comandos acima na ordem!** 🚀


