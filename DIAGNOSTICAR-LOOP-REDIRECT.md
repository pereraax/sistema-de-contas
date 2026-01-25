# 🔍 DIAGNOSTICAR LOOP DE REDIRECIONAMENTO

## ✅ Cloudflare SSL - OK
Você confirmou que está em **"Full (Strict)"** - isso está correto!

## 🔍 Próximas Verificações

### 1. **Verificar Supabase Site URL** (CRÍTICO)

O loop pode estar sendo causado pela Site URL do Supabase.

**PASSO A PASSO:**
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** → **URL Configuration**
4. **VERIFIQUE a "Site URL":**
   - ✅ Deve ser: `https://plenipay.com`
   - ❌ **NÃO** pode ser: `0.0.0.0:10000`, `localhost:3000`, ou vazio
5. **VERIFIQUE "Redirect URLs":**
   - Deve ter: `https://plenipay.com/**`
   - Deve ter: `https://plenipay.com/auth/callback`
6. **SALVE** se fizer alterações

**Link direto:** `https://app.supabase.com/project/[SEU-PROJETO]/auth/url-configuration`

---

### 2. **Verificar Cloudflare Redirect Rules**

O Cloudflare pode ter regras de redirect causando loops.

**PASSO A PASSO:**
1. No Cloudflare, vá em **Rules** → **Redirect Rules**
2. Verifique se há regras ativas
3. **Procure por regras que:**
   - Redirecionam `/auth/callback`
   - Redirecionam `/home`
   - Redirecionam baseado em query params
4. **Se encontrar regras suspeitas:**
   - Desative temporariamente
   - Teste novamente
   - Se funcionar, ajuste a regra

---

### 3. **Verificar Logs do Railway**

Os logs podem mostrar onde está o loop.

**PASSO A PASSO:**
1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá em **Deployments** → **View Logs**
4. **Procure por:**
   - `[Middleware]` - ver se está redirecionando
   - `[Callback]` - ver o fluxo do callback
   - `ERR_TOO_MANY_REDIRECTS` - mensagens de erro
5. **Copie os logs** e analise o padrão de redirects

**O que procurar:**
- Se o middleware está redirecionando mesmo no domínio correto
- Se o callback está sendo chamado múltiplas vezes
- Se há algum redirect circular entre `/auth/callback` e `/home`

---

### 4. **Testar Link Diretamente no Railway**

Teste sem passar pelo Cloudflare para isolar o problema.

**PASSO A PASSO:**
1. Pegue o link de confirmação do email
2. Substitua `plenipay.com` por `mlvqeal2.up.railway.app`
3. Exemplo:
   ```
   https://mlvqeal2.up.railway.app/auth/callback?token_hash=...&type=magiclink&next=/home
   ```
4. **Teste o link:**
   - ✅ Se funcionar → problema é no Cloudflare
   - ❌ Se não funcionar → problema é no código

---

### 5. **Verificar Cookies e Cache**

Cookies antigos podem causar loops.

**PASSO A PASSO:**
1. Abra uma janela anônima (sem cookies/cache)
2. Teste o link de confirmação
3. Se funcionar → problema é cache/cookies
4. **Solução:** Limpar cookies do site

**Como limpar cookies:**
- Chrome: `Cmd+Shift+Delete` → Cookies → `plenipay.com`
- Firefox: `Cmd+Shift+Delete` → Cookies → `plenipay.com`

---

### 6. **Verificar Variáveis de Ambiente no Railway**

Verifique se há variáveis que possam causar loops.

**PASSO A PASSO:**
1. No Railway, vá em **Variables**
2. **VERIFIQUE:**
   - `NEXT_PUBLIC_SITE_URL` = `https://plenipay.com`
   - `NEXT_PUBLIC_APP_URL` = `https://plenipay.com`
   - **NÃO** deve ter: `0.0.0.0:10000`, `localhost:3000`
3. Se encontrar valores errados, **corrija e faça redeploy**

---

## 🎯 Ordem de Prioridade

1. ✅ **Cloudflare SSL** - Já verificado (Full Strict)
2. 🔴 **Supabase Site URL** - VERIFICAR AGORA
3. 🟡 **Cloudflare Redirect Rules** - Verificar se houver
4. 🟡 **Logs do Railway** - Analisar padrão de redirects
5. 🟢 **Testar no Railway direto** - Isolar problema
6. 🟢 **Limpar cookies** - Testar em janela anônima

---

## 📝 Informações para Compartilhar

Se ainda não funcionar, compartilhe:

1. **Logs do Railway** (últimas 50 linhas)
2. **Screenshot do Supabase URL Configuration**
3. **Screenshot do Cloudflare Redirect Rules** (se houver)
4. **Resultado do teste direto no Railway** (funcionou ou não)

---

## ⚡ Solução Rápida (Teste)

Se quiser testar rapidamente:

1. **Desative temporariamente o Cloudflare Proxy:**
   - Cloudflare → DNS
   - Registro A para `@` (plenipay.com)
   - Clique no ícone de nuvem laranja (Proxied)
   - Mude para cinza (DNS only)
   - Aguarde 5 minutos
   - Teste o link

2. **Se funcionar sem proxy:**
   - Problema é configuração do Cloudflare
   - Reative o proxy e ajuste as regras

3. **Se não funcionar sem proxy:**
   - Problema é no código ou Supabase
   - Verifique Site URL do Supabase
