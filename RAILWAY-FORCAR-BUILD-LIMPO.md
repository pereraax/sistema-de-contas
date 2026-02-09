# Forçar build limpo no Railway (para o domínio atualizar)

Se o deploy termina mas o domínio continua sem refletir as mudanças, force um **build sem cache** no Railway:

## No painel do Railway

1. Acesse **https://railway.app** → projeto **sistema-de-contas-1**.
2. Aba **Deployments**.
3. No último deploy (ou em qualquer um), clique nos **três pontinhos** (⋮) ou em **"Redeploy"**.
4. Se aparecer a opção **"Clear build cache"** ou **"Rebuild from scratch"**, **marque** e confirme o redeploy.
5. Aguarde o build terminar (alguns minutos).

## Depois do deploy

1. **Purge Everything** no Cloudflare (Caching → Configuration).
2. Espere 2–3 minutos.
3. Teste em **aba anônima**:
   - https://sistema-de-contas-1-production.up.railway.app/api/build-info
   - https://www.plenipay.com/api/build-info

Se ainda retornar `"development"`, a resposta incluirá `_debug` com `cwd` e `BUILD_TIME_PATH` — use isso para ver o que o servidor está usando.
