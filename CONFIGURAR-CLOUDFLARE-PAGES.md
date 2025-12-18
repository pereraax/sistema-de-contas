# ⚙️ Configurar Cloudflare Pages - Próximos Passos

## ✅ Você está na tela de configuração!

### 📋 Verificar Configurações:

**1. Repository/Project Path:**
- ✅ Deve estar: `pereraax/plenipay`
- Se não estiver, corrija

**2. Project name:**
- ✅ Pode deixar: `plenipay`
- Ou mude para: `plenipay-app` (se quiser)

**3. Build command:**
- ✅ Deve estar: `npm run build`
- Está correto! ✅

---

## ⚠️ IMPORTANTE: Verificar se é Pages ou Workers

Se a tela diz "Worker project", você pode estar no lugar errado!

**Para Pages (correto para Next.js):**
- Deve dizer "Pages" ou "Deploy a site"
- NÃO deve dizer "Worker"

**Se estiver em Workers:**
- Clique em "Back"
- Certifique-se de escolher "Pages" (não Workers)

---

## 🔧 Configurações para Next.js no Cloudflare Pages:

### Build Settings:

**Framework preset:** `Next.js` (deve detectar automaticamente)

**Build command:**
```bash
npm run build
```

**Build output directory:**
```bash
.next
```

**Root directory (leave empty):**
```
(Deixar vazio)
```

**Node version:**
```
18.x ou 20.x
```

---

## 🔐 Adicionar Variáveis de Ambiente:

**IMPORTANTE:** Você precisa adicionar TODAS as variáveis antes de fazer deploy!

### Como adicionar:

1. **Procure por "Environment variables" ou "Variables"**
2. **Clique em "Add variable" para cada uma:**

```
NEXT_PUBLIC_SUPABASE_URL=https://frhxqgcqmxpjpnghsvoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY1Mzc1NiwiZXhwIjoyMDc5MjI5NzU2fQ.E0XIp__d2dMeHDviURhdw4_336dW9SHwUprI5XdRQbg
NEXT_PUBLIC_SITE_URL=https://plenipay.pages.dev
NEXT_PUBLIC_APP_URL=https://plenipay.pages.dev
NODE_ENV=production
ADMIN_JWT_SECRET=h7Ygdyt5/Ht0KzlMpEpxG3UNvJPldKRdjoAAcj8od5c=
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJiZjU2MDNkLTYzMDUtNGEzZi05MzhhLWM4MzkyNWVjNmJkMTo6JGFhY2hfOGM0NjVlZjUtMGRiMy00YzIwLTkwYzctMTAyOGRhNGNiNjEz
ASAAS_API_URL=https://www.asaas.com/api/v3
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
OPENAI_API_KEY=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
GROQ_API_KEY=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
```

⚠️ **ATENÇÃO:** 
- `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` devem ser atualizados DEPOIS do primeiro deploy com a URL real do Cloudflare
- Por enquanto, use: `https://plenipay.pages.dev` (ou a URL que o Cloudflare gerar)

---

## 🚀 Fazer Deploy:

1. **Verifique todas as configurações**
2. **Adicione todas as variáveis de ambiente**
3. **Clique em "Deploy" ou "Save and Deploy"**
4. **Aguarde 5-10 minutos** (primeiro deploy é mais lento)

---

## ✅ Após o Deploy:

1. **Você receberá uma URL tipo:** `https://plenipay-xxxxx.pages.dev`
2. **Atualize as variáveis:**
   - `NEXT_PUBLIC_SITE_URL` → URL real do Cloudflare
   - `NEXT_PUBLIC_APP_URL` → URL real do Cloudflare
3. **Faça um novo deploy** (ou aguarde o auto-deploy)

---

## 💡 Dica:

Se não encontrar onde adicionar variáveis de ambiente:
- Procure por "Settings" ou "Environment"
- Ou adicione depois do primeiro deploy
- Vá em Settings → Environment variables

