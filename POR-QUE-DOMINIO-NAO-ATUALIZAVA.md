# Por que o domínio parou de atualizar (resumo)

## O que aconteceu

1. **Antes:** O DNS de **plenipay.com** e **www** apontava para outro lugar (IP da Hostinger ou antigo URL do Railway `mlvqeal2`). O site “funcionava” porque abria o que estava **nesse** servidor. Os deploys no Railway **não** apareciam no domínio, porque o tráfego **não** ia para o Railway.

2. **Depois da troca de DNS:** Ajustamos o DNS no Cloudflare para **sistema-de-contas-1-production.up.railway.app**. Aí o domínio passou a bater no Railway. O teste com a **URL direta** do Railway mostrou que o deploy atual **também** retornava "development" no `/api/build-info` — ou seja, o problema não era mais DNS, e sim o **container no Railway** não encontrar o arquivo `build-time.txt` (caminho ou permissão).

3. **Correção:** Foi definido o caminho explícito do arquivo no Docker (`ENV BUILD_TIME_PATH=/app/build-time.txt`), garantida a permissão de leitura para o usuário que roda o app (`chown nextjs:nodejs`) e o código da API passou a usar essa variável. Com um **novo deploy** (build limpo), o `/api/build-info` no Railway e no domínio deve passar a mostrar a data do build e `source: "railway"`.

## Resumo

| Fase | Situação |
|------|----------|
| **Antes** | DNS apontava para servidor antigo → domínio não refletia deploys do Railway. |
| **DNS corrigido** | Domínio e URL do Railway iam para o mesmo deploy, mas o container não lia `build-time.txt`. |
| **Agora** | Caminho e permissão do arquivo corrigidos; após novo deploy, domínio e Railway devem mostrar a mesma versão. |

Depois do próximo deploy, teste de novo: **sistema-de-contas-1-production.up.railway.app/api/build-info** e **www.plenipay.com/api/build-info** — ambos devem mostrar a mesma data e `source: "railway"`.
