# ✅ O QUE FAZER DEPOIS DE CORRIGIR AS VARIÁVEIS SMTP

## 📋 CHECKLIST PÓS-CORREÇÃO

### **1️⃣ CORRIGIR VARIÁVEIS NO .env.local**

✅ Certifique-se de que todas as variáveis SMTP estão completas:
- `SMTP_HOST=smtp.hostinger.com` (não `smtp.hostinger.c`)
- `SMTP_USER=comercial@plenipay.com` (não `comercial@plenip`)
- `SMTP_FROM=Plenipay <comercial@plenipay.com>` (não `Plenipay <comerc`)
- `SMTP_PORT=465`
- `SMTP_PASSWORD=321@Vaca`

✅ Corrija também:
- `NEXT_PUBLIC_APP_URL=https://plenipay.com` (não `http:/`)

---

### **2️⃣ REINICIAR O SERVIDOR**

**CRÍTICO:** Variáveis de ambiente só são carregadas quando o servidor inicia!

1. **Pare o servidor:** Pressione `Ctrl+C` no terminal
2. **Inicie novamente:** `npm run dev`
3. **Aguarde** até ver "Ready" no terminal

---

### **3️⃣ TESTAR CRIAÇÃO DE CONTA**

1. **Acesse:** A página de cadastro
2. **Preencha o formulário** com dados válidos
3. **Clique em:** "Criar Conta"
4. **Observe:**
   - Se aparecer erro, verifique os logs
   - Se funcionar, verifique se o email chegou

---

### **4️⃣ VERIFICAR LOGS DO SERVIDOR**

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP` ou `SMTP`
3. **Procure por:**

#### **✅ SUCESSO:**
```
✅ [SMTP] Configuração SMTP válida!
✅ Email enviado com sucesso
✅ Usuário criado
```

#### **❌ ERRO:**
```
❌ [SMTP] Alguma variável SMTP está faltando
❌ Erro ao enviar email
❌ Erro ao criar usuário
```

---

### **5️⃣ VERIFICAR SE EMAIL FOI ENVIADO**

1. **Verifique a caixa de entrada** do email usado no cadastro
2. **Verifique a pasta de spam/lixo eletrônico**
3. **Se não chegou:**
   - Verifique os logs do servidor
   - Verifique se SMTP está configurado no Supabase também
   - Verifique se "Enable email confirmations" está habilitado

---

## 🔍 POSSÍVEIS PROBLEMAS APÓS CORREÇÃO

### **Problema 1: "SMTP não configurado"**

**Causa:** Servidor não foi reiniciado após corrigir variáveis

**Solução:**
1. Pare o servidor (Ctrl+C)
2. Inicie novamente (`npm run dev`)
3. Tente novamente

---

### **Problema 2: "Erro ao conectar SMTP"**

**Causa:** Credenciais SMTP incorretas ou host errado

**Solução:**
1. Verifique se `SMTP_HOST` está correto: `smtp.hostinger.com`
2. Verifique se `SMTP_USER` é o email completo: `comercial@plenipay.com`
3. Verifique se `SMTP_PASSWORD` está correta
4. Verifique se `SMTP_PORT` está correto: `465` ou `587`

---

### **Problema 3: "Erro ao criar usuário"**

**Causa:** Pode ser problema no Supabase, não no SMTP

**Solução:**
1. Verifique logs do servidor (filtrado por `SIGNUP`)
2. Verifique se variáveis do Supabase estão configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Verifique se "Enable email confirmations" está habilitado no Supabase

---

## 📝 PRÓXIMOS PASSOS

Após corrigir e reiniciar:

1. ✅ **Tente criar uma conta**
2. ✅ **Verifique os logs** (`/administracaosecr/logs`)
3. ✅ **Verifique se email chegou**
4. ✅ **Se ainda houver erro, compartilhe os logs** para diagnóstico

---

**Tudo corrigido? Reinicie o servidor e teste!**
