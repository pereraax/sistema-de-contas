# 🔧 ADICIONAR VARIÁVEIS DE AMBIENTE NO RENDER

## 📋 O QUE FAZER AGORA:

Você está na tela de "Environment Variables". **IMPORTANTE:** Adicione todas as variáveis ANTES de clicar em "Deploy Web Service"!

---

## ✅ OPÇÃO 1: ADICIONAR UMA POR UMA (RECOMENDADO)

### **Clique em "+ Add Environment Variable" e adicione cada uma:**

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://frhxqgcqmxpjpnghsvoe.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1Mzc1NiwiZXhwIjoyMDc5MjI5NzU2fQ.E0XIp__d2dMeHDviURhdw4_336dW9SHwUprI5XdRQbg`

4. **ASAAS_API_KEY**
   - Key: `ASAAS_API_KEY`
   - Value: `$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJiZjU2MDNkLTYzMDUtNGEzZi05MzhhLWM4MzkyNWVjNmJkMTo6JGFhY2hfOGM0NjVlZjUtMGRiMy00YzIwLTkwYzctMTAyOGRhNGNiNjEz`

5. **ASAAS_API_URL**
   - Key: `ASAAS_API_URL`
   - Value: `https://www.asaas.com/api/v3`

6. **APIFACIL_INSTANCE_ID**
   - Key: `APIFACIL_INSTANCE_ID`
   - Value: `1041`

7. **APIFACIL_TOKEN**
   - Key: `APIFACIL_TOKEN`
   - Value: `2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb`

8. **NEXT_PUBLIC_SITE_URL**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `(Deixe vazio por enquanto, Render vai gerar uma URL depois)`

9. **NEXT_PUBLIC_APP_URL**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `(Deixe vazio por enquanto, Render vai gerar uma URL depois)`

10. **NODE_ENV**
    - Key: `NODE_ENV`
    - Value: `production`

11. **ADMIN_JWT_SECRET**
    - Key: `ADMIN_JWT_SECRET`
    - Value: `h7Ygdyt5/Ht0KzlMpEpxG3UNvJPldKRdjoAAcj8od5c=`

12. **OPENAI_API_KEY** (se você usar)
    - Key: `OPENAI_API_KEY`
    - Value: `(seu valor, se usar)`

13. **GROQ_API_KEY** (se você usar)
    - Key: `GROQ_API_KEY`
    - Value: `(seu valor, se usar)`

---

## ✅ OPÇÃO 2: IMPORTAR DE ARQUIVO .ENV (MAIS RÁPIDO)

### **Se você tem um arquivo .env.local ou .env.production:**

1. **Clique em "Add from .env"**
2. **Cole o conteúdo do arquivo** (ou selecione o arquivo)
3. **Render vai importar todas as variáveis automaticamente!**

**Formato do arquivo .env:**
```
NEXT_PUBLIC_SUPABASE_URL=https://frhxqgcqmxpjpnghsvoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ... etc
```

---

## ⚠️ IMPORTANTE:

### **NEXT_PUBLIC_SITE_URL e NEXT_PUBLIC_APP_URL:**

1. **Deixe vazias por enquanto** (ou coloque um valor temporário)
2. **Depois que o deploy terminar:**
   - Render vai gerar uma URL (ex: `plenipay.onrender.com`)
   - Volte nas configurações
   - Atualize essas duas variáveis com a URL gerada
   - Render vai fazer redeploy automaticamente

---

## ✅ CHECKLIST ANTES DE DEPLOYAR:

- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Adicionei `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Adicionei `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Adicionei `ASAAS_API_KEY`
- [ ] Adicionei `ASAAS_API_URL`
- [ ] Adicionei `APIFACIL_INSTANCE_ID`
- [ ] Adicionei `APIFACIL_TOKEN`
- [ ] Adicionei `NODE_ENV=production`
- [ ] Adicionei `ADMIN_JWT_SECRET`
- [ ] (Opcional) Adicionei `OPENAI_API_KEY` e `GROQ_API_KEY` se usar

---

## 🚀 DEPOIS DE ADICIONAR TODAS AS VARIÁVEIS:

1. **Role até o final da página**
2. **Clique no botão "Deploy Web Service"** (botão grande)
3. **Aguarde o deploy** (5-10 minutos)
4. **Render vai gerar uma URL** (ex: `plenipay.onrender.com`)
5. **Atualize `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`** com a URL gerada
6. **Teste a aplicação!**

---

## 💡 DICA:

**Se você tem o arquivo `env-template.txt` ou `.env.production` local:**
- Use a opção "Add from .env" para importar tudo de uma vez!
- É muito mais rápido que adicionar uma por uma

---

**Adicione todas as variáveis e depois clique em "Deploy Web Service"!** 🚀

