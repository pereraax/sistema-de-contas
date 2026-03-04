# Onde ver / ativar botões na Z-API

## Botão não envia ou não aparece no WhatsApp

A documentação da Z-API fala em **aceitar os termos de uso dos botões**, mas na tela **"Configure webhooks" / "Webhooks e configurações gerais"** **não existe** essa opção (só aparecem URLs de webhook, "Rejeitar chamadas", "Ler mensagens automático", etc.).

### O que fazer

1. **Link no texto (já feito):** A extensão envia o link da URL do botão **também no texto** da mensagem. Assim, mesmo que o botão não apareça no WhatsApp, o contato vê algo como "🔗 https://plenipay.com" e pode clicar.
2. **Conferir ID e Token:** Use na extensão o ID e o Token **completos** da tela "Dados da instância" (ou cole a URL completa do campo "API da instância").
3. **Perguntar à Z-API:** Se quiser que o botão clicável apareça de fato, vale perguntar ao suporte da Z-API onde fica o aceite dos termos dos botões no painel atual ou se isso já vem ativo em contas pagas.

### Conferir ID e Token na extensão

- Na tela **"Dados da instância"** você vê:
  - **API da instância:** `https://api.z-api.io/instances/XXXX/token/YYYY`
  - **ID da instância** e **Token da instância**
- Na extensão (painel de configuração), use:
  - **Z-API Instance ID:** o ID completo (ex.: `3EEA62CB875802A646F94A7638EE86FD`) **ou** cole a URL completa da "API da instância".
  - **Z-API Token:** o Token completo (igual ao que aparece em "Token da instância").
- Se colar só a URL da "API da instância", a extensão extrai ID e Token automaticamente; confira se o Token na URL está completo (às vezes a URL é cortada).

### Client Token (se pedir)

- Se a Z-API retornar erro tipo "your client-token is not configured":
  - No painel Z-API, vá em **Segurança** (conta) e copie o **Token de segurança**.
  - Na extensão, preencha o campo **"Z-API Client Token"** e salve.

### Documentação oficial

- Status dos botões e termos: https://developer.z-api.io/tips/button-status  
- Envio de botões de ação: https://developer.z-api.io/message/send-button-actions  
