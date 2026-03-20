# Testar checkout PIX (Asaas) agora — checklist

## Confirmação: chave × URL (está certo assim)

| Chave API | `ASAAS_API_URL` |
|-----------|-----------------|
| `$aact_hmlg_...` (homologação / sandbox) | `https://api-sandbox.asaas.com/v3` |
| `$aact_prod_...` (produção) | `https://api.asaas.com/v3` |

Fonte: [documentação Asaas — Sandbox](https://docs.asaas.com/docs/sandbox) (tabela Produção vs Sandbox).

---

## O que fazer no seu PC (ordem)

### 1) Conferir `.env.local`

Para **testes com chave `hmlg`**, precisa estar assim (já é o esperado no projeto):

```env
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
# Obrigatório entre aspas: a chave começa com $
ASAAS_API_KEY="$aact_hmlg_...sua_chave_do_painel_sandbox..."
```

Se mudar qualquer linha, **salve o arquivo**.

### 2) Subir o app de novo

No terminal, na pasta do projeto:

```bash
npm run dev
```

(Se já estava rodando, **pare com Ctrl+C** e suba de novo — o Next lê o `.env.local` na subida.)

### 3) Teste automático da API (10 segundos)

Abra no navegador:

**http://localhost:3000/api/pagamento/asaas-health**

- `hasApiKey`: deve ser `true`
- `keyHint`: deve citar **sandbox (hmlg)** se você usa chave `hmlg`
- `resolvedApiBaseUrl`: deve ser `https://api-sandbox.asaas.com/v3`

Se `hasApiKey` for `false`, a chave não entrou no processo — volte ao passo 2.

### 4) Teste do checkout (quiz / modal)

1. Abra a página onde está o **checkout da oferta** (ex.: fluxo do quiz que abre o modal).
2. Preencha **nome, e-mail, CPF válido**, método **PIX**.
3. Clique em **Assinar agora**.
4. Deve aparecer a tela do **QR** ou **código copia e cola** em poucos segundos.

### 5) PIX no app do banco (sandbox)

No **sandbox**, alguns bancos **não concluem** o pagamento como dinheiro real. Se o QR aparecer mas o banco “não aceitar”, isso pode ser normal em homologação — use o painel Asaas **sandbox** para simular/confirmar cobrança, ou teste **produção** com valor mínimo quando for validar com banco real.

---

## Se der erro 500 no checkout

1. Veja a mensagem **no próprio modal** (bloco amarelo).
2. No DevTools → **Network** → requisição `checkout-guest` → aba **Response**.
3. Confira de novo o passo **3** (`asaas-health`).

---

## Produção (Railway / outro host)

Repita a **mesma lógica** nas variáveis de ambiente:

- Chave **prod** → `ASAAS_API_URL=https://api.asaas.com/v3`
- Deploy após salvar variáveis (ou redeploy).
