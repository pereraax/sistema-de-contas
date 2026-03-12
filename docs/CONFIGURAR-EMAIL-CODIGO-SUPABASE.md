# Configurar envio de código por email (Supabase)

O cadastro pela Plen usa **apenas Supabase Auth**: ao informar o email, o app chama `signUp()` e o **Supabase** envia o email com o código. Se o email não está chegando, é porque o Supabase precisa de duas configurações no **Dashboard**.

---

## Solução rápida (email não chega)

1. Acesse **https://supabase.com/dashboard** → seu projeto.
2. Menu **Authentication** → **SMTP**.
3. Ative **Enable Custom SMTP** e preencha com o mesmo servidor do seu `.env` (ex.: Hostinger: host `smtp.hostinger.com`, porta `587`, usuário e senha do email).
4. Salve. O Supabase passará a enviar para qualquer email (hoje ele só envia para emails da equipe do projeto).

Sem esse passo o código **nunca** chega no Gmail/Outlook do lead; a Plen só confirma no WhatsApp que “reenviou”, mas quem envia é o Supabase e ele precisa do SMTP configurado.

---

## Por que o email não chega?

**Sem SMTP customizado, o Supabase só envia emails para endereços que fazem parte da equipe do projeto.** Ou seja, leads com Gmail, Hotmail etc. não recebem até você configurar um SMTP no Supabase.

---

## 1. Configurar SMTP no Supabase (obrigatório)

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) e selecione seu projeto.
2. Vá em **Authentication** → **SMTP** (ou **Project Settings** → **Auth** → **SMTP**).
3. Ative **Enable Custom SMTP**.
4. Preencha com o seu servidor de email (ex.: Hostinger, o mesmo do seu `.env`):

   | Campo           | Exemplo (Hostinger)     |
   |-----------------|--------------------------|
   | Sender email    | comercial@plenipay.com   |
   | Sender name     | Plenipay                 |
   | Host            | smtp.hostinger.com       |
   | Port            | 587                      |
   | Username        | comercial@plenipay.com   |
   | Password        | (senha do email)         |

5. Salve. A partir daí o Supabase passa a enviar para **qualquer** email (não só da equipe).

---

## 2. Template do email com o código (6 dígitos)

1. No Dashboard: **Authentication** → **Email Templates**.
2. Abra o template **Confirm signup** (é o usado no cadastro).
3. No **Message body**, cole o HTML completo do template do projeto: **`docs/email-template-codigo-supabase.html`**.  
   Esse template já usa **`{{ .Token }}`** para o código de 6 dígitos e está pronto para Plenipay (layout, texto, aviso de segurança).
4. Salve o template.

---

## 3. Confirmar no projeto

- **Confirm email** deve estar **ativado**: **Authentication** → **Providers** → **Email** → "Confirm email" = ON. (Em projetos hosted costuma vir ativado.)

Depois de **SMTP** + **template com {{ .Token }}**, o Supabase envia o email e o lead recebe o código. O app não usa Resend nem outro serviço para esse fluxo; tudo é Supabase.

---

## Se o SMTP está ok e o email ainda não chega

1. **Auth logs no Supabase**  
   Dashboard → **Logs** → **Auth** (ou [Auth logs](https://supabase.com/dashboard/project/_/logs/auth-logs)).  
   Procure erros no momento do cadastro/reenvio (ex.: *"Error sending confirmation mail"*, *"authentication failed"*). Isso mostra se o problema é credencial SMTP ou entrega.

2. **Credenciais Hostinger**  
   - Usuário e senha devem ser do **email** `comercial@plenipay.com` (senha do webmail/caixa de entrada), não da conta Hostinger.  
   - Se tiver 2FA no email, use uma **senha de app** (se o Hostinger oferecer).  
   - Teste a **porta 465** em vez de 587 (alguns provedores exigem SSL em 465).

3. **Intervalo mínimo 60 segundos**  
   Em SMTP você tem "Minimum interval per user: 60". Reenvios para o **mesmo** email dentro de 60s podem ser bloqueados. Para testar, diminua temporariamente (ex.: 30) ou espere 1 minuto entre testes.

4. **Spam e provedor do destinatário**  
   Pedir para o lead checar **spam/lixo eletrônico**. Se o destinatário for Gmail/Outlook, às vezes eles bloqueiam ou atrasam; testar com outro endereço (ex.: outro Gmail) ajuda a isolar.

5. **Painel do Hostinger**  
   No painel do Hostinger, verifique se existe **log de envio** ou **emails bloqueados** para `comercial@plenipay.com`. Assim você vê se o Supabase está entregando ao SMTP e onde para.

---

## Resumo

| Onde | O que fazer |
|------|-------------|
| **Authentication → SMTP** | Ativar e preencher Host, Port, User, Password (ex.: Hostinger). **Sem isso o email não sai para leads.** |
| **Authentication → Email Templates → Confirm signup** | Corpo do email com `{{ .Token }}`. |
