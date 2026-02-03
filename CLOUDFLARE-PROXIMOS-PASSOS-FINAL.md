# ✅ Cloudflare - Próximos Passos (DNS Configurado!)

## ✅ Configuração Atual (Correta!)

Você já tem:
- ✅ **A `plenipay.com`** → `66.33.22.31` (Proxied ✅)
- ✅ **CAA records** (deixe como estão)

## 📋 Próximos Passos

### **PASSO 1: Verificar se CNAME `www` Está Configurado**

Na mesma lista, verifique se existe:
- **CNAME `www`** → `mlvqeal2.up.railway.app` (Proxied ✅)

**Se não existir**, adicione:
1. Clique em **"+ Add record"**
2. Configure:
   - Type: `CNAME`
   - Name: `www`
   - Target: `mlvqeal2.up.railway.app`
   - Proxy: ✅ **Proxied** (laranja)
   - TTL: `Auto`
3. Salve

### **PASSO 2: Remover Registros NS (Se Ainda Existirem)**

Procure na lista por registros do tipo **NS**:
- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

**Se encontrar**, remova-os (Delete).

### **PASSO 3: Continuar no Cloudflare**

1. **Role a página até o final**
2. Clique em **"Continue"** ou **"Next"** ou **"Save"**
3. O Cloudflare vai mostrar os **nameservers** que você precisa usar
4. **Anote esses nameservers!** (algo como `ns1.cloudflare.com` e `ns2.cloudflare.com`)

### **PASSO 4: Mudar Nameservers na Hostinger**

1. Vá em **Hostinger → Domínios**
2. Clique em **"Gerenciar"** no `plenipay.com`
3. Vá em **"Nameservers"** ou **"Servidores DNS"**
4. Clique em **"Alterar Nameservers"**
5. Altere para os nameservers do Cloudflare:
   - **Nameserver 1:** `ns1.cloudflare.com` (ou o que o Cloudflare mostrar)
   - **Nameserver 2:** `ns2.cloudflare.com` (ou o que o Cloudflare mostrar)
6. Clique em **"Salvar"**

### **PASSO 5: Aguardar Propagação (15-30 minutos)**

Após mudar os nameservers:

1. **Aguarde 15-30 minutos**
2. **Verifique se propagou:**
   ```bash
   dig plenipay.com NS +noall +answer
   ```
3. Você deve ver os nameservers do Cloudflare (não mais `dns-parking.com`)

### **PASSO 6: Configurar SSL no Cloudflare**

Após os nameservers propagarem:

1. No Cloudflare, vá em **SSL/TLS**
2. Selecione **"Full"** ou **"Full (strict)"**
3. O Cloudflare vai emitir SSL automaticamente em **5-10 minutos**

## ✅ Checklist

- [x] Registro A `plenipay.com` → `66.33.22.31` (Proxied ✅) ✅
- [ ] Verificado se CNAME `www` existe (se não, adicionar)
- [ ] Removidos registros NS (`dns-parking.com`)
- [ ] Clicado "Continue" no Cloudflare
- [ ] Anotado nameservers do Cloudflare
- [ ] Mudado nameservers na Hostinger
- [ ] Aguardado 15-30 minutos
- [ ] Configurado SSL como "Full"
- [ ] SSL emitido automaticamente ✅

## 🎯 Resultado Esperado

Após 15-30 minutos:
- ✅ DNS propagado
- ✅ SSL ativo (padlock verde)
- ✅ Site funcionando em `https://plenipay.com`
- ✅ CDN ativo (site mais rápido)

## ⚠️ IMPORTANTE

- **Proxy DEVE estar Proxied** (laranja) - você já configurou corretamente! ✅
- **Aguarde nameservers propagarem** antes de configurar SSL
- **SSL será automático** após nameservers propagarem
