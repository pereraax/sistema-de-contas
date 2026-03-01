# Cron: checagem de boas-vindas pendentes

O sistema envia as 3 mensagens de boas-vindas quando alguém manda a primeira mensagem (webhook). Se o webhook falhar naquela hora, a pessoa pode ficar sem receber. Para **ninguém ficar de fora**, existe uma checagem periódica que você pode rodar **a cada 2 minutos**.

## O que a checagem faz

1. O sistema **sozinho** lista em `whatsapp_contatos` quem tem `welcome_sent_at` nulo e mandou mensagem nos últimos 7 dias.
2. Para cada um desses, envia as 3 mensagens de boas-vindas e marca `welcome_sent_at`.

Assim, mesmo que uma mensagem tenha sido “pulada” na hora (erro de rede, API Fácil fora, etc.), em até 2 minutos o sistema envia as boas-vindas para quem ainda não recebeu.

## Configuração (próximos passos)

1. **Variável de ambiente**  
   No Railway (ou onde o app roda), crie:
   - `CRON_SECRET` = um segredo qualquer (ex.: gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

2. **Chamar a rota a cada 2 minutos**  
   Forma mais fácil — use **uma única URL** (o segredo na query):
   ```text
   https://SEU_DOMINIO.com/api/whatsapp/cron-boas-vindas-pendentes?secret=SEU_CRON_SECRET
   ```
   Faça um **GET** nessa URL a cada 2 minutos.
   Alternativa com header: `Authorization: Bearer SEU_CRON_SECRET` ou `X-Cron-Secret: SEU_CRON_SECRET`.

3. **Onde agendar**  
   - [cron-job.org](https://cron-job.org)** (recomendado): crie um cron “**Every 2 minutes** (ou `*/2 * * * *`), URL = a URL acima com `?secret=SEU_CRON_SECRET`, método GET.  
   - [EasyCron](https://www.easycron.com) ou outro: GET a cada 2 minutos na URL com `?secret=...`.  
   - **Railway**: em Cron Jobs, agende `*/2 * * * *` e use um comando que chame essa URL (curl com header ou com `?secret=...`).

## Resposta da rota

Exemplo:
```json
{
  "ok": true,
  "processed": 2,
  "total": 2,
  "errors": []
}
```
- `processed`: quantos receberam as 3 mensagens nesta execução.  
- `total`: quantos estavam pendentes.  
- `errors`: lista de erros por número (se houver).

## Segurança

Só quem conhece `CRON_SECRET` pode chamar a rota. Não compartilhe esse valor e não use a mesma chave para outras coisas.
