# Resolver 404 "Application not found" no Railway

Quando a API Fácil chama seu webhook e a resposta é **404 "Application not found"**, a resposta vem do **Railway** (proxy), não do seu app. Ou seja, a requisição **não está chegando** ao Next.js.

## Solução rápida: usar o domínio que já funciona

Nas suas configurações de webhook, a **URL (Mensagens)** está assim:
- `https://sistema-de-contas-1.up.railway.app/api/whatsapp/apifacil/webhook`

As outras URLs (Status e Grupo) usam:
- `https://plenipay.com/api/whatsapp/apifacil/webhook`

**Se o site abre em plenipay.com**, use o **mesmo domínio** para mensagens:

1. No painel da API Fácil → Configurações do Webhook  
2. Em **URL do Webhook (Mensagens)** coloque:
   ```
   https://plenipay.com/api/whatsapp/apifacil/webhook
   ```
3. Salve e teste de novo.

Assim a API Fácil chama o mesmo lugar que já funciona no navegador.

---

## Se quiser continuar usando a URL do Railway

1. **Testar no navegador**  
   Abra:  
   `https://sistema-de-contas-1.up.railway.app/api/whatsapp/apifacil/webhook`  
   - Se aparecer `{"success":true,"message":"Apifacil Webhook ativo",...}` → o app está no ar nessa URL.  
   - Se aparecer "Application not found" ou 404 → o problema é no Railway (domínio/serviço/porta).

2. **No painel do Railway**
   - **Deployments**: último deploy está "Success" e o serviço está "Active"?
   - **Settings → Networking**: o serviço tem um **Public Networking** / domínio? É exatamente `sistema-de-contas-1.up.railway.app`?
   - **Variables**: existe `PORT`? O app usa `process.env.PORT` (o server.js já usa).
   - **Logs**: ao abrir a URL no navegador, aparece alguma linha de log (ex.: "Ready on")? Se não aparecer nada, o tráfego não está chegando ao container.

3. **Porta**
   - O app sobe com `PORT` do ambiente (Railway define automaticamente).
   - Em **Networking**, o serviço deve expor a **mesma porta** que o app usa (geralmente Railway já faz isso).

4. **Domínio custom (plenipay.com)**
   - Se plenipay.com está ligado a este projeto no Railway, acessar por esse domínio costuma ser mais estável que o subdomínio `.up.railway.app`.

---

## Depois de corrigir

No painel da API Fácil, em mensagens com webhook "Pendente" ou "Erro", use **Reprocessar Webhook** para reenviar. Ou envie uma nova mensagem no WhatsApp e confira se o webhook deixa de dar 404.
