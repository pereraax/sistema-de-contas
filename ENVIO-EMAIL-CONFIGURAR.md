# Configuração do envio de emails

## Por que os emails não estão sendo enviados?

O envio de emails **depende das variáveis SMTP** no `.env.local`. Se elas estiverem vazias, o sistema não consegue enviar (confirmação de cadastro, recuperação de senha, etc.).

## O que foi feito

1. **Variáveis SMTP adicionadas ao `.env.local`** (como placeholders vazios):
   - `SMTP_HOST` – ex: `smtp.hostinger.com`
   - `SMTP_PORT` – ex: `587` (ou `465` para SSL)
   - `SMTP_USER` – seu email completo
   - `SMTP_PASSWORD` – senha do email
   - `SMTP_FROM` – opcional; se não preencher, usa `SMTP_USER`

2. **Logs sensíveis removidos** em `lib/mailer.ts` (não são mais exibidos usuário/senha em produção).

## Como ativar o envio de emails

1. Abra o arquivo **`.env.local`** na raiz do projeto.
2. Preencha as variáveis SMTP com os dados do seu provedor (Hostinger, Gmail, etc.):

   ```env
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   SMTP_USER=seu-email@seudominio.com
   SMTP_PASSWORD=sua_senha_do_email
   SMTP_FROM=seu-email@seudominio.com
   ```

3. Reinicie o servidor (`npm run dev`).

## Testar o envio

- **API de teste:** `POST /api/teste-smtp` com body JSON:  
  `{ "email": "destino@exemplo.com" }`  
  Se SMTP estiver correto, um email de teste será enviado.

- **Cadastro:** ao criar uma nova conta, o email de confirmação será enviado pelo SMTP configurado (quando as variáveis estiverem preenchidas).

## Servidor não inicia (caniuse-lite)

Se aparecer erro `Cannot find module 'caniuse-lite/dist/unpacker/agents'`:

1. Com internet estável, na raiz do projeto execute:  
   `npm install`
2. Depois:  
   `npm run dev`

Se ainda falhar, tente:  
`rm -rf node_modules package-lock.json` e em seguida `npm install`.
