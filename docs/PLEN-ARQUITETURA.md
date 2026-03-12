# Arquitetura da assistente PLEN (PLENIPAY)

Assistente financeira no WhatsApp via Evolution API: **intenções, estados e validação backend**. Sem liberdade total de resposta; sem spam.

---

## Tecnologia

- **WhatsApp**: Evolution API (webhook recebe mensagens)
- **Frontend/CRM**: Admin Panel existente
- **Banco**: PostgreSQL (Supabase)

---

## Módulos

```
/whatsapp          webhook-handler (Evolution) + message-sender (Evolution)
/queue             message_queue (tabela + lib) + queue_worker (envio com delay)
/state             user_state_manager (estado por contact_id)
/ai                intent_router, expense_parser, question_handler
/crm               contacts, conversations, messages (já existentes)
/auth              email_verification (criar usuário, enviar código, validar código)
/logs              interaction_logs (plen_interaction_logs ou detalhes em crm_interaction_logs)
```

---

## Fluxo geral

1. Usuário envia mensagem no WhatsApp  
2. Evolution API envia webhook  
3. **Webhook handler** recebe → CRM salva contato + mensagem  
4. Sistema identifica **estado do usuário** (user_state)  
5. **Intent Router** identifica intenção (JSON estruturado)  
6. **Business logic** executa ação (validação backend, nunca IA gravando direto)  
7. Resposta vai para **message_queue**  
8. **Queue worker** envia com delay seguro (1 msg a cada 2s)  
9. **Anti-loop**: se 3 respostas seguidas para o mesmo usuário → bloquear envio temporariamente  

---

## Salvamento automático de contatos

Sempre que um **número novo** enviar mensagem:

- Criar contato com: `telefone`, `data_primeiro_contato`, `ultima_interacao`, `origem = whatsapp`
- Mesmo que o usuário não finalize o cadastro

*(Já implementado no webhook Evolution.)*

---

## Controle de estado (user_state)

Tabela `plen_user_state` (ou equivalente). Estados:

| Estado         | Descrição                          |
|----------------|------------------------------------|
| NEW_LEAD       | Primeiro contato, ainda não fez teste |
| TEST_EXPENSE   | Fez teste de gasto (aguardando 1º gasto) |
| WAITING_NAME   | Aguardando nome (≥2 caracteres, sem números) |
| WAITING_EMAIL  | Aguardando email (formato válido)  |
| WAITING_CODE   | Aguardando código 6 dígitos do email |
| USER_ACTIVE    | Cadastro completo; pode registrar gastos |

Cada resposta da IA considera o **estado atual** do usuário.

---

## Fluxo de demonstração (PLEN)

### NEW_LEAD

Resposta inicial:

```
Olá! Eu sou a Plen 🤖
Sou sua assistente financeira no WhatsApp.
Antes de começarmos, vamos fazer um teste rápido.
Envie um gasto para eu registrar.
Exemplo:
Café 12
```

→ Estado passa para **TEST_EXPENSE**.

---

### TEST_EXPENSE

Usuário envia ex.: `Café 12`.

- Intent: `registrar_despesa`; valor 12; descrição café.
- Backend valida.
- Resposta:

```
Registrado ✅
Categoria: Alimentação
Valor: R$12

Viu como é rápido?
Agora vamos criar sua conta para salvar seus registros.
Qual é o seu nome?
```

→ Estado: **WAITING_NAME**.

---

### WAITING_NAME

- Validação: mínimo 2 caracteres, sem números.
- Se inválido: pedir nome de novo.
- Se válido: "Prazer, {nome}! 👋 Agora me diga qual é o seu email para criar sua conta."
- → Estado: **WAITING_EMAIL**.

---

### WAITING_EMAIL

- Validar formato de email.
- Se válido: criar usuário no CRM/Supabase, gerar código, enviar por email.
- Resposta: "Enviei um código de verificação para seu email. Digite o código aqui."
- → Estado: **WAITING_CODE**.

---

### WAITING_CODE

- Validar código (6 dígitos).
- Se correto: "Conta criada com sucesso! 🎉 Agora você pode registrar seus gastos diretamente aqui. Exemplo: Almoço 35"
- → Estado: **USER_ACTIVE**.

---

## Interpretação de gastos (expense_parser)

Entrada exemplo: `Café 12`.

Saída esperada (IA/parser):

```json
{
  "intent": "registrar_despesa",
  "descricao": "café",
  "valor": 12,
  "categoria": "Alimentação"
}
```

Backend valida:

- Existe número no texto
- Valor > 0
- Texto antes do número existe (descrição)

Se inválido: responder pedindo formato correto (ex.: "Descrição Valor").

---

## Intent Router

Intenções possíveis:

- `registrar_despesa`
- `registrar_receita`
- `pergunta`
- `saudacao`
- `cadastro`
- `desconhecido`

A IA/roteador retorna **sempre JSON estruturado**.

---

## Perguntas durante o cadastro

Se o usuário fizer pergunta (ex.: "Como funciona?") durante cadastro:

- Responder **brevemente** e **repetir o passo do fluxo**.
- Ex.: "A Plen registra seus gastos quando você envia mensagens como: Café 12. Mas primeiro precisamos finalizar seu cadastro. Qual é o seu nome?"

---

## Anti-spam

- **Nunca** enviar mensagens diretamente.
- Todas as mensagens passam por **message_queue**.
- Campos: id, contact_id/telefone, mensagem, status, send_after.

---

## Queue worker

- Processa fila com **delay seguro**.
- Limite: **1 mensagem a cada 2 segundos** (por instância/fila).
- **Endpoint**: `GET` ou `POST` `/api/plen/queue-worker`
- **Cron**: configurar chamada a cada 1 minuto (ex.: Railway cron, Vercel cron). Enviar header `Authorization: Bearer <CRON_SECRET>` ou query `?secret=<CRON_SECRET>`.
- **Variáveis**: `CRON_SECRET` ou `PLEN_QUEUE_SECRET` (opcional; se definido, a rota exige o secret).

---

## Proteção anti-loop

Se o sistema gerar **3 respostas seguidas** para o mesmo usuário (sem mensagem do usuário no meio):

- Bloquear envio temporariamente para esse usuário (ex.: 5 min).

---

## Logs (interaction_logs)

Registrar por interação PLEN:

- contact_id
- mensagem_recebida
- estado_usuario
- intent_detectada
- acao_executada
- resposta_enviada
- timestamp

*(Tabela `plen_interaction_logs` ou campos/detalhes em `crm_interaction_logs`.)*

---

## Regras importantes

A IA **nunca** deve:

- Registrar dados diretamente no banco
- Enviar mensagens em massa
- Responder sem validação de estado

**Sempre** usar backend para decidir ações.

---

## Objetivo final

Assistente financeira **estável** (PLEN): registra gastos corretamente no WhatsApp, guia o cadastro por estados e intenções, sem spam nem respostas incorretas.

---

## Implementação (código)

- **Estado**: `lib/plen/state/user-state-manager.ts`
- **Fila**: `lib/plen/queue/message-queue.ts` + `queue-worker.ts`
- **IA**: `lib/plen/ai/intent-router.ts`, `expense-parser.ts`, `question-handler.ts`
- **Negócio**: `lib/plen/business/plen-handler.ts`
- **Auth**: `lib/plen/auth/email-verification.ts`
- **Logs**: `lib/plen/logs/interaction-logs.ts`
- **Webhook**: após salvar mensagem de entrada, chama `handlePlenIncomingMessage(contactId, text)` (fire-and-forget).
- **Migrações**: `supabase/migrations/20260308200000_plen_architecture.sql`
