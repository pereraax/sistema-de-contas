# Rodar apenas no Railway (não usar Vercel)

Este projeto está configurado para **deploy somente no Railway**. O domínio **plenipay.com** deve apontar apenas para o Railway.

---

## 1. Desconectar / remover do Vercel

Para que o deploy rode **só** no Railway:

1. Acesse **https://vercel.com** e faça login.
2. Abra o projeto **sistema-de-contas-1** (ou o nome que estiver no Vercel).
3. Vá em **Settings** → **General**.
4. Role até **"Delete Project"** (ou **"Remove Project"**) e **remova o projeto** do Vercel.  
   - Ou, em **Settings** → **Git**, **desconecte** o repositório do GitHub.

Assim, os pushes no GitHub **não** vão mais disparar deploy no Vercel.

---

## 2. Manter deploy apenas no Railway

1. Acesse **https://railway.app** → seu projeto.
2. Em **Settings** → **Service**, confirme que o **repositório GitHub** está conectado (branch `main` ou o que você usa).
3. Cada **push** no GitHub passa a gerar deploy **somente** no Railway.

---

## 3. Apontar o domínio (Cloudflare) para o Railway

Para que **plenipay.com** e **www.plenipay.com** usem o app que está no Railway:

1. No **Railway**: **Settings** → **Domains** (ou **Networking** → **Public Networking**).  
   Anote o **domínio público** que o Railway mostra (ex.: `sistema-de-contas-1.up.railway.app` ou um CNAME como `xxx.railway.app`).

2. No **Cloudflare** → **plenipay.com** → **DNS** → **Records**:
   - **www** (e **@** se o Railway pedir): tipo **CNAME**, target = **o valor que o Railway indicar** (ex.: `sistema-de-contas-1.up.railway.app` ou o CNAME do passo anterior).
   - Remova qualquer CNAME que aponte para **Vercel** (ex.: `cname.vercel-dns.com` ou `*.vercel.app`).

3. Salve e aguarde 2–5 minutos. Depois faça **Purge Everything** em **Caching** → **Configuration** no Cloudflare.

---

## 4. Arquivo `vercel.json` neste repositório

Foi adicionado um **vercel.json** que faz o build falhar no Vercel com a mensagem:  
*"Este projeto deve rodar apenas no Railway."*

Assim, mesmo que alguém conecte este repositório ao Vercel de novo, o deploy não será concluído com sucesso e o uso oficial continua sendo só o Railway.

---

## Resumo

| Onde            | Ação |
|-----------------|------|
| **Vercel**      | Remover o projeto ou desconectar o repositório. |
| **Railway**     | Manter o repositório conectado para deploy automático. |
| **Cloudflare DNS** | **www** e **@** com CNAME apenas para o target do **Railway**. |
| **Código**      | `vercel.json` impede build com sucesso no Vercel. |

Depois disso, o deploy e o domínio oficial ficam **apenas no Railway**.
