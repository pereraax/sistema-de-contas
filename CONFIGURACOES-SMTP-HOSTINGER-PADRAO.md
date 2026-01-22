# 🔧 CONFIGURAÇÕES SMTP HOSTINGER - VALORES PADRÃO

## 📧 Se você não encontrar as configurações na Hostinger, use estes valores:

---

## ✅ CONFIGURAÇÕES SMTP HOSTINGER (PADRÃO)

### **Para TODOS os emails na Hostinger:**

```
Host SMTP: smtp.hostinger.com
Porta SMTP: 587 (TLS - Recomendado)
          OU 465 (SSL)
Usuário: SEU_EMAIL@plenipay.com
Senha: A senha que você definiu ao criar o email
Encriptação: STARTTLS (porta 587) ou SSL (porta 465)
```

---

## 📝 EXEMPLO PRÁTICO

Se você criou o email `noreply@plenipay.com` com senha `MinhaSenha123!`:

```
SMTP Host: smtp.hostinger.com
SMTP Port: 587
SMTP User: noreply@plenipay.com
SMTP Password: MinhaSenha123!
Encriptação: TLS
```

---

## 🔍 ONDE VER NO PAINEL DA HOSTINGER

### **Caminho Visual:**

1. **Login:** https://www.hostinger.com.br
2. **Menu Lateral:** Email → Email Accounts
3. **Lista de Emails:** Clique no seu email
4. **Configurações:** Procure por "SMTP" ou "Configurações"

**Se não encontrar:**
- Use as configurações padrão acima
- Funcionam para TODOS os emails da Hostinger

---

## ⚠️ IMPORTANTE

- ✅ **Host:** Sempre `smtp.hostinger.com`
- ✅ **Porta:** Use `587` (TLS) - é a mais comum e recomendada
- ✅ **Usuário:** O email completo (ex: `noreply@plenipay.com`)
- ✅ **Senha:** A mesma senha do email (não a senha do painel da Hostinger!)

---

## 🎯 USE ESTAS INFORMAÇÕES NO SUPABASE

1. Vá em: **Authentication → Settings → SMTP Settings**
2. Marque: **"Enable Custom SMTP"**
3. Preencha:
   - Host: `smtp.hostinger.com`
   - Port: `587`
   - User: `seu-email@plenipay.com`
   - Password: `senha-do-email`
   - Sender email: `seu-email@plenipay.com`
   - Sender name: `PLENIPAY`
4. Salve

---

**Essas são as configurações padrão da Hostinger - funcionam para todos os emails!**
