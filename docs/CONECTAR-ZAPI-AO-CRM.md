# Conectar Z-API ao CRM WhatsApp

Para as mensagens do WhatsApp aparecerem no CRM (Conversas, Inbox, Leads), a Z-API precisa enviar cada mensagem recebida para o seu servidor (webhook). **A mesma URL do webhook funciona em produção (domínio) e em localhost** — em localhost você usa um túnel e coloca a URL do túnel na Z-API.

---

## 1. URL do webhook

No painel do CRM: **Configurações** mostra as duas opções e os **últimos eventos do webhook** (para ver se a Z-API está chamando).

Duas URLs aceitas (use **uma** delas na Z-API):

| URL | Uso |
|-----|-----|
| `https://SEU_DOMINIO/api/whatsapp/zapi/webhook` | Só mensagens **recebidas** (entrada). |
| `https://SEU_DOMINIO/api/webhooks/zapi` | Todas: recebidas, enviadas, entregues (eventos `message`, `messageReceived`, `messageSent`, `messageDelivered`). Recomendado para inbox completo. |

- **Produção:** troque `SEU_DOMINIO` pela URL do seu site (ex.: `plenipay.com`).
- **Localhost:** use um túnel (ngrok, Cloudflare Tunnel). Ex.: `ngrok http 3000` → `https://abc123.ngrok.io/api/webhooks/zapi`.

**Importante:** use sempre **HTTPS**. Método **POST**.

---

## 2. Configurar na Z-API

### Opção A – Painel Z-API (site)

1. Acesse o painel da Z-API e selecione sua instância.
2. Vá em **Webhook** ou **Configurações**.
3. Em **“Webhook para mensagens recebidas”** (ou “Ao receber”), informe:
   - **URL:** `https://SEU_DOMINIO/api/whatsapp/zapi/webhook`
   - **Método:** POST
4. Salve.

### Opção B – API da Z-API

Se a Z-API exigir configuração via API:

**Endpoint:**  
`PUT https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/update-webhook-received`

**Header:**
- `Client-Token`: token de segurança da sua conta Z-API

**Body (JSON):**
```json
{
  "value": "https://SEU_DOMINIO/api/whatsapp/zapi/webhook"
}
```

Substitua `SEU_DOMINIO` pela sua URL real (ex.: `app.plenipay.com.br`).

---

## 3. Variáveis de ambiente (envio de mensagens)

Para **enviar** mensagens pelo CRM (botão Enviar na conversa), no `.env.local` ou no painel do seu provedor (Railway, etc.):

```
Z_API_INSTANCE_ID=SUA_INSTANCIA
Z_API_TOKEN=SEU_TOKEN
```

Esses valores aparecem no painel da Z-API (instância e token da instância).

---

## 4. Testar se o webhook está sendo chamado

1. **Teste manual (GET)**  
   Abra no navegador (ou `curl`):
   ```
   https://SEU_DOMINIO/api/whatsapp/zapi/webhook
   ```
   Deve retornar algo como: `{"webhook":"zapi","status":"ok"}`.

2. **Envie uma mensagem** do seu celular para o número conectado na Z-API.

3. **Logs do servidor**  
   Se o payload vier em formato inesperado, o servidor grava no log algo como:  
   `[webhook/zapi] Payload inválido. Body: ...`  
   Assim você vê se a Z-API está chamando a URL e o que está enviando.

4. **CRM**  
   - **Inbox:** deve aparecer a atividade “entrou em contato (novo lead)” ou “enviou uma mensagem”.  
   - **Conversas:** deve aparecer o contato e a mensagem no chat.

---

## 5. Se nada aparecer no CRM

- **URL errada ou não salva**  
  Confirme de novo a URL do webhook no painel da Z-API (sem barra no final, com `https://`).

- **Domínio em desenvolvimento**  
  Em localhost a Z-API não alcança seu PC. Use um túnel (ngrok, Cloudflare Tunnel) e configure a URL pública no webhook.

- **Payload da Z-API**  
  O CRM aceita o formato padrão (por exemplo `phone`, `text` ou `text.message`, `fromMe`). Se a Z-API mudar o formato, pode ser necessário ajustar o parser (arquivo `lib/whatsapp/webhook/parser.ts`).

- **Mensagens ignoradas**  
  Não entram no CRM: mensagens **enviadas por você** (`fromMe`) e mensagens de **grupo** (`isGroup`). Só mensagens **recebidas** em conversas **individuais** criam/atualizam contato e conversa.

- **Banco de dados**  
  As tabelas do CRM precisam existir no Supabase. Rode as migrations (por exemplo `supabase db push` ou execute os SQLs das migrations do projeto).

---

## 6. Resumo do fluxo

1. Alguém envia mensagem para o número conectado na Z-API.
2. Z-API envia um POST para `https://SEU_DOMINIO/api/whatsapp/zapi/webhook` com os dados da mensagem.
3. O CRM cria ou atualiza o contato, salva a mensagem e registra a atividade.
4. No painel admin, você vê o contato em **Conversas**, **Inbox** e **Leads**.

Se após isso ainda não aparecer nada, verifique os logs do servidor (Railway, Vercel, etc.) na hora em que você envia a mensagem de teste.
