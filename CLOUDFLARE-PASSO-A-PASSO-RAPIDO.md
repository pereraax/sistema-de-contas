# ⚡ Cloudflare - Passo a Passo Rápido

## 🎯 Objetivo

Configurar Cloudflare para ter SSL automático e rápido para `plenipay.com`.

## 📋 Passos Rápidos

### 1️⃣ Criar Conta (2 min)
- Acesse: https://dash.cloudflare.com/sign-up
- Crie conta gratuita

### 2️⃣ Adicionar Domínio (1 min)
- Clique "Add a Site"
- Digite: `plenipay.com`
- Escolha plano **Free**

### 3️⃣ Configurar DNS (3 min)
No Cloudflare → DNS, adicione:

**Registro 1:**
- Type: `CNAME`
- Name: `@`
- Target: `mlvqeal2.up.railway.app`
- Proxy: ✅ **Proxied** (laranja)
- Save

**Registro 2:**
- Type: `CNAME`
- Name: `www`
- Target: `mlvqeal2.up.railway.app`
- Proxy: ✅ **Proxied** (laranja)
- Save

### 4️⃣ Mudar Nameservers (3 min)
- Cloudflare mostra 2 nameservers (ex: `ns1.cloudflare.com`)
- Na Hostinger → Nameservers
- Altere para os nameservers do Cloudflare
- Salve

### 5️⃣ Configurar SSL (1 min)
- Cloudflare → SSL/TLS
- Selecione **"Full"**
- Pronto!

### 6️⃣ Aguardar (15-30 min)
- Aguarde propagação
- SSL será emitido automaticamente

## ✅ Resultado

Após 15-30 minutos:
- ✅ DNS propagado
- ✅ SSL ativo
- ✅ Site funcionando

## ⚠️ Lembrete

**Proxy deve estar Proxied (laranja)** para SSL funcionar!
