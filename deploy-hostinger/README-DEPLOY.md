# 🚀 ARQUIVOS PRONTOS PARA DEPLOY NA HOSTINGER

Esta pasta contém **TODOS os arquivos necessários** para fazer deploy na Hostinger.

---

## ✅ O QUE ESTÁ INCLUÍDO:

- ✅ `app/` - Páginas e rotas da aplicação
- ✅ `components/` - Componentes React
- ✅ `lib/` - Bibliotecas e utilitários
- ✅ `hooks/` - React Hooks customizados
- ✅ `public/` - Arquivos estáticos (imagens, etc)
- ✅ `package.json` - Dependências do projeto
- ✅ `next.config.js` - Configuração do Next.js
- ✅ `tailwind.config.js` - Configuração do Tailwind
- ✅ `tsconfig.json` - Configuração do TypeScript
- ✅ `.nvmrc` - Versão do Node.js (20)
- ✅ `server.js` - Servidor Node.js (se existir)

---

## 📦 PRÓXIMOS PASSOS:

### **1. Comprimir esta pasta:**

1. Clique com botão direito na pasta `deploy-hostinger`
2. Selecione **"Comprimir"** (cria um ZIP)

### **2. Fazer Upload na Hostinger:**

1. Acesse: **https://hpanel.hostinger.com**
2. Vá em **"Files"** → **"File Manager"**
3. Navegue até `public_html`
4. Clique em **"Upload"**
5. Selecione o arquivo ZIP
6. Extraia o ZIP (botão direito → Extract)

### **3. Instalar Dependências (Terminal SSH):**

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
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

- ✅ **NÃO inclui:** `node_modules/`, `.next/`, `.git/` (serão gerados no servidor)
- ✅ **Pronto para upload:** Todos os arquivos necessários estão aqui
- ✅ **Tamanho reduzido:** Apenas código fonte, sem dependências

---

## 📋 CHECKLIST:

- [ ] Pasta `deploy-hostinger` comprimida em ZIP
- [ ] ZIP enviado para Hostinger
- [ ] ZIP extraído em `public_html`
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Build feito (`npm run build`)
- [ ] Servidor iniciado (PM2 ou Node.js App)

---

**Pronto para fazer upload!** 🚀


