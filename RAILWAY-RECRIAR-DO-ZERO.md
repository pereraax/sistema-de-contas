# Solução definitiva: recriar o deploy no Railway do zero

O código que sobe no deploy **não estava atualizando**. Recriando o serviço do zero, o primeiro build usa o repositório atual **sem cache** e as atualizações passam a funcionar.

---

## Parte 1: Deixar o código no GitHub atualizado (OBRIGATÓRIO)

O novo deploy vai clonar o **branch main** do GitHub. Faça isso **antes** de criar o serviço no Railway.

1. No seu computador, na pasta do projeto, abra o terminal e rode:

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
git add .
git status
git commit -m "fix: build-info em produção sempre retorna railway (sem depender de variáveis)"
git push origin main
```

2. Confirme no GitHub (pereraax/sistema-de-contas) que o último commit está no **main** e que o arquivo `app/api/build-info/route.ts` está com a versão nova (sem `_debug`, sem `BUILD_TIMESTAMP`).

---

## Parte 2: Anotar variáveis e domínio do projeto atual

Antes de apagar nada, anote para repor no novo serviço:

1. **Railway** → projeto atual → serviço **sistema-de-contas-1** → aba **Variables**.
2. Abra **Raw Editor** e copie tudo (ou anote/exporte a lista de variáveis). Você vai colar no novo serviço.
3. Anote os **domínios** em **Settings** → **Networking** (ex.: plenipay.com, www.plenipay.com e a URL *.up.railway.app).
4. Confirme que tem **NEXT_PUBLIC_SITE_URL** e **NEXT_PUBLIC_APP_URL** = `https://plenipay.com` (ou www).

---

## Parte 3: Novo serviço no Railway (build limpo)

### Opção A – Mesmo projeto (só trocar o serviço)

1. No **mesmo projeto** do Railway, **apague o serviço** atual (sistema-de-contas-1).  
   (Se tiver só esse serviço, crie o novo primeiro e depois apague o antigo, ou use a Opção B.)

2. **New** → **GitHub Repo** → escolha **pereraax/sistema-de-contas**, branch **main**.

3. O Railway cria um serviço novo e dispara o **primeiro build** (sem cache).

### Opção B – Projeto novo (recomendado para evitar cache)

1. No Railway: **New Project**.
2. **Deploy from GitHub repo** → **pereraax/sistema-de-contas** → branch **main**.
3. O Railway cria projeto + serviço e faz o primeiro build a partir do zero.

---

## Parte 4: Configurar o novo serviço

1. **Settings** do serviço:
   - **Builder**: deixar **Dockerfile** (o repositório tem `railway.json` e `Dockerfile`).
   - **Root Directory**: em branco (código na raiz do repo).
   - **Branch**: **main**.

2. **Variables**:
   - Cole todas as variáveis que você anotou na Parte 2 (Raw Editor).
   - Inclua **NODE_ENV** = `production`.
   - Inclua **NEXT_PUBLIC_SITE_URL** e **NEXT_PUBLIC_APP_URL** = `https://plenipay.com`.

3. Aguarde o **primeiro deploy** terminar (verde).

4. **Settings** → **Networking** → **Generate Domain** (se ainda não tiver) e anote a URL tipo `xxx.up.railway.app`.

5. **Custom Domain**:
   - Adicione **plenipay.com** e **www.plenipay.com**.
   - O Railway vai mostrar as instruções de DNS (geralmente CNAME para a URL `xxx.up.railway.app`).

---

## Parte 5: DNS no Cloudflare

1. No **Cloudflare** (plenipay.com):
   - **plenipay.com** → CNAME para a **nova** URL do Railway (ex.: `xxx.up.railway.app`).
   - **www** → CNAME para a **mesma** URL do Railway.
2. Mantenha as regras de **Bypass Cache** para `*plenipay.com/*` e `*www.plenipay.com/*` (conforme `CLOUDFLARE-BYPASS-CACHE.md`).

---

## Parte 6: Conferir se está tudo certo

1. **URL direta do Railway** (substitua pela URL do novo serviço):
   ```
   https://SUA-NOVA-URL.up.railway.app/api/build-info
   ```
   Resposta esperada:
   ```json
   {"source":"railway","ok":true,"hint":"..."}
   ```
   Se aparecer isso, o **código novo** está no ar e o build foi limpo.

2. **Domínio**:
   ```
   https://plenipay.com/api/build-info
   ```
   Deve ser igual ao item 1 (mesmo `source: "railway"`).

3. Teste o site: login, home, etc.

---

## Resumo

| O que fazer | Por quê |
|-------------|--------|
| Push do código no **main** antes de criar o serviço | O primeiro build usa esse código. |
| **Novo** projeto ou **novo** serviço no Railway | Build sem cache; deploy passa a refletir o repo. |
| Repor **todas** as variáveis no novo serviço | App precisa delas em produção. |
| Apontar **DNS** de novo para a URL do Railway | plenipay.com e www passam a usar o novo deploy. |

A partir daí, sempre que você der **push no main** (ou fizer deploy pelo `railway up` no serviço novo), a **atualização do código após o deploy vai funcionar**, porque o serviço novo está ligado ao repositório correto e sem cache antigo.
