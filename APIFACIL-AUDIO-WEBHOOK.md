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

Se **tipo_envio** não for AUDIO_RECEBIDO e **tem_url_media** for false, a API não está enviando o áudio; o próximo passo é conferir no painel da API Fácil ou falar com o suporte.

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
