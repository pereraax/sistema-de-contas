# 🚀 PASSO A PASSO DETALHADO - DEPLOY NO VERCEL

## 📍 ONDE VOCÊ ESTÁ AGORA

Você está na tela **"Deploy your first project"** do Vercel.

## ✅ PASSO 1: IMPORTAR PROJETO DO GITHUB

### 1.1. Clique em "Import Project"
- Na lista de opções, encontre o card **"Import Project"**
- Clique no botão **"Import"** (no canto direito do card)

### 1.2. Conectar GitHub (se ainda não conectado)
- Se aparecer uma tela de login/autorização do GitHub:
  - Clique em **"Continue with GitHub"**
  - Autorize o Vercel a acessar seus repositórios
  - Selecione os repositórios que deseja dar acesso (ou "All repositories")

### 1.3. Selecionar o Repositório
- Após conectar, você verá uma lista de seus repositórios
- Procure e clique em: **`pereraax/plenipay`**
- Ou digite "plenipay" na barra de busca

## ✅ PASSO 2: CONFIGURAR O PROJETO

### 2.1. Configurações do Projeto
Após selecionar o repositório, você verá uma tela de configuração:

**Project Name:**
- Deixe como está: `plenipay` (ou escolha outro nome)

**Framework Preset:**
- ✅ Deve detectar automaticamente: **Next.js**
- Se não detectar, selecione manualmente: **Next.js**

**Root Directory:**
- Deixe como: `./` (raiz do projeto)

**Build Command:**
- Deixe como: `npm run build` (padrão do Next.js)

**Output Directory:**
- Deixe como: `.next` (padrão do Next.js)

**Install Command:**
- Deixe como: `npm install` (padrão)

### 2.2. Environment Variables (VARIÁVEIS DE AMBIENTE) ⚠️ IMPORTANTE!

**ANTES DE CLICAR EM "Deploy", configure as variáveis:**

1. Clique em **"Environment Variables"** (ou "Add Environment Variable")
2. Adicione cada variável uma por uma:

#### Variáveis Obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL
Valor: (cole o valor do seu .env.local)

NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: (cole o valor do seu .env.local)

SUPABASE_SERVICE_ROLE_KEY
Valor: (cole o valor do seu .env.local)
```

#### Variáveis Adicionais (se você usa):

```
NEXT_PUBLIC_SITE_URL
Valor: (sua URL do site)

NEXT_PUBLIC_APP_URL
Valor: (sua URL do app)

NODE_ENV
Valor: production

ADMIN_JWT_SECRET
Valor: (seu secret)

ASAAS_API_KEY
Valor: (seu API key da Asaas)

ASAAS_API_URL
Valor: https://api.asaas.com/v3

APIFACIL_INSTANCE_ID
Valor: (seu instance ID)
```

**Para cada variável:**
- Clique em **"Add"** ou **"Add Another"**
- Digite o **nome** da variável
- Cole o **valor** da variável
- Selecione os ambientes: ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Clique em **"Save"**

### 2.3. Verificar Configurações

Antes de fazer deploy, verifique:
- ✅ Framework: Next.js
- ✅ Node.js Version: 20.x (ou a versão que você usa)
- ✅ Build Command: `npm run build`
- ✅ Todas as variáveis de ambiente adicionadas

## ✅ PASSO 3: FAZER O DEPLOY

### 3.1. Iniciar Deploy
- Após configurar tudo, clique no botão **"Deploy"** (grande, geralmente no canto inferior direito)
- Aguarde o processo de build (pode levar 2-5 minutos)

### 3.2. Acompanhar o Build
Você verá uma tela mostrando:
- 📦 Installing dependencies...
- 🔨 Building...
- ✅ Build completed
- 🚀 Deploying...

### 3.3. Deploy Concluído
Quando terminar, você verá:
- ✅ **"Congratulations! Your project has been deployed"**
- Uma URL: `https://seu-projeto.vercel.app`

## ✅ PASSO 4: VERIFICAR O DEPLOY

### 4.1. Acessar o Site
- Clique na URL fornecida
- Ou copie e cole no navegador

### 4.2. Verificar se Funcionou
- A página deve carregar normalmente
- O CSS deve estar aplicado (cores, layout)
- As funcionalidades devem funcionar

### 4.3. Se Houver Problemas
- Verifique os logs no Vercel Dashboard
- Vá em **Deployments** → Clique no último deploy → Veja os logs
- Verifique se todas as variáveis de ambiente estão corretas

## 🔧 CONFIGURAÇÕES ADICIONAIS (Opcional)

### Domínio Customizado
- Vá em **Settings** → **Domains**
- Adicione seu domínio personalizado (se tiver)

### Configurações de Build
- Vá em **Settings** → **General**
- Verifique **Node.js Version**: deve ser `20.x`
- Verifique **Build Command**: `npm run build`

## ⚠️ PROBLEMAS COMUNS

### Erro: "Build Failed"
- Verifique os logs do build
- Confirme que todas as dependências estão no `package.json`
- Verifique se as variáveis de ambiente estão corretas

### Erro: "Module not found"
- Verifique se todas as dependências estão instaladas
- Confirme que o `package.json` está correto

### CSS não carrega
- Limpe o cache do navegador
- Verifique se o `tailwind.config.js` está no repositório
- Confirme que o build foi bem-sucedido

## 📝 CHECKLIST FINAL

Antes de clicar em "Deploy", confirme:

- [ ] Repositório selecionado: `pereraax/plenipay`
- [ ] Framework: Next.js
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Node.js Version: 20.x
- [ ] Build Command: `npm run build`
- [ ] Root Directory: `./`

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. Teste todas as funcionalidades
2. Verifique se o CSS está carregando
3. Teste em diferentes navegadores
4. Configure domínio customizado (se necessário)
5. Configure monitoramento (opcional)

---

**Dica:** Se tiver dúvidas em qualquer passo, me avise que eu te ajudo!

