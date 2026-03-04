# Habilitar login com Apple e Google (Supabase)

O erro **"Unsupported provider: provider is not enabled"** significa que o provedor (Apple ou Google) ainda não foi ativado no seu projeto Supabase.

## App vs site: a URL é a mesma?

- **App (Capacitor/App Store):** o app PLENIPAY abre o **mesmo site** (plenipay.com ou localhost) dentro do WebView. Por isso a **origem** ao fazer login com Google é a mesma do site: `https://plenipay.com` (prod) ou `http://localhost:3000` (dev). **Não precisa de URL diferente** no Google nem no Supabase — use as mesmas Redirect URLs abaixo.
- **Se no futuro o app usar outro domínio** (ex.: `app.plenipay.com`): aí sim adicione também `https://app.plenipay.com/auth/callback` no Google e no Supabase, e no código use essa origem quando estiver no app.

## Passos no Supabase

1. Acesse o **Dashboard**: https://supabase.com/dashboard  
2. Abra o projeto (ex.: o que usa a URL `frhxqgcqmxpjpnghsvoe.supabase.co`).  
3. No menu lateral: **Authentication** → **Providers**.  
4. Ative e configure:

### Google

- Clique em **Google** e ative (**Enable**).
- Crie (ou use) um projeto no **Google Cloud Console** (https://console.cloud.google.com):
  - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
  - Tipo: **Web application**.
  - **Authorized redirect URIs**: adicione a URL que o Supabase mostrar (algo como `https://frhxqgcqmxpjpnghsvoe.supabase.co/auth/v1/callback`).
- Copie **Client ID** e **Client Secret** para os campos do Supabase (Google provider).
- Salve.

### Apple

- Clique em **Apple** e ative (**Enable**).
- No **Apple Developer** (https://developer.apple.com):
  - Crie um **Services ID** e configure **Sign In with Apple**.
  - Gere uma chave **.p8** e anote o **Key ID** e **Service ID**.
- No Supabase, preencha os campos com **Services ID**, **Secret Key** (.p8), **Key ID**, **Team ID** e **Bundle ID** (ou conforme o formulário).
- Salve.

## URLs de redirect no Supabase (obrigatório para ir para o dashboard)

Se o usuário cair na **landing** em vez do **dashboard** após o Google/Apple, quase sempre é porque a URL de redirect está errada.

Em **Authentication** → **URL Configuration**:

1. **Site URL**: `https://plenipay.com` (produção) ou `http://localhost:3000` (dev).
2. **Redirect URLs** — **adicione exatamente** (uma por linha):
   - `https://plenipay.com/auth/callback`
   - `http://localhost:3000/auth/callback`
   - Se usar www: `https://www.plenipay.com/auth/callback`

**Importante:** sem `https://plenipay.com/auth/callback` na lista, o Supabase pode redirecionar para a **raiz** (/) após o login e o usuário fica na landing em vez do dashboard. O app e o site tentam corrigir redirecionando quem chega em / com `code` ou `#access_token` para `/auth/callback`, mas o ideal é o Supabase já mandar para `/auth/callback`.

**App (iOS/Android):** como o app carrega o plenipay.com no WebView, a mesma URL `https://plenipay.com/auth/callback` serve para o app; não é necessário cadastrar outra URL só para o app.

Depois de habilitar e salvar os provedores, tente de novo **Continuar com Apple** e **Continuar com Google** no app.

---

## Desenvolvimento local (localhost:3000) — funciona igual ao deploy

A lógica de redirect (middleware + script no layout) roda **também em desenvolvimento**. Não é só em produção.

Para o login com Google levar ao dashboard quando você está em **http://localhost:3000**:

1. **Supabase** → **Authentication** → **URL Configuration**:
   - **Redirect URLs**: inclua **`http://localhost:3000/auth/callback`** (além de `https://plenipay.com/auth/callback`).
   - Se quiser testar em dev com “Site URL” local: **Site URL** = `http://localhost:3000`. Senão pode deixar plenipay.com; o redirect vai para a URL que o app envia (`redirectTo`), desde que esteja na lista de Redirect URLs.

2. **Google Cloud Console**: o “Authorized redirect URIs” do OAuth é a URL **do Supabase** (ex.: `https://xxx.supabase.co/auth/v1/callback`), não a do nosso app. Ou seja, não precisa cadastrar `http://localhost:3000` no Google; o Supabase é que redireciona depois para o nosso `http://localhost:3000/auth/callback`.

3. Depois de autorizar no Google, confira na **barra de endereço**:
   - Se aparecer **`http://localhost:3000/auth/callback?code=...`** → o callback deve trocar o code por sessão e mandar para `/home`. Se cair na welcome, veja o console do **terminal** (logs do Next) e do **navegador** (F12) para erros.
   - Se aparecer **`http://localhost:3000/?code=...`** (raiz com code) → o middleware deveria redirecionar para `/auth/callback`. Se não redirecionar, recarregue a página uma vez (o script do layout também redireciona).

4. **Se ao autorizar o Google você for parar em plenipay.com em vez de localhost**: o Supabase está ignorando o `redirectTo` e mandando para a "Site URL" (produção). **Solução:** em Supabase → Authentication → URL Configuration → **Redirect URLs**, adicione exatamente **`http://localhost:3000/auth/callback`** e salve. O app já envia `redirectTo` com a origem atual (localhost); se essa URL não estiver na lista, o Supabase redireciona para a Site URL e você cai em produção. Depois de adicionar, teste de novo no localhost.
