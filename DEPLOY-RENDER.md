# Deploy no Render – PleniPay

Guia para publicar o app no Render com domínio **plenipay.com** e links de confirmação de email corretos.

---

## 1. O que já está configurado no código

- **`render.yaml`** – Build e start; `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` definidos como `https://plenipay.com` para os links de confirmação usarem o domínio certo.
- **`getSiteUrl()`** – Em produção usa `NEXT_PUBLIC_SITE_URL` (ou fallback `https://plenipay.com`). Em desenvolvimento, com `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, usa localhost.
- **`.env.production`** – Exemplo com `NEXT_PUBLIC_SITE_URL=https://plenipay.com`. No Render você configura as variáveis no Dashboard (não precisa commitar `.env.production`).

---

## 2. Variáveis de ambiente no Render (obrigatórias)

No **Dashboard do Render** → seu **Web Service** → **Environment**:

| Variável | Valor | Observação |
|----------|--------|------------|
| `NODE_ENV` | `production` | Já pode estar no `render.yaml`. |
| `NEXT_PUBLIC_SITE_URL` | `https://plenipay.com` | **Crítico** – base dos links de confirmação no email. |
| `NEXT_PUBLIC_APP_URL` | `https://plenipay.com` | Mesmo domínio. |
| `NEXT_PUBLIC_SUPABASE_URL` | (sua URL do Supabase) | Do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (sua anon key) | Do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | (sua service role key) | Do projeto Supabase (segredo). |
| `ADMIN_JWT_SECRET` | (segredo forte) | Para painel admin. |
| `ASAAS_API_KEY` | (sua key) | Se usar Asaas. |
| `ASAAS_API_URL` | `https://www.asaas.com/api/v3` | Se usar Asaas. |

### Email (confirmação de cadastro / reenvio de link)

Para os emails de confirmação serem enviados pelo app (Hostinger ou outro SMTP):

| Variável | Valor |
|----------|--------|
| `SMTP_HOST` | `smtp.hostinger.com` (ou seu servidor) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | ex: `comercial@plenipay.com` |
| `SMTP_PASSWORD` | Senha do email (ou senha de app) |
| `SMTP_FROM` | ex: `comercial@plenipay.com` |

Assim, no Render os links no email saem como:  
`https://plenipay.com/auth/callback?token_hash=...&next=/home`.

---

## 3. Como fazer o deploy no Render (você faz no site)

1. Acesse [dashboard.render.com](https://dashboard.render.com) e faça login.
2. **New** → **Web Service**.
3. Conecte o repositório Git (GitHub/GitLab) onde está este projeto.
4. Render deve detectar o `render.yaml`. Confirme:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `./start.sh` (ou o que estiver no `render.yaml`).
5. Em **Environment**, adicione todas as variáveis da tabela acima (e as de SMTP se for enviar email pelo app).  
   Não é necessário adicionar de novo `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` se já estiverem no `render.yaml`, a menos que queira sobrescrever.
6. Salve e inicie o **Deploy**. Aguarde o build e o start.
7. Em **Settings**, em **Custom Domain**, adicione **plenipay.com** (e **www.plenipay.com** se usar) e configure o DNS conforme as instruções do Render.

---

## 4. DNS (domínio plenipay.com)

No painel do seu provedor de domínio (ex.: Registro.br, Cloudflare, GoDaddy):

- Para o serviço web do Render, use o endereço que o Render mostrar em **Custom Domain** (geralmente um CNAME para algo como `xxx.onrender.com`).
- Exemplo: `plenipay.com` → CNAME → `sistema-de-contas-1.onrender.com` (ou o host que o Render indicar).

Assim, quando o usuário acessar **https://plenipay.com**, cai no app no Render e os links de confirmação já saem com `https://plenipay.com`.

---

## 5. Resumo

- **Desenvolvimento:** `NEXT_PUBLIC_SITE_URL=http://localhost:3000` no `.env.local` → links de confirmação em **localhost**.
- **Produção (Render):** `NEXT_PUBLIC_SITE_URL=https://plenipay.com` (no `render.yaml` e/ou no Environment do Render) → links de confirmação em **plenipay.com**.

O deploy em si é feito por você no Render (conectar repositório, configurar env e domínio). Este repositório já está preparado para que, após o deploy, o link de confirmação use o domínio plenipay.
