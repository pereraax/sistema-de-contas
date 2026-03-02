# Como rodar e testar a assistente PLEN em localhost (passo a passo)

Este guia explica **com detalhes** como subir o projeto no seu computador e fazer a API Fácil ou a Z-API chamar seu app local, para você testar a assistente WhatsApp antes de fazer deploy.

---

## O que você vai precisar

- **Node.js** instalado (v18 ou superior)
- **Conta** na API Fácil (apifacil.dev) **ou** na Z-API (z-api.io), com uma instância/número de WhatsApp já conectado
- **Projeto Supabase** do Plenipay configurado (tabelas criadas, variáveis anotadas)
- **Duas abas/terminais** no computador: uma para o app e outra para o túnel

---

## Parte 1: Rodar o app no seu computador

### 1.1 Abrir o projeto

Abra o terminal na pasta do projeto (onde está o `package.json`):

```bash
cd "/Users/charlin/Downloads/SISTEMA DE CONTAS"
```

### 1.2 Instalar dependências (se ainda não instalou)

```bash
npm install
```

### 1.3 Criar o arquivo de variáveis de ambiente local

Na **raiz do projeto** (mesma pasta do `package.json`), crie um arquivo chamado **`.env.local`**.

- No Mac/Linux: pode criar pelo terminal: `touch .env.local` e depois abrir no editor.
- **Não commite** esse arquivo no Git (ele já deve estar no `.gitignore`).

Copie para o `.env.local` as **mesmas variáveis** que você usa em produção. Exemplo mínimo:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Se for usar API Fácil:
APIFACIL_INSTANCE_ID=seu_instance_id
APIFACIL_TOKEN=seu_token

# OU, se for usar Z-API:
ZAPI_INSTANCE_ID=seu_instance_id
ZAPI_TOKEN=seu_token
ZAPI_CONNECTED_PHONE=5511999999999
```

Use os valores reais do seu painel (Supabase → Settings → API; API Fácil ou Z-API → configurações da instância).  
Se a assistente usar IA (OpenAI, Groq, etc.), adicione também as chaves correspondentes no `.env.local`.

### 1.4 Subir o servidor em localhost

No mesmo terminal:

```bash
npm run dev
```

- Espere aparecer algo como: `Ready in X ms` e `Local: http://localhost:3000`.
- **Deixe esse terminal aberto** o tempo todo que você for testar.
- O app estará acessível só no seu computador em: **http://localhost:3000**.

Para testar se está no ar: abra no navegador **http://localhost:3000**. Deve carregar a página do projeto.

### 1.5 Usar **apenas localhost** por enquanto (sem ngrok)

Se você ainda está configurando e **não** precisa receber mensagens do WhatsApp no seu PC (webhook), pode trabalhar só no navegador:

- Deixe rodando: `npm run dev`
- Acesse: **http://localhost:3000**
- A assistente em produção não será chamada; em localhost o app responde só para você.

Quando terminar de configurar e quiser que a Z-API/API Fácil chame seu app, aí sim use o túnel (Parte 2).

---

## Parte 2: Expor o localhost para a internet (túnel)

A API Fácil e a Z-API são serviços na nuvem. Eles precisam chamar uma **URL pública** para enviar as mensagens do WhatsApp ao seu app. O `localhost` não é acessível da internet, então usamos um **túnel**: um programa que cria uma URL pública que redireciona tudo para o seu `localhost:3000`.

Você pode usar **ngrok** ou **Cloudflare Tunnel**. Escolha um.

### Opção A: ngrok

**Instalar ngrok**

- Acesse: https://ngrok.com/download  
- Baixe para o seu sistema (Mac, Windows, etc.) ou use Homebrew no Mac:

```bash
brew install ngrok
```

- (Opcional) Crie uma conta grátis em ngrok.com e configure o authtoken para evitar limites.)

**Rodar o túnel**

Abra **outro terminal** (não feche o que está rodando `npm run dev`). Na pasta do projeto ou em qualquer pasta, execute o comando **completo** (com `http` e a porta):

```bash
ngrok http 3000
```

- Se aparecer só a tela de "Usage" / "Paid Features" em vez do túnel, você rodou `ngrok` sem argumentos. Digite de novo: **`ngrok http 3000`** (com espaço entre `http` e `3000`).

- O ngrok vai mostrar uma tela com uma URL **HTTPS**, algo como:
  - `https://a1b2c3d4.ngrok-free.app`
- **Anote essa URL** (troque a cada vez que você reiniciar o ngrok na conta grátis).
- Deixe esse terminal do ngrok aberto enquanto testar.

**Erro "endpoint already online" (ERR_NGROK_334)**  
Na conta grátis só pode existir **um** túnel. Se aparecer que o endpoint já está online:

1. **Pare o ngrok antigo:** feche o terminal onde o ngrok estava rodando ou execute `pkill -f ngrok`.
2. No **painel do ngrok** (https://dashboard.ngrok.com) → Endpoints: encerre o túnel que está ativo.
3. Espere uns segundos e rode de novo: `ngrok http 3000` (com **http**, não "hrrp").

### Opção B: Cloudflare Tunnel (cloudflared)

**Instalar cloudflared**

- Mac (Homebrew): `brew install cloudflared`
- Ou baixe em: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

**Rodar o túnel**

Em **outro terminal**:

```bash
cloudflared tunnel --url http://localhost:3000
```

- Na saída, procure uma linha com uma URL **HTTPS**, tipo:
  - `https://xxxx-xx-xx-xx-xx.trycloudflare.com`
- **Anote essa URL**.
- Deixe o terminal aberto.

---

## Parte 3: Configurar o webhook no provedor (API Fácil ou Z-API)

Agora você vai dizer ao provedor de WhatsApp: “quando chegar uma mensagem, chame esta URL”. A URL será a do túnel + o caminho do webhook do seu app.

Substitua `SUA-URL-DO-TUNEL` pela URL que você anotou (com `https://`), **sem** barra no final.

### Se usar API Fácil (apifacil.dev)

1. Acesse o painel da API Fácil e entre na sua **instância**.
2. Vá em **Configurações** / **Webhook** (ou equivalente onde se configura a URL de recebimento).
3. No campo **URL do webhook**, coloque exatamente:
   ```text
   https://SUA-URL-DO-TUNEL/api/whatsapp/apifacil/webhook
   ```
   Exemplo com ngrok:
   ```text
   https://a1b2c3d4.ngrok-free.app/api/whatsapp/apifacil/webhook
   ```
4. Salve e, se houver, **ative** o webhook.

### Se usar Z-API (z-api.io)

1. Acesse o painel da Z-API e abra a **instância** conectada ao WhatsApp.
2. Procure **Webhook** / **URL de retorno** / **Callback**.
3. No campo da URL, coloque:
   ```text
   https://SUA-URL-DO-TUNEL/api/whatsapp/zapi/webhook
   ```
   Exemplo:
   ```text
   https://a1b2c3d4.ngrok-free.app/api/whatsapp/zapi/webhook
   ```
4. Salve e ative.

---

## Parte 4: Testar de verdade

### 4.1 Conferir o que está rodando

Você deve ter:

1. **Terminal 1:** `npm run dev` rodando (localhost:3000).
2. **Terminal 2:** ngrok ou cloudflared rodando (URL pública anotada).
3. **Webhook** configurado no provedor com a URL do túnel + `/api/whatsapp/apifacil/webhook` ou `.../zapi/webhook`.
4. **`.env.local`** preenchido com Supabase e API Fácil ou Z-API (e reiniciou o `npm run dev` depois de editar).

### 4.2 Enviar uma mensagem no WhatsApp

- No celular, envie uma mensagem para o **número** que está conectado na instância (API Fácil ou Z-API).
- Exemplos de mensagem: **“Olá”**, **“quero utilizar plenipay”**, **“gastei 50 reais no mercado”**.

### 4.3 O que deve acontecer

1. O provedor (API Fácil ou Z-API) recebe a mensagem.
2. Ele chama a URL do webhook (sua URL do túnel).
3. O túnel encaminha a requisição para o seu `localhost:3000`.
4. O Next.js processa em `/api/whatsapp/apifacil/webhook` ou `.../zapi/webhook` e a assistente responde.
5. No **terminal do `npm run dev`** devem aparecer logs (por exemplo `[Apifacil Webhook]` ou `[Z-API Webhook]`).
6. No **WhatsApp** você deve receber a resposta da assistente (boas-vindas, confirmação de gasto, etc.).

### 4.4 Se não responder

- **Confira a URL do webhook:** deve ser exatamente `https://.../api/whatsapp/apifacil/webhook` ou `.../zapi/webhook` (sem barra no final da parte do túnel).
- **Confira o `.env.local`:** variáveis de Supabase e do provedor (APIFACIL_* ou ZAPI_*) corretas.
- **Reinicie o `npm run dev`** depois de alterar o `.env.local`.
- **Veja o terminal do `npm run dev`:** se aparecer erro (ex.: 500, variável não definida), corrija o que for indicado.
- **ngrok:** na conta grátis, a URL muda ao reiniciar; atualize a URL do webhook no painel do provedor se você reiniciou o ngrok.

---

## Parte 5: Depois dos testes (ir para produção)

Quando estiver tudo certo em localhost:

1. Faça o **deploy** do app (Railway, Vercel, etc.) e anote a URL de produção (ex.: `https://seu-app.railway.app` ou `https://seu-dominio.com`).
2. No painel da **API Fácil** ou **Z-API**, **troque** a URL do webhook para a de produção:
   - API Fácil: `https://SUA-URL-DE-PRODUCAO/api/whatsapp/apifacil/webhook`
   - Z-API: `https://SUA-URL-DE-PRODUCAO/api/whatsapp/zapi/webhook`
3. Salve. A partir daí, as mensagens serão atendidas pelo app em produção, não mais pelo localhost.
4. **Assistente em produção:** a assistente responde **por padrão** em produção. Para desligar temporariamente use o painel admin (WhatsApp PLEN → "Pausar assistente para todos") ou a variável de ambiente `DISABLE_WHATSAPP_ASSISTENTE_PRODUCAO=true`.

---

## Resumo rápido

| Etapa | O que fazer |
|-------|-------------|
| 1 | No terminal: `npm run dev` (deixar rodando). |
| 2 | Criar `.env.local` com Supabase + APIFACIL_* ou ZAPI_*. |
| 3 | Em outro terminal: `ngrok http 3000` ou `cloudflared tunnel --url http://localhost:3000` e anotar a URL HTTPS. |
| 4 | No painel do provedor: webhook = `https://SUA-URL-TUNEL/api/whatsapp/apifacil/webhook` ou `.../zapi/webhook`. |
| 5 | Enviar mensagem no WhatsApp para o número da instância e ver a resposta e os logs no terminal. |
| 6 | Para produção: fazer deploy e trocar a URL do webhook para a URL do app em produção. |

Com isso você consegue rodar e testar a assistente em localhost com todos os detalhes antes de subir no ar.
