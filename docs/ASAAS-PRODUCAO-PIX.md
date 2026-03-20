# PIX real (localhost e produção)

O Asaas **não** mistura ambientes:

| Onde | Chave | URL (`ASAAS_API_URL`) |
|------|--------|------------------------|
| **Dinheiro de verdade no app do banco** | `$aact_prod_...` (painel **produção**) | `https://api.asaas.com/v3` |
| Só testes / sem PIX real | `$aact_hmlg_...` | `https://api-sandbox.asaas.com/v3` |

## O que configurar (Railway e `.env.local`)

```env
ASAAS_API_URL=https://api.asaas.com/v3
# Aspas obrigatórias — a chave começa com $
ASAAS_API_KEY="$aact_prod_COLE_A_CHAVE_DO_PAINEL_PRODUCAO"
```

1. Conta **produção**: [Asaas](https://www.asaas.com) (não use `sandbox.asaas.com` para chave de produção).
2. Menu **Integrações** → gere/copie a chave que começa com **`$aact_prod_`**.
3. No Asaas, cadastre **chave PIX** da empresa se ainda não tiver (recebimentos PIX).
4. Reinicie o app após salvar o `.env`.

## Webhook em produção

`https://SEU-DOMINIO/api/pagamento/webhook-asaas` + mesmo `ASAAS_WEBHOOK_TOKEN` do painel.

## Homologação opcional

Só se quiser testar **sem** dinheiro real:

```env
ASAAS_USE_SANDBOX=true
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY="$aact_hmlg_..."
```
