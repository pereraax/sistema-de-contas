# Arquitetura: Recuperação de leads que abandonaram após o pedido de e-mail

Sistema de follow-up automático para reengajar leads que pararam de responder depois que a assistente pediu o e-mail no fluxo de cadastro via WhatsApp.

---

## Regra principal de ativação

O follow-up **só** é acionado quando:

- O usuário **iniciou** uma conversa
- O usuário **ainda não finalizou** o cadastro
- A assistente **pediu o e-mail** (“Qual seu e-mail?”)
- O usuário **parou de responder** após esse pedido

**Não** envia follow-up quando:

- Cadastro já foi finalizado
- Usuário já enviou o e-mail
- Usuário respondeu **qualquer** mensagem depois do pedido de e-mail
- Conversa já foi marcada como concluída

---

## Sequência de tempo

| Etapa | Tempo após pedido de e-mail | Gatilho psicológico        |
|-------|-----------------------------|----------------------------|
| 1     | 5 minutos                   | Lembrete leve              |
| 2     | 10 minutos                  | Continuidade da conversa  |
| 3     | 15 horas                    | Checagem amigável          |
| 4     | 24 horas                    | Lembrar progresso iniciado  |
| 5     | 48 horas                    | Encerramento suave         |

---

## Componentes

### 1. Tabela `whatsapp_lead_recovery`

- **phone** (PK): número do lead
- **status_conversa**: `ativo` \| `aguardando_email` \| `follow_up` \| `cadastro_concluido`
- **email_requested_at**: momento em que foi enviado “Qual seu e-mail?” (base dos intervalos)
- **timestamp_ultima_mensagem_usuario**: última mensagem do usuário (uso futuro/denormalizado)
- **etapa_followup**: 0 a 5 (última etapa enviada)
- **mensagens_followup_enviadas**: array de textos já enviados (evita repetir na mesma conversa)
- **cadastro_finalizado**, **email_recebido**: flags para cancelar follow-ups

Migration: `supabase/migrations/20260306100000_whatsapp_lead_recovery.sql`

### 2. Lib `lib/whatsapp-lead-recovery.ts`

- **initLeadRecovery(phone)**: chamado quando a assistente envia “Qual seu e-mail?”
- **cancelLeadRecoveryOnUserReply(phone)**: chamado em **toda** mensagem recebida do lead → para follow-ups
- **markLeadRecoveryEmailReceived(phone)**: quando o lead envia e-mail válido
- **markLeadRecoveryCadastroConcluido(phone)**: quando a conta é criada (clearSignupPending)
- **listLeadsDueForFollowUp()**: lista leads elegíveis (status, tempo, última mensagem antes do pedido)
- **pickRandomMessageForStage(stage, alreadySent)**: escolhe mensagem aleatória do conjunto, sem repetir
- **recordFollowUpSent(phone, stage, message)**: registra envio e atualiza etapa
- **runLeadRecoveryFollowUps(sendTextMessage)**: orquestra envios (usado pelo cron)

### 3. Webhook Z-API `app/api/whatsapp/zapi/webhook/route.ts`

- **Ao receber qualquer mensagem**: `cancelLeadRecoveryOnUserReply(phone)` (início do processamento)
- **Após enviar “Qual seu e-mail?”**: `initLeadRecovery(phone)` (após `setSignupStepEmail`)
- **Ao receber e-mail válido** (antes de criar conta): `markLeadRecoveryEmailReceived(phone)`
- **Após criar conta com sucesso**: `markLeadRecoveryCadastroConcluido(phone)` antes de `clearSignupPending`

### 4. Cron `app/api/cron/plen-smart-messages/route.ts`

- Usa o mesmo `CRON_SECRET` e mesma frequência sugerida (10–15 min)
- Chama `runLeadRecoveryFollowUps(sendOne)` após o follow-up de 10 min do modo teste
- Resposta do cron inclui `leadRecovery: { sent, total }`

---

## Fluxo de dados

1. Lead envia nome → assistente envia “Qual seu e-mail?” → **initLeadRecovery(phone)** com `email_requested_at = now`, `status = aguardando_email`.
2. Cron (a cada ~5–15 min) chama **listLeadsDueForFollowUp()**:
   - Filtra: `status` em (`aguardando_email`, `follow_up`), `cadastro_finalizado = false`, `email_recebido = false`
   - Compara `whatsapp_contatos.last_message_at` com `email_requested_at`: se última mensagem do usuário for **depois** do pedido de e-mail → exclui (usuário respondeu)
   - Para cada lead restante, verifica se já passou o tempo da **próxima** etapa (5m, 10m, 15h, 24h, 48h)
   - Escolhe mensagem aleatória do conjunto da etapa (que ainda não foi enviada)
3. Para cada lead devido: confirma **getSignupPending(phone).step === 'email'** e **!hasCadastro(phone)** → envia mensagem → **recordFollowUpSent(phone, stage, message)**.
4. Se o lead responder em qualquer momento: **cancelLeadRecoveryOnUserReply(phone)** no webhook → `status = ativo` → próximo cron não envia mais.
5. Se o lead enviar e-mail: **markLeadRecoveryEmailReceived(phone)** → `email_recebido = true` → cron ignora.
6. Se a conta for criada: **markLeadRecoveryCadastroConcluido(phone)** → `cadastro_finalizado = true` → cron ignora.

---

## Conjuntos de mensagens

Cada etapa tem um conjunto de frases. Ao disparar um follow-up:

1. Seleciona uma mensagem **aleatória** do conjunto da etapa
2. Verifica se essa mensagem **já foi enviada** para o mesmo lead (`mensagens_followup_enviadas`)
3. Envia e **registra** no histórico (a mesma mensagem não se repete na mesma conversa)

Os textos estão definidos em `lib/whatsapp-lead-recovery.ts` (constantes `FOLLOWUP_1_MSGS` … `FOLLOWUP_5_MSGS`).

---

## Escalabilidade

- **Detecção de inatividade**: baseada em `email_requested_at` e `whatsapp_contatos.last_message_at` (uma query por execução do cron com join implícito via lista de phones).
- **Agendamento**: não há jobs por lead; o cron roda em intervalo fixo e calcula “quem está devido” na hora.
- **Seleção aleatória e anti-repetição**: em memória (conjuntos + array `mensagens_followup_enviadas`).
- **Cancelamento**: ao responder, ao enviar e-mail ou ao concluir cadastro, o estado é atualizado e o próximo run do cron já não considera o lead.

---

## Deploy

1. **Obrigatório:** aplicar a migration no Supabase (SQL Editor ou `supabase db push`):
   - `supabase/migrations/20260306100000_whatsapp_lead_recovery.sql`
   - Sem essa tabela, o follow-up de 5 min nunca dispara (initLeadRecovery falha em silêncio; verifique logs por `[lead-recovery]`).
2. O cron **a cada 2 min** (`/api/whatsapp/cron-boas-vindas-pendentes`) executa a recuperação de leads além das boas-vindas. O **server.js** chama essa rota automaticamente quando `CRON_SECRET` está definido (não precisa de cron externo).
3. O **server.js** também chama `/api/cron/plen-smart-messages` **a cada 10 min** (follow-up 10 min para leads no modo teste + mensagens inteligentes para cadastrados). Mesmo `CRON_SECRET`, header `Authorization: Bearer <CRON_SECRET>`.

### Por que as mensagens de vácuo não estavam saindo (correção)

- **Lead recovery (5m, 10m, 15h, 24h, 48h):** o cron de boas-vindas só rodava `runLeadRecoveryFollowUps` quando **Z-API** estava configurado. Quem usava só **API Fácil** nunca recebia essas mensagens. Corrigido: agora roda com Z-API **ou** API Fácil.
- **Follow-up 10 min (leads no modo teste) e smart messages:** o **server.js** não chamava `/api/cron/plen-smart-messages`. Só rodava se houvesse um cron externo (cron-job.org etc.) apontando para essa URL. Corrigido: o server.js passou a chamar essa rota a cada 10 minutos com `Authorization: Bearer CRON_SECRET`.

---

## Resumo da lógica de implementação

| Requisito                         | Implementação                                                                 |
|-----------------------------------|-------------------------------------------------------------------------------|
| Detecção de inatividade          | `email_requested_at` + `last_message_at` (usuário não respondeu depois)      |
| Agendamento                      | Cron periódico; intervalos 5m, 10m, 15h, 24h, 48h calculados em cada run     |
| Seleção aleatória                | `pickRandomMessageForStage(stage, alreadySent)`                               |
| Prevenção de repetição           | `mensagens_followup_enviadas` (array de textos já enviados)                   |
| Cancelamento ao responder         | `cancelLeadRecoveryOnUserReply(phone)` no webhook                            |
| Verificação cadastro concluído   | `cadastro_finalizado` e `getSignupPending` / `hasCadastro` no cron            |
| Controle de estado               | Tabela `whatsapp_lead_recovery` + integrações no webhook e no cron            |
