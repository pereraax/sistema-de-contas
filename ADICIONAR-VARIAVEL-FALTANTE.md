# 🔴 VARIÁVEL FALTANTE NO RAILWAY

## Problema Identificado

Falta a variável `NEXT_PUBLIC_APP_URL` no Railway. Esta variável é usada em vários lugares do código, especialmente para webhooks do WhatsApp.

## ✅ Solução Rápida

### No Railway:

1. Vá em **Variables**
2. Clique em **"+ New Variable"**
3. Adicione:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://plenipay.com`
4. Clique em **"Add"**
5. **IMPORTANTE:** Após adicionar, você precisa fazer um **redeploy** para que as variáveis sejam incluídas no build do Next.js

## ⚠️ Por que precisa fazer redeploy?

Variáveis `NEXT_PUBLIC_*` são incluídas no **build** do Next.js, não apenas no runtime. Isso significa que:

- Se você adicionar uma variável `NEXT_PUBLIC_*` sem fazer redeploy, ela não estará disponível no código do cliente
- O Next.js "embute" essas variáveis no JavaScript durante o build
- Você precisa fazer um novo build para que as novas variáveis sejam incluídas

## 🔄 Como fazer redeploy no Railway

1. Vá em **Deployments**
2. Clique nos **3 pontinhos** (⋯) no deployment mais recente
3. Selecione **"Redeploy"**
4. Ou faça um commit vazio no GitHub (isso vai triggerar um novo deploy automaticamente)

## 📋 Checklist Completo de Variáveis

Certifique-se de que TODAS estas variáveis estão configuradas:

- ✅ `NODE_ENV` = `production`
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://frhxqgcqmxpjpnghsvoe.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ✅ `NEXT_PUBLIC_SITE_URL` = `https://plenipay.com`
- ❌ `NEXT_PUBLIC_APP_URL` = `https://plenipay.com` ← **FALTANDO**
- ✅ `PORT` = `3000`

## 🐛 Se ainda não funcionar após adicionar

Se após adicionar a variável e fazer redeploy ainda der erro:

1. Verifique os **Build Logs** no Railway para ver se há erros durante o build
2. Verifique os **Deploy Logs** para ver se a aplicação está iniciando corretamente
3. Abra o **Console do Navegador** (F12) para ver o erro específico do JavaScript
4. Verifique se todas as variáveis `NEXT_PUBLIC_*` estão sendo incluídas no build
