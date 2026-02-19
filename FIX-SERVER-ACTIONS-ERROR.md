# Corrigir erro "Failed to find Server Action" / "reading 'workers'"

Esse erro quebra páginas que usam Server Actions (login, dashboard, home, etc.) e pode fazer a assistente ou o site não responder. O Next.js gera IDs criptografados para Server Actions; sem uma chave fixa, cada deploy gera IDs diferentes e o cliente (navegador) fica com referências inválidas.

## Solução (obrigatório em produção)

Defina a variável de ambiente **no ambiente de produção** (Railway, Render, Vercel, etc.) **no momento do build**:

```bash
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<chave-base64-32-bytes>
```

### Como gerar a chave (uma vez só)

No terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copie o resultado (ex.: `K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=`) e use como valor de `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

### Onde configurar

- **Railway:** Project → Variables → Add Variable → `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` = (valor gerado). Depois faça um novo deploy.
- **Render:** Dashboard → Service → Environment → Add Variable → mesmo nome e valor. Redeploy.
- **Vercel:** Project Settings → Environment Variables → idem.

Importante: a chave deve ser **a mesma** em todos os deploys futuros. Não gere uma nova a cada deploy.

### Desenvolvimento local

No `.env.local` você pode adicionar a mesma variável (opcional; em dev o Next.js costuma tolerar melhor). Para gerar e já colar no .env.local:

```bash
echo "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")" >> .env.local
```

(Use só uma vez; senão duplica a linha.)

## Referência

- [Next.js: Failed to find Server Action](https://nextjs.org/docs/messages/failed-to-find-server-action)
- [Overwriting encryption keys (advanced)](https://nextjs.org/docs/app/guides/data-security#overwriting-encryption-keys-advanced)
