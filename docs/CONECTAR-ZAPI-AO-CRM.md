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

**Clique em botão do menu:** a Z-API deve enviar o clique para o **mesmo** webhook “mensagens recebidas”. Se a Plen não responder ao clicar em “Indique e ganhe”, etc., confira em **CRM → Configurações → Últimos eventos do webhook**: se aparecer evento com `texto: Indique e ganhe` e `plen: ...`, o problema é no envio; se não aparecer nenhum evento ao clicar, a Z-API pode não estar enviando o clique para essa URL.

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

### Webhook “Ao conectar” (opcional, recomendado)

Para que **todas as conversas e o histórico** sejam importados automaticamente quando o WhatsApp conectar (igual ao WhatsApp Web), configure também o webhook **“Ao conectar”** na Z-API:

- **URL:** `https://SEU_DOMINIO/api/webhooks/zapi/connected`
- **Método:** POST

Quando a instância conectar (QR lido ou reconexão), a Z-API chama essa URL e o CRM dispara a sincronização completa (`whatsappFullSync`): busca todos os chats, cria contatos e conversas e importa o histórico de mensagens.

Via API da Z-API:  
`PUT https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/update-webhook-connected`  
Body: `{ "value": "https://SEU_DOMINIO/api/webhooks/zapi/connected" }`

---

## 3. Variáveis de ambiente

Para **enviar** mensagens pelo CRM e **sincronizar** conversas (como no WhatsApp Web):

```
Z_API_INSTANCE_ID=SUA_INSTANCIA
Z_API_TOKEN=SEU_TOKEN
Z_API_CLIENT_TOKEN=TOKEN_DE_SEGURANCA_DA_CONTA
```

- `Z_API_INSTANCE_ID` e `Z_API_TOKEN`: no painel Z-API (instância e token da instância).
- `Z_API_CLIENT_TOKEN`: no painel Z-API, em **Segurança** → **Token de segurança da conta**. Necessário para o botão **"Sincronizar WhatsApp"** trazer todas as conversas e mensagens recentes para o CRM.

---

## 4. Comportamento igual ao WhatsApp Web

- **Sincronização inicial:** Com o webhook “Ao conectar” configurado, ao conectar o WhatsApp (ler QR ou reconectar) o CRM importa automaticamente todas as conversas e o histórico. Sem esse webhook, use o botão **“Sincronizar WhatsApp”** na página **Conversas** (exige `Z_API_CLIENT_TOKEN`).
- **Lista de conversas:** `GET /api/admin/crm/inbox` (ou use a página Conversas).
- **Mensagens de uma conversa:** `GET /api/admin/crm/messages?contact_id=UUID` ou `?conversation_id=UUID`.
- **Novas mensagens em tempo real:** O frontend inscreve-se no Supabase Realtime na tabela `crm_messages`; quando chega uma nova mensagem (webhook → backend grava no banco), a lista e o chat atualizam sem recarregar.
- **Mídia:** O CRM exibe **imagens**, **áudios**, **vídeos** e **documentos** (a Z-API armazena por até 30 dias).

---

## 5. Testar se o webhook está sendo chamado

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

## 6. Se nada aparecer no CRM

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

## 7. Resumo do fluxo

1. **Ao conectar o WhatsApp:** Z-API envia POST para `/api/webhooks/zapi/connected` → o CRM roda `whatsappFullSync()` e importa todas as conversas e histórico.
2. **Mensagens novas:** Z-API envia POST para `/api/webhooks/zapi` (ou `/api/whatsapp/zapi/webhook`) → o CRM cria/atualiza contato e conversa, salva a mensagem e atualiza a última mensagem.
3. **Frontend:** A página Conversas carrega a lista (`/api/admin/crm/inbox`) e as mensagens (`/api/admin/crm/messages`), assina o Realtime em `crm_messages` e atualiza a lista e o chat quando chega INSERT.
4. **Resultado:** Comportamento igual ao WhatsApp Web: todas as conversas, histórico e novas mensagens em tempo real.

Se nada aparecer, confira as URLs dos webhooks, as variáveis de ambiente e os logs do servidor.
