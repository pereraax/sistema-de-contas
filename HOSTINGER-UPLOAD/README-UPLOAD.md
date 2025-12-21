# 📦 ARQUIVOS PRONTOS PARA UPLOAD NA HOSTINGER

## ✅ ESTA PASTA CONTÉM APENAS OS ARQUIVOS NECESSÁRIOS!

Todos os arquivos desnecessários foram removidos:
- ❌ `node_modules/` (será instalado no servidor)
- ❌ `.next/` (será gerado no servidor)
- ❌ `.git/` (controle de versão)
- ❌ Arquivos de cache e logs

---

## 🚀 PRÓXIMOS PASSOS:

### **1. Comprimir esta pasta:**

1. Clique com botão direito na pasta `HOSTINGER-UPLOAD`
2. Selecione **"Comprimir"** (cria um ZIP)
3. Aguarde a compressão

### **2. Fazer Upload na Hostinger:**

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Files"** → **"File Manager"**
3. Navegue até `public_html` (ou pasta do seu domínio)
4. Clique em **"Upload"**
5. Selecione o arquivo ZIP
6. Aguarde upload completar
7. Clique com botão direito no ZIP → **"Extract"** (extrair)

### **3. Instalar Dependências (Terminal SSH):**

1. Acesse **"Advanced"** → **"SSH Access"** na Hostinger
2. Conecte via SSH
3. Execute:

```bash
cd public_html
npm install
```

### **4. Configurar Variáveis de Ambiente:**

```bash
nano .env.production
```

Cole as variáveis:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_chave
ASAAS_API_KEY=sua_chave
APIFACIL_INSTANCE_ID=seu_id
APIFACIL_TOKEN=seu_token
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

Salve: **Ctrl+X**, depois **Y**, depois **Enter**

### **5. Fazer Build:**

```bash
npm run build
```

### **6. Iniciar Servidor:**

**Opção A: PM2 (Recomendado)**

```bash
npm install -g pm2
pm2 start npm --name "sistema-contas" -- start
pm2 save
pm2 startup
```

**Opção B: Node.js App (Hostinger)**

1. Vá em **"Advanced"** → **"Node.js"**
2. Clique em **"Create Node.js App"**
3. Configure:
   - **Node.js Version:** `20.x`
   - **Application Root:** `/public_html`
   - **Application Startup File:** `server.js`
   - **Application URL:** Seu domínio
4. Clique em **"Create"**

---

## ⚠️ IMPORTANTE:

- ✅ Hostinger precisa ter plano **VPS ou Cloud** (Shared Hosting não funciona)
- ✅ Node.js 20 deve estar disponível
- ✅ Use PM2 para manter servidor rodando

---

## ✅ CHECKLIST:

- [ ] Pasta comprimida em ZIP
- [ ] Upload feito na Hostinger
- [ ] Arquivos extraídos
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Node.js configurado (versão 20.x)
- [ ] Build feito (`npm run build`)
- [ ] Servidor iniciado (PM2 ou Node.js App)
- [ ] Testar aplicação no navegador

---

**Pronto para upload!** 🚀
