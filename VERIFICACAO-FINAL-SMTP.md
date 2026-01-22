# ✅ Verificação Final - Configuração SMTP

## 📋 Configuração Atual

### **.env.local:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=comercial@plenipay.com
SMTP_PASSWORD="321@Vaca"
SMTP_FROM=Plenipay <comercial@plenipay.com>
```

### **Supabase Dashboard:**
- Porta: **587** ✅
- Host: `smtp.hostinger.com` ✅
- User: `comercial@plenipay.com` ✅
- Password: (mesma do .env.local) ✅

---

## ✅ O que foi corrigido

1. **Senha com aspas:** `SMTP_PASSWORD="321@Vaca"` → `parseEnv` remove aspas automaticamente
2. **Porta 587:** Configurada no Supabase e no `.env.local`
3. **STARTTLS:** Porta 587 usa `secure: false` e `requireTLS: true` (já configurado)

---

## 🧪 Teste Agora

### **1. Reinicie o servidor** (se ainda não reiniciou)

O servidor precisa ser reiniciado para ler as novas variáveis do `.env.local`.

### **2. Teste o SMTP**

No console do navegador (F12):

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

### **3. Veja o terminal**

Deve aparecer:

```
🔍 [SMTP] Verificando configuração SMTP:
  - SMTP_HOST: ✅ (smtp.hostinger.com)
  - SMTP_PORT: ✅ (587)
  - SMTP_USER: ✅ (comercial@plenipay.com)
  - SMTP_PASSWORD: ✅ (8 caracteres)
  - SMTP_FROM: ✅ (Plenipay <comercial@plenipay.com>)
✅ [SMTP] Configuração válida!
  - Porta: 587 (STARTTLS)
  - Usuário: comercial@plenipay.com
  - Senha: 8 caracteres (primeiro: 3, último: a)
```

**Se aparecer "8 caracteres"** → Senha está sendo parseada corretamente (sem aspas)

**Se aparecer erro EAUTH novamente** → A senha ainda está incorreta (mesmo com aspas)

---

## 🔍 Se ainda der erro EAUTH

### **Opção 1: Verificar senha no webmail**

1. Acesse webmail da Hostinger
2. Tente fazer login com:
   - Email: `comercial@plenipay.com`
   - Senha: `321@Vaca` (sem aspas)
3. Se **NÃO conseguir** → senha está errada

### **Opção 2: Redefinir senha**

1. Hostinger → Email Accounts → `comercial@plenipay.com`
2. Change Password
3. Use uma senha **simples** (sem `@` ou caracteres especiais)
4. Atualize no `.env.local`:
   ```env
   SMTP_PASSWORD="NovaSenha123"
   ```
5. Reinicie servidor

### **Opção 3: Verificar formato do SMTP_FROM**

O `SMTP_FROM` está como `Plenipay <comercial@plenipay.com>`. Alguns servidores SMTP podem ter problemas com esse formato.

**Tente apenas o email:**

```env
SMTP_FROM=comercial@plenipay.com
```

---

## 📊 O que esperar

### **Se funcionar:**
```
✅ [SMTP] Conexão SMTP verificada!
📤 [SMTP] Enviando email...
✅ [SMTP] Email enviado com sucesso!
✅ Email enviado via SMTP próprio
```

### **Se ainda falhar:**
```
❌ [SMTP] Erro ao enviar email: Invalid login: 535 5.7.8 Error: authentication failed
❌ [SMTP] Código: EAUTH
```

**Nesse caso:** A senha está incorreta. Redefina a senha do email na Hostinger.

---

## ✅ Checklist

- [x] Senha com aspas no `.env.local`
- [x] Porta 587 no `.env.local`
- [x] Porta 587 no Supabase
- [ ] Servidor reiniciado após mudanças
- [ ] Teste `/api/teste-smtp` executado
- [ ] Verificado logs no terminal

---

**Teste agora e veja o terminal! Se ainda der EAUTH, a senha está incorreta mesmo com aspas.** 🔑
