# Garantir que todos recebam as 3 mensagens (WhatsApp)

Quando o webhook da API Fácil falha ou atrasa, novos contatos podem ficar sem as 3 mensagens de boas-vindas. Duas formas de corrigir:

---

## 1. Botão no painel admin (manual)

1. Acesse **Administração** → **WhatsApp — CRM e Reenvio**.
2. Aba **Pendentes**.
3. Clique em **Carregar contatos que não receberam as 3 mensagens** (sincroniza com a API Fácil).
4. Clique em **Enviar para todos os pendentes agora**.

Isso busca no histórico da API Fácil quem enviou "quero utilizar Plenipay" (últimas 48h), adiciona na fila e envia as 3 mensagens para todos que ainda não receberam (últimos 7 dias).

---

## 2. Cron automático (recomendado)

Para que **qualquer** novo contato receba as 3 mensagens mesmo quando o webhook falhar, configure um cron que rode a cada **1–2 minutos**.

### Variável de ambiente

No Railway (ou seu host), crie:

- **Nome:** `CRON_SECRET`
- **Valor:** uma senha forte (ex.: gere em https://randomkeygen.com e use "Code Ignition" ou similar). Não compartilhe.

### Serviço de cron (ex.: cron-job.org)

1. Acesse https://cron-job.org e crie uma conta.
2. Crie um novo cron job:
   - **URL:** `https://plenipay.com/api/whatsapp/cron-boas-vindas-pendentes`
   - **Método:** GET ou POST
   - **Intervalo:** a cada 1 minuto (ou 2 minutos)
   - **Headers:**  
     - Nome: `Authorization`  
     - Valor: `Bearer SEU_CRON_SECRET`  
     (substitua `SEU_CRON_SECRET` pelo valor da variável `CRON_SECRET`)

3. Salve e ative.

Assim, a cada 1–2 minutos o sistema:

- Busca na API Fácil as mensagens recebidas (últimas 48h) com "quero utilizar Plenipay".
- Preenche a tabela de contatos com quem ainda não estava.
- Envia as 3 mensagens para todos que estão pendentes (últimos 7 dias).

Quem o webhook não atendeu passa a ser atendido pelo cron em no máximo 1–2 minutos.

---

## Resumo

| Ação | Quando usar |
|------|-------------|
| **Enviar para todos pendentes agora** (botão no admin) | Agora mesmo, para os contatos que já aparecem como "Aguardando mensagem". |
| **Cron a cada 1–2 min** | Para que no futuro todo novo contato receba as 3 mensagens mesmo se o webhook falhar. |
