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

## 3. Código (já implementado)

- `lib/auth.ts`: `getSiteUrlForEmailRedirect()` retorna `https://plenipay.com` em produção.
- O redirect usado no signUp e no generateLink é sempre: `https://plenipay.com/auth/callback?next=/login`.

Mesmo que o email saia com `redirect_to=https://plenipay.com`, o **middleware** e a **página raiz** redirecionam `/?code=...` ou `/?token_hash=...` para `/auth/callback`, que processa a confirmação, mostra o modal e dispara o aviso no WhatsApp.
