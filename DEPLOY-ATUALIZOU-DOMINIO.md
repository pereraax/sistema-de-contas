# Deploy concluído mas o domínio não atualiza – o que fazer

## Causa mais comum: domínio e deploy em lugares diferentes

O **domínio** (plenipay.com) precisa apontar para **o mesmo lugar** onde o deploy está rodando. Se no Cloudflare o DNS aponta para **Railway** mas o deploy que você vê como "success" é no **Vercel** (ou o contrário), o site no domínio **nunca** atualiza, mesmo com Purge Everything.

### Passo 1 – Para onde o domínio aponta?

1. **Cloudflare** → domínio **plenipay.com** → **DNS** → **Records**.
2. Veja o registro de **www** (e o de **@**):
   - **CNAME** com target tipo `xxx.railway.app` → tráfego vai para **Railway**.
   - **CNAME** com target tipo `cname.vercel-dns.com` ou `xxx.vercel.app` → tráfego vai para **Vercel**.
   - Outro target (Render, IP antigo, etc.) → tráfego vai para **outro serviço**.

### Passo 2 – Onde o deploy está rodando?

No painel onde você viu **"Deployment successful"** (Railway ou Vercel), copie a **URL pública** do app (ex.: `sistema-de-contas-1.up.railway.app` ou `sistema-de-contas-1.vercel.app`).

### Passo 3 – Teste direto nessa URL

Abra no celular/navegador: **essa URL** + `/home` (ex.: `https://sistema-de-contas-1.up.railway.app/home`).

- Se **nessa URL** a versão nova aparecer e em **plenipay.com** não → o domínio está apontando para **outro lugar** ou há cache. Ajuste o DNS no Cloudflare para apontar para **essa mesma** URL (o target CNAME que Railway ou Vercel indicar) e faça Purge Everything de novo.
- Se **nessa URL** também estiver a versão antiga → o deploy "success" pode ser de outro projeto; confira qual projeto está ligado ao repositório no Railway e no Vercel.

### Resumo

| DNS no Cloudflare aponta para | Deploy "success" está em | Resultado |
|------------------------------|---------------------------|-----------|
| Railway                      | Railway                   | Deve atualizar (senão é cache). |
| Vercel                       | Vercel                    | Deve atualizar (senão é cache). |
| Railway                      | Vercel                    | **Domínio não atualiza.** Ajuste DNS para Vercel. |
| Vercel                       | Railway                   | **Domínio não atualiza.** Ajuste DNS para Railway. |

---

## 1. Conferir no Railway

1. Acesse **https://railway.app** → seu projeto.
2. Aba **Deployments**: o último deploy está com status **Success**?
3. O domínio **plenipay.com** está ligado a **este** serviço?
   - **Settings** → **Domains** → confira se `plenipay.com` (e `www.plenipay.com` se usar) está na lista e apontando para o serviço correto.
4. Se existir opção **“Production”** ou **“Promote to production”**, o deploy mais recente está marcado como produção? Às vezes o domínio usa o deploy “production”, não o último build.

---

## 2. Limpar cache do Cloudflare (se usar)

Se o site passa pelo **Cloudflare**:

1. Login em **https://dash.cloudflare.com**.
2. Selecione o domínio **plenipay.com**.
3. Menu **Caching** → **Configuration**.
4. Clique em **Purge Everything** (ou “Limpar tudo”).
5. Confirme. Em 1–2 minutos o CDN passa a buscar a versão nova do Railway.

Se não tiver “Purge Everything”, use **Custom Purge** e coloque:
- `https://plenipay.com/*`
- `https://www.plenipay.com/*`

---

## 3. Testar sem cache do seu celular/navegador

- **Safari no iPhone**:  
  Ajustes → Safari → **Limpar Histórico e Dados dos Sites**  
  Ou: Ajustes → Safari → Avançado → **Dados dos Sites** → plenipay.com → **Remover**.

- **Teste “limpo”**:  
  Abra o site em **aba anônima/privada** ou em outro navegador (Chrome, etc.) para ver se a versão nova aparece.

---

## 4. Conferir se a nova versão está no ar

Abra no navegador (de preferência em aba anônima):

- `https://plenipay.com/home`

Teste uma mudança que você sabe que fez (ex.: zoom nos inputs, sidebar rolável). Se aparecer, o deploy está no domínio e o que atrapalhava era cache (Cloudflare ou navegador).

---

## Resumo

| Onde verificar | O que fazer |
|----------------|------------|
| **Railway**    | Domínio ligado ao serviço certo e último deploy em produção. |
| **Cloudflare**| **Purge Everything** (ou purge das URLs do site). |
| **Celular**    | Limpar dados do Safari / site ou testar em aba anônima. |

Na maioria dos casos, **Purge Everything** no Cloudflare resolve quando o deploy já terminou há mais de 15 minutos e o domínio continua mostrando a versão antiga.
