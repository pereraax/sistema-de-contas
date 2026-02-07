# Configurar SMTP no Supabase para comercial@plenipay.com

O "Esqueceu a senha?" usa o Supabase para enviar o email. O email é enviado pelos **servidores do Supabase** (não pelo Railway), então o SMTP da Hostinger funciona.

## Passo a passo

### 1. Acesse o painel do Supabase

1. Vá em [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto (frhxqgcqmxpjpnghsvoe)

### 2. Configure o SMTP

1. **Project Settings** (ícone de engrenagem no menu lateral)
2. Aba **Authentication**
3. Role até a seção **SMTP Settings**
4. Ative **Enable Custom SMTP**
5. Preencha com os dados da Hostinger:

| Campo | Valor |
|-------|--------|
| **Sender email** | comercial@plenipay.com |
| **Sender name** | PLENIPAY |
| **Host** | smtp.hostinger.com |
| **Port** | 587 |
| **Username** | comercial@plenipay.com |
| **Password** | (senha do email comercial@plenipay.com) |

6. Clique em **Save**

### 3. Adicione a URL de redirecionamento

1. Ainda em **Authentication** → **URL Configuration**
2. Em **Redirect URLs**, adicione:
   - `https://plenipay.com/auth/redefinir-senha`
   - `https://www.plenipay.com/auth/redefinir-senha`
3. Salve

### 4. Pronto

O email de redefinição de senha será enviado de **comercial@plenipay.com** e o link levará para plenipay.com/auth/redefinir-senha.
