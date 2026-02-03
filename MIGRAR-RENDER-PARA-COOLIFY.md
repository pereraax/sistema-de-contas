# Migrar Render → Coolify

Guia para colocar o **Sistema de Contas** no Coolify sem burocracia e voltar a funcionar.

---

## O que você precisa

1. **VPS** (Hetzner, DigitalOcean, Contabo, etc.) ou **Coolify Cloud**
2. **Coolify** instalado nesse VPS (ou conta no Coolify Cloud)
3. **Domínio** apontando para o servidor (ex.: `plenipay.com`)
4. **Variáveis de ambiente** que você já usa no Render (Supabase, SMTP, etc.)

---

## Passo 1: Coolify instalado

- **Self‑hosted:** siga [Coolify Docs – Installation](https://coolify.io/docs/installation).
- **Coolify Cloud:** crie conta em [coolify.io](https://coolify.io) e use o painel deles.

---

## Passo 1b: Adicionar o servidor no Coolify (“New Server”)

O Coolify **não hospeda** nada por você. Ele faz deploy **em um servidor (VPS)** que você adiciona.  
Por isso ele pede **“New Server”** antes de criar projetos ou fazer deploy.

### Opção A: Conectar um servidor Hetzner

- Se você já tem **Hetzner Cloud**: clique em **“Connect a Hetzner Server”**.
- Conecte a conta Hetzner e escolha (ou crie) um servidor. O Coolify configura o resto.

### Opção B: Adicionar servidor por IP (qualquer VPS)

Use isso se seu VPS é **DigitalOcean, Contabo, Vultr, AWS, etc.** ou qualquer outro com SSH.

1. **Name**  
   - Qualquer nome para identificar o servidor (ex.: `plenipay-vps` ou `meu-servidor`).  
   - Pode trocar o que veio preenchido.

2. **IP Address/Domain**  
   - O **IP público** do seu VPS (ex.: `123.45.67.89`) **ou** um domínio que aponte para ele.

3. **Port**  
   - Deixe **22** (porta padrão do SSH).

4. **User**  
   - Normalmente **`root`** (ou o usuário que você usa para SSH).

5. **Private Key**  
   - Sua **chave SSH privada** (a que você usa para `ssh root@ip-do-servidor`).  
   - Cole o conteúdo completo, incluindo as linhas `-----BEGIN ... KEY-----` e `-----END ... KEY-----`.

6. **Use it as a build server?**  
   - Pode deixar **desmarcado** no início.

7. Clique em **Continue**.

### Se ainda não tem um VPS

- Crie um em **Hetzner**, **DigitalOcean**, **Contabo** ou **Vultr** (qualquer um com Ubuntu e IP público).
- Anote o **IP**, usuário (geralmente `root`) e garanta que você tem a **chave SSH** para acessar.
- Depois use a **Opção B** acima para adicionar no Coolify.

---

## Passo 2: Novo projeto no Coolify

1. No Coolify, vá em **Projects**.
2. **Add** → **Project**.
3. Nome: `sistema-de-contas` (ou outro).
4. Salve.

---

## Passo 3: Conectar o repositório

1. No projeto, **Add Resource**.
2. Escolha **Public Repository** (ou **Private** se configurou GitHub App).
3. **Repository URL:**  
   `https://github.com/pereraax/sistema-de-contas`  
   (ou o seu fork).
4. **Branch:** `main`.
5. **Check Repository** para validar.

---

## Passo 4: Tipo de deploy

1. **Build Pack:** **Dockerfile**.
2. O projeto já tem `Dockerfile` na raiz; o Coolify usa ele.
3. **Port:** `3000` (ou a porta que o Coolify mostrar como padrão).

---

## Passo 5: Variáveis de ambiente

No Coolify, em **Environment Variables** do serviço, adicione as mesmas do Render:

| Variável | Exemplo | Obrigatório |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Sim |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Sim |
| `NEXT_PUBLIC_SITE_URL` | `https://plenipay.com` | Sim |
| `SMTP_HOST` | `smtp.hostinger.com` | Se usar email próprio |
| `SMTP_PORT` | `587` | Se usar email próprio |
| `SMTP_USER` | `comercial@plenipay.com` | Se usar email próprio |
| `SMTP_PASSWORD` | `***` | Se usar email próprio |
| `SMTP_FROM` | `Plenipay <comercial@plenipay.com>` | Se usar email próprio |

**Dica:** no Render, em **Environment** do serviço, copie cada variável e cole no Coolify.

---

## Passo 6: Domínio e SSL

1. Em **Domains** do serviço no Coolify:
   - Adicione `plenipay.com` e `www.plenipay.com` (se usar).
2. **SSL:** Coolify costuma gerar certificado automaticamente (Let’s Encrypt).
3. No **DNS** do domínio, aponte:
   - **A** ou **CNAME** para o IP ou hostname do servidor onde o Coolify roda.

---

## Passo 7: Deploy

1. Salve as configurações.
2. Clique em **Deploy** (ou **Deploy Now**).
3. Acompanhe os **Logs** do build e do runtime.
4. Quando aparecer **Running** / **Healthy**, teste no navegador.

---

## Passo 8: Testar

- Abra `https://plenipay.com`.
- Faça login, teste cadastro e o fluxo de **confirmar email** (link no email deve abrir em `plenipay.com`).

---

## O que já está ajustado no projeto

- **`server.js`:** em produção usa `0.0.0.0` (funciona em Coolify/VPS).
- **`Dockerfile`:** build e execução via `node server.js`.
- **`.dockerignore`:** reduz tamanho do build.

Nada disso depende mais do Render.

---

## Se usar Nixpacks em vez de Dockerfile

1. **Build Pack:** **Nixpacks**.
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `node server.js`
4. **Port:** `3000`

O projeto já está pronto para os dois (Dockerfile ou Nixpacks).

---

## Resumo rápido

| Onde | O que fazer |
|------|-------------|
| **Coolify → New Server** | Adicionar VPS (IP + SSH ou Hetzner) |
| Coolify | Novo projeto → Resource → Repo GitHub |
| Build | Dockerfile (ou Nixpacks) |
| Env | Copiar variáveis do Render |
| Domínio | Adicionar em Domains e apontar DNS |
| Deploy | Deploy → ver logs → testar |

---

## Problemas comuns

**Build falha**

- Veja os logs do build no Coolify.
- Confirme que o **Dockerfile** está na raiz e que o repositório é o correto.

**502 / não abre**

- Verifique se a **porta** do serviço é `3000` (ou a que você configurou).
- Confira se **Todas as variáveis** (principalmente Supabase e `NEXT_PUBLIC_SITE_URL`) estão iguais ao Render.

**Email não envia / link errado**

- `NEXT_PUBLIC_SITE_URL` deve ser `https://plenipay.com`.
- Supabase **Site URL** e **Redirect URLs** devem usar `https://plenipay.com` e `https://plenipay.com/auth/callback`.

Se quiser, na próxima mensagem você pode colar um trecho dos logs do Coolify (build ou runtime) que eu te ajudo a interpretar.
