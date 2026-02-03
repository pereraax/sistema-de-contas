# 🔧 Corrigir deploy com erro no Railway

## ❌ Problema

No dashboard do Railway você pode ver:

- Deploy com status **Error**
- Build ou runtime falhando

---

## 🔍 Ver o erro

1. Acesse https://railway.app e abra seu projeto
2. Vá em **Deployments**
3. Clique no deploy com status **Failed** ou **Error**
4. Abra **View Logs** (Build Logs ou Deploy Logs)
5. Copie a mensagem de erro (texto vermelho)

Isso mostra por que o deploy falhou.

---

## 🚀 Soluções

### 1. Redeploy pelo dashboard

1. No Railway: **Deployments** → último deploy
2. Clique em **⋮** (três pontos) → **Redeploy**
3. Aguarde 2–5 minutos

### 2. Novo deploy via Git (recomendado)

Se o projeto está conectado ao GitHub:

```bash
git add .
git commit -m "fix: correção para deploy"
git push origin main
```

Ou forçar redeploy sem mudar código:

```bash
git commit --allow-empty -m "chore: redeploy"
git push origin main
```

O Railway detecta o push e inicia um novo deploy.

### 3. Variáveis de ambiente

Erro pode ser falta de variáveis:

1. No Railway: **Variables** (ou **Settings** → **Variables**)
2. Confira se estão definidas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ASAAS_API_KEY` / `ASAAS_API_URL` (se usar)
   - `NEXT_PUBLIC_SITE_URL` (ex.: `https://plenipay.com`)
   - `NODE_ENV=production`

---

## 📋 Checklist

- [ ] Vi os logs do deploy que falhou
- [ ] Corrigi o erro (código ou variáveis)
- [ ] Fiz commit e push (ou Redeploy no dashboard)
- [ ] Novo deploy concluiu com sucesso

---

**Dashboard:** https://railway.app → seu projeto → Deployments
