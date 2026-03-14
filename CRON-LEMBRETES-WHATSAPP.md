# Cron: lembrete no WhatsApp no dia do compromisso

## Lembretes Plen (me lembre de pagar X dia D)

Quando o app sobe com **`node server.js`** e **`CRON_SECRET`** está definido, o **cron de lembretes Plen** roda **a cada 1 minuto** e envia a mensagem "Não esqueça que você precisa pagar *X* hoje!! Você já pagou? sim/não" no **dia e hora** combinados (horário **America/Sao_Paulo**).

- **Rota:** `GET /api/plen/lembretes-cron?secret=CRON_SECRET`
- **Frequência:** a cada 1 min (para disparar no horário exato, ex.: 17:27)
- **Fuso:** "hoje" e "hora atual" são calculados em America/Sao_Paulo para o lembrete disparar no horário certo no Brasil.
- Se não usar server.js, agende essa URL em um cron externo (cron-job.org etc.) a cada 1 min.

### Se o lembrete não chega no WhatsApp

1. **Servidor em produção**  
   O cron só roda se o processo for iniciado com **`node server.js`** (ou `npm start`). Se o deploy usar só `next start` ou outro comando que não inicia o `server.js`, o cron **nunca** roda.  
   **Solução:** no Railway/Render/VPS, use **Start Command = `npm start`** (ou `node server.js`). Ou use um cron externo (veja abaixo).

2. **CRON_SECRET**  
   A variável **CRON_SECRET** precisa existir no ambiente de produção. Se não existir, o server.js não agenda o cron de lembretes (e aparece no log: "CRON_SECRET não definido").

3. **Testar manualmente**  
   Abra no navegador (troque SEU_DOMINIO e SEU_SECRET):  
   `https://SEU_DOMINIO.com/api/plen/lembretes-cron?secret=SEU_SECRET`  
   Se estiver tudo certo e houver lembrete para hoje no horário já passado, a resposta será `{"ok":true,"sent":1,"total":1}` e a mensagem deve ir para o WhatsApp.

4. **Cron externo (quando server.js não roda)**  
   Em [cron-job.org](https://cron-job.org) (ou similar), crie um job que chama **a cada 1 minuto**:
   - URL: `https://SEU_DOMINIO.com/api/plen/lembretes-cron?secret=SEU_CRON_SECRET`
   - Método: GET

---

No dia do lembrete (outro fluxo), a assistente envia uma mensagem no WhatsApp para o usuário, por exemplo:

> Olá! Hoje você precisa: pagar minha dívida de 11/03. Ok? 📌

## O que a rota faz

1. Busca lembretes com **data_lembrete = hoje** (fuso America/Sao_Paulo), status **pendente** e ainda não notificados por WhatsApp.
2. Para cada lembrete, pega o número de WhatsApp do perfil do dono da conta (`account_owner_id` → `profiles.whatsapp`).
3. Envia a mensagem via API Fácil e marca o lembrete com `whatsapp_lembrete_enviado_at` para não reenviar.

## Pré-requisito no banco

Execute no Supabase o script que adiciona a coluna de controle:

- **Arquivo:** `ADICIONAR-LEMBRETE-WHATSAPP-ENVIADO.sql`

Sem essa coluna, a rota pode falhar ao buscar/atualizar lembretes.

## Configuração

1. **Variável de ambiente**  
   Use a mesma `CRON_SECRET` já usada no cron de boas-vindas (ou defina uma).

2. **Agendar a rota**  
   Chamar **uma vez por dia**, por exemplo às **8h (BRT)**:

   ```text
   GET https://SEU_DOMINIO.com/api/whatsapp/cron-lembretes
   ```

   Header:

   ```text
   Authorization: Bearer SEU_CRON_SECRET
   ```

   ou:

   ```text
   X-Cron-Secret: SEU_CRON_SECRET
   ```

3. **Onde agendar**  
   - [cron-job.org](https://cron-job.org): criar um job diário (ex.: 8:00) com GET na URL e header acima.  
   - [EasyCron](https://www.easycron.com) ou outro: mesma ideia.

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

- `processed`: quantos lembretes tiveram mensagem enviada com sucesso.  
- `total`: quantos lembretes eram do dia (pendentes e ainda não notificados).  
- `errors`: lista de erros (ex.: número sem WhatsApp, falha na API).

## Observações

- Só envia para contas que têm **WhatsApp preenchido** no perfil (Configurações / perfil).
- O “hoje” é calculado em **America/Sao_Paulo** para bater com o dia que o usuário vê no app.
