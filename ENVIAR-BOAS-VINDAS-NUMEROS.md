# Enviar boas-vindas para números que ainda não foram respondidos

O sistema **não guarda** em banco quais números mandaram "Olá, quero utilizar a plenipay" e não receberam resposta. Quem envia essa mensagem é atendido na hora pelo webhook.

Para **reponder** a quem você sabe que não foi atendido (por exemplo, números que aparecem no painel da API Fácil como "não respondidos" ou uma lista que você anotou), use a rota abaixo.

## Rota

**POST** `/api/whatsapp/apifacil/enviar-boas-vindas`

Ela envia as **mesmas 3 mensagens** do fluxo "quero utilizar" (boas-vindas + botões CADASTRAR / JÁ CADASTREI + instrução de e-mail) para cada número da lista.

## Como usar

1. **Configure o segredo** (recomendado) no painel do seu host (Railway, Render, etc.):
   - Nome: `WHATSAPP_ENVIAR_BOASVINDAS_SECRET`
   - Valor: uma senha forte que só você saiba (ex.: um token aleatório).

2. **Monte a lista de números**  
   Formato Brasil: `5511999999999` (DDI 55 + DDD + número, sem espaços ou traços).  
   Você pode pegar os números no painel da API Fácil (conversas não respondidas) ou de uma planilha.

3. **Chame a API** (Postman, curl ou qualquer cliente HTTP):

```bash
curl -X POST "https://SEU-DOMINIO.com/api/whatsapp/apifacil/enviar-boas-vindas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_WHATSAPP_ENVIAR_BOASVINDAS_SECRET" \
  -d '{"numeros": ["5511999999999", "5511888888888"]}'
```

Se você **não** configurou `WHATSAPP_ENVIAR_BOASVINDAS_SECRET`, pode chamar sem o header `Authorization` (menos seguro; use só em ambiente controlado).

## Resposta

Exemplo de sucesso:

```json
{
  "success": true,
  "enviados": 2,
  "total": 2,
  "detalhes": [
    { "numero": "5511999999999", "ok": true },
    { "numero": "5511888888888", "ok": true }
  ]
}
```

Se algum número falhar, `detalhes` trará `ok: false` e `error` com a mensagem.
