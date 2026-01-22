# ✅ VERIFICAÇÃO RÁPIDA - LINK DE CONFIRMAÇÃO

## 🔍 O QUE VERIFICAR AGORA:

### **1️⃣ REINICIAR O SERVIDOR**

O servidor Next.js precisa ser reiniciado para aplicar as mudanças!

**No terminal onde está rodando `npm run dev`:**
1. Pare o servidor (Ctrl+C ou Cmd+C)
2. Inicie novamente: `npm run dev`

---

### **2️⃣ VERIFICAR LOGS AO CRIAR CONTA**

Após reiniciar, crie uma nova conta e verifique os logs no terminal.

**DEVE APARECER:**
```
✅ [getSiteUrl] Usando URL de produção para links de email: https://plenipay.com.br
📧 Site URL detectada: https://plenipay.com.br
📧 emailRedirectTo: https://plenipay.com.br/auth/callback?next=/home
```

**NÃO DEVE APARECER:**
```
❌ localhost:3000
```

---

### **3️⃣ VERIFICAR NO SUPABASE DASHBOARD**

**IMPORTANTE:** O Supabase pode estar usando a Site URL configurada no dashboard!

1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em: **Authentication** → **URL Configuration**
3. **VERIFIQUE a "Site URL":**
   - Se estiver como `http://localhost:3000` → **MUDE PARA** `https://plenipay.com.br`
   - Se estiver como `https://plenipay.com.br` → Está correto ✅

4. **VERIFIQUE as "Redirect URLs":**
   - Deve ter: `https://plenipay.com.br/**`
   - Deve ter: `https://plenipay.com.br/auth/callback`
   - Pode ter: `http://localhost:3000/**` (para desenvolvimento local)

5. **SALVE** as alterações

---

### **4️⃣ TESTAR NOVAMENTE**

1. **Reinicie o servidor** (se ainda não fez)
2. **Crie uma nova conta de teste**
3. **Verifique o email de confirmação**
4. **O link deve ter:** `redirect_to=https://plenipay.com.br/auth/callback...`

---

## ⚠️ POR QUE PODE NÃO ESTAR FUNCIONANDO:

1. **Servidor não foi reiniciado** → O código antigo ainda está em memória
2. **Supabase Dashboard tem localhost** → O Supabase usa a Site URL do dashboard
3. **Cache do navegador** → Limpe o cache ou use modo anônimo

---

## 🆘 SE AINDA NÃO FUNCIONAR:

Me diga:
1. O que aparece nos logs quando você cria uma conta? (copie e cole)
2. Qual é a Site URL configurada no Supabase Dashboard?
3. Você reiniciou o servidor?
