# Auditoria e remoção do sistema de automação WhatsApp (Plenipay)

**Data:** 2025-03-07  
**Objetivo:** Eliminar toda a automação antiga de WhatsApp e preparar base para nova arquitetura.

---

## PASSO 1 — Auditoria (arquivos relacionados)

### API Routes (app/api/)

| Arquivo | Função |
|--------|--------|
| `api/whatsapp/zapi/webhook/route.ts` | Webhook Z-API: recebe mensagens, processa com PLEN, envia respostas (texto, áudio, imagem/comprovante). **~1234 linhas.** |
| `api/whatsapp/apifacil/webhook/route.ts` | Webhook API Fácil: mesmo fluxo para provedor alternativo. |
| `api/whatsapp/zapi/status/route.ts` | Status da instância Z-API (conectado/config). |
| `api/whatsapp/status/route.ts` | Status unificado Z-API + API Fácil. |
| `api/whatsapp/cron-boas-vindas-pendentes/route.ts` | Cron: envia boas-vindas pendentes, lead recovery, revisão vácuo. |
| `api/whatsapp/cron-lembretes/route.ts` | Cron: dispara lembretes WhatsApp. |
| `api/whatsapp/send-welcome-extension/route.ts` | Envio de boas-vindas pela extensão CRM. |
| `api/whatsapp/send-custom-extension/route.ts` | Envio de mensagem customizada pela extensão. |
| `api/whatsapp/apifacil/enviar-boas-vindas/route.ts` | Envio de boas-vindas via API Fácil. |
| `api/whatsapp/apifacil/ensure-audio-config/route.ts` | Garantir webhook de áudio na API Fácil. |
| `api/cron/plen-smart-messages/route.ts` | Cron: follow-up 10min, lead recovery, mensagens “inteligentes”. |
| `api/plen/whatsapp-chat/route.ts` | Rota que processa mensagem WhatsApp e chama PLEN (usada pelo handler). |
| `api/auth/criar-conta-whatsapp/route.ts` | Criação de conta a partir do fluxo WhatsApp (nome/email/código). |
| `api/auth/on-email-confirmed/route.ts` | Após confirmação de email: envia mensagem no WhatsApp. |
| `api/admin/whatsapp-pendentes/route.ts` | Lista contatos pendentes de boas-vindas. |
| `api/admin/whatsapp-enviar-boas-vindas/route.ts` | Admin: envia boas-vindas para um número. |
| `api/admin/whatsapp-enviar-todos-pendentes/route.ts` | Admin: dispara boas-vindas para todos pendentes. |
| `api/admin/whatsapp-revisao-vacuo/route.ts` | Admin: executa “revisão vácuo” (contatos sem resposta). |
| `api/admin/whatsapp-conversa/route.ts` | Admin: lista notificações enviadas/recebidas (conversa). |
| `api/admin/whatsapp-contatos/route.ts` | Admin: lista contatos WhatsApp. |
| `api/admin/whatsapp-contatos/export/route.ts` | Admin: exporta contatos. |
| `api/admin/whatsapp-importar-webhook/route.ts` | Admin: importa histórico do webhook. |
| `api/admin/whatsapp-restricao-registro/route.ts` | Admin: restrição de registro (anti-spam). |
| `api/user/whatsapp-key/route.ts` | Usuário: obtém/chave WhatsApp para extensão. |

### Páginas (app/)

| Arquivo | Função |
|--------|--------|
| `administracaosecr/whatsapp/page.tsx` | Painel admin: configuração WhatsApp, assistente pausada. |
| `administracaosecr/whatsapp-pendentes/page.tsx` | Admin: lista de pendentes de boas-vindas. |
| `whatsapp/send-logs/page.tsx` | Envio de logs. |
| `whatsapp/webhook-logs/page.tsx` | Logs do webhook. |
| `whatsapp/logs-completos/page.tsx` | Logs completos. |
| `whatsapp-connect/page.tsx` | Conectar WhatsApp (Z-API/outros). |
| `whatsapp-webjs-connect/page.tsx` | Conectar via whatsapp-web.js. |
| `whatsapp-pairing/page.tsx` | Pairing WhatsApp. |
| `whatsapp-evolution/page.tsx` | Evolution API. |
| `logs-whatsapp/page.tsx` | Logs WhatsApp. |
| `logs-limite-whatsapp/page.tsx` | Logs de limite. |
| `lembretes/page.tsx` | Página de lembretes (usa cron WhatsApp). |

### Callback Auth

| Arquivo | Função |
|--------|--------|
| `auth/callback/route.ts` | Após confirmar email: envia mensagem WhatsApp (sendTextMessage). |

### Lib (lógica de negócio)

| Arquivo | Função |
|--------|--------|
| `lib/whatsapp-plen-handler.ts` | **Handler principal:** processa mensagem, cadastro, registro, IA, boas-vindas (~2200 linhas). |
| `lib/whatsapp-zapi.ts` | Cliente Z-API: sendTextMessage, botões, status. |
| `lib/whatsapp-apifacil.ts` | Cliente API Fácil: enviar mensagem, botões, mídia. |
| `lib/whatsapp-apifacil-config.ts` | Config e ensure audio webhook API Fácil. |
| `lib/whatsapp-contatos-pendentes.ts` | Contatos pendentes, boas-vindas enviadas, cadastro. |
| `lib/whatsapp-enviar-boas-vindas-lib.ts` | Lógica de envio de boas-vindas (Z-API + API Fácil). |
| `lib/whatsapp-cron-boas-vindas.ts` | Cron: runBoasVindasPendentes. |
| `lib/whatsapp-modo-teste.ts` | Modo teste: mensagens introdutórias, gasto “nada”. |
| `lib/whatsapp-signup-flow.ts` | Fluxo de cadastro pendente (whatsapp_signup_pending). |
| `lib/whatsapp-lead-recovery.ts` | Lead recovery: follow-ups por email/cadastro. |
| `lib/whatsapp-lead-followup.ts` | Follow-up 10min para leads inativos. |
| `lib/whatsapp-revisao-vacuo.ts` | Revisão “vácuo”: contatos sem resposta. |
| `lib/whatsapp-media-processor.ts` | Download mídia, transcrição áudio, OCR comprovante. |
| `lib/whatsapp-email-code.ts` | Código de confirmação por email (Supabase OTP). |
| `lib/whatsapp-restricao-registro.ts` | Registro de restrição (anti-spam). |
| `lib/whatsapp-limit-checker.ts` | Verificação de limite de envios. |
| `lib/whatsapp-apifacil-notificacoes.ts` | Listar notificações enviadas/recebidas (API Fácil). |
| `lib/plen-whatsapp-chat.ts` | PLEN para WhatsApp: processPlenWhatsAppMessage, extrairUsuarioNaMensagem, registro. |
| `lib/plen-whatsapp-logs.ts` | Logs do assistente WhatsApp. |
| `lib/plen-smart-messages.ts` | Mensagens “inteligentes” (inativos, etc.). |
| `lib/criar-conta-whatsapp.ts` | Criar conta a partir de nome/email no WhatsApp. |
| `lib/webhook-public-url.ts` | URL pública do webhook (Z-API e API Fácil). |
| `lib/whatsapp-baileys.ts` | Conexão WhatsApp via Baileys. |
| `lib/whatsapp-baileys-SIMPLIFICADO.ts` | Versão simplificada Baileys. |
| `lib/whatsapp-webjs.ts` | Conexão whatsapp-web.js. |
| `lib/whatsapp-client-store.ts` | Store do cliente WhatsApp (webjs). |
| `lib/whatsapp-instance-manager.ts` | Gerência de instâncias (whatsapp_instances). |
| `lib/whatsapp-evolution.ts` | Evolution API. |
| `lib/whatsapp-evolution-admin.ts` | Admin Evolution. |
| `lib/whatsapp-whapi.ts` | WHAPI. |

### Componentes

| Arquivo | Função |
|--------|--------|
| `components/WhatsAppConfig.tsx` | UI configuração WhatsApp. |
| `components/WhatsAppBaileysConfig.tsx` | UI Baileys. |
| `components/admin/AdminSidebar.tsx` | Links para páginas WhatsApp no admin. |
| `components/admin/ModalDetalhesUsuario.tsx` | Pode ter ações WhatsApp. |
| `components/admin/UsuariosLista.tsx` | Pode exibir whatsapp. |
| `components/ConfiguracoesView.tsx` | Pode ter seção WhatsApp. |
| `components/SupportPanel.tsx` | Pode referenciar WhatsApp. |

### Configuração

| Arquivo | Função |
|--------|--------|
| `next.config.js` | CORS para `/api/whatsapp/send-welcome-extension`; webpack externals/alias whatsapp-web.js. |
| `package.json` | Scripts tunnel:zapi, dev:webhook; deps: @whiskeysockets/baileys, whatsapp-web.js. |

---

## PASSO 2 — Dependências e impactos

### O que NÃO é removido (mantido)

- **`app/api/plen/chat/route.ts`** — Chat in-app (web). Usa `plen-registro`, `plen-llm-fallback` e `extrairUsuarioNaMensagem` (esta movida para `plen-registro`).
- **`lib/plen-registro.ts`** — Interpretação de mensagens e registro (usado pelo chat web).
- **`lib/plen-llm-fallback.ts`** — Resposta LLM (usado pelo chat web).
- **`lib/auth.ts`** — Campo `whatsapp` em tipos/perfil (dado de usuário, não automação).
- **`lib/admin-auth.ts`** — Listagem admin com coluna `whatsapp` (dado).
- **`app/api/admin/assistente-global-pausada/route.ts`** + **`lib/assistente-global-pausada.ts`** — Config “assistente pausada” (reutilizável no novo sistema).

### Impactos ao remover

1. **Auth/callback e on-email-confirmed:** deixam de enviar mensagem no WhatsApp; fluxo de confirmação de email e redirect permanecem.
2. **Admin:** páginas e rotas WhatsApp removidas; sidebar e menus que apontam para elas precisam ser ajustados.
3. **Extensão CRM:** rotas `send-welcome-extension` e `send-custom-extension` removidas; extensão precisará ser reconectada ao novo sistema no futuro.
4. **Cron externo:** se algum cron (Railway, etc.) chama `cron-boas-vindas-pendentes`, `cron-lembretes` ou `plen-smart-messages`, passarão a retornar 404; desativar ou apontar para nova API no futuro.

### Dependências entre módulos (antes da remoção)

- Webhook Z-API → whatsapp-plen-handler, whatsapp-zapi, whatsapp-contatos-pendentes, whatsapp-enviar-boas-vindas-lib, whatsapp-modo-teste, whatsapp-signup-flow, whatsapp-lead-recovery, criar-conta-whatsapp, whatsapp-media-processor, whatsapp-limite-checker, plen-whatsapp-chat, openai-validar-nome, assistente-global-pausada.
- Handler → whatsapp-modo-teste, whatsapp-contatos-pendentes, whatsapp-email-code, whatsapp-signup-flow, criar-conta-whatsapp, plen-whatsapp-chat, plen-whatsapp-logs, whatsapp-restricao-registro.
- plen/chat (web) → plen-registro, plen-llm-fallback, plen-whatsapp-chat (apenas `extrairUsuarioNaMensagem`) → migrada para plen-registro.

---

## PASSO 3–5 — Ações realizadas

- Remoção de todas as rotas de API listadas acima (whatsapp, admin whatsapp-*, cron plen-smart-messages, plen/whatsapp-chat, auth/criar-conta-whatsapp) e da rota `api/logs/plen-whatsapp`.
- Remoção do envio de WhatsApp em `on-email-confirmed` e `auth/callback`.
- Migração de `extrairUsuarioNaMensagem` para `lib/plen-registro.ts` e atualização de `app/api/plen/chat` para importar de lá.
- Remoção de todos os arquivos `lib/whatsapp-*.ts`, `lib/plen-whatsapp-*.ts`, `lib/plen-smart-messages.ts`, `lib/criar-conta-whatsapp.ts`, `lib/whatsapp-signup-flow.ts`, `lib/webhook-public-url.ts`.
- Remoção das páginas WhatsApp e atualização do AdminSidebar e componentes que referenciam WhatsApp.
- Limpeza de `next.config.js` (CORS e referências ao send-welcome-extension).
- Criação da estrutura vazia: `/whatsapp` (webhook, queue, processor, sender), `/users`, `/contacts`, `/ai`, `/intent`, `/finance` (expenses, income).

---

## Estrutura nova (vazia) criada

```
lib/
  whatsapp/           # (novo)
    webhook/
    queue/
    processor/
    sender/
  users/              # (novo)
  contacts/          # (novo)
  ai/                 # (novo)
  intent/             # (novo)
  finance/            # (novo)
    expenses/
    income/
```

Arquivos placeholder (index vazios ou README) podem ser adicionados conforme a nova arquitetura for definida.
