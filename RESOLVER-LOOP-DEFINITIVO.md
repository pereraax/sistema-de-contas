# 🔧 RESOLVER LOOP DE REDIRECIONAMENTO - GUIA DEFINITIVO

## 🔴 Problema Persistente

Mesmo com Cloudflare em "Flexible", ainda há `ERR_TOO_MANY_REDIRECTS`.

---

## ✅ Correções Aplicadas no Código

1. ✅ Verificação de referer para evitar loops
2. ✅ Cookie para rastrear tokens processados
3. ✅ Status 303 em vez de 307
4. ✅ URLs absolutas sempre

**O código foi atualizado e commitado!**

---

## 🔍 Verificações no Cloudflare (CRÍTICO)

### **1. Verificar Redirect Rules**

O Cloudflare pode ter regras automáticas causando loops:

1. No Cloudflare, vá em **Rules** → **Redirect Rules**
2. **Procure por regras que:**
   - Redirecionam HTTP → HTTPS
   - Redirecionam `/auth/callback`
   - Redirecionam `/home`
   - Redirecionam baseado em query params
3. **Se encontrar:**
   - **DESATIVE TODAS** temporariamente
   - Teste novamente
   - Se funcionar, reative uma por vez para identificar qual causa o problema

---

### **2. Verificar Always Use HTTPS**

1. No Cloudflare, vá em **SSL/TLS** → **Edge Certificates**
2. Procure por **"Always Use HTTPS"**
3. **Se estiver ativado:**
   - **DESATIVE temporariamente**
   - Teste novamente
   - Isso pode estar causando loops

---

### **3. Verificar Automatic HTTPS Rewrites**

1. No Cloudflare, vá em **SSL/TLS** → **Edge Certificates**
2. Procure por **"Automatic HTTPS Rewrites"**
3. **Se estiver ativado:**
   - **DESATIVE temporariamente**
   - Teste novamente

---

### **4. Verificar Transform Rules**

1. No Cloudflare, vá em **Rules** → **Transform Rules**
2. Verifique:
   - **Modify Request Header**
   - **Modify Response Header**
3. **Se houver regras:**
   - **DESATIVE temporariamente**
   - Teste novamente

---

## 🔍 Verificações no Railway

### **1. Verificar Logs do Railway**

Os logs mostram o que está acontecendo:

1. Acesse: https://railway.app
2. Vá em **Deployments** → **View Logs**
3. **Procure por:**
   - Múltiplas chamadas a `/auth/callback`
   - Padrão de redirects: `/auth/callback` → `/home` → `/auth/callback` → ...
   - Mensagens `[Callback]` repetidas

**O que procurar:**
- Se o callback está sendo chamado múltiplas vezes
- Se há erros nos logs
- Se o redirect está funcionando corretamente

---

### **2. Verificar Variáveis de Ambiente**

1. No Railway, vá em **Variables**
2. **Verifique:**
   - `NEXT_PUBLIC_SITE_URL` = `https://plenipay.com`
   - `NEXT_PUBLIC_APP_URL` = `https://plenipay.com`
   - **NÃO** deve ter: `0.0.0.0:10000`, `localhost:3000`

---

## 🎯 Solução Passo a Passo

### **Passo 1: Desativar Tudo no Cloudflare**

1. **Redirect Rules:** Desative todas
2. **Always Use HTTPS:** Desative
3. **Automatic HTTPS Rewrites:** Desative
4. **Transform Rules:** Desative todas
5. **Aguarde 2 minutos**
6. **Teste:** `https://plenipay.com/auth/callback?token_hash=...`

**Se funcionar:**
- Reative uma regra por vez
- Teste após cada reativação
- Identifique qual causa o problema

**Se não funcionar:**
- Continue para Passo 2

---

### **Passo 2: Verificar Logs do Railway**

1. Acesse os logs do Railway
2. **Procure por padrão de loops:**
   - Múltiplas chamadas ao callback
   - Redirects circulares
3. **Compartilhe os logs** para análise

---

### **Passo 3: Testar Diretamente no Railway**

Teste sem passar pelo Cloudflare:

1. Pegue o link de confirmação
2. Substitua `plenipay.com` por `mlvqeal2.up.railway.app`
3. Teste: `https://mlvqeal2.up.railway.app/auth/callback?token_hash=...`

**Se funcionar:**
- Problema é no Cloudflare
- Continue verificando regras do Cloudflare

**Se não funcionar:**
- Problema é no código
- Verifique logs do Railway

---

### **Passo 4: Limpar Cookies e Cache**

1. **Limpar cookies do site:**
   - Chrome: `Cmd+Shift+Delete` → Cookies → `plenipay.com`
   - Firefox: `Cmd+Shift+Delete` → Cookies → `plenipay.com`

2. **Testar em janela anônima:**
   - Chrome: `Cmd+Shift+N`
   - Firefox: `Cmd+Shift+P`

---

## 📝 Checklist Completo

### Cloudflare:
- [ ] SSL mode: "Flexible" ✅
- [ ] Redirect Rules: **DESATIVADAS** (temporariamente)
- [ ] Always Use HTTPS: **DESATIVADO** (temporariamente)
- [ ] Automatic HTTPS Rewrites: **DESATIVADO** (temporariamente)
- [ ] Transform Rules: **DESATIVADAS** (temporariamente)

### Railway:
- [ ] Deploy foi bem-sucedido
- [ ] Logs não mostram erros
- [ ] Variáveis de ambiente corretas

### Teste:
- [ ] Testado em janela anônima (sem cookies)
- [ ] Testado diretamente no Railway (sem Cloudflare)
- [ ] Logs do Railway verificados

---

## 🚨 Se Ainda Não Funcionar

Compartilhe:

1. **Screenshot dos Redirect Rules do Cloudflare** (se houver)
2. **Screenshot dos Transform Rules** (se houver)
3. **Últimas 50 linhas dos logs do Railway**
4. **Resultado do teste direto no Railway** (funcionou ou não)

---

## 💡 Dica Final

O problema mais comum é **Redirect Rules** ou **Always Use HTTPS** no Cloudflare causando loops. Desative tudo temporariamente e teste. Se funcionar, reative uma regra por vez para identificar a causa.
