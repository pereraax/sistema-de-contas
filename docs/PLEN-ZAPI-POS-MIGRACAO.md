# PLEN com Z-API — Pós-migração (Evolution removida)

## O que foi feito

1. **Evolution API removida**
   - Webhook `/api/webhooks/evolution` removido
   - Envio e sync passaram a usar apenas Z-API
   - Parser e referências à Evolution removidos

2. **Integração Z-API**
   - **Webhook:** `POST /api/whatsapp/zapi/webhook` — configure na Z-API em “Ao receber”
   - **Fluxo:** WhatsApp → Z-API → Webhook → CRM (contato/conversa/mensagem) → User State → Intent Router → Business Logic → Message Queue (delay 1,5–5 s) → Sender Z-API
   - **Primeira mensagem:** sempre tratada como novo lead (incluindo mensagens de anúncio, ex.: “Olá! Quero utilizar a Plenipay.”)
   - **Origem:** detectada automaticamente (`anuncio` ou `whatsapp`)

3. **Contatos**
   - Todo contato é criado/atualizado a cada mensagem (telefone, nome, origem, data_primeiro_contato, ultima_interacao)
   - **CRM → Contatos:** lista por ordem de chegada, exportação CSV

4. **Estado do usuário (plen_user_state)**
   - Estados: NEW_LEAD → TEST_EXPENSE → WAITING_NAME → WAITING_EMAIL → WAITING_CODE → USER_ACTIVE

5. **Delay humano**
   - Todas as respostas passam pela fila com atraso aleatório de 1,5 a 5 segundos

6. **Menu global**
   - Usuário pode digitar **menu** a qualquer momento e recebe as opções (Falar com humano, Como funciona, Assinatura, etc.)

7. **Fluxo PLEN**
   - Lead: “Olá {nome}! 💙 … Envie um gasto: Café 12 ☕” → TEST_EXPENSE
   - Registro de gasto: resposta no formato 💙 + categoria, valor, link “Ver meus registros”
   - Cadastro: nome → email → código → conta criada + tutorial (áudio, foto, comprovante)

8. **Respostas humanizadas**
   - Frases aleatórias na confirmação de gasto
   - Mensagem de formato confuso: “Ops {nome}, fiquei um pouco confusa 🥹 …”

9. **Intenções**
   - registrar_gasto, registrar_receita, consultar_saldo, consultar_mes, pergunta, menu

## Variáveis de ambiente

**Remover (Evolution):**
- `EVOLUTION_API_URL`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_API_KEY`

**Obrigatório (Z-API):**
- `ZAPI_INSTANCE_ID` — ID da instância no painel Z-API
- `ZAPI_TOKEN` — Token da instância
- `ZAPI_CLIENT_TOKEN` — (opcional) Token de segurança da conta, se ativado na Z-API

**Opcional:**
- `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_SITE_URL` — usado no link “Ver meus registros” (ex.: https://app.plenipay.com)

## Webhook na Z-API

- **URL:** `https://SEU_DOMINIO/api/whatsapp/zapi/webhook`
- No painel Z-API: Instância → Configurações → Webhook → **Ao receber** = essa URL

## Cron da fila PLEN

Para processar a fila de mensagens (envio com delay), chame periodicamente:

- `GET ou POST /api/plen/queue-worker`  
- Header: `Authorization: Bearer {CRON_SECRET}` ou query `?secret={CRON_SECRET}`  
- Configure `CRON_SECRET` ou `PLEN_QUEUE_SECRET` no ambiente.

Recomendado: cron a cada 1 minuto.

## Pendente (próximos passos)

- **Plano gratuito (implementado):** limite de 10 registros; após isso mensagem R$ 9,90.
- **Lembretes (implementado):** detectar “preciso pagar dia” / “preciso receber dia” e enviar no dia
- **Reengajamento (implementado):** cron `/api/plen/reengagement-cron` (24h inatividade, 72h entre envios).
- **Painel Assistente Plen:** página no Admin com builder visual (blocos editáveis)
- **Multimídia:** interpretar áudio (transcrição), imagem e comprovante (OCR) para registrar gastos
