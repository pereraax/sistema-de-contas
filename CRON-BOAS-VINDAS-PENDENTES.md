# Cron: checagem de boas-vindas pendentes

O sistema envia as 3 mensagens de boas-vindas quando alguém manda a primeira mensagem (webhook). Se o webhook falhar naquela hora, a pessoa pode ficar sem receber. Para **ninguém ficar de fora**, existe uma checagem periódica que você pode rodar **a cada 1 minuto**.

## O que a checagem faz

1. Lista contatos em `whatsapp_contatos` com `welcome_sent_at` nulo e que mandaram mensagem nos últimos 7 dias.
2. Para cada um, envia as 3 mensagens de boas-vindas e marca `welcome_sent_at`.

Assim, mesmo que uma mensagem tenha sido “pulada” na hora (erro de rede, API Fácil fora, etc.), em até 1 minuto o sistema tenta corrigir.

## Configuração

1. **Variável de ambiente**  
   No Railway (ou onde o app roda), crie:
   - `CRON_SECRET` = um segredo qualquer (ex.: gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

2. **Chamar a rota a cada 1 minuto**  
   URL (troque pelo seu domínio):
   ```text
   GET https://SEU_DOMINIO.com/api/whatsapp/cron-boas-vindas-pendentes
   ```
   Header:
   ```text
   Authorization: Bearer SEU_CRON_SECRET
   ```
   Ou:
   ```text
   X-Cron-Secret: SEU_CRON_SECRET
   ```

3. **Onde agendar**  
   - [cron-job.org](https://cron-job.org): crie um cron “Every minute” e faça um GET na URL com o header acima.  
   - [EasyCron](https://www.easycron.com) ou outro serviço: mesma ideia (GET a cada 1 minuto + header de autorização).  
   - Se no futuro o Railway tiver cron nativo, use-o para chamar essa URL.

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
