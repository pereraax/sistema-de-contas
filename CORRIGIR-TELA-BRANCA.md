# Tela branca / página sem estilo (CSS) depois do login

## Por que a página fica sem estilo depois de logar?

A página após o login (ex.: `/home`) usa o mesmo HTML e os mesmos arquivos de CSS/JS que o resto do app. Se você vê a página **com conteúdo mas sem cores, layout nem botões estilizados**, é porque os **arquivos em `/_next/static/`** (CSS e JS) **não estão sendo carregados** — em geral por **404** ou proxy incorreto.

- **Local:** costuma ser cache antigo do Next (pasta `.next`) ou abrir em outra porta/URL.
- **Produção:** o servidor (Nginx, etc.) não está entregando `/_next/*` para o Node que roda o Next.

## O que foi corrigido no código

1. **next.config.js**
   - Removido `upgrade-insecure-requests` do CSP (evita que o navegador force HTTPS e quebre em localhost).
   - CSP ajustado para permitir fonts (Google Fonts) em `style-src` e `font-src`.
   - Removidos `ignoreWarnings` que escondiam erros de módulos e CSS no build.

2. **package.json**
   - Novo script: `npm run dev:reset` — limpa a pasta `.next` e sobe o dev na porta 3000.

3. **app/layout.tsx**
   - Estilos inline de fallback no `<body>` (fundo, cor, fonte) para que, se o CSS não carregar, a página ainda fique legível.

## O que fazer no seu ambiente

### Desenvolvimento local

1. Pare o servidor (Ctrl+C) se estiver rodando.
2. Rode:
   ```bash
   npm run dev:reset
   ```
   Ou manualmente:
   ```bash
   rm -rf .next && npm run dev
   ```
3. Abra no navegador: **http://localhost:3000** (use exatamente essa URL).
4. Se ainda ficar branco, faça um refresh forçado: **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac).

### Produção (Hostinger, Railway, etc.)

- Os 404 em `webpack.js`, `main.js`, `app.js` costumam ser **servidor não entregando a pasta `_next`**.
- Garanta que:
  - O deploy inclui a pasta **`.next`** (ou o output do `next build`).
  - O proxy (Nginx, etc.) encaminha **`/_next/*`** para o mesmo processo que serve o Next (Node).
- Exemplo Nginx:
  ```nginx
  location /_next/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  ```

### Como conferir se o problema é 404 em assets

1. Abra **Ferramentas do desenvolvedor** (F12) → aba **Rede** (Network).
2. Faça login e vá para `/home` (ou recarregue a página sem estilo).
3. Procure requisições em vermelho (falha). Se houver **404** em URLs como:
   - `/_next/static/chunks/...css`
   - `/_next/static/chunks/...js`
   então o servidor não está entregando a pasta `_next` corretamente. Corrija o proxy/build conforme a seção de produção acima.

Depois do deploy, limpe o cache do navegador ou teste em aba anônima.
