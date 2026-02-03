# 🔧 Corrigir DNS do plenipay.com para Railway

## ⚠️ Problema Identificado

O DNS de `plenipay.com` está apontando para `66.33.22.31` (IP da Hostinger), mas precisa apontar para o Railway.

## ✅ Solução: Configurar CNAME/ALIAS na Hostinger

### Passo 1: Adicionar Domínio no Railway (se ainda não fez)

1. Vá em **Railway → seu projeto → Settings**
2. Role até **"Domains"** ou **"Custom Domain"**
3. Clique em **"Add Domain"** ou **"+ New Domain"**
4. Digite: `plenipay.com`
5. Clique em **"Add"**

O Railway vai mostrar o valor do CNAME (algo como `mlvqeal2.up.railway.app`). **Anote esse valor!**

### Passo 2: Remover Registros A Antigos na Hostinger

1. Vá na **Hostinger → DNS**
2. Procure por registros **A** que apontam para `66.33.22.31` ou qualquer IP
3. **DELETE** esses registros A (eles estão conflitando)

### Passo 3: Adicionar CNAME/ALIAS na Hostinger

1. Vá na **Hostinger → DNS**
2. Clique em **"Adicionar Registro"** ou **"+ Add Record"**
3. Configure:
   - **Tipo:** `CNAME` ou `ALIAS` (se Hostinger suportar ALIAS para domínio raiz)
   - **Nome/Host:** `@` (ou deixe em branco para o domínio raiz)
   - **Valor/Target:** `mlvqeal2.up.railway.app` (ou o valor que o Railway mostrar)
   - **TTL:** `3600` (ou automático)
4. Clique em **"Salvar"** ou **"Add"**

**Nota:** Se a Hostinger não permitir CNAME no domínio raiz (`@`), use **ALIAS** em vez de CNAME.

### Passo 4: Configurar www.plenipay.com (Opcional)

Se quiser que `www.plenipay.com` também funcione:

1. No **Railway**, adicione também `www.plenipay.com` como domínio
2. Na **Hostinger**, adicione um registro **CNAME**:
   - **Tipo:** `CNAME`
   - **Nome/Host:** `www`
   - **Valor/Target:** `mlvqeal2.up.railway.app` (mesmo valor do domínio raiz)
   - **TTL:** `3600`

### Passo 5: Aguardar Propagação DNS

- Pode levar de **5 minutos a 48 horas**
- Geralmente leva **15-30 minutos**
- Verifique com: `dig plenipay.com @8.8.8.8`

### Passo 6: Verificar se Funcionou

Execute no terminal:

```bash
dig plenipay.com @8.8.8.8
```

Você deve ver algo como:

```
plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
```

Ou se usar ALIAS:

```
plenipay.com.    IN    ALIAS    mlvqeal2.up.railway.app.
```

## 🔍 Verificar no Railway

1. Vá em **Settings → Domains**
2. Verifique se `plenipay.com` aparece na lista
3. Verifique o status:
   - ✅ **"Active"** = funcionando
   - ⏳ **"Pending"** = aguardando DNS
   - ❌ **"Failed"** = problema de DNS

## ⚠️ Importante

- **NÃO** deixe registros A e CNAME ao mesmo tempo (conflito)
- **DELETE** todos os registros A antigos antes de adicionar CNAME
- Se Hostinger não permitir CNAME no domínio raiz, use **ALIAS**

## 📋 Checklist

- [ ] Domínio `plenipay.com` adicionado no Railway
- [ ] Registros A antigos removidos da Hostinger
- [ ] CNAME/ALIAS configurado na Hostinger apontando para Railway
- [ ] DNS propagou (verificado com `dig`)
- [ ] Status no Railway mostra "Active"
- [ ] SSL configurado (padlock verde no navegador)

## 🐛 Se Ainda Não Funcionar

1. **Aguarde mais tempo** (DNS pode levar até 48 horas)
2. **Verifique se o domínio está adicionado no Railway**
3. **Verifique se não há registros A conflitantes**
4. **Tente acessar `www.plenipay.com`** (pode funcionar enquanto o raiz não propaga)
