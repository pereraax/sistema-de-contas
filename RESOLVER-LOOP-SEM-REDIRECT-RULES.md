# 🔧 RESOLVER LOOP - SEM Redirect Rules (Plano Gratuito)

## 🔴 Problema

Mesmo com Cloudflare "Flexible", ainda há loop de redirecionamento.

**Nota:** No plano gratuito, "Redirect Rules" pode não estar disponível ou estar em outro lugar.

---

## ✅ Verificações no Cloudflare (Plano Gratuito)

### **1. SSL/TLS Settings**

1. Acesse: https://dash.cloudflare.com
2. Selecione `plenipay.com`
3. Vá em **SSL/TLS**
4. **Verifique:**

   **a) Encryption mode:**
   - Deve estar **"Flexible"** ✅
   - Se estiver "Full" ou "Full (strict)", mude para "Flexible"

   **b) Edge Certificates:**
   - Clique em **"Edge Certificates"**
   - Procure por **"Always Use HTTPS"**
   - **Se estiver ON:** **DESLIGUE** temporariamente
   - Procure por **"Automatic HTTPS Rewrites"**
   - **Se estiver ON:** **DESLIGUE** temporariamente

---

### **2. Page Rules (Pode Estar Aqui)**

No plano gratuito, redirects podem estar em **Page Rules**:

1. No Cloudflare, vá em **Rules** → **Page Rules**
2. **Verifique se há regras ativas:**
   - Se houver regras, **DESATIVE temporariamente**
   - Teste novamente
   - Se funcionar, reative uma por vez

---

### **3. Transform Rules (Se Disponível)**

1. No Cloudflare, vá em **Rules** → **Transform Rules**
2. Verifique:
   - **Modify Request Header**
   - **Modify Response Header**
3. **Se houver regras:**
   - **DESATIVE temporariamente**
   - Teste novamente

---

### **4. Workers (Se Houver)**

1. No Cloudflare, vá em **Workers & Pages**
2. Verifique se há Workers ativos para `plenipay.com`
3. **Se houver:**
   - **DESATIVE temporariamente**
   - Teste novamente

---

## 🔍 Verificações no Railway

### **1. Verificar Logs**

Os logs mostram o que está acontecendo:

1. Acesse: https://railway.app
2. Vá em **Deployments** → **View Logs**
3. **Procure por:**
   - Múltiplas chamadas a `/auth/callback`
   - Padrão: `/auth/callback` → `/home` → `/auth/callback` → ...
   - Mensagens `[Callback]` repetidas

**Compartilhe os logs** para análise.

---

### **2. Testar Diretamente no Railway**

Teste sem passar pelo Cloudflare:

1. Pegue o link de confirmação do email
2. Substitua `plenipay.com` por `mlvqeal2.up.railway.app`
3. Teste: `https://mlvqeal2.up.railway.app/auth/callback?token_hash=...`

**Se funcionar:**
- ✅ Problema é no Cloudflare
- Continue verificando configurações do Cloudflare

**Se não funcionar:**
- ❌ Problema é no código
- Verifique logs do Railway

---

## 🎯 Solução Passo a Passo

### **Passo 1: Desativar Tudo no Cloudflare**

1. **SSL/TLS → Edge Certificates:**
   - **Always Use HTTPS:** OFF
   - **Automatic HTTPS Rewrites:** OFF

2. **Rules → Page Rules:**
   - Desative todas as regras (se houver)

3. **Rules → Transform Rules:**
   - Desative todas as regras (se houver)

4. **Aguarde 2 minutos**

5. **Teste:** `https://plenipay.com/auth/callback?token_hash=...`

---

### **Passo 2: Verificar Logs do Railway**

1. Acesse os logs do Railway
2. **Procure por padrão de loops:**
   - Múltiplas chamadas ao callback
   - Redirects circulares
3. **Compartilhe os logs** para análise

---

### **Passo 3: Testar Sem Cloudflare (Temporariamente)**

Para isolar o problema:

1. No Cloudflare, vá em **DNS**
2. Encontre o registro A para `@` (plenipay.com)
3. Clique no ícone de nuvem laranja (Proxied)
4. Mude para cinza (DNS only)
5. Aguarde 5 minutos
6. Teste: `https://plenipay.com/auth/callback?token_hash=...`

**Se funcionar sem proxy:**
- Problema é configuração do Cloudflare
- Reative o proxy e ajuste as configurações

**Se não funcionar sem proxy:**
- Problema é no código ou Railway
- Verifique logs do Railway

---

## 📝 Checklist

### Cloudflare:
- [ ] SSL mode: "Flexible" ✅
- [ ] Always Use HTTPS: **OFF** (temporariamente)
- [ ] Automatic HTTPS Rewrites: **OFF** (temporariamente)
- [ ] Page Rules: **DESATIVADAS** (se houver)
- [ ] Transform Rules: **DESATIVADAS** (se houver)

### Teste:
- [ ] Testado diretamente no Railway (sem Cloudflare)
- [ ] Logs do Railway verificados
- [ ] Testado em janela anônima (sem cookies)

---

## 🚨 Se Ainda Não Funcionar

Compartilhe:

1. **Screenshot do SSL/TLS → Edge Certificates** (mostrando Always Use HTTPS e Automatic HTTPS Rewrites)
2. **Screenshot do Rules → Page Rules** (se houver regras)
3. **Últimas 50 linhas dos logs do Railway**
4. **Resultado do teste direto no Railway** (funcionou ou não)

---

## 💡 Dica

O problema mais comum no plano gratuito é **"Always Use HTTPS"** ou **"Automatic HTTPS Rewrites"** causando loops. Desative ambos e teste.
