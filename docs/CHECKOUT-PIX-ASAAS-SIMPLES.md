# Checkout PIX (Asaas) — passo a passo simples

Siga **na ordem**. Na maioria dos casos o problema é **ambiente (URL + chave)** ou **conta Asaas**.

---

## 1) Chave e URL têm que ser do **mesmo** ambiente

(Alinhado à [tabela oficial Asaas](https://docs.asaas.com/docs/sandbox): produção `api.asaas.com`, sandbox `api-sandbox.asaas.com` — nas chamadas REST use o sufixo `/v3`.)

| Sua chave começa com… | URL correta (`ASAAS_API_URL`) |
|------------------------|-------------------------------|
| `$aact_hmlg_` (homologação / testes) | `https://api-sandbox.asaas.com/v3` |
| `$aact_prod_` (produção / dinheiro real) | `https://api.asaas.com/v3` |

**Erro comum:** chave `hmlg` com URL `https://api.asaas.com/v3` → o checkout quebra (500) e **não aparece QR**.

O código do projeto **corrige isso automaticamente** em muitos casos, mas no **Railway/Render** deixe as duas variáveis **coerentes** para evitar surpresas.

---

## 2) Onde configurar

- **Local:** `.env.local` → reinicie o `npm run dev` depois de mudar.
- **Produção:** painel do host (Railway, etc.) → mesmas variáveis.

Variáveis:

```env
ASAAS_API_KEY=$aact_...
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
```

(Em produção real, troque para `https://api.asaas.com/v3` + chave `prod`.)

---

## 3) Diagnóstico rápido (1 clique)

Com o app rodando, abra no navegador:

`http://localhost:3000/api/pagamento/asaas-health`

(Em produção: `https://SEU-DOMINIO/api/pagamento/asaas-health`)

Você vê se a chave existe, qual URL está sendo usada e se há aviso de mistura sandbox/produção.

---

## 4) QR aparece mas o **banco recusa** o PIX

- **Sandbox:** muitos apps de banco **não pagam** cobrança de teste como se fosse real. Use **produção** + chave **prod** para teste com dinheiro de verdade (valor baixo) **ou** confirme o pagamento no painel Asaas (sandbox).
- **Produção:** cadastre **chave PIX** da empresa no Asaas (menu de Pix / configurações) se o painel pedir; conta **aprovada** e CPF/CNPJ válidos na cobrança.

---

## 5) Webhook (opcional, mas ajuda)

Configure o webhook no Asaas apontando para:

`/api/pagamento/webhook-asaas`

e defina `ASAAS_WEBHOOK_TOKEN` igual ao token configurado no Asaas. Isso **não gera o QR**, mas acelera a confirmação de “já paguei”.

---

## 6) Ainda falhou?

1. Abra o **terminal** onde roda `npm run dev` e veja o erro após clicar em Assinar.
2. No navegador, **DevTools → Network** → clique na requisição `checkout-guest` → aba **Response** (mensagem do servidor).
3. Confira `asaas-health` (passo 3).

---

## Resumo em uma linha

**`hmlg` → sandbox URL · `prod` → produção URL · reiniciar servidor após mudar `.env` · PIX real no banco = produção.**
