# Mensagens da Plen vêm do painel da Assistente

Todas as mensagens que a Plen envia (boas-vindas, confirmação de gasto, pedir nome, email, código, etc.) são lidas do **Painel da Assistente** (Administração → Assistente Plen → Mensagens do fluxo).

## Como funciona

1. **No painel**: você edita os textos em "Mensagens do fluxo" (e em "Mensagens dos leads e respostas"). Ao sair do campo ou clicar em "Salvar mensagens", o conteúdo é gravado no banco (`platform_config`, chave `plen_flow_messages`).

2. **Na Plen**: sempre que uma mensagem precisa ser enviada, o sistema chama `getPlenFlowMessages()`, que lê esse mesmo registro no banco. O texto que você configurou no painel é o que é usado nas respostas.

## Se as mensagens não mudarem

- **Salve no painel**: altere o texto e clique fora do campo (ou em "Salvar mensagens") e espere o toast "Salvo!".
- **Diagnóstico**: no painel da Assistente Plen, clique em **"Diagnóstico"** (ou acesse `/api/admin/plen-flow-debug` logado como admin). A resposta mostra se a service role está ativa, o que está no banco e o que a Plen está usando. Use isso para ver por que o texto do painel não aparece.
- **Chave Service Role (opcional mas recomendado)**: veja a seção abaixo.

---

## O que é a SUPABASE_SERVICE_ROLE_KEY?

O Supabase tem duas chaves para acessar o banco:

| Chave | Onde está no .env | Uso |
|-------|-------------------|-----|
| **anon** (pública) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Já usada pelo app e pelo painel. |
| **service_role** (secreta) | `SUPABASE_SERVICE_ROLE_KEY` | "Chave de admin": o servidor usa ela para ler/escrever sem restrições. |

Quando a Plen responde no WhatsApp, o código no servidor precisa **ler** as mensagens que você salvou no painel. Essa leitura pode ser feita com a chave anon ou com a service role. **Se você colocar a service role no .env, a leitura do fluxo fica mais garantida.**

### Como obter e configurar

1. Acesse **[supabase.com/dashboard](https://supabase.com/dashboard)** e abra o seu projeto.
2. No menu lateral: **Settings** (ou Configurações) → **API**.
3. Na página, em **Project API keys**, você verá duas chaves:
   - **anon** `public` — essa você já tem no `.env` como `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role** `secret` — **copie esta** (clique em "Reveal" se estiver oculta).
4. No seu projeto, abra o arquivo **`.env.local`** na raiz.
5. Adicione uma linha (trocando pelo valor que você copiou):
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxx...
   ```
6. **Nunca** commite essa chave no Git nem exponha em front-end. Ela deve ficar só no `.env.local` (e no painel de deploy, se você subir o app).
7. **Em produção (Vercel, Railway, etc.)**: defina a mesma variável `SUPABASE_SERVICE_ROLE_KEY` no painel do provedor. Sem ela, em produção a Plen usa só o fluxo padrão e ignora o que você salvou no painel.
8. Reinicie o servidor (`npm run dev`) depois de alterar o `.env.local`.

**Resumo:** A service role é a "senha de admin" do seu projeto no Supabase. Colocando no `.env.local` com o nome `SUPABASE_SERVICE_ROLE_KEY`, o backend consegue ler as mensagens do painel com mais confiabilidade. Se não colocar, o sistema tenta usar a chave anon; pode funcionar ou não, dependendo das permissões do banco.

## Variáveis nos textos

Nos campos do fluxo você pode usar:

- `{nome}` — nome do contato (ou "amigo" se não tiver/inválido)
- `{categoria}` — categoria do gasto (ex.: Outros)
- `{valor}` — valor numérico (ex.: 12.00)
- `{dashboardUrl}` — URL do app (ex.: https://app.plenipay.com)

Exemplo: `✨ Continue assim {nome}! ✨`
