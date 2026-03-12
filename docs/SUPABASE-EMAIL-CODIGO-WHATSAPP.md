 # Código por email no cadastro WhatsApp (Supabase)

O envio e a verificação do código de 6 dígitos usam **apenas o Supabase Auth**. Nada de Resend nem SMTP no app.

## 1. SMTP no Supabase (quem envia o email)

O próprio **Supabase** envia o email. Configure o SMTP do seu projeto:

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) → seu projeto.
2. Vá em **Authentication** → **SMTP Settings** (ou **Project Settings** → **Auth** → **SMTP**).
3. Ative **Enable Custom SMTP** e preencha:
   - **Sender email**: o endereço que aparece como remetente (ex.: `noreply@seudominio.com`).
   - **Sender name**: ex. `Plenipay`.
   - **Host, Port, User, Password**: dados do seu servidor SMTP (Hostinger, Gmail, etc.).

Assim o Supabase usa esse SMTP para enviar todos os emails de Auth (incluindo o código do WhatsApp).

## 2. Template para mostrar o código (6 dígitos)

Por padrão o Supabase envia um **link** no email. Para enviar um **código de 6 dígitos** no cadastro pelo WhatsApp:

1. No Dashboard: **Authentication** → **Email Templates**.
2. Abra o template **Magic Link**.
3. No corpo do email, em vez de usar `{{ .ConfirmationURL }}`, use **`{{ .Token }}`** para exibir o código de 6 dígitos.

Exemplo de corpo:

```html
<h2>Seu código de confirmação Plenipay</h2>
<p>Use o código abaixo para confirmar seu e-mail no cadastro feito pelo WhatsApp:</p>
<p style="font-size: 24px; letter-spacing: 4px;"><strong>{{ .Token }}</strong></p>
<p>Digite esse código na conversa do WhatsApp que a Plen vai confirmar sua conta.</p>
```

Assim o usuário recebe o código pelo email (enviado pelo Supabase) e digita no WhatsApp.
