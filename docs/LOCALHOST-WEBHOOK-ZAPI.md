# Por que “não chega nada” no ngrok (0 connections)

Quando o ngrok mostra **0 connections**, a Z-API **não está enviando** nenhuma requisição para a sua URL. Ou seja: o problema não é o código nem o ngrok — é a **configuração do webhook na Z-API**.

---

## O que fazer (passo a passo)

### 1. Copiar a URL do ngrok

No terminal do ngrok aparece algo como:

```
Forwarding   https://prosecrecy-unsuperlatively-yen.ngrok-free.dev -> http://localhost:3000
```

Copie **só a parte HTTPS** (sem barra no final):

```
https://prosecrecy-unsuperlatively-yen.ngrok-free.dev
```

### 2. Montar a URL do webhook

Sempre use esta URL completa no webhook da Z-API:

```
https://SUA-URL-DO-NGROK/api/whatsapp/zapi/webhook
```

Exemplo com a URL acima:

```
https://prosecrecy-unsuperlatively-yen.ngrok-free.dev/api/whatsapp/zapi/webhook
```

### 3. Configurar na Z-API

- Acesse o **painel da Z-API** (site onde você gerencia a instância).
- Vá em **Webhook** ou **Configurações**.
- Procure **“Webhook para mensagens recebidas”** ou **“Ao receber”**.
- Cole exatamente:  
  `https://prosecrecy-unsuperlatively-yen.ngrok-free.dev/api/whatsapp/zapi/webhook`  
  (ou a URL que o ngrok mostrar no *seu* terminal).
- Método: **POST**.
- **Salve** a configuração.

### 4. Importante: ngrok gratuito muda a URL

Toda vez que você **reinicia** o `ngrok http 3000`, a URL pública **muda** (no plano gratuito).

- Se você reiniciou o ngrok, a URL antiga **não funciona mais**.
- Você **precisa** entrar de novo no painel da Z-API e **atualizar** o webhook com a **nova** URL que apareceu no ngrok.
- Enquanto a Z-API estiver com a URL antiga, o ngrok continuará em **0 connections**.

### 5. Testar se o túnel responde

No navegador, abra (com *sua* URL do ngrok):

```
https://SUA-URL-DO-NGROK/api/whatsapp/zapi/webhook
```

Deve aparecer algo como:

```json
{"webhook":"zapi","status":"ok"}
```

Se aparecer, o túnel e a rota estão ok; aí é só a Z-API estar apontando para essa **mesma** URL.

### 6. Enviar uma mensagem no WhatsApp

Depois de salvar o webhook com a URL certa, envie uma mensagem (ex.: “oi”) para o número conectado na Z-API.

- No ngrok, **Connections** deve subir (1, 2, …).
- No terminal do `npm run dev` devem aparecer logs como `[webhooks/zapi] POST recebido`.

Se ainda ficar em 0 connections, a Z-API ainda está usando outra URL — confira de novo no painel e use **exatamente** a URL que o ngrok mostra + `/api/whatsapp/zapi/webhook`.

---

## Aviso do ngrok “You are about to visit…” (plano gratuito)

No plano **gratuito**, o ngrok pode exibir uma página de aviso antes de acessar sua URL. Em alguns casos isso atrapalha:

- **No navegador:** você vê “Visit Site” e precisa clicar para continuar.
- **Na Z-API:** quando a Z-API envia o POST para o webhook, o ngrok pode devolver essa página (HTML) em vez de repassar a requisição para o seu app, e o webhook não funciona direito.

### Opções

**1. Usar outro túnel (recomendado para dev)**

Túneis gratuitos que **não** exibem essa página e funcionam bem com webhooks:

- **Localtunnel** (sem conta):
  ```bash
  npx localtunnel --port 3000
  ```
  Ele mostra uma URL tipo `https://alguma-coisa.loca.lt`. Use:
  `https://alguma-coisa.loca.lt/api/whatsapp/zapi/webhook` na Z-API.

- **Cloudflare Tunnel** (conta grátis):
  ```bash
  npx cloudflared tunnel --url http://localhost:3000
  ```
  Gera uma URL `https://....trycloudflare.com`. Use essa base + `/api/whatsapp/zapi/webhook` na Z-API.

**2. Plano pago do ngrok**

Em planos pagos do ngrok essa página de aviso não aparece e a Z-API consegue chamar o webhook normalmente.

**3. Testar se o ngrok está repassando**

Mesmo com o aviso no navegador, a Z-API pode estar sendo bloqueada ou recebendo HTML. Vale:

- Configurar o webhook na Z-API com a URL do ngrok.
- Enviar uma mensagem no WhatsApp e ver se no ngrok aparecem **connections** e no terminal do `npm run dev` os logs do webhook.

Se continuar em 0 connections ou sem resposta da Plen, trocar para **Localtunnel** ou **Cloudflare Tunnel** costuma resolver no localhost.
