# Localhost Z-API: funcionar em 3 passos

Objetivo: você manda mensagem do **31994467805** (navegador/celular) para a **Plen** (conectada na Z-API) e recebe a resposta da assistente. Só esse número ativo em localhost.

**Importante:** a instância na Z-API precisa estar **Conectada** (ícone verde). Se não estiver, a assistente não responde.

---

## Túnel: ngrok (recomendado) ou Cloudflare

Use **ngrok** primeiro:

```bash
ngrok http 3000
```

Copie a URL (ex.: `https://xxxx.ngrok-free.app` ou `.ngrok-free.dev`) e em **Z-API → Webhook → Ao receber** coloque:  
`https://SUA-URL-NGROK/api/whatsapp/zapi/webhook`

Se o POST não chegar no terminal (não aparecer `🔔 [Z-API Webhook] POST recebido`), o plano gratuito do ngrok pode estar devolvendo uma página “Visit Site” em vez de encaminhar. Aí use **Cloudflare**: `npm run tunnel:zapi` e use a URL que aparecer no webhook.

---

## Passo 1 – Variáveis no `.env.local`

Já deve estar assim (só conferir):

```env
WHATSAPP_TEST_NUMBERS=5531994467805
# ou WHATSAPP_TEST_NUMBERS=31994467805 (com ou sem 55)

ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
ZAPI_CONNECTED_PHONE=5531973403036
```

- **31994467805** = número que **você** usa para enviar mensagens (único que recebe resposta em localhost).
- **ZAPI_CONNECTED_PHONE** = número do WhatsApp **conectado na Z-API** (o da Plen). Não coloque 31994467805 aqui.

---

## Passo 2 – Subir app e túnel

**Terminal 1 – app:**

```bash
cd "SISTEMA DE CONTAS"
npm run dev
```

Deixe rodando.

**Terminal 2 – túnel (ngrok):**

```bash
ngrok http 3000
```

Ou use o script: `npm run tunnel:ngrok`

Copie a URL HTTPS que o ngrok mostrar (ex.: `https://xxxx.ngrok-free.app` ou `.ngrok-free.dev`).

**Alternativa (se o ngrok não encaminhar o POST):** `npm run tunnel:zapi` (Cloudflare) e use a URL que aparecer.

---

## Passo 3 – Configurar na Z-API

1. Painel **Z-API** → **Configurações** → **Webhook**.
2. **Ao receber:** cole `https://SUA-URL-DO-TUNEL/api/whatsapp/zapi/webhook` (URL do ngrok ou do Cloudflare).
3. **Ao enviar:** mesma URL (se usar).
4. Clique em **Salvar**.
5. Confirme que a **instância está Conectada** (status verde no painel da Z-API).

---

## Testar

**Direção certa (obrigatório):**

- **Quem manda "oi":** o número **31994467805** (seu celular ou navegador com esse WhatsApp).
- **Para quem:** o número da **Plen** (o que está conectado na Z-API).

Ou seja: no WhatsApp do **31994467805**, abra o chat **com a Plen** e mande "oi". A resposta da assistente vai aparecer **nesse mesmo chat** (como mensagem recebida da Plen).

**Se você mandar "oi" do WhatsApp da Plen para alguém:** o webhook ignora (são mensagens *enviadas por nós*, `fromMe=true`) e a assistente **não** responde. Por isso não adianta enviar pelo navegador onde está a Plen conectada.

1. No **celular ou navegador do 31994467805**, envie **"oi"** para o contato da Plen.
2. No terminal do `npm run dev` deve aparecer: `🔔 [Z-API Webhook] POST recebido` e `Mensagem recebida`.
3. A resposta da assistente aparece no chat do **31994467805** (enviada pela Plen).

Se outro número enviar em localhost, o app não responde (só 31994467805). Em produção não há essa restrição.

---

## Resumo

| O quê                | Onde / valor                                                |
|----------------------|-------------------------------------------------------------|
| Número que testa     | 31994467805 (só esse em localhost)                         |
| Número da Plen       | ZAPI_CONNECTED_PHONE (ex.: 5531973403036)                  |
| Túnel                | **ngrok** (`ngrok http 3000` ou `npm run tunnel:ngrok`)    |
| Alternativa ao ngrok | Cloudflare: `npm run tunnel:zapi` (se o POST não chegar)   |
| Instância Z-API      | Tem que estar **Conectada** (verde no painel)              |
