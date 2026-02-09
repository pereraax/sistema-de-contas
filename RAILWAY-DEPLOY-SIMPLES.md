# Deploy no Railway – resolver de uma vez

## O que mudou

- O endpoint `/api/build-info` **não usa mais arquivo nem variável sua**. Só usa o que o Railway já injeta (`RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_DEPLOYMENT_ID`). Em produção no Railway a resposta será sempre `source: "railway"`.
- O start command voltou a ser só `node server.js` (sem script).

## Se ainda aparece "source": "local" no Railway

Significa que o **código novo ainda não está rodando** no Railway. Faça isto na ordem:

### 1. Conferir repositório e branch no Railway

- No projeto no Railway: **Settings** do serviço (ou **Deploy**).
- Veja de qual **repositório** e **branch** o deploy é feito (ex.: `main`).
- Anote: repositório = ?, branch = ?

### 2. Subir o código certo para esse branch

No seu computador:

```bash
git add .
git status   # conferir se app/api/build-info/route.ts e railway.json estão na lista
git commit -m "fix: build-info só usa variáveis do Railway"
git push origin main
```

(Substitua `main` pelo branch que o Railway usa.)

### 3. Forçar um deploy novo

- No Railway: abra o serviço → **Deployments**.
- No último deploy, clique nos **três pontinhos** → **Redeploy** (ou **Clear build cache and redeploy** se existir).
- Ou faça um push vazio: `git commit --allow-empty -m "trigger deploy" && git push origin main`.

### 4. Testar

Quando o deploy terminar (status verde):

- Abra: `https://sistema-de-contas-1-production.up.railway.app/api/build-info`
- Deve aparecer algo como: `{"source":"railway","deploymentId":"...","domain":"...","hint":"..."}`

Se ainda aparecer `"source":"local"`, o Railway **não** está rodando o código desse repositório/branch. Confira de novo o passo 1 (repo e branch) e se o push foi para o mesmo branch.

## Domínio (plenipay.com)

- Se a **URL direta do Railway** já mostra `source: "railway"`, compare com `https://plenipay.com/api/build-info`.
- Se o **deploymentId** for o mesmo nos dois, o domínio está apontando para o deploy certo.
- Se for diferente, o problema é DNS/cache (Cloudflare): confira o doc `CLOUDFLARE-BYPASS-CACHE.md`.

## Resumo

| Problema | O que fazer |
|----------|-------------|
| `/api/build-info` mostra `source: "local"` na URL do Railway | Código novo não está no deploy: conferir repo/branch, push e Redeploy. |
| URL do Railway ok, domínio errado | DNS/cache: ver `CLOUDFLARE-BYPASS-CACHE.md`. |

Não é mais necessário configurar `BUILD_TIMESTAMP` nem nada no painel. Só garantir que o código deste repositório seja o que o Railway está deployando.
