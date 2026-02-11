# Checklist: WhatsApp (Apifacil) + Assistente PLEN

Use quando **reconectar a instância** ou quando o **assistente não responder**.

---

## 1. No painel Apifacil

- [ ] **Instância:** Clique em **Play App** para sincronizar o WhatsApp e gerar o QR Code (se necessário). Escaneie com o celular do número que vai usar. Sem isso, a instância não recebe mensagens.
- [ ] **Config. Webhook:** Aba **Config. Webhook** → URL do webhook deve ser:
  ```
  https://plenipay.com/api/whatsapp/apifacil/webhook
  ```
  (ou sua URL do Railway se não usar domínio). Status deve estar **ATIVO**.
- [ ] **Config. Instância:** Confirme que está ATIVO e que o **APIFACIL_INSTANCE_ID** no Railway é o mesmo da instância.

---

## 2. Variáveis no Railway

- [ ] **APIFACIL_INSTANCE_ID** = ID da sua instância (número no painel Apifacil).
- [ ] **APIFACIL_TOKEN** = Token da API (no painel Apifacil).

Depois de alterar, faça **Redeploy** ou aguarde o próximo deploy.

---

## 3. Teste da primeira mensagem

- O assistente só “ativa” quando o usuário envia uma **palavra-chave** ou quando recebe **qualquer mensagem** (agora respondemos com instrução).
- Para ativar de fato e receber o menu completo, o usuário deve enviar: **Assistente PLEN** (ou “ativar assistente plen”, “chamar plen”, etc.).
- Envie do seu WhatsApp para o número conectado na Apifacil:
  1. Qualquer mensagem (ex.: "oi") → deve receber instrução para enviar "Assistente PLEN".
  2. Depois envie: **Assistente PLEN** → deve receber a mensagem de boas-vindas longa e o assistente fica ativo.

---

## 4. Se ainda não responder

- Confira os **logs do Railway** (Deploy Logs / HTTP Logs): procure por `[Apifacil Webhook]` e `[WhatsApp PLEN]`. Se aparecer "Payload não reconhecido", o formato que a Apifacil envia pode ter mudado.
- Se aparecer **"APIFACIL_INSTANCE_ID ou APIFACIL_TOKEN não configurados"** nos logs, configure as variáveis no Railway (item 2) e faça redeploy.
- Se você já fez login pelo WhatsApp mas o PLEN não responde, envie de novo **Assistente PLEN** — o sistema agora responde pedindo para ativar quando você está autenticado mas o assistente estava desativado.
- No painel Apifacil, em **Config. Webhook**, veja se há **histórico de chamadas** ou **erros** (alguns painéis mostram isso).
- Teste a URL do webhook no navegador: `https://plenipay.com/api/whatsapp/apifacil/webhook` → deve retornar JSON `{ "success": true, "message": "Apifacil Webhook ativo", ... }`.
