# Testar a assistente PLEN sem redeploy em produção

Duas formas: **simular o webhook no seu PC** (só lógica) ou **apontar o WhatsApp para sua máquina** (teste real no celular).

---

## Corrigir áudio (Gemini + API Fácil) em local — sem deploy

Use o **servidor local** para ajustar o fluxo de áudio sem esperar 3–4 min de deploy a cada alteração.

1. **Terminal 1 – servidor**
   ```bash
   cd "SISTEMA DE CONTAS"
   npm run dev
   ```
   Deixe rodando. O Next.js recarrega sozinho quando você salva arquivos (não precisa reiniciar).

2. **Terminal 2 – túnel (ngrok)**  
   Instale [ngrok](https://ngrok.com) se ainda não tiver. Depois:
   ```bash
   ngrok http 3000
   ```
   Copie a URL HTTPS (ex.: `https://abc123.ngrok-free.app`).

3. **API Fácil – webhook temporário**
   - Painel **apifacil.dev** → sua instância → **Config. Webhook**.
   - URL do webhook: `https://SUA-URL-DO-NGROK/api/whatsapp/apifacil/webhook`
   - Salvar.

4. **`.env.local`** (para áudio e envio real)
   ```env
   GEMINI_API_KEY=sua_chave_gemini
   APIFACIL_INSTANCE_ID=...
   APIFACIL_TOKEN=...
   WHATSAPP_TEST_NUMBERS=5531999999999
   ```
   Troque pelo seu número em `WHATSAPP_TEST_NUMBERS` (só esse número recebe resposta no modo dev).

5. **Testar**
   - Envie um **áudio** pelo WhatsApp para o número da instância.
   - Veja os logs no **Terminal 1** (Payload recebido, tipo_envio, ÁUDIO detectado?, Áudio transcrito (Gemini), etc.).
   - Ajuste o código, salve → o Next.js recarrega → teste de novo (sem deploy).

6. **Simular payload de áudio (sem WhatsApp)**  
   Para testar só o parsing do body (ex.: `payload` / `tipo_envio`), use um body com URL de áudio ou tipo AUDIO:
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/apifacil/webhook \
     -H "Content-Type: application/json" \
     -d '{"event":"whatsapp_insert","payload":{"tipo_envio":"AUDIO_RECEBIDO","origem":"5531999999999","mensagem":"https://exemplo.com/audio.ogg"}}'
   ```
   Nos logs deve aparecer algo como `ÁUDIO detectado no tipo_envio` e (se a URL for acessível e o Gemini configurado) a transcrição.

7. **Voltar para produção**  
   No painel da API Fácil, restaure a URL: `https://plenipay.com/api/whatsapp/apifacil/webhook` (ou a URL de produção que você usa).

---

## Guia rápido: testar mensagens no WhatsApp (com túnel)

Siga na ordem:

| # | O que fazer | Onde / comando |
|---|----------------|------------------|
| 1 | Abrir um terminal e subir o app | `cd "SISTEMA DE CONTAS"` → `npm run dev` (deixe rodando) |
| 2 | Abrir **outro** terminal e subir o túnel | Preferir **ngrok** (veja abaixo). Localtunnel costuma falhar com webhooks. |
| 3 | Copiar a URL do túnel | Ex.: ngrok → `https://xyz.ngrok.io` → webhook = `https://xyz.ngrok.io/api/whatsapp/apifacil/webhook` |
| 4 | Trocar a URL do webhook na API Fácil | Painel **apifacil.dev** → sua instância → **Config. Webhook** → colar a URL do passo 3 → Salvar |
| 5 | Enviar mensagens no WhatsApp | Do seu celular, envie para o número da Plenipay: "Olá! Quero utilizar a Plenipay", "JÁ CADASTREI", "quanto custa?" etc. |
| 6 | Ver o que está acontecendo | No terminal do `npm run dev` aparecem os logs (mensagem recebida, resposta enviada). |
| 7 | Quando terminar de testar | No painel da API Fácil, **volte** a URL do webhook para: `https://plenipay.com/api/whatsapp/apifacil/webhook` |

**Importante:** O app e o túnel precisam ficar rodando o tempo em que você estiver testando. Se fechar um dos dois, o WhatsApp para de responder até você subir de novo ou voltar a URL para produção.

---

## Modo teste: só um número específico (localhost)

Para que **apenas o seu número** receba resposta quando o webhook estiver apontando para o seu localhost (evitando responder para outros usuários durante o teste):

1. No projeto, crie ou edite o arquivo **`.env.local`** e adicione:
   ```env
   WHATSAPP_TEST_NUMBERS=5511999999999
   ```
   Troque `5511999999999` pelo seu número com DDI (55) e DDD. Pode ser mais de um, separado por vírgula: `5511999999999,5511888888888`.

2. Com isso, em **desenvolvimento** (`npm run dev`):
   - Mensagens **do seu número** → o assistente processa e responde normalmente.
   - Mensagens **de outros números** → o webhook ignora (não responde). No terminal aparece: `Modo teste: ignorando número não autorizado`.

Assim você pode apontar o webhook da API Fácil para o túnel e só o número configurado recebe a assistente; os demais ficam sem resposta no período do teste.

---

## Opção A – Testar só a lógica (sem WhatsApp real)

Você chama o webhook localmente com um body de teste e vê a resposta no terminal.

### 1. Subir o app local

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
npm run dev
```

Deixe rodando (porta 3000).

### 2. Simular mensagem recebida (em outro terminal)

**Exemplo: “Quero utilizar a Plenipay” (resposta em partes)**

```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "whatsapp_insert",
    "origem": "5511999999999",
    "mensagem": "Olá! Quero utilizar a Plenipay"
  }'
```

**Exemplo: “JÁ CADASTREI”**

```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "whatsapp_insert", "origem": "5511999999999", "mensagem": "JÁ CADASTREI"}'
```

**Exemplo: pergunta sobre preço**

```bash
curl -X POST http://localhost:3000/api/whatsapp/apifacil/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "whatsapp_insert", "origem": "5511999999999", "mensagem": "quanto que paga?"}'
```

O webhook responde **200** na hora; o processamento roda em background. Para ver o que a Plen “responderia”, confira os **logs no terminal onde está rodando `npm run dev`** (e, se tiver `APIFACIL_*` configurado no `.env.local`, a mensagem será enviada de verdade para o número em `origem`).

### 3. Variáveis para envio real no local

Se quiser que o app local **realmente envie** a resposta pelo WhatsApp (para seu número), crie ou edite `.env.local` com:

- `APIFACIL_INSTANCE_ID` = ID da instância (API Fácil)
- `APIFACIL_TOKEN` = token da API
- `OPENAI_API_KEY` = para respostas de IA (preços, “como funciona”)

Assim, ao testar com `curl`, a resposta pode ir para o número que você colocar em `origem` (formato: 5511999999999).

---

## Opção B – Testar no WhatsApp de verdade (webhook na sua máquina)

Aqui a API Fácil chama seu PC. Você precisa de uma URL pública que aponte para `localhost:3000`.

### 1. Subir o app

```bash
npm run dev
```

### 2. Abrir túnel na porta 3000

**Com localtunnel (já no projeto):**

```bash
npm run tunnel
```

Anote a URL que aparecer (ex.: `https://abc123.loca.lt`). Às vezes o localtunnel pede um clique para “Continue” na primeira vez.

**Ou com ngrok (se tiver instalado):**

```bash
ngrok http 3000
```

Anote a URL HTTPS (ex.: `https://xyz.ngrok.io`).

### 3. Configurar a API Fácil (temporariamente)

1. Acesse o painel da **API Fácil** (apifacil.dev).
2. Na configuração do webhook da instância, **troque a URL** para:
   - Localtunnel: `https://SUA-URL.loca.lt/api/whatsapp/apifacil/webhook`
   - Ngrok: `https://SUA-URL.ngrok.io/api/whatsapp/apifacil/webhook`
3. Salve.

### 4. Testar no celular

Envie mensagens para o número conectado na instância (ex.: “Olá! Quero utilizar a Plenipay”, “JÁ CADASTREI”, “quanto custa?”). O fluxo será processado no seu PC e as respostas sairão pelo WhatsApp.

### 5. Voltar para produção

Quando terminar de testar, no painel da API Fácil **restaure a URL do webhook** para:

`https://plenipay.com/api/whatsapp/apifacil/webhook`

Assim o produção continua recebendo as mensagens sem redeploy.

---

---

## Testar com Z-API (ngrok / túnel)

O webhook da Z-API é: **`/api/whatsapp/zapi/webhook`**.

1. **Subir o app:** `npm run dev` (porta 3000).
2. **Subir o túnel:** `ngrok http 3000` e copiar a URL (ex.: `https://xxxx.ngrok-free.app` ou `.ngrok-free.dev`).
3. **Z-API:** no painel da Z-API, em **Configurações → Webhook → Ao receber**, colar:  
   `https://SUA-URL-DO-TUNEL/api/whatsapp/zapi/webhook`  
   Usar **exatamente** o domínio que o ngrok mostrar (`.app` ou `.dev`).
4. **`.env.local`:** ter `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` e `ZAPI_CLIENT_TOKEN` (segurança da conta).
5. **Testar:** enviar uma mensagem de outro número para o WhatsApp conectado na Z-API e ver o terminal do `npm run dev`.

### Se a assistente não responder com ngrok ativo

- **O POST não chega no app** (no terminal não aparece `🔔 [Z-API Webhook] POST recebido`):  
  No plano **gratuito** do ngrok, a primeira requisição de um cliente que não é navegador pode receber uma **página HTML** (“Visit Site”) em vez de ser encaminhada ao seu app. A Z-API recebe esse HTML e seu backend nunca processa a mensagem.

  **Soluções:**
  - Se o painel da Z-API permitir **headers customizados** no webhook, adicione:  
    `ngrok-skip-browser-warning: 1`
  - Ou use outro túnel que não mostre essa tela, por exemplo **Cloudflare Tunnel**:  
    `cloudflared tunnel --url http://localhost:3000`  
    e use a URL que o cloudflared mostrar no webhook da Z-API.

- **Aparece “Payload ignorado” no terminal:**  
  Em desenvolvimento o webhook imprime o **body completo** no log. Confira o formato (ex.: `phone`, `text.message`, `fromMe`) e, se precisar, ajuste o parser ou envie esse body para análise.

- **Aparece POST recebido mas não envia resposta:**  
  Verifique se `ZAPI_CLIENT_TOKEN` está no `.env.local` (Z-API exige para envio) e se não há erro de “Client-Token” nos logs.

**Simular POST da Z-API (sem WhatsApp):** para testar se o app processa e responde, em outro terminal:

```bash
curl -X POST http://localhost:3000/api/whatsapp/zapi/webhook \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","fromMe":false,"text":{"message":"olá"},"connectedPhone":"5511888888888"}'
```

Troque `5511999999999` pelo seu número e `5511888888888` pelo número conectado na Z-API. No terminal do `npm run dev` deve aparecer o POST e o fluxo (contato novo ou resposta). Se tiver Z-API configurada no `.env.local`, a resposta pode ser enviada de verdade para o número em `phone`.

---

## Resumo

| Objetivo                         | Usar                    |
|----------------------------------|-------------------------|
| Só ver a lógica / logs           | Opção A (curl + `npm run dev`) |
| Testar no WhatsApp de verdade    | Opção B (túnel + trocar URL do webhook) |
| Testar com Z-API em local        | Túnel (ngrok ou cloudflared) + URL em “Ao receber”; ver seção Z-API acima |

Nenhuma das duas exige redeploy em produção.
