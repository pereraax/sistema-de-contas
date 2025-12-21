# ✅ ARQUIVOS ENVIADOS - PRÓXIMOS PASSOS

## 🎉 ARQUIVOS JÁ ESTÃO NO SERVIDOR!

Vejo que você já enviou:
- ✅ `app/`
- ✅ `components/`
- ✅ `hooks/`
- ✅ `lib/`
- ✅ `pages/`
- ✅ `public/`
- ✅ `scripts/`
- ✅ `types/`
- ✅ `next.config.js`

---

## 📋 AGORA EXECUTE NO TERMINAL SSH:

### **1. Verificar onde estão os arquivos:**

No terminal SSH (onde você está conectado), execute:

```bash
# Ver onde está
pwd

# Ver arquivos na pasta atual
ls -la
```

**Se você está na pasta home (`~`), os arquivos provavelmente estão em `public_html` ou em uma subpasta.**

---

### **2. Navegar para onde estão os arquivos:**

```bash
# Tentar ir para public_html
cd public_html

# Ver arquivos
ls -la
```

**Se os arquivos estão em outra pasta, navegue até lá:**

```bash
# Ver todas as pastas
ls -la

# Entrar na pasta onde estão os arquivos
cd nome-da-pasta
```

---

### **3. Verificar se está na pasta correta:**

Você deve ver:
- `app/`
- `components/`
- `next.config.js`
- `package.json`

Se ver esses arquivos, você está no lugar certo! ✅

---

### **4. Instalar dependências:**

```bash
npm install
```

**Isso vai demorar alguns minutos.** Aguarde terminar.

---

### **5. Verificar versão Node.js:**

```bash
node -v
npm -v
```

**Deve mostrar:** `v20.x.x` ou superior

**Se mostrar versão antiga:**
- Configure Node.js no painel Hostinger
- Vá em **"Advanced"** → **"Node.js"** → **"Create Node.js App"**
- Escolha versão **20.x**

---

### **6. Criar arquivo de variáveis de ambiente:**

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
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

**Para salvar:**
1. Pressione **Ctrl+X**
2. Depois pressione **Y**
3. Depois pressione **Enter**

---

### **7. Fazer build:**

```bash
npm run build
```

**Isso vai demorar alguns minutos.** Aguarde terminar.

---

### **8. Instalar PM2 (para manter servidor rodando):**

```bash
npm install -g pm2
```

---

### **9. Iniciar servidor:**

```bash
pm2 start npm --name "sistema-contas" -- start
```

---

### **10. Salvar configuração PM2:**

```bash
pm2 save
```

---

### **11. Ver status do servidor:**

```bash
pm2 status
```

Você deve ver o servidor rodando! ✅

---

### **12. Ver logs (opcional):**

```bash
pm2 logs sistema-contas
```

---

## 🔍 SE NÃO ENCONTRAR OS ARQUIVOS:

### **Procurar em outras pastas:**

```bash
# Procurar por next.config.js
find ~ -name "next.config.js" 2>/dev/null

# Procurar por package.json
find ~ -name "package.json" 2>/dev/null

# Ver estrutura de pastas
ls -la ~
ls -la ~/public_html
```

---

## 📝 SEQUÊNCIA COMPLETA (COPIE E COLE):

```bash
# 1. Ver onde está
pwd

# 2. Ver arquivos
ls -la

# 3. Ir para pasta dos arquivos (ajuste conforme necessário)
cd public_html
# ou
cd ~/public_html

# 4. Verificar arquivos
ls -la

# 5. Instalar dependências
npm install

# 6. Verificar Node.js
node -v

# 7. Criar variáveis
nano .env.production
# (Cole variáveis e salve: Ctrl+X, Y, Enter)

# 8. Fazer build
npm run build

# 9. Instalar PM2
npm install -g pm2

# 10. Iniciar servidor
pm2 start npm --name "sistema-contas" -- start

# 11. Salvar
pm2 save

# 12. Ver status
pm2 status
```

---

## ✅ CHECKLIST:

- [x] Arquivos enviados para servidor
- [ ] Naveguei para pasta dos arquivos no terminal SSH
- [ ] Instalei dependências (`npm install`)
- [ ] Verifiquei versão Node.js (20.x)
- [ ] Criei `.env.production` com variáveis
- [ ] Fiz build (`npm run build`)
- [ ] Instalei PM2
- [ ] Iniciei servidor (`pm2 start`)
- [ ] Salvei configuração (`pm2 save`)
- [ ] Verifiquei que está rodando (`pm2 status`)

---

## 🚨 IMPORTANTE:

### **Se não encontrar `package.json`:**

Os arquivos podem estar em uma subpasta. Procure:

```bash
find ~ -name "package.json" 2>/dev/null
```

### **Se Node.js não estiver instalado:**

Configure no painel Hostinger:
1. **"Advanced"** → **"Node.js"**
2. **"Create Node.js App"**
3. Versão: **20.x**
4. Application Root: pasta onde estão os arquivos

---

**Agora execute os comandos no terminal SSH para instalar e iniciar!** 🚀


