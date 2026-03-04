# Login com Google no app: ir para página de bem-vindo (não para a landing)

## O que foi corrigido

1. **CSP (Content Security Policy)**  
   Em produção a CSP estava bloqueando o Google (`connect-src`, scripts), então o fluxo OAuth quebrava e a sessão não era criada — o usuário voltava sem estar logado e via a landing.  
   **Ajuste:** em `next.config.js` foram reforçadas as diretivas para OAuth com Google (`script-src-elem`, `connect-src`, `frame-src`, `form-action` com domínios Google). **É preciso dar deploy** para essa CSP valer em produção (e não definir CSP no Cloudflare se o Next já definir).

2. **App: após OAuth, ir para /onboarding (bem-vindo), nunca para a landing**  
   - Na **raiz** (`app/page.tsx`): quando a URL tem `?code=...` (retorno do Google), o servidor lê o cookie `platform=app`. Se for app, o redirect para o callback já leva `next=/onboarding` e `platform=app`, assim o callback manda para a página de bem-vindo.  
   - No **cliente** (`LandingPageClient`): se o retorno do OAuth cair em `/` ou `/login` com `code` ou hash de token, e for app (`isApp`), o redirect para o callback usa `next=/onboarding` e `platform=app`.  
   - O **callback** já redireciona para o `next` que vier na URL; com `next=/onboarding` e `platform=app` o usuário cai na página de bem-vindo e o middleware mantém o cookie de app.

3. **App nunca mostra a landing**  
   Com `platform=app` (cookie), a raiz já renderiza `AppWelcomeScreen` em vez da landing. A landing só aparece no site (sem cookie de app).

---

# Por que aparece 500 após criar conta com Google (e não a página de bem-vindo)

## O que acontece no fluxo

1. Você clica em **Continuar com Google** (no app ou no site).
2. O Google redireciona para a **sua** aplicação com um `code` na URL, por exemplo:
   `https://frhxqgcqm.../auth/callback?code=...&next=/onboarding&platform=app`
3. A rota **`/auth/callback`** no servidor:
   - Troca o `code` por uma sessão (Supabase)
   - Grava cookies
   - Redireciona para a página de bem-vindo (`/onboarding`) ou para `/home`
4. Se **qualquer** passo no servidor lançar uma exceção **não tratada**, o host (Railway, Vercel, etc.) responde com **500** e o corpo:
   `{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure, please check server logs..."}`  
   Nesse caso o navegador **não** chega a ser redirecionado para a página de bem-vindo; você fica na mesma URL (geralmente a do callback) vendo esse JSON.

## Onde o 500 pode estar vindo

### 1. Dentro de `/auth/callback` (caso mais provável)

- O callback usa `cookies()`, `createServerClient` e `exchangeCodeForSession`.
- Se no **ambiente da preview** (ex.: `frhxqgcqm...`) faltar variável de ambiente (Supabase) ou `cookies()` falhar, o código **antigo** (sem try/catch) lança exceção → o host devolve 500.
- **O que já foi feito no código:** try/catch no callback, checagem de env e fallback quando `cookies()` falha. **Isso só vale no código que está no seu repositório.** Na URL da preview está rodando o **código que foi deployado naquele ambiente** (provavelmente uma versão antiga).
- **Por que “persiste”:** o erro continua na preview porque essa preview **ainda não** tem o código novo. Quando você fizer deploy do código atual nesse mesmo ambiente, o callback tende a parar de gerar 500 (ou a devolver uma resposta controlada em vez de “unexpected_failure”).

### 2. Na página **depois** do callback (`/onboarding` ou `/home`)

- Se o callback **conseguir** redirecionar, o próximo request é para `/onboarding` ou `/home`.
- A **home** é Server Component e chama `obterHomeEstatisticas` e `obterPerfilUsuario` no servidor. Se aí der erro (por exemplo Supabase sem env na preview), o host pode devolver 500 na **rota** `/home` (e aí a URL da página de erro seria `/home`, não `/auth/callback`).

## Como conferir

- **URL quando o 500 aparece**
  - Se for algo como `.../auth/callback?code=...` → o 500 veio do **callback**. Deploy do código novo na preview deve resolver.
  - Se for `.../onboarding` ou `.../home` → o 500 veio da **página** (servidor ao renderizar essa rota). Aí é preciso ver logs do servidor e/ou garantir env (Supabase) nesse ambiente.
- **Testar em localhost**
  - Com o código atual e `.env.local` com Supabase preenchido, faça o mesmo fluxo (Continuar com Google) em `http://localhost:3000?platform=app`.  
  - Se em localhost você for para a página de bem-vindo e na preview continuar em 500, confirma que o problema é o ambiente da preview (código antigo e/ou env).

## Resumo

- O 500 **não** é “redirect errado”: o redirect para a página de bem-vindo está configurado; o que acontece é que **antes** de redirecionar, algo no servidor (em geral no callback ou na página seguinte) lança exceção e o host responde 500.
- O erro **persiste** na URL da preview porque essa preview ainda está com **código antigo** (sem as proteções no callback) e/ou **sem variáveis de ambiente** do Supabase.
- Para a preview se comportar como o esperado: fazer deploy do código atual nessa preview e garantir que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e qualquer outra env usada no servidor) estejam configuradas nesse ambiente.
