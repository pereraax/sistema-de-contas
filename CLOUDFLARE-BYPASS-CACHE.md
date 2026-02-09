# Fazer o domínio atualizar após cada deploy – desativar cache no Cloudflare

Se o deploy termina no Railway mas **www.plenipay.com** não mostra as mudanças (ou aparece erro "Failed to find Server Action"), o navegador ou o Cloudflare estão servindo **HTML/JS antigos**. A solução mais segura é o Cloudflare **não cachear nada** do site.

---

## Passo a passo no Cloudflare

1. Acesse **https://dash.cloudflare.com** → domínio **plenipay.com**.
2. No menu lateral: **Rules** → **Page Rules** (ou **Regras** → **Page Rules**).
3. Clique em **Create Page Rule** (ou **Adicionar regra**).
4. Em **URL** (ou "Se o URL corresponder a"), use um destes:
   - `*www.plenipay.com/*`
   - ou `*plenipay.com/*`
   (assim a regra vale para todo o site.)
5. Em **Setting** (Configuração), adicione:
   - **Cache Level** → **Bypass** (ou "Ignorar cache").
6. Salve (**Save and Deploy** / **Salvar e implantar**).

Com isso, o Cloudflare **não guarda em cache** as respostas do seu site. Cada visita busca a versão atual no Railway e as atualizações passam a aparecer logo após o deploy.

---

## Por que isso resolve

- O erro **"Failed to find Server Action"** acontece quando o **navegador** está com **JavaScript de um deploy antigo** e o **servidor** já está em um **deploy novo** (IDs das Server Actions não batem).
- Isso costuma ocorrer quando **HTML ou JS** ficam em cache (Cloudflare ou navegador).
- Com **Cache Level: Bypass** no Cloudflare, as páginas e os scripts vêm sempre do Railway, então o navegador recebe a versão nova após cada deploy.

Depois de criar a regra, faça **Purge Everything** uma vez (Caching → Configuration) e teste em **aba anônima**.
