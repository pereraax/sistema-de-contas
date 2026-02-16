# Deploy manual

O assistente (Cursor) **deve fazer o deploy** sempre que houver alterações que afetem o app em produção. Se não fizer, use um dos fluxos abaixo.

---

## Opção 1: Git push (recomendado — dispara deploy automático)

Se o deploy sobe a partir do GitHub (Vercel, Render, Railway conectado ao repo):

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"

# 1. Validar build
npm run build

# 2. Adicionar arquivos, commitar e enviar
git add .
git status   # conferir o que vai subir
git commit -m "fix: descrição curta da mudança"
git push origin main
```

O serviço conectado ao repositório fará o deploy automaticamente após o push.

---

## Opção 2: Railway CLI (deploy direto do PC, sem Git)

Se você configurou o Railway CLI (`railway login` e `railway link`):

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
railway up
```

O Railway usa o código da sua pasta e faz o build no servidor. Não precisa de `git push`.

---

## Opção 3: Servidor próprio (Hostinger/VPS com PM2)

Se o app roda em um servidor com PM2:

```bash
cd /var/www/plenipay   # ou o diretório do app
git pull origin main   # se o código está no Git
npm install --production
npm run build
pm2 restart plenipay
```

Ou use o script do projeto: `./deploy-completo.sh` (no servidor).

---

## Lembrete para o assistente

Sempre que alterar código que afeta produção:

1. Rodar `npm run build`.
2. Se passar: `git add` (arquivos alterados), `git commit` com mensagem clara, `git push origin main`.
3. Não pedir ao usuário para fazer o deploy; fazer o push para disparar o deploy automático.

Exceções: não fazer commit/push se o usuário pedir só revisão, documentação ou disser explicitamente para não dar deploy.
