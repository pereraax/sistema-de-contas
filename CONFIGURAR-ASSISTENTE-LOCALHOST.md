# Testar a assistente PLEN em localhost antes do deploy

Este guia permite configurar e testar o fluxo da assistente WhatsApp (API Fácil ou Z-API) no seu computador, antes de fazer deploy em produção.

## Pré-requisitos

- Node.js e `npm run dev` funcionando
- Conta na API Fácil (apifacil.dev) **ou** Z-API (z-api.io) com uma instância/número
- Supabase: projeto com as tabelas e variáveis já configuradas

## Passos

### 1. Rodar o app em localhost

```bash
npm run dev
```

O app ficará em `http://localhost:3000`.

### 2. Expor o localhost para a internet (túnel)

Os provedores de WhatsApp (API Fácil, Z-API) precisam chamar uma URL **pública** para enviar mensagens ao seu app. No localhost, isso não existe. Por isso usamos um túnel:

- **ngrok:** `ngrok http 3000` → você recebe uma URL como `https://abc123.ngrok.io`
- **Cloudflare Tunnel:** `cloudflared tunnel --url http://localhost:3000` → URL tipo `https://xxx.trycloudflare.com`

Anote a URL HTTPS que o túnel gerar (ex.: `https://abc123.ngrok.io`).

### 3. Configurar o webhook no provedor

No painel da **API Fácil** ou da **Z-API**:

- **API Fácil:** em Configurações / Webhook da instância, defina:
  - URL: `https://SUA-URL-DO-TUNEL/api/whatsapp/apifacil/webhook`
- **Z-API:** em Webhook da instância, defina:
  - URL: `https://SUA-URL-DO-TUNEL/api/whatsapp/zapi/webhook`

Salve e ative o webhook.

### 4. Variáveis de ambiente em localhost

Crie ou edite o arquivo **`.env.local`** na raiz do projeto (não commitar este arquivo). Use as mesmas variáveis que você usa em produção, para o mesmo comportamento:

**Supabase (obrigatório):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**API Fácil (se for usar API Fácil):**

- `APIFACIL_INSTANCE_ID`
- `APIFACIL_TOKEN`

**Z-API (se for usar Z-API):**

- `ZAPI_INSTANCE_ID`
- `ZAPI_TOKEN`
- `ZAPI_CONNECTED_PHONE` (opcional)

**Outras (conforme uso):**

- Chaves de IA (OpenAI, Groq, etc.) se a assistente usar LLM
- Qualquer outra variável que o handler ou o envio de boas-vindas use

Reinicie o `npm run dev` após alterar o `.env.local`.

### 5. Testar

1. Mantenha o túnel e o `npm run dev` rodando.
2. Envie uma mensagem para o número conectado na API Fácil ou Z-API (ex.: “Olá”, “quero utilizar plenipay”).
3. O webhook será chamado na sua URL do túnel → seu app em localhost processa e responde.
4. Verifique os logs no terminal do `npm run dev` e as respostas no WhatsApp.

### 6. Depois dos testes: deploy

Quando estiver tudo certo em localhost:

1. Faça o deploy do app (Railway, Vercel, etc.) com a URL de produção.
2. No painel da API Fácil ou Z-API, **altere a URL do webhook** para a URL de produção, por exemplo:
   - `https://seu-dominio.com/api/whatsapp/apifacil/webhook`
   - ou `https://seu-dominio.com/api/whatsapp/zapi/webhook`
3. Não use mais a URL do túnel em produção.

## Resumo

| Onde       | O que fazer |
|-----------|-------------|
| Localhost | `npm run dev` + túnel (ngrok/cloudflared) |
| .env.local | Mesmas variáveis de produção (Supabase, APIFACIL_*, ZAPI_*, etc.) |
| Provedor  | Webhook = `https://SEU-TUNEL/api/whatsapp/apifacil/webhook` ou `.../zapi/webhook` |
| Produção  | Trocar webhook para a URL do app em produção após o deploy |

Assim você consegue configurar e testar a assistente em localhost antes de subir no ar.
