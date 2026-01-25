# 🔧 RESOLVER: Loop de Redirecionamento com Cloudflare "Full"

## 🔴 Problema

Com Cloudflare em modo **"Full"**, está ocorrendo `ERR_TOO_MANY_REDIRECTS`.

**Causa provável:** O Cloudflare em modo "Full" tenta conectar ao Railway via HTTPS, mas o Railway pode não ter SSL válido, causando loops de redirect.

---

## ✅ Solução 1: Mudar para "Flexible" (RÁPIDA)

Esta é a solução mais rápida:

1. Acesse: https://dash.cloudflare.com
2. Selecione `plenipay.com`
3. Vá em **SSL/TLS**
4. Mude de **"Full"** para **"Flexible"**
5. Aguarde 1-2 minutos
6. Teste novamente

**O que isso faz:**
- Cloudflare aceita HTTP do Railway (sem SSL)
- Cloudflare ainda fornece SSL para visitantes
- Resolve o loop imediatamente

---

## ✅ Solução 2: Verificar Redirect Rules no Cloudflare

O Cloudflare pode ter regras automáticas causando loops:

1. No Cloudflare, vá em **Rules** → **Redirect Rules**
2. **Procure por regras que:**
   - Redirecionam HTTP → HTTPS
   - Redirecionam `/auth/callback`
   - Redirecionam `/home`
3. **Se encontrar:**
   - Desative temporariamente
   - Teste novamente
   - Se funcionar, ajuste a regra

---

## ✅ Solução 3: Verificar Automatic HTTPS Rewrites

1. No Cloudflare, vá em **SSL/TLS** → **Edge Certificates**
2. Procure por **"Automatic HTTPS Rewrites"**
3. Se estiver ativado, **desative temporariamente**
4. Teste novamente

---

## ✅ Solução 4: Verificar Always Use HTTPS

1. No Cloudflare, vá em **SSL/TLS** → **Edge Certificates**
2. Procure por **"Always Use HTTPS"**
3. Se estiver ativado, pode estar causando loops
4. **Desative temporariamente** e teste

---

## 🔍 Diagnóstico

### Verificar Logs do Railway

Os logs mostram o que está acontecendo:

1. Acesse: https://railway.app
2. Vá em **Deployments** → **View Logs**
3. **Procure por:**
   - Múltiplas chamadas a `/auth/callback`
   - Padrão: `/auth/callback` → `/home` → `/auth/callback` → ...

### Verificar Headers HTTP

O Cloudflare pode estar adicionando headers que causam loops:

1. No Cloudflare, vá em **Rules** → **Transform Rules** → **Modify Response Header**
2. Verifique se há regras que modificam headers de redirect
3. Desative temporariamente e teste

---

## 🎯 Ordem de Prioridade

1. 🔴 **Mudar para "Flexible"** - Resolve imediatamente
2. 🟡 **Verificar Redirect Rules** - Pode ser a causa
3. 🟡 **Verificar Automatic HTTPS Rewrites** - Pode causar loops
4. 🟢 **Verificar Always Use HTTPS** - Pode causar loops
5. 🟢 **Verificar Logs do Railway** - Para diagnóstico

---

## 📝 Após Resolver

Após resolver o loop:

1. **Teste o link de confirmação:**
   ```
   https://plenipay.com/auth/callback?token_hash=...&type=signup&next=/home
   ```

2. **Verifique se:**
   - ✅ Não dá mais "Too Many Redirects"
   - ✅ Redireciona para `/home` corretamente
   - ✅ Email é confirmado

3. **Para produção futura:**
   - Configure SSL no Railway (Origin Certificate)
   - Ou mantenha "Flexible" (menos seguro, mas funciona)

---

## ⚠️ Importante

**"Flexible" mode:**
- ✅ Funciona imediatamente
- ✅ Resolve loops
- ⚠️ Menos seguro (HTTP entre Cloudflare e Railway)

**Para produção ideal:**
- Configure Cloudflare Origin Certificate no Railway
- Use "Full (Strict)" mode
- Mas isso requer configuração adicional no Railway
