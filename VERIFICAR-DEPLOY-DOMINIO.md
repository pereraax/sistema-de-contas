# Verificar por que o domínio não mostra as atualizações do deploy

Quando o deploy termina no Railway mas **plenipay.com** continua com a versão antiga (mesmo após Purge e limpar Safari), use os passos abaixo.

---

## 1. Descobrir a URL do Railway

1. Acesse **https://railway.app** → seu projeto.
2. Abra **Settings** → **Networking** (ou **Domains**).
3. Copie a **URL pública** do serviço, por exemplo:
   - `https://sistema-de-contas-1.up.railway.app`
   - ou algo como `https://nomedoprojeto-production.up.railway.app`

---

## 2. Comparar qual build está no ar

Foi adicionada a rota **`/api/build-info`**, que devolve a **data/hora do build** do deploy atual.

**No navegador (ou no celular), abra as duas URLs em aba anônima:**

| Onde você abre | URL |
|----------------|-----|
| **Domínio** | https://plenipay.com/api/build-info |
| **Railway direto** | https://**SUA-URL-RAILWAY**/api/build-info |

(Substitua **SUA-URL-RAILWAY** pela URL que você copiou no passo 1.)

**O que cada resposta mostra:**

- **buildTime** – data/hora do build (ex.: `2026-02-08T18:30:00Z`).
- **source** – `railway` em produção, `local` em desenvolvimento.

**Como interpretar:**

- Se as **duas** respostas tiverem a **mesma** `buildTime` (e for recente) → domínio está apontando para o Railway certo; o problema pode ser cache do navegador ou de alguma página específica.
- Se a **buildTime do domínio** for **mais antiga** (ou diferente) da **buildTime do Railway** → o tráfego de **plenipay.com** **não** está indo para o deploy atual do Railway. O problema é **DNS ou Cloudflare**.

---

## 3. Se o domínio estiver com build antigo: ajustar DNS no Cloudflare

O domínio precisa apontar **para o Railway**, não para outro serviço (Vercel, outro host, etc.).

1. **Cloudflare** → **plenipay.com** → **DNS** → **Records**.
2. Veja os registros de **www** e **@** (raiz):
   - **Tipo** = CNAME (ou A, se o Railway der um IP).
   - **Target / Conteúdo** deve ser **exatamente** o que o Railway pede para domínio customizado.
3. No **Railway**: **Settings** → **Domains** (ou **Networking**). O Railway mostra algo como:
   - “Adicione CNAME: **www** → `seu-projeto.up.railway.app`”
   - ou um host específico para domínio customizado.
4. No Cloudflare:
   - **www** → CNAME → para o **mesmo** target que o Railway indicar.
   - **@** (apex): o Railway costuma usar CNAME flattening ou um A record; siga o que o painel do Railway mostrar para o apex.
5. **Remova** qualquer CNAME que aponte para **Vercel** (ex.: `cname.vercel-dns.com`) ou para outro host que não seja o Railway.
6. Salve e aguarde 2–5 minutos.
7. Faça de novo **Purge Everything** em **Caching** → **Configuration** no Cloudflare.
8. Teste de novo:
   - https://plenipay.com/api/build-info  
   - https://SUA-URL-RAILWAY/api/build-info  

As duas devem mostrar a **mesma** `buildTime` e bem recente.

---

## 4. Resumo

| Situação | O que fazer |
|----------|-------------|
| **buildTime igual** no domínio e no Railway | Domínio está no deploy certo. Limpar cache do navegador/site ou testar em aba anônima para ver as mudanças na interface. |
| **buildTime diferente** (domínio mais antigo) | DNS/Cloudflare está apontando para outro lugar. Ajustar CNAME/target no Cloudflare para o Railway e fazer Purge. |
| **plenipay.com/api/build-info** não abre ou dá erro | Domínio pode estar em outro servidor (ex.: antigo). Conferir DNS e garantir que **www** e **@** apontem para o Railway. |

Depois de corrigir o DNS e o cache, o domínio passa a refletir o mesmo deploy que aparece na URL direta do Railway.
