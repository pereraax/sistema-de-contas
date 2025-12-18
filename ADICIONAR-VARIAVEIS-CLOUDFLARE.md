# 🔐 Adicionar Variáveis de Ambiente no Cloudflare

## 📋 Você está na tela correta!

### ⚠️ IMPORTANTE:
Você precisa adicionar **TODAS as 12 variáveis** antes de fazer deploy!

---

## 🔄 Como Adicionar Cada Variável:

### Para cada variável:

1. **Variable name:** Digite o nome (ex: `NEXT_PUBLIC_SUPABASE_URL`)
2. **Variable value:** Cole o valor correspondente
3. **Encrypt:** Deixe desmarcado (não precisa criptografar)
4. **Clique em "Add" ou "Save"** (ou botão equivalente)
5. **Repita para a próxima variável**

---

## 📝 Lista Completa de Variáveis (Adicione nesta ordem):

### 1. NEXT_PUBLIC_SUPABASE_URL
**Variable name:** `NEXT_PUBLIC_SUPABASE_URL`  
**Variable value:** `https://frhxqgcqmxpjpnghsvoe.supabase.co`

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Variable name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
**Variable value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I`

### 3. SUPABASE_SERVICE_ROLE_KEY
**Variable name:** `SUPABASE_SERVICE_ROLE_KEY`  
**Variable value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1Mzc1NiwiZXhwIjoyMDc5MjI5NzU2fQ.E0XIp__d2dMeHDviURhdw4_336dW9SHwUprI5XdRQbg`

### 4. NEXT_PUBLIC_SITE_URL
**Variable name:** `NEXT_PUBLIC_SITE_URL`  
**Variable value:** `https://plenipay.pages.dev`  
⚠️ **Você atualiza depois com a URL real do Cloudflare**

### 5. NEXT_PUBLIC_APP_URL
**Variable name:** `NEXT_PUBLIC_APP_URL`  
**Variable value:** `https://plenipay.pages.dev`  
⚠️ **Você atualiza depois com a URL real do Cloudflare**

### 6. NODE_ENV
**Variable name:** `NODE_ENV`  
**Variable value:** `production`

### 7. ADMIN_JWT_SECRET
**Variable name:** `ADMIN_JWT_SECRET`  
**Variable value:** `h7Ygdyt5/Ht0KzlMpEpxG3UNvJPldKRdjoAAcj8od5c=`

### 8. ASAAS_API_KEY
**Variable name:** `ASAAS_API_KEY`  
**Variable value:** `$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJiZjU2MDNkLTYzMDUtNGEzZi05MzhhLWM4MzkyNWVjNmJkMTo6JGFhY2hfOGM0NjVlZjUtMGRiMy00YzIwLTkwYzctMTAyOGRhNGNiNjEz`

### 9. ASAAS_API_URL
**Variable name:** `ASAAS_API_URL`  
**Variable value:** `https://www.asaas.com/api/v3`

### 10. APIFACIL_INSTANCE_ID
**Variable name:** `APIFACIL_INSTANCE_ID`  
**Variable value:** `1041`

### 11. APIFACIL_TOKEN
**Variable name:** `APIFACIL_TOKEN`  
**Variable value:** `2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb`

### 12. OPENAI_API_KEY
**Variable name:** `OPENAI_API_KEY`  
**Variable value:** `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`

### 13. GROQ_API_KEY
**Variable name:** `GROQ_API_KEY`  
**Variable value:** `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`

---

## 💡 Dicas:

1. **Copie e cole os valores exatamente como estão** (sem espaços extras)
2. **Não marque "Encrypt"** (deixe desmarcado)
3. **Adicione uma por vez** e verifique se foi salva
4. **Após adicionar todas, clique em "Deploy"**

---

## ⚠️ IMPORTANTE sobre NEXT_PUBLIC_SITE_URL e NEXT_PUBLIC_APP_URL:

Por enquanto, use: `https://plenipay.pages.dev`

**Depois do primeiro deploy:**
1. Você receberá uma URL tipo: `https://plenipay-xxxxx.pages.dev`
2. Volte em Settings → Environment variables
3. Atualize essas duas variáveis com a URL real
4. Faça um novo deploy

---

## ✅ Após Adicionar Todas:

1. Verifique se todas as 13 variáveis foram adicionadas
2. Clique em **"Deploy"** (botão azul)
3. Aguarde 5-10 minutos para o deploy

---

## 🆘 Se Precisar Adicionar Depois:

Se quiser fazer deploy primeiro e adicionar variáveis depois:
1. Clique em "Deploy" agora (mesmo sem todas as variáveis)
2. Após o deploy, vá em **Settings** → **Environment variables**
3. Adicione as variáveis que faltaram
4. Faça um novo deploy

