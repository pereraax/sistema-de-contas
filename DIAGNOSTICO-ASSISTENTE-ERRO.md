# Diagnóstico: "Desculpe, tive um problema. Tente novamente."

Quando a assistente responde isso no WhatsApp, algo falhou no processamento da mensagem. O servidor **registra o erro real** nos logs.

## Onde ver o erro

1. **Railway** (ou outro host): abra o projeto → **Deployments** → último deploy → **View Logs** (ou **Logs**).
2. Procure por linhas que começam com:
   - `❌ [Apifacil Webhook] Erro no processamento em background:`
   - `❌ [Apifacil Webhook] processWhatsAppMessage lançou:`
   - `❌ [WhatsApp PLEN] ERRO`
3. A linha seguinte costuma trazer o **Stack** (onde quebrou no código).
4. No painel do sistema (se tiver logs): busque por `[Apifacil Webhook]` ou `error`.

## Causas comuns

- **SUPABASE_SERVICE_ROLE_KEY** não definida ou inválida → criar cliente admin falha.
- **Tabela ausente:** `whatsapp_sessions` ou `profiles` (coluna `assistente_pausada`, etc.) → rodar os SQLs de migração do projeto.
- **API Fácil:** token/instância errados ou instância desconectada → conferir variáveis e status na API Fácil.
- **Timeout ou rede:** chamada ao Supabase ou a outro serviço demorando ou falhando.

## O que foi ajustado no código

- O erro real é logado (mensagem + stack) antes de enviar "Desculpe, tive um problema".
- Se `processWhatsAppMessage` lançar exceção, ela é capturada, logada e a assistente envia a mensagem de fallback (sem travar).
- `isAssistentePausadaParaNumero` não lança mais; em erro retorna `false`.

Depois do deploy, ao reproduzir o problema, confira os logs para ver a causa exata.
