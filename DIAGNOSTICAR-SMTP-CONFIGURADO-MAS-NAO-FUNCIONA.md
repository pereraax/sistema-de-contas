# 🔍 DIAGNOSTICAR: SMTP Configurado mas Não Funciona

## ⚠️ PROBLEMA

SMTP está configurado e ativado no Supabase, mas emails ainda não são enviados.

---

## ✅ VERIFICAÇÕES DETALHADAS

### **1️⃣ VERIFICAR CREDENCIAIS SMTP**

Mesmo que pareça configurado, as credenciais podem estar incorretas:

#### **Teste Manual das Credenciais:**

1. **Verifique se a senha está correta:**
   - A senha do SMTP é a **senha do email**, não a senha da conta Hostinger
   - Se você mudou a senha do email recentemente, atualize no Supabase

2. **Verifique se o email está ativo:**
   - O email usado no SMTP User deve estar ativo e funcionando
   - Teste fazer login no webmail da Hostinger com essas credenciais

3. **Verifique se o email não está bloqueado:**
   - Alguns provedores bloqueiam SMTP por segurança
   - Verifique na Hostinger se SMTP está habilitado para sua conta

---

### **2️⃣ VERIFICAR PORTA E PROTOCOLO**

A porta pode estar errada ou o protocolo não corresponde:

#### **Para Hostinger:**

- **Porta 587** = TLS/STARTTLS (recomendado)
  - ✅ Use esta se estiver usando porta 587
  - ✅ Deve funcionar com "Secure" desmarcado no Supabase

- **Porta 465** = SSL direto
  - ✅ Use esta se estiver usando porta 465
  - ✅ Deve funcionar com "Secure" marcado no Supabase

**⚠️ IMPORTANTE:**
- Se você configurou porta 587 mas marcou "Secure", pode não funcionar
- Se você configurou porta 465 mas não marcou "Secure", pode não funcionar

**Teste:**
1. Tente com porta 587 (TLS)
2. Se não funcionar, tente com porta 465 (SSL)
3. Ajuste a opção "Secure" conforme a porta

---

### **3️⃣ VERIFICAR TEMPLATE DE EMAIL**

O template pode estar mal configurado:

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba: **"Source"** (não "Preview")
3. **VERIFIQUE se contém:**

```html
{{ .ConfirmationURL }}
```

**⚠️ CRÍTICO:**
- Deve ter `{{ .ConfirmationURL }}` (com espaços)
- Se não tiver, o link não será gerado
- Se estiver errado (ex: `{{.ConfirmationURL}}` sem espaços), pode não funcionar

**Template mínimo que funciona:**
```html
<h1>Confirme seu email</h1>
<p>Clique no link abaixo para confirmar:</p>
<a href="{{ .ConfirmationURL }}">Confirmar Email</a>
```

---

### **4️⃣ VERIFICAR LOGS DO SUPABASE**

Os logs mostram o erro real:

1. Acesse: **Authentication** → **Logs**
2. **Procure por:**
   - Eventos de "Signup" ou "Email sent"
   - Erros relacionados a SMTP
   - Mensagens de erro específicas

**O que procurar nos logs:**

- ❌ "SMTP connection failed"
- ❌ "Invalid credentials"
- ❌ "Authentication failed"
- ❌ "Connection timeout"
- ❌ "535 Authentication failed"

**Se encontrar algum desses erros:**
- Anote o erro exato
- Isso indica qual é o problema real

---

### **5️⃣ TESTAR CONEXÃO SMTP DIRETAMENTE**

Teste se o SMTP funciona fora do Supabase:

#### **Opção A: Usar o endpoint de teste (se existir)**

O sistema tem um endpoint `/api/teste-smtp` que você pode usar:

1. Abra o console do navegador (F12)
2. Execute:

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
})
.then(r => r.json())
.then(console.log)
```

3. Veja o resultado no console e no terminal

#### **Opção B: Testar via código Node.js**

Crie um arquivo de teste temporário:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: 'seu-email@plenipay.com',
    pass: 'sua-senha'
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Erro:', error);
  } else {
    console.log('✅ SMTP está funcionando!');
  }
});
```

---

### **6️⃣ VERIFICAR CONFIGURAÇÕES ESPECÍFICAS DA HOSTINGER**

A Hostinger pode ter requisitos específicos:

#### **Verificar na Hostinger:**

1. **Acesse o painel da Hostinger**
2. **Vá em: Email Accounts** ou **Email**
3. **Verifique:**
   - O email existe e está ativo?
   - SMTP está habilitado para este email?
   - Há alguma restrição de segurança?

#### **Configurações comuns da Hostinger:**

- **SMTP Host:** `smtp.hostinger.com` ou `smtp.titan.email`
- **SMTP Port:** `587` (TLS) ou `465` (SSL)
- **Autenticação:** Obrigatória (sempre usar usuário e senha)
- **TLS/SSL:** Depende da porta (587 = TLS, 465 = SSL)

**⚠️ IMPORTANTE:**
- Alguns planos da Hostinger podem ter SMTP desabilitado por padrão
- Entre em contato com suporte da Hostinger se necessário

---

### **7️⃣ VERIFICAR SE EMAIL ESTÁ SENDO ENVIADO MAS CAINDO EM SPAM**

O email pode estar sendo enviado mas não chegando:

1. **Verifique a pasta de spam/lixo eletrônico**
2. **Verifique filtros do email**
3. **Verifique se o domínio está com SPF/DKIM configurado**

**Para verificar se está sendo enviado:**
- Veja os logs do Supabase
- Se aparecer "Email sent successfully", o problema é spam/filtros

---

### **8️⃣ VERIFICAR RATE LIMITING**

O Supabase pode estar bloqueando por muitas tentativas:

1. **Aguarde alguns minutos** (5-10 minutos)
2. **Tente novamente**
3. **Verifique se há mensagem de rate limit nos logs**

---

## 🔧 SOLUÇÕES ESPECÍFICAS

### **Solução 1: Reconfigurar SMTP do Zero**

1. No Supabase: **SMTP Settings**
2. **Desmarque** "Enable Custom SMTP"
3. **Salve**
4. **Marque novamente** "Enable Custom SMTP"
5. **Preencha todos os campos novamente** (copie e cole para evitar erros de digitação)
6. **Salve**
7. **Teste novamente**

---

### **Solução 2: Usar Porta Diferente**

Se está usando porta 587, tente 465:

1. **Mude a porta** de 587 para 465
2. **Marque "Secure"** (se não estiver marcado)
3. **Salve**
4. **Teste**

Ou vice-versa:
1. **Mude a porta** de 465 para 587
2. **Desmarque "Secure"** (se estiver marcado)
3. **Salve**
4. **Teste**

---

### **Solução 3: Verificar Template**

1. **Authentication** → **Email Templates** → **"Confirm signup"**
2. **Clique em "Reset to default"** (se disponível)
3. **Ou copie este template mínimo:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <h1>Confirme seu email</h1>
  <p>Clique no link abaixo para confirmar sua conta:</p>
  <p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
  <p>Ou copie e cole este link no navegador:</p>
  <p>{{ .ConfirmationURL }}</p>
</body>
</html>
```

4. **Salve**
5. **Teste novamente**

---

### **Solução 4: Usar SMTP Próprio (Fallback)**

O sistema já tem fallback para SMTP próprio. Configure:

1. **Abra `.env.local`**
2. **Adicione:**

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=seu-email@plenipay.com
SMTP_PASSWORD=sua-senha
SMTP_FROM=seu-email@plenipay.com
```

3. **Reinicie o servidor** (`npm run dev`)
4. **Teste criar conta**

O sistema tentará usar o SMTP próprio se o Supabase falhar.

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute estes passos na ordem:

- [ ] Verifiquei se a senha do email está correta
- [ ] Testei fazer login no webmail com as mesmas credenciais
- [ ] Verifiquei se a porta está correta (587 ou 465)
- [ ] Verifiquei se "Secure" está correto conforme a porta
- [ ] Verifiquei o template de email tem `{{ .ConfirmationURL }}`
- [ ] Verifiquei os logs do Supabase para erros específicos
- [ ] Testei o endpoint `/api/teste-smtp` (se disponível)
- [ ] Verifiquei pasta de spam
- [ ] Aguardei alguns minutos e tentei novamente
- [ ] Reconfigurei o SMTP do zero
- [ ] Tentei porta diferente (587 ↔ 465)
- [ ] Configurei SMTP próprio no `.env.local`

---

## 🆘 PRÓXIMOS PASSOS

**Se nada funcionar:**

1. **Anote o erro exato dos logs do Supabase**
2. **Entre em contato com suporte da Hostinger:**
   - Pergunte se SMTP está habilitado para seu domínio
   - Confirme as configurações SMTP corretas
   - Veja se há alguma restrição

3. **Considere usar outro provedor de email:**
   - Gmail (com senha de app)
   - SendGrid
   - Mailgun
   - Outros serviços de email transacional

---

## 📝 INFORMAÇÕES PARA DIAGNÓSTICO

**Me envie estas informações:**

1. **Erro exato dos logs do Supabase** (Authentication → Logs)
2. **Porta que está usando** (587 ou 465)
3. **Se "Secure" está marcado ou não**
4. **Resultado do teste `/api/teste-smtp`** (se testou)
5. **Se consegue fazer login no webmail** com as mesmas credenciais

Com essas informações, posso ajudar mais especificamente!
