# ❌ SENHA SMTP ESTÁ ERRADA - RESOLVER AGORA

## 🔴 Problema Confirmado

Os logs mostram:
```
✅ [SMTP] Configuração válida!
  - Senha: 8 caracteres (primeiro: 3, último: a)
❌ [SMTP] Código: EAUTH
❌ [SMTP] Response: 535 5.7.8 Error: authentication failed
```

**A senha está sendo parseada corretamente (8 caracteres = `321@Vaca`), mas o servidor SMTP está rejeitando a autenticação.**

**Isso significa que a senha `321@Vaca` está INCORRETA.**

---

## ✅ SOLUÇÃO IMEDIATA

### **1. Verificar Senha no Webmail**

**Teste AGORA:**

1. Acesse: **https://webmail.hostinger.com** (ou o webmail da Hostinger)
2. Tente fazer login com:
   - **Email:** `comercial@plenipay.com`
   - **Senha:** `321@Vaca` (sem aspas)
3. **Se NÃO conseguir fazer login** → A senha está errada

---

### **2. Redefinir Senha do Email**

**Se a senha estiver errada, redefina:**

#### **Opção A: Via Painel Hostinger**

1. Acesse: **https://hpanel.hostinger.com** (ou painel da Hostinger)
2. Vá em: **Email** → **Email Accounts**
3. Encontre: `comercial@plenipay.com`
4. Clique em: **⚙️ Configurar** ou **Change Password**
5. **Defina uma nova senha:**
   - Use uma senha **simples** (sem `@` ou caracteres especiais)
   - Exemplo: `Plenipay2024!` ou `MinhaSenha123`
6. **Salve**

#### **Opção B: Via Suporte Hostinger**

Se não conseguir redefinir pelo painel:
1. Entre em contato com suporte da Hostinger
2. Peça para redefinir a senha do email `comercial@plenipay.com`

---

### **3. Atualizar .env.local**

**Após redefinir a senha:**

1. Abra o arquivo `.env.local`
2. Atualize a linha:
   ```env
   SMTP_PASSWORD="NovaSenhaAqui"
   ```
   **Exemplo:**
   ```env
   SMTP_PASSWORD="Plenipay2024!"
   ```
3. **Se a senha tiver caracteres especiais, use aspas:**
   ```env
   SMTP_PASSWORD="Plenipay2024!"
   ```
4. **Salve o arquivo**

---

### **4. Atualizar Supabase Dashboard**

**Também atualize no Supabase:**

1. Acesse: **https://app.supabase.com**
2. Vá em: **⚙️ Project Settings** → **Authentication** → **SMTP Settings**
3. Atualize o campo **SMTP Password** com a nova senha
4. **Salve**

---

### **5. Reiniciar Servidor**

**Após atualizar:**

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

---

### **6. Testar Novamente**

**Teste o SMTP:**

No console do navegador (F12):

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

**Se funcionar:**
```
✅ Email de teste enviado!
```

**Se ainda der EAUTH:**
- A senha ainda está errada
- Verifique se atualizou no `.env.local` E no Supabase
- Teste fazer login no webmail novamente

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### **A. Verificar se Email Existe**

1. No painel Hostinger, confirme que `comercial@plenipay.com` existe
2. Verifique se o email está **ativo** (não suspenso ou desabilitado)

### **B. Verificar Formato da Senha**

**Senhas com caracteres especiais podem precisar de aspas:**

```env
# ✅ CORRETO (com aspas)
SMTP_PASSWORD="321@Vaca"

# ❌ ERRADO (sem aspas, pode ser truncado)
SMTP_PASSWORD=321@Vaca
```

### **C. Verificar Porta**

**Confirme que está usando porta 587:**

```env
SMTP_PORT=587
```

**E no Supabase também:** Porta `587`

---

## 📊 CHECKLIST

- [ ] Testei fazer login no webmail com `comercial@plenipay.com` / `321@Vaca`
- [ ] Se não conseguiu → Redefini a senha do email na Hostinger
- [ ] Atualizei `SMTP_PASSWORD` no `.env.local` (com aspas se necessário)
- [ ] Atualizei `SMTP_PASSWORD` no Supabase Dashboard
- [ ] Reiniciei o servidor
- [ ] Testei novamente com `/api/teste-smtp`
- [ ] Se ainda der erro → Verifiquei se o email existe e está ativo

---

## ⚠️ IMPORTANTE

**A senha do SMTP é a senha do EMAIL, não a senha da CONTA HOSTINGER.**

- ❌ **NÃO é:** A senha que você usa para fazer login no painel da Hostinger
- ✅ **É:** A senha que você definiu ao criar o email `comercial@plenipay.com`

---

## 🎯 PRÓXIMOS PASSOS

1. **Teste fazer login no webmail AGORA**
2. **Se não conseguir → Redefina a senha**
3. **Atualize `.env.local` e Supabase**
4. **Reinicie servidor e teste**

**O problema é 100% a senha incorreta. Depois de corrigir, vai funcionar!** ✅
