# Configuração Supabase para confirmação de email (Plenipay)

Para o link de confirmação abrir em **plenipay.com**, mostrar o modal "Email confirmado" e enviar o aviso no WhatsApp, configure o projeto assim:

## 1. URL Configuration (Auth → URL Configuration)

- **Site URL:** `https://plenipay.com`
- **Redirect URLs** (adicione exatamente):
  - `https://plenipay.com/auth/callback`
  - `https://plenipay.com/auth/callback?next=/login`
  - `https://plenipay.com/login`

Se só estiver `https://plenipay.com`, o link do email pode sair com `redirect_to=https://plenipay.com` (sem path) e o usuário cai na raiz. O app redireciona mesmo assim, mas o ideal é o link já apontar para o callback.

## 2. Email Templates (Auth → Email Templates → Confirm signup)

Use **{{ .ConfirmationURL }}** no botão/link do email (não use {{ .SiteURL }} sozinho).

Exemplo de link no template:
```html
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

O `ConfirmationURL` já inclui o token e o `redirect_to` que enviamos no signUp (`https://plenipay.com/auth/callback?next=/login`).

## 3. Código e variável de ambiente

- `lib/auth.ts`: `getSiteUrlForEmailRedirect()` usa, nesta ordem:
  1. **EMAIL_REDIRECT_BASE_URL** (se definida e não for localhost) → use em produção para forçar o link do email.
  2. Em desenvolvimento: `NEXT_PUBLIC_SITE_URL` com localhost.
  3. Caso contrário: `https://plenipay.com`.
- **No Railway (ou outro host de produção):** defina `EMAIL_REDIRECT_BASE_URL=https://plenipay.com` para o link de confirmação **sempre** apontar para plenipay.com, mesmo que `NODE_ENV` ou `NEXT_PUBLIC_SITE_URL` estejam com valor de dev/localhost.

Mesmo que o email saia com `redirect_to=https://plenipay.com`, o **middleware** e a **página raiz** redirecionam `/?code=...` ou `/?token_hash=...` para `/auth/callback`, que processa a confirmação, mostra o modal e dispara o aviso no WhatsApp.
