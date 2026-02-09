# Verificar no Railway: domínio e deploy no mesmo lugar

Se o deploy termina com sucesso mas **www.plenipay.com** não mostra as mudanças (mesmo com Bypass no Cloudflare e teste em aba anônima), o tráfego do domínio pode estar indo para **outro serviço** ou **outro deploy** no Railway.

---

## 1. Um único serviço com domínio + GitHub

No Railway, **um projeto** pode ter **vários serviços** (ex.: "web", "api"). O **domínio customizado** (www.plenipay.com) fica ligado a **um** serviço. O **GitHub** também fica conectado a **um** serviço.

Para o site atualizar após o deploy, **tem de ser o mesmo serviço**:

- O serviço que recebe o **push do GitHub** (e faz o build)  
- O serviço que tem o **domínio www.plenipay.com** em Settings → Domains / Networking  

**O que fazer:**

1. Abra **https://railway.app** → projeto **sistema-de-contas-1**.
2. Veja quantos **serviços** existem (cards na horizontal).
3. Em **cada** serviço:
   - **Settings** → **Domains** (ou **Networking**): veja se **www.plenipay.com** está listado.
   - **Settings** → **Source** (ou **Connect Repo**): veja se o **GitHub** está conectado a esse serviço.
4. Confirme: o serviço que tem **www.plenipay.com** é o **mesmo** que está conectado ao **GitHub**.  
   Se o domínio estiver em um serviço e o GitHub em outro, o domínio **nunca** vai mostrar o deploy novo.

---

## 2. Deploy “ativo” é o mais recente

Algumas configurações usam “Production” ou “Active” para decidir qual deploy recebe o tráfego.

1. No **serviço** que tem o domínio e o GitHub, abra **Deployments**.
2. Veja o **último** deploy (o do seu último push).
3. Confirme se esse deploy está marcado como **Active** / **Production** (verde ou badge).  
   Se outro deploy antigo estiver como “Production”, o domínio continua servindo a versão antiga.

---

## 3. Testar direto na URL do Railway

Para saber se o **código novo** está no ar no Railway (sem passar pelo domínio):

1. No Railway, no serviço certo: **Settings** → **Networking** (ou **Domains**).
2. Copie a **URL pública** do serviço (ex.: `https://sistema-de-contas-1-production.up.railway.app`).
3. Abra em aba anônima: **essa URL** + `/api/build-info`  
   (ex.: `https://sistema-de-contas-1-production.up.railway.app/api/build-info`).
4. Veja a **data/hora** em `buildTime`.  
   Depois abra **https://www.plenipay.com/api/build-info** em aba anônima e compare.

- Se as **datas forem iguais** → domínio está apontando para o deploy certo; o problema é cache ou outro.
- Se a **data do domínio for mais antiga** → o domínio **não** está indo para o deploy novo (DNS ou serviço errado no Railway).

---

## 4. Resumo

| Verificação | O que conferir |
|-------------|----------------|
| **Serviço único** | O mesmo serviço tem **domínio www.plenipay.com** e **conexão com GitHub**. |
| **Deploy ativo** | O deploy mais recente está **Active** / **Production**. |
| **build-info** | `buildTime` em www.plenipay.com e na URL do Railway são **iguais e recentes**. |

Se o domínio estiver em um serviço e o GitHub em outro, mova o domínio para o serviço que recebe o deploy (ou conecte o GitHub ao serviço que tem o domínio).
