# ✅ Senha Atualizada - Testar Agora

## 📋 O que foi feito

✅ **Senha atualizada no `.env.local`:**
```env
SMTP_PASSWORD="321@Vacas"
```

---

## ⚠️ IMPORTANTE: Atualizar também no Supabase

**Você PRECISA atualizar a senha no Supabase Dashboard também:**

1. Acesse: **https://app.supabase.com**
2. Vá em: **⚙️ Project Settings** → **Authentication** → **SMTP Settings**
3. Encontre o campo **SMTP Password**
4. Atualize para: `321@Vacas`
5. **Salve** (clique em "Save" ou "Update")

**Por quê?**
- O Supabase também usa essas credenciais para enviar emails
- Se não atualizar, o Supabase continuará usando a senha antiga

---

## 🔄 Reiniciar Servidor

**Após atualizar no Supabase, reinicie o servidor:**

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

**OU** se o servidor já está rodando, ele precisa ser reiniciado para ler a nova senha do `.env.local`.

---

## 🧪 Testar Agora

**Após reiniciar, teste o SMTP:**

No console do navegador (F12):

```javascript
fetch('/api/teste-smtp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
}).then(r => r.json()).then(console.log)
```

**Ou teste fazendo um novo cadastro** - o email deve ser enviado agora!

---

## 📊 O que esperar

### **Se funcionar:**
```
✅ [SMTP] Email enviado com sucesso!
✅ Email enviado via SMTP próprio
```

### **Se ainda der EAUTH:**
```
❌ [SMTP] Código: EAUTH
❌ [SMTP] Response: 535 5.7.8 Error: authentication failed
```

**Nesse caso:**
1. Verifique se atualizou no Supabase também
2. Teste fazer login no webmail com `comercial@plenipay.com` / `321@Vacas`
3. Se não conseguir fazer login → a senha ainda está errada

---

## ✅ Checklist

- [x] Senha atualizada no `.env.local` → `321@Vacas`
- [ ] Senha atualizada no Supabase Dashboard
- [ ] Servidor reiniciado
- [ ] Teste executado (`/api/teste-smtp` ou novo cadastro)

---

**Atualize no Supabase e reinicie o servidor para testar!** 🚀
