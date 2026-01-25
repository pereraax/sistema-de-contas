# 🔧 RESOLVER LOOP DE REDIRECIONAMENTO

## 🔴 Problema
O link de confirmação de email está causando `ERR_TOO_MANY_REDIRECTS`.

## ✅ Correções Aplicadas

### 1. Middleware Corrigido
- ✅ Agora verifica se já estamos no domínio correto (`plenipay.com`) antes de redirecionar
- ✅ Usa status `303` em vez de `307` para evitar loops
- ✅ Não redireciona se já estiver no domínio correto

### 2. Callback Simplificado
- ✅ Remove parâmetros de query que podem causar loops
- ✅ Usa status `303` para redirects

## 🔍 Verificações Necessárias

### 1. Cloudflare SSL/TLS
**CRÍTICO:** Verifique a configuração SSL no Cloudflare:

1. Acesse: https://dash.cloudflare.com
2. Selecione o site `plenipay.com`
3. Vá em **SSL/TLS**
4. Verifique o modo SSL:
   - ✅ Deve estar **"Full"** ou **"Full (strict)"**
   - ❌ **NÃO** pode estar **"Flexible"** (causa loops!)

**Se estiver "Flexible":**
- Mude para **"Full"**
- Aguarde 1-2 minutos
- Teste novamente

### 2. Supabase Site URL
Verifique se a Site URL no Supabase está correta:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Verifique **Site URL**:
   - Deve ser: `https://plenipay.com`
   - **NÃO** pode ser `http://0.0.0.0:10000` ou similar

### 3. Cloudflare Redirect Rules
Verifique se há regras de redirect no Cloudflare:

1. No Cloudflare, vá em **Rules** → **Redirect Rules**
2. Verifique se há regras que possam estar causando loops
3. Se houver regras para `/auth/callback`, desative temporariamente

### 4. Testar em Modo Anônimo
Teste o link em uma janela anônima para evitar cache:
- Chrome: `Ctrl+Shift+N` (Windows) ou `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) ou `Cmd+Shift+P` (Mac)

## 🚀 Próximos Passos

1. ✅ Aguardar deploy no Railway (2-3 minutos)
2. ✅ Verificar configuração SSL no Cloudflare
3. ✅ Verificar Site URL no Supabase
4. ✅ Testar link em janela anônima
5. ✅ Verificar logs do Railway se ainda der erro

## 📝 Logs para Verificar

Se ainda der erro, verifique os logs no Railway:
1. Acesse: https://railway.app
2. Selecione o projeto
3. Vá em **Deployments** → **View Logs**
4. Procure por:
   - `[Middleware]` - logs do middleware
   - `[Callback]` - logs do callback
   - Erros de redirect

## ⚠️ Se Ainda Não Funcionar

Se após todas as verificações ainda der erro:

1. **Desative temporariamente o Cloudflare Proxy:**
   - No Cloudflare, vá em **DNS**
   - Encontre o registro A para `@` (plenipay.com)
   - Clique no ícone de nuvem laranja (Proxied)
   - Mude para cinza (DNS only)
   - Aguarde 5 minutos
   - Teste novamente

2. **Verifique se há redirects no Railway:**
   - Railway pode ter configurações de redirect
   - Verifique as variáveis de ambiente

3. **Teste diretamente no Railway:**
   - Acesse: `https://mlvqeal2.up.railway.app/auth/callback?token_hash=...`
   - Se funcionar, o problema é no Cloudflare
   - Se não funcionar, o problema é no código
