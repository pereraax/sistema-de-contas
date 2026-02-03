# 🔧 Configurar Domínio Personalizado no Railway

## ⚠️ Problema

A aplicação funciona em `https://sistema-de-contas-1-production.up.railway.app` mas não funciona em `https://plenipay.com`.

## ✅ Solução: Configurar Domínio no Railway

### Passo 1: Adicionar Domínio no Railway

1. Vá em **Railway → seu projeto → Settings**
2. Role até a seção **"Domains"** ou **"Custom Domain"**
3. Clique em **"Add Domain"** ou **"+ New Domain"**
4. Digite: `plenipay.com`
5. Clique em **"Add"** ou **"Save"**

### Passo 2: Configurar DNS na Hostinger

O Railway vai mostrar as instruções de DNS. Geralmente você precisa:

#### Opção A: CNAME (Recomendado)

1. Vá na **Hostinger → DNS**
2. Adicione um registro **CNAME**:
   - **Nome/Host:** `@` (ou deixe em branco para o domínio raiz)
   - **Valor/Target:** `mlvqeal2.up.railway.app` (ou o valor que o Railway mostrar)
   - **TTL:** `3600` (ou automático)

#### Opção B: ALIAS (Se Hostinger suportar)

1. Vá na **Hostinger → DNS**
2. Adicione um registro **ALIAS**:
   - **Nome/Host:** `@`
   - **Valor/Target:** `mlvqeal2.up.railway.app`
   - **TTL:** `3600`

### Passo 3: Configurar www.plenipay.com (Opcional)

Se quiser que `www.plenipay.com` também funcione:

1. No **Railway**, adicione também `www.plenipay.com` como domínio
2. Na **Hostinger**, adicione um registro **CNAME**:
   - **Nome/Host:** `www`
   - **Valor/Target:** `mlvqeal2.up.railway.app`
   - **TTL:** `3600`

### Passo 4: Aguardar Propagação DNS

- Pode levar de **5 minutos a 48 horas**
- Geralmente leva **15-30 minutos**
- Verifique com: `dig plenipay.com @8.8.8.8`

### Passo 5: Verificar SSL

O Railway configura SSL automaticamente após o DNS propagar. Pode levar alguns minutos.

## 🔍 Verificar se Está Configurado

### No Railway:

1. Vá em **Settings → Domains**
2. Verifique se `plenipay.com` aparece na lista
3. Verifique o status:
   - ✅ **"Active"** = funcionando
   - ⏳ **"Pending"** = aguardando DNS
   - ❌ **"Failed"** = problema de DNS

### Verificar DNS:

Execute no terminal:

```bash
dig plenipay.com @8.8.8.8
```

Procure por uma linha que mostre o Railway:

```
plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
```

## 🐛 Problemas Comuns

### 1. DNS não propagou

**Sintoma:** Domínio não resolve ou mostra erro de DNS

**Solução:**
- Aguarde mais tempo (até 48 horas)
- Verifique se o registro DNS está correto na Hostinger
- Use `dig` para verificar se o DNS propagou

### 2. SSL não configurado

**Sintoma:** Erro de certificado SSL ou "Not Secure"

**Solução:**
- Aguarde alguns minutos após o DNS propagar
- O Railway configura SSL automaticamente
- Se não funcionar após 1 hora, verifique se o domínio está adicionado corretamente no Railway

### 3. Domínio não adicionado no Railway

**Sintoma:** Domínio resolve mas mostra erro 404 ou "Application failed to respond"

**Solução:**
- Adicione o domínio no Railway (Settings → Domains)
- Aguarde alguns minutos
- Faça um redeploy se necessário

### 4. Variáveis de ambiente com URL errada

**Sintoma:** Aplicação funciona mas há erros de redirect ou callback

**Solução:**
- Verifique se `NEXT_PUBLIC_SITE_URL` = `https://plenipay.com`
- Verifique se `NEXT_PUBLIC_APP_URL` = `https://plenipay.com`
- Faça um redeploy após alterar variáveis `NEXT_PUBLIC_*`

## 📋 Checklist

- [ ] Domínio `plenipay.com` adicionado no Railway
- [ ] Registro CNAME/ALIAS configurado na Hostinger
- [ ] DNS propagou (verificado com `dig`)
- [ ] SSL configurado (padlock verde no navegador)
- [ ] Variáveis `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` = `https://plenipay.com`
- [ ] Redeploy feito após configurar variáveis

## 🔗 Links Úteis

- Railway Domains: https://docs.railway.app/deploy/custom-domains
- Verificar DNS: https://dnschecker.org
- Testar SSL: https://www.ssllabs.com/ssltest/
