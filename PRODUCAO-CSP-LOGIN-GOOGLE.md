# Por que o login com Google em produção ainda manda para a landing?

Se você autorizou com Google mas foi parar na **landing** em vez do dashboard/onboarding, o console do navegador costuma mostrar:

- **"Connecting to https://www.google.com/ping?... violates Content-Security-Policy"**
- **connect-src** listando só `'self' https://*.supabase.co https://api.asaas.com` (sem Google)

Isso significa que a **CSP em produção** ainda é a antiga. O código no repositório já tem a CSP correta (com Google) em `next.config.js`.

## O que fazer

### 1. Fazer deploy de novo

O servidor (Railway, Vercel, Render, etc.) precisa rodar um **build novo** com o `next.config.js` atual:

- Faça commit e push das alterações (incluindo `next.config.js`).
- Ou dispare um **redeploy** no painel do provedor (Rebuild / Redeploy).

Depois do deploy, abra de novo o site em produção, abra o DevTools (F12) → aba **Network** → recarregue a página → clique na requisição do **document** (a primeira) → em **Response Headers** procure por **Content-Security-Policy**. Deve aparecer **connect-src** com `https://www.google.com`, `https://accounts.google.com`, etc.

### 2. Se usar Cloudflare (ou outro proxy na frente)

Se o domínio (ex.: plenipay.com) passa pelo **Cloudflare** (ou outro CDN/proxy) que **injeta** ou **reescreve** headers:

- Entre no painel do Cloudflare (ou do proxy).
- Em **Rules** / **Transform Rules** / **Page Rules**, veja se existe alguma regra que adiciona **Content-Security-Policy** (ou **Content-Security-Policy-Report-Only**).
- Se existir:
  - **Opção A:** Remover essa regra para que só o Next.js envie a CSP (recomendado).
  - **Opção B:** Editar a regra e incluir na **connect-src** os mesmos domínios que estão no `next.config.js`:  
    `https://www.google.com https://www.google.com/ping https://accounts.google.com https://apis.google.com https://*.google.com`

Vários headers CSP no mesmo response podem ser combinados de forma restritiva; por isso o ideal é ter **uma única** CSP (a do Next.js, já correta no código).

### 3. Conferir após o ajuste

1. Deploy feito (e, se for o caso, CSP do Cloudflare removida ou corrigida).
2. Abrir **https://plenipay.com** (ou o domínio de produção).
3. F12 → Console: não deve aparecer mais violação de CSP para `google.com`.
4. Fazer de novo **Cadastrar/Entrar com Google** → após autorizar, deve ir para o **dashboard** ou para o **onboarding** (bem-vindo + quiz), e não para a landing.

---

**Resumo:** O erro persiste porque a **CSP em produção** ainda é a antiga (sem Google). Corrija com **novo deploy** e, se usar Cloudflare (ou similar), **não definir CSP lá** ou incluir os domínios do Google na connect-src.
