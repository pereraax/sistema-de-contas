# Configurar Z-API (WhatsApp com botões) no Plenipay

Siga estes passos para usar a Z-API e ter **botões de verdade** nas mensagens do assistente PLEN.

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

Opcional (se a Z-API pedir nas requisições):

```env
ZAPI_CLIENT_TOKEN=seu_client_token_aqui
```

O **Client-Token** fica em Segurança / Token de segurança da conta no painel Z-API. Só coloque se aparecer erro 401 ou se a documentação da sua conta exigir.

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
| **.env.local / Railway** | `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` (e opcionalmente `ZAPI_CLIENT_TOKEN`) |
| **Painel Z-API**  | Conectar número (QR Code) e configurar webhook “Ao receber” → `https://plenipay.com/api/whatsapp/zapi/webhook` |
| **Código**        | Já integrado: webhook em `/api/whatsapp/zapi/webhook` e envio de texto + botões em `lib/whatsapp-zapi.ts` |

Se o webhook estiver correto e as variáveis certas no ambiente que responde pela URL, os botões passam a funcionar nesse número.

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

4. **Deploy**  
   Depois de alterar variáveis no Railway, é preciso dar **Redeploy** para o novo valor passar a valer.

5. **Logs no Railway**  
   Em **Deployments** → último deploy → **View logs**, ao enviar uma mensagem para o número você deve ver algo como:
   ```text
   📨 [Z-API Webhook] Mensagem recebida: { from: '55...', textPreview: '...' }
   ```
   Se não aparecer nada ao mandar mensagem, o webhook “Ao receber” não está sendo chamado (conferir URL e salvamento no painel Z-API).
