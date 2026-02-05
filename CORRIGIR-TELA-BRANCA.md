# Tela branca e 404 nos scripts (webpack, main.js, etc.)

## O que foi corrigido no código

1. **next.config.js**
   - Removido `upgrade-insecure-requests` do CSP (evita que o navegador force HTTPS e quebre em localhost).
   - CSP ajustado para permitir fonts (Google Fonts) em `style-src` e `font-src`.
   - Removidos `ignoreWarnings` que escondiam erros de módulos e CSS no build.

2. **package.json**
   - Novo script: `npm run dev:reset` — limpa a pasta `.next` e sobe o dev na porta 3000.

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

Depois do deploy, limpe o cache do navegador ou teste em aba anônima.
