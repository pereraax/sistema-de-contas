# 🚀 Deploy PLENIPAY no Cloudflare Pages

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (repositório `pereraax/plenipay`)
2. ✅ Conta no Cloudflare (gratuita - criar em https://dash.cloudflare.com/sign-up)
3. ✅ Código commitado e pushado no GitHub

---

## 🔧 Passo 1: Preparar o Projeto

### 1.1 Verificar se está tudo commitado

```bash
git status
git add .
git commit -m "Preparar para deploy no Cloudflare Pages"
git push origin main
```

### 1.2 Verificar se o build funciona localmente

```bash
npm run build
```

Se funcionar, está pronto! ✅

---

## 🌐 Passo 2: Criar Conta no Cloudflare

1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie uma conta gratuita (não precisa de cartão de crédito!)
3. Faça login no dashboard

---

## 📦 Passo 3: Conectar Repositório GitHub

1. No dashboard do Cloudflare, vá em **Pages** (menu lateral)
2. Clique em **Create a project**
3. Clique em **Connect to Git**
4. Escolha **GitHub**
5. Autorize o Cloudflare a acessar seus repositórios
6. Selecione o repositório: **pereraax/plenipay**
7. Clique em **Begin setup**

---

## ⚙️ Passo 4: Configurar Build Settings

### Configurações do Build:

**Framework preset:** `Next.js` (deve detectar automaticamente)

**Build command:**
```bash
npm run build
```

**Build output directory:**
```bash
.next
```

**Root directory (leave empty):**
```
(Deixar vazio)
```

**Node version:**
```
18.x ou 20.x
```

---

## 🔐 Passo 5: Adicionar Variáveis de Ambiente

Na seção **Environment variables**, adicione TODAS estas variáveis:

### Variáveis de Produção (Production):

```
NEXT_PUBLIC_SUPABASE_URL=https://frhxqgcqmxpjpnghsvoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1Mzc1NiwiZXhwIjoyMDc5MjI5NzU2fQ.E0XIp__d2dMeHDviURhdw4_336dW9SHwUprI5XdRQbg
NEXT_PUBLIC_SITE_URL=https://seu-projeto.pages.dev
NEXT_PUBLIC_APP_URL=https://seu-projeto.pages.dev
NODE_ENV=production
ADMIN_JWT_SECRET=h7Ygdyt5/Ht0KzlMpEpxG3UNvJPldKRdjoAAcj8od5c=
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJiZjU2MDNkLTYzMDUtNGEzZi05MzhhLWM4MzkyNWVjNmJkMTo6JGFhY2hfOGM0NjVlZjUtMGRiMy00YzIwLTkwYzctMTAyOGRhNGNiNjEz
ASAAS_API_URL=https://www.asaas.com/api/v3
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
OPENAI_API_KEY=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
GROQ_API_KEY=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
```

⚠️ **IMPORTANTE:** 
- Substitua `https://seu-projeto.pages.dev` pela URL que o Cloudflare vai gerar (ex: `https://plenipay.pages.dev`)
- Você pode atualizar depois quando souber a URL exata

### Como adicionar cada variável:

1. Clique em **Add variable**
2. Digite o **Name** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
3. Digite o **Value** (ex: `https://frhxqgcqmxpjpnghsvoe.supabase.co`)
4. Selecione **Production** (e Preview se quiser)
5. Clique em **Save**
6. Repita para todas as variáveis

---

## 🚀 Passo 6: Fazer Deploy

1. Após configurar tudo, clique em **Save and Deploy**
2. O Cloudflare vai:
   - Clonar seu repositório
   - Instalar dependências (`npm install`)
   - Fazer build (`npm run build`)
   - Fazer deploy
3. Aguarde alguns minutos (primeiro deploy pode levar 5-10 minutos)

---

## ✅ Passo 7: Verificar Deploy

1. Após o deploy, você verá uma URL tipo: `https://plenipay-xxxxx.pages.dev`
2. Clique na URL para testar
3. Se tudo funcionar, está pronto! 🎉

---

## 🔄 Passo 8: Atualizar URLs nas Variáveis de Ambiente

Após o primeiro deploy, você terá a URL final. Atualize:

1. Vá em **Settings** → **Environment variables**
2. Edite `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`
3. Coloque a URL final do Cloudflare (ex: `https://plenipay.pages.dev`)
4. Salve e faça um novo deploy

---

## 🌍 Passo 9: Configurar Domínio Personalizado (Opcional)

Se você tem um domínio próprio:

1. Vá em **Custom domains** no projeto
2. Clique em **Set up a custom domain**
3. Digite seu domínio (ex: `plenipay.com.br`)
4. Siga as instruções para configurar DNS
5. O Cloudflare vai configurar SSL automaticamente

---

## 🔧 Configurações Adicionais do Next.js

### Criar arquivo `next.config.js` (se ainda não tiver)

Certifique-se de que seu `next.config.js` está configurado corretamente para produção.

### Verificar `package.json`

Certifique-se de que tem os scripts:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 📝 Troubleshooting

### Erro: "Build failed"

1. Verifique os logs do build no Cloudflare
2. Teste localmente: `npm run build`
3. Verifique se todas as variáveis de ambiente estão configuradas

### Erro: "Module not found"

1. Verifique se todas as dependências estão no `package.json`
2. Execute `npm install` localmente para testar

### Erro: "Environment variable not found"

1. Verifique se todas as variáveis foram adicionadas
2. Certifique-se de que selecionou **Production** ao adicionar

### Página em branco

1. Verifique os logs do build
2. Verifique se as variáveis de ambiente estão corretas
3. Verifique se `NEXT_PUBLIC_SITE_URL` está com a URL correta

---

## 🎯 Próximos Passos

1. ✅ Fazer deploy inicial
2. ✅ Testar todas as funcionalidades
3. ✅ Configurar domínio personalizado (se tiver)
4. ✅ Configurar analytics (opcional)
5. ✅ Configurar preview deployments para PRs

---

## 💡 Dicas

- **Preview Deployments:** Cada PR automaticamente gera um preview
- **Rollback:** Você pode voltar para qualquer deploy anterior
- **Analytics:** Cloudflare Pages inclui analytics básico
- **Performance:** Cloudflare Pages é muito rápido (CDN global)

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs do build no Cloudflare
2. Teste localmente primeiro: `npm run build`
3. Verifique se todas as variáveis estão corretas

---

**Boa sorte com o deploy! 🚀**

