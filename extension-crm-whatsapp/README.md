# PleniPay CRM — Extensão Chrome para WhatsApp Web

Extensão que adiciona uma **barra lateral** no site do WhatsApp Web com um botão para **enviar as 3 mensagens de boas-vindas** na conversa aberta. Assim você entra na conversa e, para contatos que o assistente não respondeu, envia manualmente pelo botão.

## Como instalar (modo desenvolvedor)

1. Abra o Chrome e vá em `chrome://extensions/`.
2. Ative **"Modo do desenvolvedor"** (canto superior direito).
3. Clique em **"Carregar sem compactação"**.
4. Selecione a pasta **`extension-crm-whatsapp`** (esta pasta do projeto).

## Configuração no servidor (obrigatório)

1. No painel do seu provedor (Railway, Render, Vercel etc.), crie uma variável de ambiente:
   - Nome: `EXTENSION_CRM_API_KEY`
   - Valor: um texto longo e aleatório (ex.: gere em https://randomkeygen.com/ e use “Code 128-bit”).

2. Faça o **redeploy** para a variável valer.

## Configuração da extensão

1. No Chrome, clique com o botão direito no ícone da extensão → **Opções** (ou abra `chrome://extensions/`, encontre “PleniPay CRM WhatsApp” e clique em **Detalhes** → **Opções**).
2. **URL do site:** deixe `https://plenipay.com` (ou o seu domínio).
3. **Token:** cole **exatamente** o mesmo valor que você colocou em `EXTENSION_CRM_API_KEY`.
4. Clique em **Salvar**.

## Uso

1. Abra **https://web.whatsapp.com** e faça login.
2. Uma **barra lateral** aparece à direita (PleniPay CRM).
3. Abra a **conversa** do contato que ainda não recebeu as 3 mensagens.
4. A extensão tenta detectar o número da conversa atual. Se não aparecer, **cole o número** no campo (com DDD, ex.: 5511999999999).
5. Clique em **“Enviar 3 mensagens”**.
6. As 3 mensagens de boas-vindas são enviadas pelo seu backend (API Fácil) para esse número.

Para **esconder/mostrar** a barra, use o botão **◀** / **▶** na borda direita da tela.

## Segurança

- O token (`EXTENSION_CRM_API_KEY`) é o único segredo; quem tiver esse valor pode enviar as 3 mensagens pela sua API.
- Use um token longo e aleatório e não compartilhe.
- A API só aceita esse token e não usa sessão/cookie do admin.
