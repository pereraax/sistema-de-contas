# Configurar token para o envio funcionar

Quando aparece **"Configure o token nas opções da extensão"**, o envio não funciona porque a extensão ainda não tem o token da API. Siga estes passos:

## 1. Definir o token no servidor

No painel do seu provedor (Railway, Render, Vercel etc.), crie a variável de ambiente:

- **Nome:** `EXTENSION_CRM_API_KEY`
- **Valor:** um texto longo e aleatório (ex.: `abc123xyz789_secreto_nao_compartilhe`)

Salve e faça o deploy (ou reinicie o app) para a variável valer.

**Railway:** anote a URL do app (ex: `https://seu-projeto.up.railway.app`) — você vai colar nas opções da extensão. Na primeira vez o app pode demorar alguns segundos para acordar.

## 2. Configurar na extensão

1. No WhatsApp Web, na barra da extensão PleniPay CRM, clique em **"Configurar API (token e URL)"**  
   **ou** clique no ícone da extensão (puzzle do Chrome → PleniPay CRM) e abra **Opções**.
2. Preencha:
   - **URL do site:** a URL do seu site em produção (ex.: `https://plenipay.com`), **sem barra no final**.
   - **Token:** o **mesmo** valor que você colocou em `EXTENSION_CRM_API_KEY` no servidor.
3. Clique em **Salvar**.

## 3. Testar

1. Na barra da extensão, clique em **"Testar conexão com a URL"**. Deve aparecer **"Conexão OK: site no ar."**  
   - Se falhar: a URL nas opções está errada, tem barra no final ou o app no Railway está parado. Use a URL exata que o Railway mostra (ex: `https://sistema-de-contas-production.up.railway.app`), sem barra no final, e recarregue a extensão em `chrome://extensions`.
2. Depois clique em **"Enviar 3 mensagens"**.  
   - Se der erro de rede, use de novo o "Testar conexão". Se der erro de autenticação, o token na extensão e no servidor precisam ser exatamente iguais.
