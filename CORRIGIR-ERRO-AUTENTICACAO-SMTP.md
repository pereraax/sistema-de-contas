# 🔧 Corrigir: Erro de Autenticação SMTP (EAUTH)

## ⚠️ Erro Identificado

```
❌ [SMTP] Erro ao enviar email: Invalid login: 535 5.7.8 Error: authentication failed
❌ [SMTP] Código: EAUTH
```

**Causa:** Credenciais SMTP (usuário ou senha) estão incorretas.

---

## ✅ Solução

### **1. Verificar Credenciais no .env.local**

Abra o arquivo `.env.local` e verifique:

```env
SMTP_USER=comercial@plenipay.com
SMTP_PASSWORD=321@Vaca
```

### **2. Problemas Comuns**

#### **A. Senha com Caracteres Especiais**

Se a senha tem `@`, `#`, `$`, etc., pode precisar de aspas:

```env
# Se senha tem caracteres especiais, use aspas:
SMTP_PASSWORD="321@Vaca"
```

#### **B. Senha Truncada**

Verifique se a senha não foi cortada no `.env.local`:
- Abra o arquivo
- Veja se a senha está completa
- Se estiver cortada, reescreva completamente

#### **C. Senha Errada**

A senha do SMTP é a **senha do email**, não a senha da conta Hostinger.

**Como verificar:**
1. Acesse o webmail da Hostinger
2. Tente fazer login com:
   - Email: `comercial@plenipay.com`
   - Senha: a mesma do `SMTP_PASSWORD`
3. Se **NÃO conseguir fazer login**, a senha está errada

#### **D. Email Errado**

Verifique se o email `comercial@plenipay.com` existe e está ativo.

---

### **3. Testar Credenciais**

#### **Opção 1: Via Webmail**

1. Acesse: https://webmail.hostinger.com (ou o webmail da Hostinger)
2. Tente fazer login com as mesmas credenciais do `.env.local`
3. Se funcionar → credenciais estão corretas
4. Se não funcionar → credenciais estão erradas

#### **Opção 2: Via Código**

Após corrigir o `.env.local`, teste:

```javascript
// No console do navegador (F12)
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

---

### **4. Correções Específicas**

#### **Se a senha tem `@`:**

```env
SMTP_PASSWORD="321@Vaca"
```

#### **Se a senha tem espaços:**

```env
SMTP_PASSWORD="senha com espaços"
```

#### **Se a senha tem aspas:**

```env
SMTP_PASSWORD='senha"com"aspas'
```

#### **Se não souber a senha:**

1. Acesse o painel da Hostinger
2. Vá em **Email Accounts** ou **Email**
3. Selecione o email `comercial@plenipay.com`
4. Clique em **"Change Password"** ou **"Redefinir Senha"**
5. Defina uma nova senha
6. Atualize no `.env.local`:
   ```env
   SMTP_PASSWORD=nova_senha_sem_especiais
   ```

---

### **5. Verificar Porta**

No Supabase você usa porta **465**, mas no `.env.local` está **587**.

**Teste com porta 465:**

```env
SMTP_PORT=465
```

**E verifique se precisa de `secure: true`** (já está configurado automaticamente).

---

### **6. Após Corrigir**

1. **Salve o `.env.local`**
2. **Reinicie o servidor** (`npm run dev`)
3. **Teste novamente** o reenvio de link
4. **Veja o terminal** - deve aparecer `✅ Email enviado via SMTP próprio`

---

## 📋 Checklist

- [ ] Abri `.env.local` e verifiquei `SMTP_USER` e `SMTP_PASSWORD`
- [ ] Testei fazer login no webmail com as mesmas credenciais
- [ ] Se senha tem caracteres especiais, coloquei entre aspas
- [ ] Verifiquei se senha não está truncada
- [ ] Se necessário, redefini a senha do email na Hostinger
- [ ] Atualizei `SMTP_PASSWORD` no `.env.local`
- [ ] Reiniciei o servidor
- [ ] Testei novamente

---

## 🆘 Se Nada Funcionar

1. **Redefina a senha do email:**
   - Hostinger → Email Accounts → `comercial@plenipay.com` → Change Password
   - Use uma senha **simples** (sem caracteres especiais) para testar
   - Exemplo: `MinhaSenha123`

2. **Atualize `.env.local`:**
   ```env
   SMTP_PASSWORD=MinhaSenha123
   ```

3. **Reinicie e teste**

4. **Se ainda falhar:**
   - Verifique se o email está ativo
   - Verifique se SMTP está habilitado para este email na Hostinger
   - Entre em contato com suporte da Hostinger

---

**O erro é claro: credenciais SMTP incorretas. Corrija o usuário ou senha no `.env.local`!** 🔑
