# Corrigir erro CORS com a extensão (Cloudflare)

Se o console mostra: **"No 'Access-Control-Allow-Origin' header is present"** ao clicar em "Enviar 3 mensagens", o navegador está bloqueando porque a resposta do servidor (ou do Cloudflare) não trouxe o header de CORS.

## O que fazer

### 1. Limpar cache no Cloudflare (se você usa Cloudflare na plenipay.com)

O Cloudflare pode estar **guardando em cache** uma resposta antiga do endpoint (sem os headers CORS).

1. Entre no painel do **Cloudflare** e selecione o domínio **plenipay.com**.
2. Vá em **Caching** → **Configuration**.
3. Clique em **Purge Everything** (limpar todo o cache) **ou** use **Custom Purge** e adicione:
   - `https://www.plenipay.com/api/whatsapp/send-welcome-extension`
   - `https://plenipay.com/api/whatsapp/send-welcome-extension`
4. Confirme a limpeza.

Assim o próximo OPTIONS/POST virá do seu servidor (Railway) com os headers CORS corretos.

### 2. Fazer deploy de novo

Depois de dar **push** das alterações (CORS no `next.config.js` e na rota da API), espere o **Railway** terminar o deploy. Só então teste de novo a extensão.

### 3. Testar de novo

Recarregue a extensão, abra o WhatsApp Web e clique em **"Enviar 3 mensagens"**. O erro de CORS deve sumir se o cache foi limpo e o deploy está no ar.
