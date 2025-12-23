# 📋 COMO USAR O ARQUIVO .env

## 📁 Arquivo criado:

✅ **`.env`** - Arquivo com todas as variáveis de ambiente

---

## 🎯 COMO USAR:

### **OPÇÃO 1: Railway (Recomendado)**

1. **Acesse:** https://railway.app
2. **Crie projeto** e conecte seu repositório
3. **Vá em "Variables"**
4. **Clique em "Raw Editor"**
5. **Abra o arquivo `.env`** que acabei de criar
6. **Copie TODO o conteúdo** (exceto comentários se quiser)
7. **Cole no Raw Editor do Railway**
8. **Ajuste as URLs:**
   - Substitua `https://seu-projeto.up.railway.app` pela URL real que o Railway gerar
9. **Salve**

---

### **OPÇÃO 2: Adicionar uma por uma**

1. **Abra o arquivo `.env`**
2. **Para cada linha** (que não começa com `#`):
   - No Railway, clique em "New Variable"
   - Key: Nome da variável (antes do `=`)
   - Value: Valor da variável (depois do `=`)
   - Salve

---

## ⚠️ IMPORTANTE:

### **URLs que precisam ser ajustadas:**

Após o deploy, você receberá uma URL tipo:
- `https://seu-projeto.up.railway.app`

**Ajuste estas variáveis:**
```
NEXT_PUBLIC_SITE_URL=https://seu-projeto.up.railway.app
NEXT_PUBLIC_APP_URL=https://seu-projeto.up.railway.app
```

**Substitua `seu-projeto.up.railway.app` pela URL real!**

---

## 📋 VARIÁVEIS OBRIGATÓRIAS:

✅ **NEXT_PUBLIC_SUPABASE_URL**  
✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**  
✅ **SUPABASE_SERVICE_ROLE_KEY**  
✅ **NODE_ENV**  
✅ **NEXT_PUBLIC_SITE_URL** (ajustar após deploy)  
✅ **NEXT_PUBLIC_APP_URL** (ajustar após deploy)  
✅ **ADMIN_JWT_SECRET**  

---

## 📋 VARIÁVEIS OPCIONAIS:

⚠️ **ASAAS_API_KEY** (se usar pagamentos)  
⚠️ **ASAAS_API_URL** (se usar pagamentos)  
⚠️ **APIFACIL_INSTANCE_ID** (se usar WhatsApp)  
⚠️ **APIFACIL_TOKEN** (se usar WhatsApp)  
⚠️ **OPENAI_API_KEY** (se usar IA)  
⚠️ **GROQ_API_KEY** (se usar IA alternativa)  
⚠️ **SMTP_*** (se usar envio de email)  

---

## ✅ CHECKLIST:

- [ ] Arquivo `.env` criado
- [ ] Variáveis copiadas para Railway/Render
- [ ] URLs ajustadas após deploy
- [ ] Deploy funcionando
- [ ] Aplicação acessível

---

**Arquivo `.env` criado com sucesso!** 🎉

**Use este arquivo para copiar as variáveis para a plataforma de deploy!** 🚀

