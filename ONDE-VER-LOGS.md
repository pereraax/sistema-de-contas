# 📋 Onde Ver os Logs

## 🔍 Logs do Servidor (Node.js/Next.js)

### **Onde encontrar:**

Os logs aparecem no **terminal/console** onde você está rodando o aplicativo.

### **Como ver:**

1. **Localmente (desenvolvimento):**
   - Abra o terminal onde você rodou `npm run dev` ou `yarn dev`
   - Os logs aparecem lá em tempo real
   - Procure por mensagens como:
     - `📧 ========== ENVIAR LINK DE CONFIRMAÇÃO ==========`
     - `✅ Email enviado com sucesso`
     - `❌ Erro ao enviar link`

2. **Em produção (Render/Vercel/etc):**
   - **Render:** Dashboard do Render → Seu serviço → "Logs" (aba)
   - **Vercel:** Dashboard do Vercel → Seu projeto → "Deployments" → Clique no deployment → "Logs"
   - **Railway:** Dashboard do Railway → Seu projeto → "Deployments" → Clique no deployment → "View Logs"

### **O que procurar:**

Quando você criar uma conta ou solicitar reenvio de email, procure por:

```
📧 ========== ENVIAR LINK DE CONFIRMAÇÃO ==========
📧 Email: seu@email.com
🔄 Tentativa 1: type = signup
✅ Email enviado com sucesso via resend (type: signup)!
```

**OU se houver erro:**

```
❌ Erro ao enviar link de confirmação: [mensagem de erro]
❌ Código do erro: [número]
```

---

## 🌐 Logs do Supabase Dashboard

### **Onde encontrar:**

1. Acesse: https://app.supabase.com → Seu projeto
2. Vá em: **Authentication** → **Logs**
3. Clique na aba **"Logs"** (não "Users")

### **O que procurar:**

- **Tentativas de envio de email**
- **Erros de SMTP**
- **Erros de template**
- **Rate limiting**

### **Exemplos de erros comuns:**

- `SMTP connection failed` = SMTP não configurado ou credenciais erradas
- `Template not found` = Template de email não configurado
- `Email confirmation disabled` = Email confirmation não está habilitado
- `Rate limit exceeded` = Muitas tentativas (aguarde alguns minutos)

---

## 🖥️ Logs do Navegador (Console do Browser)

### **Onde encontrar:**

1. Abra o navegador
2. Pressione **F12** (ou **Cmd+Option+I** no Mac)
3. Clique na aba **"Console"**
4. Crie uma conta ou solicite reenvio de email

### **O que procurar:**

Quando você criar conta ou clicar em "Reenviar link", procure por:

```
📧 [MODAL] ========== MODAL MONTADO ==========
📧 [MODAL] Email recebido: seu@email.com
```

**OU mensagens de erro:**

```
❌ Erro ao enviar link: [mensagem]
```

---

## 📧 Como Testar Agora

### **Teste 1: Criar Nova Conta**

1. **Abra o terminal** onde o app está rodando
2. **Abra o console do navegador** (F12)
3. **Preencha** o formulário de cadastro
4. **Clique em "Criar Conta"**
5. **Observe os logs:**
   - **Terminal:** Deve mostrar logs do servidor
   - **Console do navegador:** Deve mostrar logs do frontend

### **Teste 2: Reenviar Link**

1. **Abra o terminal** onde o app está rodando
2. **Abra o console do navegador** (F12)
3. **Clique em "Não recebeu? Reenviar link"** no modal
4. **Observe os logs:**
   - **Terminal:** Deve mostrar logs da API `/api/auth/enviar-link-confirmacao`
   - **Console do navegador:** Deve mostrar logs do modal

---

## 🔍 O Que Fazer com os Logs

### **Se aparecer `✅ Email enviado com sucesso`:**

- ✅ O código está funcionando
- ❓ Mas email não chegou? Verifique:
  - Pasta de spam
  - SMTP está funcionando? (verifique logs do Supabase)
  - Email está correto?

### **Se aparecer `❌ Erro ao enviar`:**

**Copie a mensagem de erro completa** e me envie, incluindo:
- Mensagem de erro
- Código do erro (se houver)
- Logs do Supabase (Authentication → Logs)

### **Exemplo de log de erro:**

```
❌ Erro ao enviar link de confirmação: SMTP connection failed
❌ Código do erro: 500
❌ Erro completo: {
  "message": "SMTP connection failed",
  "status": 500
}
```

**Se aparecer isso, significa:**
- SMTP não está configurado corretamente
- Ou credenciais SMTP estão erradas
- Verifique: Project Settings → Auth → SMTP Settings

---

## 📋 Resumo Rápido

### **Logs do Servidor:**
- **Onde:** Terminal onde o app está rodando
- **Como:** Apenas observe o terminal ao criar conta

### **Logs do Supabase:**
- **Onde:** https://app.supabase.com → Seu projeto → Authentication → Logs
- **Como:** Clique na aba "Logs" e procure por erros

### **Logs do Navegador:**
- **Onde:** Console do navegador (F12 → Console)
- **Como:** Pressione F12 e observe a aba Console

---

**Me envie os logs se aparecer algum erro para eu ajudar a resolver!** 🚀
