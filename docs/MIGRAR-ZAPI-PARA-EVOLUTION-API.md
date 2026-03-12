# Migrar de Z-API para Evolution API

Guia para trocar o provedor de WhatsApp do CRM de **Z-API** para **Evolution API**.

---

## Quanto vou gastar?

| Opção | Custo | Observação |
|------|--------|------------|
| **Evolution API self-hosted** | **R$ 0** (software) + VPS | Você instala a Evolution em um servidor (VPS). Só paga o VPS (ex.: R$ 20–80/mês). Instâncias ilimitadas. |
| **Evolution API Cloud** (gerenciado) | **~R$ 29,90/mês** | Serviço pronto (ex.: evocloud.pro). API REST, webhooks, suporte. |
| **Z-API** (atual) | Conforme plano da z-api.io | Planos pagos por instância/mensagem. |

**Resumo:** Se você self-hospedar a Evolution em um VPS, o custo é basicamente o do VPS. Se usar Evolution Cloud, tende a ser mais barato que muitos planos Z-API e com controle maior (open-source).

---

## O que já está implementado no projeto

- **Webhook Evolution:** `POST /api/webhooks/evolution` — recebe eventos `MESSAGES_UPSERT`, cria contato/conversa e salva mensagem no CRM.
- **Envio:** o sender usa **Evolution API** quando as variáveis da Evolution estão preenchidas; caso contrário, continua usando Z-API.
- **Parser:** suporte ao payload da Evolution (Baileys): `key.remoteJid`, `key.fromMe`, `key.id`, `message.conversation`, `message.extendedTextMessage`, `imageMessage`, `videoMessage`, etc.

Nenhuma alteração de frontend é necessária: o CRM continua igual; só muda o provedor em backend e nas variáveis de ambiente.

---

## Passo a passo da migração

### 1. Ter uma Evolution API rodando

- **Self-hosted:** veja o guia **[Como subir a Evolution API](COMO-SUBIR-EVOLUTION-API.md)** (Docker no VPS em poucos passos).
- **Cloud:** assine um serviço gerenciado (ex.: EvolutionApi Cloud) e anote a URL da API, nome da instância e chave (apikey).

### 2. Criar/conectar uma instância WhatsApp na Evolution

- Na Evolution, crie uma instância e conecte o número (QR Code ou pareamento).
- Anote o **nome da instância** (ex.: `minha-instancia`).

### 3. Configurar variáveis de ambiente

No `.env.local` (e no ambiente de produção) **adicione** as variáveis da Evolution e **opcionalmente** remova as da Z-API depois de validar:

```bash
# Evolution API (se todas estiverem preenchidas, o CRM usa Evolution em vez de Z-API)
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_INSTANCE=minha-instancia
EVOLUTION_API_KEY=sua_apikey
```

- **EVOLUTION_API_URL:** URL base da API (sem barra no final). Ex.: `https://evolution.seudominio.com`.
- **EVOLUTION_INSTANCE:** Nome da instância na Evolution.
- **EVOLUTION_API_KEY:** Chave de API (header `apikey`). Na Evolution self-hosted costuma estar no `.env` do servidor; em cloud, no painel.

Enquanto **EVOLUTION_API_URL**, **EVOLUTION_INSTANCE** e **EVOLUTION_API_KEY** estiverem definidos, o envio do CRM passa a usar Evolution. Se quiser voltar a usar só Z-API, remova ou comente essas três variáveis.

### 4. Configurar o webhook na Evolution

A Evolution precisa chamar seu backend quando chegar mensagem.

**URL do webhook:**

```
https://SEU_DOMINIO/api/webhooks/evolution
```

Ex.: em produção: `https://plenipay.com/api/webhooks/evolution`. Em localhost, use um túnel (ngrok, Cloudflare Tunnel) e coloque a URL pública do túnel + `/api/webhooks/evolution`.

**Eventos:** pelo menos **MESSAGES_UPSERT** (mensagens recebidas/enviadas).

**Como configurar:**

- **Pela API da Evolution:**  
  `POST {EVOLUTION_API_URL}/webhook/set/{EVOLUTION_INSTANCE}` (ou endpoint equivalente da sua versão) com body por exemplo:

  ```json
  {
    "enabled": true,
    "url": "https://SEU_DOMINIO/api/webhooks/evolution",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }
  ```

- **Pelo painel (se a sua instalação tiver):** informe a URL acima e marque o evento de mensagens (MESSAGES_UPSERT / messages.upsert).

Consulte a [documentação de webhooks da Evolution](https://doc.evolution-api.com/v2/pt/configuration/webhooks) para o formato exato do seu servidor.

### 5. Testar

1. Enviar uma mensagem do celular para o número conectado na Evolution.
2. Verificar no CRM se a conversa aparece e se o conteúdo da mensagem é exibido.
3. Enviar uma resposta pelo CRM (chat) e confirmar que o envio usa a Evolution (e que a mensagem chega no WhatsApp).

Se algo falhar, confira os logs do webhook (Configurações do CRM, se houver tela de “últimos eventos”) e os logs do servidor Next.js.

### 6. Desligar a Z-API (opcional)

Depois de validar envio e recebimento pela Evolution:

- Remova ou comente no `.env` as variáveis **Z_API_INSTANCE_ID**, **Z_API_TOKEN** e **Z_API_CLIENT_TOKEN**.
- No painel da Z-API, pode desativar o webhook ou a instância para não receber eventos em duplicidade.

---

## Resumo de variáveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| **EVOLUTION_API_URL** | Sim | URL base da Evolution (ex.: `https://evolution.seudominio.com`). |
| **EVOLUTION_INSTANCE** | Sim | Nome da instância na Evolution. |
| **EVOLUTION_API_KEY** | Sim | Chave de API (header `apikey`). |
| Z_API_* | Não | Só são usadas se as três da Evolution não estiverem todas preenchidas. |

---

## Referências

- [Evolution API – Documentação](https://doc.evolution-api.com)
- [Evolution API – Webhooks (PT)](https://doc.evolution-api.com/v2/pt/configuration/webhooks)
- [Evolution API – Envio de texto](https://doc.evolution-api.com/v2/api-reference/message-controller/send-text)
