# Redirect vai para plenipay.com mesmo com localhost nas URLs?

Se você já colocou `http://localhost:3000/auth/callback` nas **Redirect URLs** do Supabase e mesmo assim, ao testar no localhost, o retorno do Google vai para **plenipay.com**, faça o seguinte.

## 1. Conferir a "Site URL" no Supabase

O Supabase usa a **Site URL** como destino padrão em vários fluxos. Se ela estiver como `https://plenipay.com`, o retorno do OAuth pode acabar indo para lá em vez do seu `redirectTo`.

**Para testar no localhost:**

1. Abra **Supabase** → **Authentication** → **URL Configuration**.
2. Em **Site URL**, troque **temporariamente** para:  
   **`http://localhost:3000`**
3. Salve.
4. Teste de novo o login com Google no **localhost**.
5. Depois dos testes, **volte a Site URL** para **`https://plenipay.com`** para produção.

Assim, durante o teste local, o Supabase tende a redirecionar para o localhost em vez de plenipay.com.

## 2. Abrir sempre com `?platform=app` no localhost

A tela com o botão **“Continuar com Google”** do **app** (bem-vindo + quiz) só aparece quando o sistema entende que está no app (cookie `platform=app`).

- **Certo:** abrir **`http://localhost:3000?platform=app`**  
  → aparece a tela do app com Google → o `redirectTo` enviado é do localhost.

- **Errado:** abrir só **`http://localhost:3000`**  
  → aparece a landing do site; se nessa tela tiver algum “Login com Google”, o fluxo pode ser outro e o retorno pode ir para plenipay.com.

Use sempre **`http://localhost:3000?platform=app`** ao testar o fluxo do app no localhost.

## 3. Conferir no console o que está sendo enviado

Ao clicar em **“Continuar com Google”** no localhost, o console (F12) deve mostrar algo como:

`[OAuth] redirectTo (local): http://localhost:3000/auth/callback?next=/onboarding&platform=app ...`

- Se aparecer **plenipay.com** aí, você não está na tela do app (abrir com `?platform=app`).
- Se aparecer **localhost** e mesmo assim o navegador cair em plenipay.com, altere a **Site URL** no Supabase para `http://localhost:3000` como no passo 1.

## 4. Resumo

| Onde testar | Site URL (Supabase) | URL no navegador |
|-------------|---------------------|-------------------|
| Local (app) | `http://localhost:3000` | `http://localhost:3000?platform=app` |
| Produção    | `https://plenipay.com`  | `https://plenipay.com?platform=app` (no app) |

Com Redirect URLs corretas **e** Site URL = localhost durante o teste, o retorno do Google deve ficar no localhost.
