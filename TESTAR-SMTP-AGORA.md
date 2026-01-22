# 🧪 TESTAR SMTP AGORA - PASSO A PASSO

## 🎯 OBJETIVO

Testar se o SMTP está funcionando diretamente, sem passar pelo Supabase.

---

## ✅ TESTE 1: Via Endpoint de Teste

### **Passo 1: Abrir Console do Navegador**

1. Abra o site: `http://localhost:3000` (ou sua URL)
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**

### **Passo 2: Executar Teste**

Cole este código no console e pressione Enter:

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email-pessoal@gmail.com' })
})
.then(r => r.json())
.then(result => {
  console.log('📊 Resultado:', result)
  if (result.success) {
    console.log('✅ Email enviado! Verifique sua caixa de entrada.')
  } else {
    console.error('❌ Erro:', result.error)
    console.error('💡 Sugestão:', result.suggestion)
  }
})
.catch(error => {
  console.error('❌ Erro na requisição:', error)
})
```

**⚠️ IMPORTANTE:** Substitua `seu-email-pessoal@gmail.com` pelo seu email real.

### **Passo 3: Verificar Resultado**

**No Console do Navegador:**
- Se aparecer `✅ Email enviado!` → SMTP próprio está funcionando
- Se aparecer `❌ Erro:` → Veja qual é o erro específico

**No Terminal (onde está rodando `npm run dev`):**
- Veja os logs detalhados do SMTP
- Procure por erros de conexão, autenticação, etc.

---

## ✅ TESTE 2: Verificar Logs do Supabase

### **Passo 1: Acessar Logs**

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto
3. Vá em: **Authentication** → **Logs**

### **Passo 2: Procurar Erros**

**Procure por:**
- Eventos de "Signup" ou "Email sent"
- Erros relacionados a SMTP
- Mensagens de erro específicas

**O que procurar:**
- ❌ "SMTP connection failed"
- ❌ "Invalid credentials"
- ❌ "Authentication failed"
- ❌ "535 Authentication failed"
- ❌ "Connection timeout"
- ✅ "Email sent successfully" (se aparecer, o problema é spam)

### **Passo 3: Anotar Erro Específico**

**Anote exatamente:**
- Qual é a mensagem de erro
- Qual é o código de erro (se houver)
- Em que momento ocorre (ao criar conta, ao reenviar, etc.)

---

## ✅ TESTE 3: Verificar Credenciais Manualmente

### **Passo 1: Testar Login no Webmail**

1. Acesse o webmail da Hostinger
2. Tente fazer login com:
   - **Email:** O mesmo usado no SMTP User
   - **Senha:** A mesma usada no SMTP Password

**Se NÃO conseguir fazer login:**
- ❌ As credenciais estão erradas
- ❌ Atualize no Supabase com as credenciais corretas

**Se conseguir fazer login:**
- ✅ As credenciais estão corretas
- ✅ O problema pode ser outra coisa

---

## ✅ TESTE 4: Verificar Template de Email

### **Passo 1: Acessar Template**

1. Acesse: **Authentication** → **Email Templates** → **"Confirm signup"**
2. Clique na aba: **"Source"** (não "Preview")

### **Passo 2: Verificar Conteúdo**

**Procure por:**
- ✅ `{{ .ConfirmationURL }}` → **DEVE TER** (com espaços)
- ❌ `{{.ConfirmationURL}}` → **ERRADO** (sem espaços)
- ❌ `{{ .SiteURL }}` → **ERRADO** (não use sozinho)
- ❌ `0.0.0.0` ou `10000` → **ERRADO** (remova se encontrar)

### **Passo 3: Corrigir se Necessário**

**Se o template estiver errado:**

1. Abra o arquivo `TEMPLATE-EMAIL-CONFIRMACAO-CORRETO.html` no projeto
2. Copie **TODO** o conteúdo
3. Cole no campo "Source" do template no Supabase
4. **SALVE**

---

## ✅ TESTE 5: Verificar Porta e Protocolo

### **Problema Comum:**

A porta pode estar errada ou o protocolo não corresponde:

- **Porta 587** = TLS/STARTTLS → "Secure" deve estar **DESMARCADO**
- **Porta 465** = SSL direto → "Secure" deve estar **MARCADO**

### **Teste:**

1. **Se está usando porta 587:**
   - Verifique se "Secure" está **DESMARCADO**
   - Se estiver marcado, desmarque e salve

2. **Se está usando porta 465:**
   - Verifique se "Secure" está **MARCADO**
   - Se não estiver marcado, marque e salve

3. **Teste alternativo:**
   - Tente mudar de 587 para 465 (ou vice-versa)
   - Ajuste "Secure" conforme a nova porta
   - Salve e teste novamente

---

## 📋 CHECKLIST COMPLETO

Execute estes testes na ordem:

- [ ] Testei SMTP próprio via `/api/teste-smtp`
- [ ] Verifiquei logs do Supabase para erros específicos
- [ ] Testei fazer login no webmail com as mesmas credenciais
- [ ] Verifiquei o template de email tem `{{ .ConfirmationURL }}`
- [ ] Verifiquei se porta e "Secure" estão corretos
- [ ] Tentei porta diferente (587 ↔ 465)
- [ ] Verifiquei pasta de spam
- [ ] Aguardei alguns minutos e tentei novamente

---

## 🆘 PRÓXIMOS PASSOS

**Após executar os testes, me envie:**

1. **Resultado do teste `/api/teste-smtp`:**
   - Funcionou? Qual erro apareceu?

2. **Erro específico dos logs do Supabase:**
   - Qual é a mensagem exata?
   - Qual é o código de erro?

3. **Credenciais:**
   - Consegue fazer login no webmail?

4. **Porta e Secure:**
   - Qual porta está usando?
   - "Secure" está marcado ou não?

5. **Template:**
   - Tem `{{ .ConfirmationURL }}`?

Com essas informações, posso ajudar mais especificamente!
