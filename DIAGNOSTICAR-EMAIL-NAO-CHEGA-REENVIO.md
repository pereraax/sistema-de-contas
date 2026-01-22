# 🔍 DIAGNOSTICAR: Email Não Chega ao Reenviar

## ⚠️ Problema

Mesmo clicando em "Reenviar link", o email não está chegando na caixa de entrada.

---

## 🔍 Verificações Obrigatórias

### **1. Verificar Logs no Terminal**

Quando você clica em "Reenviar link", **veja o terminal** e procure por:

#### **Se SMTP Próprio Funcionou:**
```
✅ Email enviado via SMTP próprio
✅ [SMTP] Email enviado com sucesso!
  - Message ID: ...
```

#### **Se SMTP Próprio Falhou:**
```
❌ SMTP próprio falhou: [erro]
❌ [SMTP] Erro ao enviar email: [mensagem]
❌ [SMTP] Código: EAUTH (ou outro código)
```

**Se aparecer `EAUTH`:** A senha SMTP está incorreta. Veja `CORRIGIR-ERRO-AUTENTICACAO-SMTP.md`

#### **Se Tentou Resend do Supabase:**
```
📤 Tentativa 2: Resend do Supabase...
✅ Email enviado via resend
```

**⚠️ ATENÇÃO:** O Supabase pode retornar "sucesso" mesmo sem enviar o email se SMTP não estiver configurado no Supabase Dashboard!

---

### **2. Verificar SMTP Próprio**

#### **A. Testar SMTP Diretamente**

No console do navegador (F12):

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

**Se funcionar:**
```json
{
  "success": true,
  "message": "Email de teste enviado! Verifique sua caixa de entrada."
}
```

**Se falhar:**
```json
{
  "error": "Erro ao enviar email de teste: [mensagem]",
  "code": "EAUTH"
}
```

#### **B. Verificar Credenciais**

No `.env.local`:
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=comercial@plenipay.com
SMTP_PASSWORD="321@Vacas"
```

**Teste fazer login no webmail:**
1. Acesse: https://webmail.hostinger.com
2. Tente fazer login com:
   - Email: `comercial@plenipay.com`
   - Senha: `321@Vacas`
3. Se **NÃO conseguir** → senha está errada

---

### **3. Verificar Supabase Dashboard**

#### **A. SMTP Configurado no Supabase?**

1. Acesse: https://app.supabase.com
2. Vá em: **⚙️ Project Settings** → **Authentication** → **SMTP Settings**
3. Verifique:
   - ✅ **"Enable Custom SMTP"** está **MARCADO**?
   - ✅ Todos os campos estão preenchidos?
   - ✅ Host, Port, User, Password estão corretos?

**Se NÃO estiver configurado:**
- O `resend()` do Supabase retorna sucesso mas **NÃO envia email**
- Configure SMTP no Supabase Dashboard

#### **B. Site URL Configurado?**

1. Vá em: **⚙️ Project Settings** → **Authentication** → **URL Configuration**
2. Verifique:
   - ✅ **Site URL** = `https://plenipay.com`
   - ✅ **Redirect URLs** inclui `https://plenipay.com/**`

---

## 🔧 Soluções

### **Solução 1: Corrigir SMTP Próprio**

Se o erro é `EAUTH` (autenticação):

1. **Verifique a senha no `.env.local`**
2. **Teste fazer login no webmail**
3. **Se não conseguir:** Redefina a senha do email na Hostinger
4. **Atualize `.env.local` e Supabase Dashboard**
5. **Reinicie o servidor**

### **Solução 2: Configurar SMTP no Supabase**

Se o SMTP próprio falhar e o resend do Supabase também não funcionar:

1. **Configure SMTP no Supabase Dashboard:**
   - Host: `smtp.hostinger.com`
   - Port: `587`
   - User: `comercial@plenipay.com`
   - Password: `321@Vacas`
   - Sender email: `comercial@plenipay.com`
   - Sender name: `PLENIPAY`

2. **Salve e teste novamente**

### **Solução 3: Verificar Filtros de Spam**

Mesmo que o email seja enviado, pode ir para spam:

1. **Verifique a pasta de spam**
2. **Adicione `comercial@plenipay.com` aos contatos**
3. **Verifique filtros do email**

---

## 📊 Checklist de Diagnóstico

- [ ] Verifiquei logs no terminal ao clicar em "Reenviar link"
- [ ] Testei SMTP próprio via `/api/teste-smtp`
- [ ] Testei fazer login no webmail com as credenciais
- [ ] Verifiquei se SMTP está configurado no Supabase Dashboard
- [ ] Verifiquei Site URL no Supabase Dashboard
- [ ] Verifiquei pasta de spam
- [ ] Reiniciei o servidor após mudanças

---

## 🎯 Próximos Passos

1. **Veja o terminal** quando clicar em "Reenviar link"
2. **Copie os logs** que aparecem
3. **Identifique o erro:**
   - `EAUTH` → Senha SMTP incorreta
   - `ECONNECTION` → Host/porta incorretos
   - `✅ Email enviado via resend` → Supabase pode não estar enviando (verifique SMTP no Dashboard)

**Com os logs, podemos identificar exatamente o problema!** 🔍
