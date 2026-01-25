# 🔧 RESOLVER: Erro 526 - Invalid SSL Certificate (Cloudflare)

## 🔴 Problema Identificado

O erro **526** do Cloudflare significa:
- ✅ Seu navegador → Cloudflare: **Funcionando** (SSL válido)
- ✅ Cloudflare: **Funcionando**
- ❌ Cloudflare → Railway (origin): **Erro SSL**

**Causa:** O Railway não tem um certificado SSL válido ou o Cloudflare não consegue validá-lo.

---

## ✅ Soluções

### **Solução 1: Mudar Cloudflare SSL Mode para "Flexible" (RÁPIDA)**

Esta é a solução mais rápida para testar:

1. Acesse: https://dash.cloudflare.com
2. Selecione o site `plenipay.com`
3. Vá em **SSL/TLS**
4. **Mude o modo SSL de "Full (Strict)" para "Flexible"**
5. Aguarde 1-2 minutos
6. Teste novamente: `https://plenipay.com/auth/callback`

**O que isso faz:**
- Cloudflare aceita conexões HTTP do Railway (sem SSL)
- Cloudflare ainda fornece SSL para os visitantes
- **⚠️ Menos seguro, mas funciona para testar**

---

### **Solução 2: Configurar SSL no Railway (RECOMENDADA)**

O Railway precisa ter SSL configurado para funcionar com Cloudflare "Full" ou "Full (Strict)".

#### **Opção A: Usar Domínio Customizado no Railway**

1. No Railway, vá em **Settings** → **Domains**
2. Adicione o domínio customizado: `plenipay.com`
3. O Railway gerará automaticamente um certificado SSL
4. Configure o DNS no Cloudflare para apontar para o Railway

**⚠️ Mas isso pode conflitar com o Cloudflare Proxy!**

#### **Opção B: Usar Railway com Cloudflare Proxy Desabilitado**

1. No Cloudflare, vá em **DNS**
2. Encontre o registro A para `@` (plenipay.com)
3. Clique no ícone de nuvem laranja (Proxied)
4. Mude para cinza (DNS only)
5. Aguarde 5 minutos
6. Teste: `https://plenipay.com/auth/callback`

**Isso remove o Cloudflare Proxy temporariamente.**

---

### **Solução 3: Usar Cloudflare Origin Certificate (MELHOR)**

Esta é a solução ideal - usar um certificado do Cloudflare no Railway:

1. **No Cloudflare:**
   - Vá em **SSL/TLS** → **Origin Server**
   - Clique em **"Create Certificate"**
   - Selecione:
     - Validity: 15 years
     - Private key type: RSA (2048)
     - Hostnames: `*.plenipay.com` e `plenipay.com`
   - Clique em **"Create"**
   - **Copie o certificado e a chave privada**

2. **No Railway:**
   - Vá em **Variables**
   - Adicione:
     - `SSL_CERT` = (certificado completo)
     - `SSL_KEY` = (chave privada completa)
   - Ou configure no `server.js` para usar esses certificados

**⚠️ Isso requer modificar o `server.js` para usar HTTPS.**

---

## 🎯 Solução Rápida (Recomendada para Testar)

### **Passo 1: Mudar Cloudflare para "Flexible"**

1. Cloudflare → SSL/TLS
2. Mude de "Full (Strict)" para **"Flexible"**
3. Aguarde 1-2 minutos

### **Passo 2: Testar**

1. Teste: `https://plenipay.com/auth/callback?token_hash=test&type=magiclink&next=/home`
2. Se funcionar, o problema era o SSL mode

### **Passo 3: Depois, Configurar SSL Corretamente**

Após confirmar que funciona, configure SSL adequadamente:
- Use Cloudflare Origin Certificate no Railway
- Ou mantenha "Flexible" (menos seguro, mas funciona)

---

## 🔍 Verificar Status Atual

### **1. Verificar SSL Mode no Cloudflare**

1. Cloudflare → SSL/TLS
2. Verifique o modo atual
3. Se estiver "Full (Strict)", mude para "Flexible" temporariamente

### **2. Verificar Railway**

1. Acesse: `https://mlvqeal2.up.railway.app`
2. **Se funcionar:**
   - ✅ Railway está funcionando
   - ❌ Problema é SSL entre Cloudflare e Railway

3. **Se não funcionar:**
   - ❌ Problema é no Railway (não SSL)
   - Verifique logs do Railway

---

## 📝 Checklist

- [ ] Cloudflare SSL mode mudado para "Flexible"
- [ ] Aguardou 1-2 minutos para propagação
- [ ] Testou `https://plenipay.com/auth/callback`
- [ ] Se funcionou, planejar configuração SSL adequada
- [ ] Se não funcionou, verificar logs do Railway

---

## ⚠️ Importante

**"Flexible" mode é menos seguro porque:**
- Cloudflare → Railway: HTTP (sem criptografia)
- Visitante → Cloudflare: HTTPS (criptografado)

**Para produção, use:**
- Cloudflare Origin Certificate no Railway
- Cloudflare SSL mode: "Full (Strict)"

Mas para testar agora, "Flexible" resolve o problema imediatamente.
