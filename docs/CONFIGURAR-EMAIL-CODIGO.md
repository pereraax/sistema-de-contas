# Configurar envio de código por email (cadastro WhatsApp)

O cadastro pela Plen envia um **código de 6 dígitos** por email. Quem envia é o **Supabase**; você só precisa configurar o SMTP e o template no painel.

---

## 1. SMTP no Supabase (para o email sair)

O Supabase usa o SMTP que você configurar no projeto. Sem isso, o email não é enviado.

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) e selecione seu projeto.
2. Vá em **Authentication** → **SMTP Settings** (ou **Project Settings** → **Auth** → **SMTP**).
3. Ative **Enable Custom SMTP** e preencha com os dados do seu servidor de email:

   | Campo          | Exemplo (Hostinger)   | Seu valor |
   |----------------|------------------------|-----------|
   | Sender email   | comercial@plenipay.com |           |
   | Sender name    | Plenipay               |           |
   | Host           | smtp.hostinger.com     |           |
   | Port           | 587                    |           |
   | Username       | comercial@plenipay.com |           |
   | Password       | (senha do email)       |           |

4. Salve. Os próximos emails de confirmação sairão por esse SMTP.

---

## 2. Template do email com o código (6 dígitos)

Por padrão o Supabase manda um **link** no email. Para o cadastro via WhatsApp precisamos mostrar o **código** (`{{ .Token }}`).

1. No Dashboard: **Authentication** → **Email Templates**.
2. Abra o template **Confirm signup** (é o usado no `signUp` do cadastro Plen).
3. No campo **Message body** (corpo do email):
   - Troque o conteúdo por um que use **`{{ .Token }}`** (código de 6 dígitos).
   - O **Subject** pode ser algo como: `Seu código Plenipay - {{ .Token }}`.

### Exemplo simples (copiar e colar)

**Subject:**
```
Seu código de confirmação Plenipay: {{ .Token }}
```

**Message body (HTML):**
```html
<h2>Confirme seu cadastro Plenipay</h2>
<p>Use o código abaixo para confirmar seu e-mail no cadastro feito pelo WhatsApp:</p>
<p style="font-size: 24px; letter-spacing: 4px;"><strong>{{ .Token }}</strong></p>
<p>Digite esse código na conversa do WhatsApp que a Plen vai confirmar sua conta.</p>
<p style="color: #666; font-size: 14px;">Este código é válido por 1 hora. Se você não solicitou este cadastro, ignore este email.</p>
```

### Template completo (opcional)

Se quiser o layout completo (header, rodapé, aviso), use o arquivo do projeto:

- **Arquivo:** `docs/email-template-codigo-supabase.html`  
- Copie todo o conteúdo e cole no **Message body** do template **Confirm signup**.  
- O código de 6 dígitos está na variável **`{{ .Token }}`** no meio do HTML.

---

## 3. Conferir no projeto

No app, o envio já está implementado em:

- **Envio:** `lib/plen/auth/email-verification.ts` → `createUserAndSendCode()` chama `supabase.auth.signUp()`, e o Supabase dispara o email.
- **Verificação:** o lead digita o código no WhatsApp e a Plen chama `verifyCodeForPlen()`.

Não é necessário configurar SMTP/Resend no `.env` do app para esse fluxo; o Supabase usa apenas o SMTP configurado no painel (passo 1).

---

## Resumo

| Onde           | O que fazer |
|----------------|-------------|
| **Supabase → Auth → SMTP** | Ativar e preencher Host, Port, User, Password (ex.: Hostinger). |
| **Supabase → Auth → Email Templates → Confirm signup** | Colar template que usa `{{ .Token }}` no corpo do email. |

Depois disso, ao informar o email no WhatsApp, o lead recebe o código por email e pode colar na conversa para a Plen confirmar o cadastro.
