# Configurar Z-API (WhatsApp com botões) no Plenipay

Siga estes passos para usar a Z-API e ter **botões de verdade** nas mensagens do assistente PLEN.

---

## Ter API Fácil e Z-API ao mesmo tempo duplica mensagem?

**Não.** Cada mensagem do WhatsApp chega por **um único** provedor:

- O **número** está conectado **só em um lugar**: ou na API Fácil **ou** na Z-API (não nos dois).
- Quem recebe a mensagem é esse provedor e ele chama **só o webhook dele** (API Fácil ou Z-API).
- O sistema responde **uma vez** por esse webhook (prioriza Z-API para envio se estiver configurada, senão API Fácil).

Você **não precisa remover** as variáveis da API Fácil. Pode deixar as duas configuradas no Railway. Se o número estiver conectado na Z-API e o webhook "Ao receber" for o da Z-API, só a Z-API recebe as mensagens e só ela envia a resposta. A API Fácil fica como fallback (por exemplo se a Z-API falhar no envio) ou para outro uso.

---

## Como adicionar as variáveis da Z-API no Railway

1. Acesse **https://railway.app** e entre no seu projeto.
2. Clique no **serviço** (app) que faz o deploy (ex.: "sistema-de-contas").
3. Abra a aba **Variables** (ou **Config** / **Variáveis de ambiente**).
4. Clique em **+ New Variable** (ou **Add Variable**) e crie:
   - **Nome:** `ZAPI_INSTANCE_ID`  
     **Valor:** o ID da instância (copie no painel Z-API → Dados da instância).
   - **Nome:** `ZAPI_TOKEN`  
     **Valor:** o Token da instância (painel Z-API).
   - (Opcional) Se a Z-API pedir Client-Token:  
     **Nome:** `ZAPI_CLIENT_TOKEN`  
     **Valor:** token de Segurança da conta (painel Z-API → Segurança).
5. Salve. O Railway normalmente faz **redeploy automático**; se não, clique em **Redeploy** / **Deploy** para subir de novo com as variáveis.

Depois do deploy, teste em: `https://seu-dominio.com/api/whatsapp/zapi/status` — deve retornar `"configured": true`.

---

## 1. Variáveis de ambiente

No **Railway** (produção) e no **`.env.local`** (desenvolvimento), adicione:

```env
# Z-API (z-api.io) — substitua pelos dados da sua instância
ZAPI_INSTANCE_ID=cole_aqui_o_ID_da_instancia
ZAPI_TOKEN=cole_aqui_o_token_da_instancia
```

- **ZAPI_INSTANCE_ID:** copie o **ID da instância** da tela “Dados da instância” (campo “ID da instância”).
- **ZAPI_TOKEN:** copie o **Token da instância** (campo “Token da instância”). Se gerar um novo token, atualize aqui.
- **ZAPI_CLIENT_TOKEN (obrigatório se ativou na Z-API):** No painel Z-API, vá em **Segurança** → **Token de segurança da conta**. Se você ativou esse token, **todas** as requisições (incluindo envio de mensagens) precisam do header `Client-Token`. Copie o token e adicione no Railway e no `.env.local`:

```env
ZAPI_CLIENT_TOKEN=cole_aqui_o_token_de_seguranca_da_conta
```

Se aparecer nos logs **"Falha ao enviar: your client-token is not configured"**, é porque essa variável não está definida ou o token está ativado na Z-API e não foi colocado aqui.

---

## 2. Conectar o número (QR Code)

1. No painel Z-API, na aba **“Dados da instância web”**, no quadro **“Leia o QRCode”**.
2. Abra o **WhatsApp** no celular que será usado para o atendimento.
3. Toque em **Menu (⋮)** → **Aparelhos conectados** → **Conectar um aparelho**.
4. Escaneie o **QR Code** que aparece na tela da Z-API.
5. Aguarde conectar. Quando aparecer “Conectado” (ou equivalente), o número está ligado à instância.

Se quiser usar **o mesmo número** que hoje está na API Fácil, você precisará **desconectar** esse número da API Fácil e **conectar na Z-API** (um número só pode estar conectado em um lugar por vez).

---

## 3. Configurar o webhook (obrigatório)

Sem webhook, a Z-API não envia as mensagens recebidas para o seu sistema.

1. No painel Z-API, clique em **“Webhooks e configurações gerais”** (ou no aviso **“Configurar agora”** ao lado de “Você ainda não configurou os webhooks”).
2. No webhook **“Ao receber”** (mensagens recebidas e cliques em botões), coloque a URL do seu backend:

   **Produção (plenipay.com):**
   ```text
   https://plenipay.com/api/whatsapp/zapi/webhook
   ```

   **Teste local (com ngrok):**
   ```text
   https://SEU-NGROK.ngrok.io/api/whatsapp/zapi/webhook
   ```

3. Salve.

Assim, toda mensagem e todo clique em botão serão enviados para essa URL e o assistente PLEN responderá (incluindo envio de botões quando for o fluxo “Quero utilizar a Plenipay”).

---

## 4. Deploy e teste

1. Faça **deploy** do projeto no Railway (ou suba local com `npm run dev` e ngrok para teste).
2. Confira se as variáveis **ZAPI_INSTANCE_ID** e **ZAPI_TOKEN** estão preenchidas no ambiente que está rodando (Railway ou `.env.local`).
3. Envie uma mensagem para o número conectado na Z-API (ex.: **“Olá! Quero utilizar a Plenipay”**).
4. Você deve receber as mensagens do assistente e a segunda com **dois botões**: **CADASTRAR** e **JÁ CADASTREI**.

---

## 5. Resumo

| Onde              | O que fazer |
|-------------------|-------------|
| **.env.local / Railway** | `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` e `ZAPI_CLIENT_TOKEN` (se ativou Token de segurança na Z-API) |
| **Painel Z-API**  | Conectar número (QR Code) e configurar webhook “Ao receber” → `https://plenipay.com/api/whatsapp/zapi/webhook` |
| **Código**        | Já integrado: webhook em `/api/whatsapp/zapi/webhook` e envio de texto + botões em `lib/whatsapp-zapi.ts` |

Se o webhook estiver correto e as variáveis certas no ambiente que responde pela URL, os botões passam a funcionar nesse número.

---

## Webhook Z-API mas variáveis só da API Fácil no Railway

Se você configurou o webhook da Z-API (URL "Ao receber" apontando para `/api/whatsapp/zapi/webhook`) mas **não** colocou `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` no Railway:

- O sistema **continua processando** as mensagens (incluindo cliques em "JÁ CADASTREI").
- As **respostas** (ex.: "Me envia seu e-mail") são enviadas pela **API Fácil** (fallback), desde que `APIFACIL_*` esteja configurado no Railway.
- As **3 mensagens de boas-vindas** e a **mensagem com botão** (CADASTRAR) saem pela **API Fácil**, por isso o visual pode ser diferente do botão nativo da Z-API.

Para a mensagem com botão ser no formato Z-API e todas as respostas saírem pela Z-API, configure no Railway: **ZAPI_INSTANCE_ID**, **ZAPI_TOKEN** e, se exigido, **ZAPI_CLIENT_TOKEN**.

---

## Assistente não responde – o que verificar

1. **Webhook “Ao receber”**  
   No painel Z-API, em **Webhooks**, o campo **“Ao receber”** deve ter exatamente:
   ```text
   https://plenipay.com/api/whatsapp/zapi/webhook
   ```
   (em produção). Se estiver em branco ou com outra URL, a Z-API não envia as mensagens para o seu sistema.

2. **Variáveis no ambiente que está rodando**  
   Quem responde pela URL é o servidor (Railway em produção). Lá precisam existir:
   - `ZAPI_INSTANCE_ID` = ID da instância (painel Z-API).
   - `ZAPI_TOKEN` = Token da instância (painel Z-API).  
   Para conferir se o backend “vê” a Z-API configurada, abra no navegador:
   ```text
   https://plenipay.com/api/whatsapp/zapi/status
   ```
   Deve retornar `"configured": true`. Se retornar `false`, as variáveis não estão definidas ou não estão no ambiente correto.

3. **Número conectado na Z-API**  
   O WhatsApp que recebe as mensagens deve ser o que está conectado à **instância Z-API** (QR Code lido na Z-API). Se o número estiver em outro serviço (ex.: API Fácil), as mensagens não chegam na Z-API.

4. **Client-Token (Falha ao enviar)**  
   Se nos logs aparecer **"Falha ao enviar: your client-token is not configured"** (ou "client-token"), a Z-API está exigindo o **Token de segurança da conta**. No painel Z-API: **Segurança** → **Token de segurança da conta** → copie o token. No Railway (e no `.env.local`), crie a variável **ZAPI_CLIENT_TOKEN** com esse valor e faça **Redeploy**.

5. **Deploy**  
   Depois de alterar variáveis no Railway, é preciso dar **Redeploy** para o novo valor passar a valer.

6. **Logs no Railway**  
   Em **Deployments** → último deploy → **View logs**, ao enviar uma mensagem para o número você deve ver algo como:
   ```text
   📨 [Z-API Webhook] Mensagem recebida: { from: '55...', textPreview: '...' }
   ```
   Se não aparecer nada ao mandar mensagem, o webhook “Ao receber” não está sendo chamado (conferir URL e salvamento no painel Z-API).
