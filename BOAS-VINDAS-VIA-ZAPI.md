# Envio de boas-vindas via Z-API (sem API Fácil)

Você pode usar a **Z-API** (z-api.io) para enviar as 3 mensagens de boas-vindas, com **botões nativos** (CADASTRAR / JÁ CADASTREI), sem depender da API Fácil.

---

## Por que Z-API?

- **Configuração simples**: instância + token no painel Z-API.
- **Botões nativos**: a segunda mensagem sai com botão "CADASTRAR" (abre o link) e "JÁ CADASTREI" (resposta), sem depender de suporte da API Fácil a botões.
- **Alternativa** quando a API Fácil estiver instável ou você quiser trocar de provedor só para o fluxo de boas-vindas.

---

## 1. Criar conta e instância na Z-API

1. Acesse **https://z-api.io** e crie uma conta.
2. Crie uma **instância** WhatsApp (conecte com QR Code como em qualquer API).
3. No painel da instância, anote:
   - **Instance ID** (ou número da instância)
   - **Token** (token de acesso da instância)
   - Se aparecer **Token de segurança da conta** (Client-Token), anote também — às vezes a Z-API exige.

---

## 2. Variáveis de ambiente (Railway / host)

No painel do seu host (ex.: Railway), adicione:

| Variável | Valor | Obrigatório |
|----------|--------|-------------|
| `ZAPI_INSTANCE_ID` | ID da sua instância Z-API | Sim |
| `ZAPI_TOKEN` | Token da instância | Sim |
| `ZAPI_CLIENT_TOKEN` | Token de segurança da conta (se o painel pedir) | Só se exigido |
| `WHATSAPP_BOASVINDAS_PROVIDER` | `zapi` | Sim, para usar Z-API nas boas-vindas |

Para usar **só** Z-API nas boas-vindas (e não API Fácil), defina:

```env
WHATSAPP_BOASVINDAS_PROVIDER=zapi
ZAPI_INSTANCE_ID=seu_instance_id
ZAPI_TOKEN=seu_token
```

Se a Z-API pedir Client-Token em algum erro:

```env
ZAPI_CLIENT_TOKEN=seu_client_token
```

(O Client-Token fica em **Segurança** ou **Token de segurança da conta** no painel Z-API.)

---

## 3. O que passa a usar Z-API

Quando `WHATSAPP_BOASVINDAS_PROVIDER=zapi` e Z-API estiver configurada:

- **Botão "Enviar para todos os pendentes agora"** (admin) → envia as 3 mensagens via Z-API.
- **Cron de boas-vindas** (`/api/whatsapp/cron-boas-vindas-pendentes`) → envia via Z-API.
- **Reenvio individual** no CRM (Enviar 3 mensagens para um número) → via Z-API.

As 3 mensagens são:

1. Texto de boas-vindas (Plen, assistente financeira, etc.).
2. Texto + **botões**: **CADASTRAR** (abre plenipay.com) e **JÁ CADASTREI** (resposta).
3. Texto pedindo e-mail após o cadastro.

---

## 4. Receber mensagens (webhook) com Z-API

O **envio** das boas-vindas pode ser 100% pela Z-API. Para **receber** as mensagens dos clientes (e continuar o fluxo de cadastro/email), você precisa que a Z-API chame seu backend:

1. No painel Z-API, na instância, configure o **Webhook** para:
   - URL: `https://plenipay.com/api/whatsapp/zapi/webhook`  
   (ou a URL do seu app em produção)
2. Ative os eventos de mensagem recebida.

Assim, quando alguém responder "JÁ CADASTREI" ou enviar e-mail, seu sistema continua recebendo pela Z-API. O projeto já tem rota em `app/api/whatsapp/zapi/webhook/route.ts`; basta apontar a Z-API para ela e tratar o que for necessário (ex.: abrir fluxo de e-mail).

---

## 5. Resumo rápido

| Objetivo | O que fazer |
|----------|-------------|
| Só enviar as 3 boas-vindas por Z-API (botões) | `WHATSAPP_BOASVINDAS_PROVIDER=zapi` + `ZAPI_*` |
| Também receber respostas pela Z-API | Configurar webhook da Z-API para `/api/whatsapp/zapi/webhook` |
| Voltar a usar API Fácil nas boas-vindas | `WHATSAPP_BOASVINDAS_PROVIDER=apifacil` ou remover a variável (usa API Fácil se configurada) |

Sem API Fácil, o cron e o botão "Enviar para todos pendentes" continuam funcionando desde que Z-API esteja configurada e `WHATSAPP_BOASVINDAS_PROVIDER=zapi`.
