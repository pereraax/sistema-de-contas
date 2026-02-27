# Botões WhatsApp (API Fácil) – Checklist

O código envia o payload **conforme a documentação** da API Fácil (Enviar Botão WhatsApp). Se a mensagem ainda chega como **texto com link** em vez de **botões clicáveis**, o problema costuma ser na **entrega** (API Fácil / WhatsApp), não no payload.

## O que o código faz

1. **Primeira tentativa:** mensagem com botão de resposta (JÁ CADASTREI) + botão CTA URL (CADASTRAR), URL no texto, `title`, `footer`, `instancia` em string, `Authorization: Bearer <token>`.
2. **Segunda tentativa (se a primeira falhar):** só botões de resposta (id + text) para as duas opções.
3. **Fallback:** se ambas falharem, envia texto com link (o que você está vendo hoje).
4. **Webhook de erro:** quando a API envia `BOTAO_ENVIADO` com `erro: true`, enviamos o link em texto para o usuário não ficar sem a mensagem.

## O que conferir com o suporte da API Fácil

1. **A instância está habilitada para mensagens com botões?** Algumas conexões (ex.: WhatsApp conectado só por QR) podem não suportar mensagens interativas.
2. **O token deve ir com "Bearer"?** O código já envia `Bearer <token>` se o token não começar com "Bearer". Se a API esperar só o token, podemos ajustar.
3. **Há limite ou aprovação para botões?** Pode ser necessário ativar “botões” ou “mensagens interativas” no painel da instância.
4. **Qual a resposta exata do POST `/api/v1/whatsapp/enviar-botao`?** Se retornar 200 com `error: false`, a mensagem foi aceita na fila; se depois chegar webhook com `erro: true`, a falha foi na entrega ao WhatsApp.

## Logs no servidor

Nos logs da aplicação (Railway/Render), procure por:

- `[Apifacil] enviar-botao OK` → envio aceito.
- `[Apifacil] enviar-botao falhou. Status: X Resposta: {...}` → resposta exata da API (útil para enviar ao suporte).

Envie esse trecho ao suporte da API Fácil para eles identificarem por que a mensagem com botões não está sendo entregue.
