# Botões na mensagem "Falar com humano" — testar em localhost

## 1. Migration no Supabase (obrigatório)

A fila precisa da coluna `botoes`. No **Supabase** que você usa em dev (Dashboard → SQL Editor), execute:

```sql
ALTER TABLE plen_message_queue
ADD COLUMN IF NOT EXISTS botoes JSONB DEFAULT NULL;
```

Ou rode a migration: `supabase db push` (se usar CLI).

## 2. Expor o localhost para a Z-API (ngrok)

A Z-API só consegue chamar uma URL pública. Use um túnel, por exemplo:

```bash
ngrok http 3000
```

Copie a URL HTTPS (ex.: `https://abc123.ngrok.io`) e no painel da **Z-API** configure o webhook para:

`https://abc123.ngrok.io/api/whatsapp/zapi/webhook`

## 3. Variáveis de ambiente (.env.local)

- `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` (e `ZAPI_CLIENT_TOKEN` se exigido) para enviar mensagens.
- Supabase com a tabela `plen_message_queue` e coluna `botoes` (passo 1).

## 4. Fluxo no localhost

1. Subir o app: `npm run dev`
2. Enviar no WhatsApp a mensagem que leva ao menu (ex.: "menu" ou "1") e escolher **Falar com humano**
3. O webhook responde na hora; ~5,5 s depois a fila processa e a mensagem com botão (ou lista) é enviada
4. Se o botão não aparecer após ~6 s: abra no navegador (com o app rodando):
   - `http://localhost:3000/api/plen/queue-worker`
   - Em dev, se não houver `CRON_SECRET`, a rota processa a fila sem autenticação

## 5. Se ainda não aparecer o botão

- Confirme no Supabase se a linha em `plen_message_queue` tem a coluna `botoes` preenchida (array com `titulo`/`link`)
- Veja no terminal do `npm run dev` o log `[webhooks/zapi] PLEN fila (dev): { sent, failed }`
- Se a Z-API não aceitar botões de ação, o código tenta enviar **lista de opções** ("Ver opções" → "Falar com suporte")
