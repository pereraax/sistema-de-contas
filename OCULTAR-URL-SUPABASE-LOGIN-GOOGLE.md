# Deixar a URL do login Google mais profissional (ocultar supabase.co)

Na tela "Escolha uma conta" do Google aparece **"Prosseguir para frhxqgcqmxpjpnghsvoe.supabase.co"**. O Google sempre exibe essa URL por segurança; não dá para removê-la. O que dá para fazer é **trocar** para o seu domínio usando **Custom Domain** no Supabase.

## O que acontece hoje

- O fluxo OAuth usa o callback do Supabase: `https://PROJECT.supabase.co/auth/v1/callback`
- O Google mostra esse domínio na tela de consentimento.

## Solução: Custom Domain no Supabase

Quando você configura um **custom hostname** no projeto Supabase, todo o tráfego (incluindo Auth) passa a poder usar o seu domínio. Aí o Google mostrará algo como **"Prosseguir para auth.seudominio.com"**.

### Passo 1 – Custom hostname no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard) e abra o seu projeto.
2. Vá em **Project Settings** (ícone de engrenagem) e procure por **Custom Domain** ou **Hostname**.
3. Se existir a opção na interface:
   - Adicione um subdomínio, por exemplo: `auth.seudominio.com` (substitua pelo seu domínio real).
   - Siga as instruções de DNS e verificação que o Supabase mostrar.

Se **não** aparecer Custom Domain no dashboard (depende do plano), use a **Management API**:

- Endpoint: `POST /v1/projects/{ref}/custom-hostname/initialize`
- Body: `{ "custom_hostname": "auth.seudominio.com" }`
- Documentação: [Management API – Custom Hostname](https://supabase.com/docs/reference/api/v1-activate-custom-hostname)

Você precisa de um **Personal Access Token** do Supabase (Dashboard → Account → Access Tokens).

### Passo 2 – DNS

No provedor do seu domínio (Hostinger, Cloudflare, etc.):

- Crie um **CNAME** (ou o tipo que o Supabase indicar):
  - Nome: `auth` (para `auth.seudominio.com`)
  - Valor: o que o Supabase fornecer (geralmente algo como `xxx.supabase.co` ou um alias deles).

Aguarde a propagação e, no Supabase, conclua a verificação (e SSL, se pedido).

### Passo 3 – Google Cloud Console

1. Abra [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Edite o **OAuth 2.0 Client ID** usado no login (tipo “Web application”).
3. Em **Authorized redirect URIs**, **adicione** (mantendo o que já existe se ainda for usado):
   - `https://auth.seudominio.com/auth/v1/callback`
4. Em **Authorized JavaScript origins**, adicione:
   - `https://auth.seudominio.com`
   - E o domínio do seu site (ex.: `https://seudominio.com`).
5. Salve.

### Passo 4 – Supabase: Provider Google

1. No Supabase: **Authentication** → **Providers** → **Google**.
2. Confira se a URL de callback exibida lá está correta. Após o custom domain ativo, ela deve ser `https://auth.seudominio.com/auth/v1/callback`. Ajuste se o dashboard permitir ou aguarde a troca automática após o custom hostname.

### Passo 5 – Usar o custom domain no app

Depois que o custom domain estiver ativo e verificado:

1. No **Railway** (ou onde estiver o deploy), defina:
   - `NEXT_PUBLIC_SUPABASE_URL=https://auth.seudominio.com`
   (sem barra no final.)
2. Mantenha `NEXT_PUBLIC_SUPABASE_ANON_KEY` igual ao que já está no Supabase.
3. Faça um novo deploy para a variável ser aplicada.

Assim o cliente do Supabase (login, OAuth) passará a usar `https://auth.seudominio.com`, e o Google mostrará **"Prosseguir para auth.seudominio.com"** em vez de `frhxqgcqmxpjpnghsvoe.supabase.co`.

### Resumo

| Onde              | O que fazer |
|-------------------|-------------|
| Supabase          | Ativar custom hostname (ex.: `auth.seudominio.com`) e configurar DNS. |
| Google Console    | Adicionar `https://auth.seudominio.com/auth/v1/callback` nos redirect URIs. |
| App (env)         | `NEXT_PUBLIC_SUPABASE_URL=https://auth.seudominio.com` e redeploy. |

**Nota:** Custom domain no Supabase pode ser recurso de planos pagos. Confirme em [Supabase Pricing](https://supabase.com/pricing). Se não tiver custom domain, a única forma de “esconder” o supabase.co seria trocar o provedor de Auth por um que use o seu domínio no callback (ex.: Auth0, Clerk, ou implementar o OAuth no seu backend e redirecionar para o seu domínio).
