# 🚨 VERIFICAR TEMPLATE DE EMAIL - URGENTE!

## ✅ VOCÊ JÁ FEZ:
- ✅ "Confirm email" está ATIVADO (vimos na imagem)

## ❌ O QUE FALTA VERIFICAR (CAUSA DO PROBLEMA):

### 1️⃣ TEMPLATE DE EMAIL (MAIS COMUM - 90% DOS CASOS)

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** **Authentication** → **Email Templates**
3. **Clique em:** **"Confirm signup"**
4. **Clique na aba:** **"Source"** (código fonte HTML)

#### ❌ SE TIVER ISSO (ERRADO):
```html
Clique aqui para confirmar: {{ .ConfirmationURL }}
```

#### ✅ DEVE TER ISSO (CORRETO):
```html
Seu código é: {{ .Token }}
```

**AÇÃO:**
- Procure por `{{ .ConfirmationURL }}` ou `ConfirmationURL`
- **SUBSTITUA** por `{{ .Token }}`
- **SALVE**

---

### 2️⃣ TIPO DE CONFIRMAÇÃO

1. **Acesse:** **Authentication** → **URL Configuration**
2. **VERIFIQUE:** **"Email confirmation type"**
   - ✅ Deve estar: **"OTP"** (One-Time Password)
   - ❌ NÃO pode estar: **"Email Link"**

**SE ESTIVER COMO "Email Link":**
- ❌ Não funciona com códigos
- ✅ Mude para **"OTP"**
- ✅ **SALVE**

---

### 3️⃣ SMTP CONFIGURADO?

1. **Project Settings** → **Auth** → **SMTP Settings**
2. **VERIFIQUE:**
   - ✅ **Enable Custom SMTP** está marcado?
   - ✅ Host, Port, Username, Password preenchidos?

**SE NÃO ESTIVER:**
- O Supabase usa serviço padrão (limite muito baixo)
- Configure SMTP da Hostinger

---

## 🧪 TESTE RÁPIDO:

1. **Corrija o template** (se necessário)
2. **Verifique tipo OTP** (se necessário)
3. **Feche e abra o modal** novamente
4. **Clique em "Verificar email agora"**
5. **Aguarde 1-2 minutos**
6. **Verifique email e spam**

---

## 📋 CHECKLIST FINAL:

- [ ] Template usa `{{ .Token }}` (NÃO `{{ .ConfirmationURL }}`)
- [ ] Tipo de confirmação é **"OTP"** (NÃO "Email Link")
- [ ] SMTP configurado (opcional, mas recomendado)
- [ ] Testou fechar/abrir modal novamente
- [ ] Verificou spam

**99% das vezes o problema é o template usando ConfirmationURL!**













