# Diagnóstico: erro "Desculpe, ocorreu um erro ao processar sua mensagem"

## De onde essa mensagem pode vir

No código, a frase exata **"Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."** aparece **apenas** em:

1. **`lib/whatsapp-plen-handler.ts`** (e cópias em `deploy-hostinger/lib/` e `HOSTINGER-UPLOAD/lib/`)
   - Usado só no **fluxo WhatsApp** (webhook `/api/whatsapp/apifacil/webhook`).
   - O **chat in-app (PLEN na web)** **não** usa esse handler; ele chama **`/api/plen/chat`**.

2. **Código antigo do `PlenAssistant`** (já corrigido)
   - Antes, o `catch` do `handleSend` em `PlenAssistant.tsx` mostrava essa mensagem fixa para qualquer erro.
   - As versões atuais (raiz, deploy-hostinger, HOSTINGER-UPLOAD) mostram o erro real: `Erro: ${errMsg}. Verifique sua conexão e se está logado.`

Conclusão: se você ainda vê a mensagem genérica no **chat in-app**, é provável que esteja rodando **código em cache** (build antigo ou cache do navegador).

---

## Como confirmar qual código está rodando

1. **Abra as Ferramentas do Desenvolvedor** (F12) → aba **Rede (Network)**.
2. Envie uma mensagem no PLEN (ex.: "gastei 50 reais").
3. Localize a requisição **`plen/chat`** (método POST).
4. Clique nela e veja:
   - **Cabeçalhos da resposta (Response Headers):**
     - Se existir **`X-Plen-Chat: ok`** → a requisição chegou na rota **`/api/plen/chat`** (esta API).
   - **Resposta (Response / Preview):**
     - Se for JSON com `response: "..."` → o texto que aparecer no chat é o que a API devolveu.
     - Se a resposta for HTML (página 404/500) → a rota `/api/plen/chat` não existe nesse deploy ou deu erro antes de devolver JSON.

5. **No console (Console):**
   - Se aparecer algo como `[PLEN] Erro ao enviar mensagem:` → o frontend atual (com tratamento de erro) está rodando.
   - A mensagem exibida no chat deve ser a que vem em `data.response` ou `data.error`, ou o texto do `Error` que o frontend monta.

---

## O que fazer

1. **Limpar cache e testar de novo**
   - Hard refresh: **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac).
   - Ou abrir o site em **aba anônima**.

2. **Garantir que o deploy usa o código certo**
   - Se você faz deploy a partir de **HOSTINGER-UPLOAD** ou **deploy-hostinger**, faça o build de novo após as alterações no `PlenAssistant` e na rota `app/api/plen/chat/route.ts`.
   - A rota **`/api/plen/chat`** existe apenas em **`app/api/plen/chat/route.ts`** (na raiz do projeto). Pastas como HOSTINGER-UPLOAD podem não ter essa rota; nesse caso, o chat in-app dará 404 se o servidor estiver servindo só essa pasta.

3. **Rodar pela raiz do projeto**
   - Para o chat in-app funcionar, o Next deve rodar a partir da **raiz** (onde está `app/api/plen/chat/route.ts`), não só de uma subpasta de deploy.

4. **Interpretar a mensagem que aparecer**
   - A API agora devolve o erro real no campo `response` (ex.: `[PLEN] Erro no servidor: ...`).
   - Use esse texto para saber se o problema é login, Supabase, falta de pessoa em Usuários, etc.

---

## Resumo

| Onde aparece a mensagem genérica | Significado |
|----------------------------------|------------|
| **Chat in-app (navegador)**      | Frontend antigo em cache ou build antigo; ou resposta de outra rota (improvável). |
| **WhatsApp**                     | Resposta do `whatsapp-plen-handler` em caso de erro (esperado nesse fluxo). |

Para o **chat in-app**, a origem do erro é sempre a resposta da API **`/api/plen/chat`** ou o `catch` do **`PlenAssistant`**. Verifique a requisição em Rede e o texto em `response`/`error` para ver exatamente o que está vindo do servidor.
