# Áudio no webhook da API Fácil — por que o Gemini não transcreve

## O que está acontecendo

Quando o usuário **envia um áudio** no WhatsApp (ex.: "gastei 290 com roupas"), o nosso webhook está recebendo **só texto** `"paguei 2.00"` (ou similar). Ou seja:

- Não recebemos o **arquivo de áudio** (nem URL para baixar).
- Por isso o Gemini **nunca é chamado** para transcrever.
- O sistema usa o texto que veio e registra R$ 200,00.

Nos logs aparece algo como:
- `Text extraído: paguei 2.00`
- `Payload recebido: { tipo_envio: "MENSAGEM_RECEBIDA", ... }` (e não `AUDIO_RECEBIDO`)

## O que precisamos para funcionar

Para o nosso servidor **baixar o áudio e transcrever com Gemini**, o webhook precisa receber **uma das opções**:

1. **Opção A:** `tipo_envio` (ou equivalente) = **`AUDIO_RECEBIDO`** (ou "audio", "voice") **e** uma URL do áudio em algum campo, por exemplo:
   - `url_media` / `url_midia` / `media_url` / `url`
   - ou `mensagem` com a URL (ex.: `https://...`)
2. **Opção B:** Outro nome de campo que a API Fácil use para a URL do áudio (ex.: `audio_url`, `file_url`, `link_media`). Nosso código já procura por esses nomes.

## O que fazer

### Ver no nosso servidor o que a API Fácil enviou

1. **Fazer deploy** das últimas alterações (para o log de diagnóstico estar ativo).
2. **Enviar um áudio** pelo WhatsApp para o número da instância (ex.: "gastei 290 com roupas").
3. Abrir os **Deploy Logs** do app (plenipay.com / Railway / Render).
4. No campo **"Filter and search logs"** (ou busca), digitar: **`APIFACIL_WEBHOOK_PAYLOAD`**.
5. Deve aparecer uma linha assim:
   ```text
   APIFACIL_WEBHOOK_PAYLOAD tipo_envio=MENSAGEM_RECEBIDA payload_keys=id,erro,event,origem,mensagem,... tem_url_media=false mensagem_preview=paguei 2.00 from=5531...
   ```
   - **tipo_envio** = o que a API mandou (MENSAGEM_RECEBIDA, AUDIO_RECEBIDO, etc.).
   - **payload_keys** = lista de campos no payload (se tiver url_media, audio_url, aparece aí).
   - **tem_url_media** = true só se tiver URL de áudio.
   - **mensagem_preview** = o que veio em "mensagem" (texto ou URL).

Se **tipo_envio** não for AUDIO_RECEBIDO e **tem_url_media** for false, a API pode estar **bloqueando** o envio de áudio (campo `tipos_envio` na configuração). **Correção automática:** o sistema tenta corrigir isso na primeira vez que recebe um texto "paguei 2.00" em vez de áudio. Você também pode forçar a correção chamando:

- **GET ou POST** `https://seu-dominio.com/api/whatsapp/apifacil/ensure-audio-config`

Isso remove `AUDIO_RECEBIDO` e `IMAGEM_RECEBIDA` da lista de tipos bloqueados na API Fácil, e o webhook passará a receber áudio. Se ainda assim não vier áudio, confira no painel da API Fácil ou fale com o suporte.

---

### No painel da API Fácil  
   Quando alguém envia uma **mensagem de voz** (áudio):
   - Abra o histórico de webhooks / "Payload Enviado" **dessa** mensagem (a que foi disparada pelo áudio).
   - Veja quais campos vêm no JSON (ex.: `tipo_envio`, `mensagem`, `url_media`, `audio_url`, etc.).
   - Confira se existe **alguma URL** apontando para o arquivo de áudio.

2. **Se não houver URL de áudio no payload**  
   Entre em contato com o **suporte da API Fácil** e pergunte:
   - "Quando o usuário envia uma **mensagem de áudio/voz** no WhatsApp, o webhook pode receber a **URL do arquivo de áudio** (ou o áudio) para eu processar no meu servidor?"
   - "Em qual campo vem essa URL (ou mídia)? E o `tipo_envio` (ou tipo da mensagem) vem como quê para áudio (ex.: AUDIO_RECEBIDO)?"

3. **Testar em local**  
   Use o guia em **TESTAR-WEBHOOK-LOCAL.md** (seção "Corrigir áudio em local") para:
   - Rodar o app em local com `npm run dev` e ngrok.
   - Apontar o webhook da API Fácil para a URL do ngrok.
   - Enviar um áudio e ver nos logs:
     - `Payload recebido: { payload_keys: [...], tipo_envio: ..., tem_url_media: ... }`
     - O aviso em amarelo se continuar vindo só texto "paguei 2.00".

Assim dá para saber **exatamente** o que a API está enviando e o que falta (tipo_envio de áudio e/ou URL do áudio) para o Gemini transcrever.

---

## Onde ver isso na API Fácil

### Via API (endpoints)

1. **Configuração da instância e tipos de envio**
   - **GET** `https://apifacil.dev/api/v1/whatsapp/instancia/{id}/detalhes`
   - Header: `Authorization: seu_token`
   - Na resposta, em `data.configuracao.config_json` aparece o objeto `tipos_envio`.
   - **Importante:** Na API Fácil, `tipos_envio` é a lista de tipos que você **bloqueia** (não quer receber). Se `AUDIO_RECEBIDO` estiver nessa lista, o webhook **não** recebe áudio. Para receber áudio, **não** inclua `AUDIO_RECEBIDO` em `tipos_envio` (ou remova se estiver).
   - Valores possíveis citados na doc: `MENSAGEM_ENVIADA`, `MENSAGEM_RECEBIDA`, `ERRO_PROCESSAMENTO`, `MENSAGEM_GRUPO_RECEBIDO`, **`AUDIO_RECEBIDO`**, `IMAGEM_RECEBIDA`, `VIDEO_RECEBIDO`, `DOCUMENTO_RECEBIDO`.

2. **Alterar a configuração (para passar a receber áudio)**
   - **PUT** `https://apifacil.dev/api/v1/whatsapp/configuracao/{id}`
   - Body (exemplo): envie apenas o que quiser atualizar. Para **não** bloquear áudio, não inclua `AUDIO_RECEBIDO` em `tipos_envio`. Exemplo só com outros bloqueios:
   ```json
   {
     "tipos_envio": ["MENSAGEM_ENVIADA", "MENSAGEM_RECEBIDA"]
   }
   ```
   - Assim você continua recebendo `AUDIO_RECEBIDO` (e imagem, etc.) no webhook.

3. **Reprocessar um webhook (teste)**
   - **POST** `https://apifacil.dev/api/v1/whatsapp/notificacao/reprocessar-webhook`
   - Body: `{ "id": 123456 }` (o ID da notificação).
   - O ID da notificação costuma aparecer no **painel** (histórico de notificações).

### No painel (site apifacil.dev)

- Entre no painel da API Fácil e abra a **instância** que você usa.
- Procure por:
  - **Configuração / Config. Webhook** → URL do webhook e opções avançadas (equivalente ao que a API retorna em “detalhes da instância”).
  - **Notificações** ou **Histórico de webhooks** ou **Payload enviado** → lista de notificações enviadas ao seu webhook; ao clicar em uma notificação (ex.: a da mensagem de áudio), você vê o **payload** que foi enviado (`tipo_envio`, `mensagem`, `url_media`, etc.). É aí que você confere se veio `AUDIO_RECEBIDO` e se existe URL do áudio.
- Se no painel não houver “Payload enviado” ou “Histórico”, use os **logs do seu servidor** (busca por `APIFACIL_WEBHOOK_PAYLOAD`) como na seção “Ver no nosso servidor o que a API Fácil enviou” acima.
