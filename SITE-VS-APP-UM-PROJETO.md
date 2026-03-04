# Site e app iPhone: é o mesmo projeto (e pode ficar assim)

## Como funciona hoje

- **Um único repositório** = um único sistema.
- O **site** (plenipay.com no navegador) e o **app iPhone** (Capacitor) usam **o mesmo código**.
- O app não é outro “projeto”: ele abre o **mesmo site** (plenipay.com) dentro de uma WebView, com um parâmetro/cookie (`platform=app`) que ativa o visual e o fluxo do app (onboarding, quiz, etc.).

Ou seja: **não são 2 projetos diferentes**. É 1 projeto que se comporta de 2 jeitos conforme quem abre (navegador = site, app = app).

## O que o deploy faz e o que NÃO faz

- **Deploy** = publicar o código novo no servidor (ex.: Railway). O que sobe é o que está no repositório (Next.js, páginas, CSP, etc.).
- **NÃO some** a “configuração da plataforma via site”:
  - Variáveis de ambiente (`.env` no servidor, Supabase, etc.) ficam onde você configurou (painel do Railway, Vercel, etc.).
  - Redirect URLs no Supabase, Google, etc. continuam como você configurou.
  - Domínio (plenipay.com), SSL, etc. continuam iguais.

Ou seja: fazer deploy **atualiza o código**, não apaga configurações de plataforma (site, domínio, env, OAuth).

## Medo: “Atualizar o deploy com alterações do app e quebrar o site”

- Tudo que fizemos para o **app** (onboarding, quiz, cookie `platform=app`) **só muda o comportamento quando a pessoa está no app** (cookie `platform=app`).
- Quem entra pelo **site** (sem esse cookie) continua vendo o site normal; não passa pelo onboarding do app.
- Então: **um deploy único** serve os dois. As alterações “do app” não substituem o site; elas só aparecem para quem usa o app.

Se no futuro você quiser **separar de verdade** (por exemplo, um deploy só “site” e outro só “app”), aí sim dá para falar em 2 ambientes ou 2 pipelines; hoje não é necessário.

## Como desenvolver de forma separada (sem confundir)

Você pode organizar assim, **sem criar 2 projetos**:

1. **Branches**
   - `main` = o que está em produção (site + app).
   - `develop` (ou `app`) = onde você desenvolve coisas do app e do site.
   - Você só faz merge de `develop` em `main` (e aí o deploy roda) quando estiver seguro.

2. **Quem faz o deploy**
   - Você pode pedir para **não** fazer deploy automático: a regra do Cursor pode ser “não dar push em main a menos que eu peça”.
   - Assim, alterações para o app ficam no seu branch até você decidir subir.

3. **Um projeto, dois “modos”**
   - Continua sendo **um projeto**.
   - Site = abrir plenipay.com no navegador.
   - App = abrir plenipay.com no iPhone (com `platform=app`).
   - O mesmo deploy atende os dois; a diferença é o modo (site vs app), não o projeto.

## Resumo

- **Não são 2 projetos**; é 1 sistema que serve site e app.
- **Deploy não apaga** configuração da plataforma (site, env, OAuth).
- **Alterações do app** não “substituem” o site; só mudam o que quem usa o app vê.
- Para não confundir: use **branches** e só faça deploy (merge em `main`) quando quiser. Podemos seguir **sem** eu fazer deploy a menos que você peça explicitamente.
