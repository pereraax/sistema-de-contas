# 🔴 CORRIGIR plenipay.com AGORA

## ⚠️ Problema Identificado

- ✅ `www.plenipay.com` está funcionando (verde) - DNS correto
- ❌ `plenipay.com` está pendente (amarelo) - DNS ainda apontando para Hostinger

**Causa:** O domínio raiz `plenipay.com` ainda tem um registro **A** apontando para `66.33.22.31` (Hostinger) em vez de um **CNAME/ALIAS** apontando para o Railway.

## ✅ Solução Rápida (5 minutos)

### Passo 1: Remover Registro A Antigo na Hostinger

1. Vá na **Hostinger → DNS**
2. Procure por um registro **A** que aponta para `66.33.22.31` ou qualquer IP
3. **DELETE** esse registro A (é ele que está causando o problema)

### Passo 2: Adicionar CNAME/ALIAS na Hostinger

1. Vá na **Hostinger → DNS**
2. Clique em **"Adicionar Registro"** ou **"+ Add Record"**
3. Configure:
   - **Tipo:** `CNAME` ou `ALIAS` (se Hostinger suportar ALIAS para domínio raiz)
   - **Nome/Host:** `@` (ou deixe em branco para o domínio raiz)
   - **Valor/Target:** `mlvqeal2.up.railway.app` (mesmo valor do www)
   - **TTL:** `3600` (ou automático)
4. Clique em **"Salvar"**

**Nota:** Se a Hostinger não permitir CNAME no domínio raiz (`@`), use **ALIAS** em vez de CNAME.

### Passo 3: Aguardar Propagação (15-30 minutos)

Após salvar, aguarde 15-30 minutos para o DNS propagar.

### Passo 4: Verificar se Funcionou

Execute no terminal:

```bash
dig plenipay.com @8.8.8.8
```

Você deve ver algo como:

```
plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
```

**OU** se usar ALIAS:

```
plenipay.com.    IN    ALIAS    mlvqeal2.up.railway.app.
```

### Passo 5: Verificar no Railway

Após o DNS propagar (15-30 minutos):

1. Vá em **Railway → Settings → Domains**
2. Verifique se `plenipay.com` mudou de **"Pending"** para **"Active"** (verde)
3. O SSL será configurado automaticamente

## ⚠️ IMPORTANTE

- **NÃO** deixe registros A e CNAME ao mesmo tempo (conflito)
- **DELETE** o registro A antigo ANTES de adicionar CNAME/ALIAS
- Se Hostinger não permitir CNAME no domínio raiz, use **ALIAS**

## 📋 Checklist

- [ ] Registro A antigo removido da Hostinger
- [ ] CNAME/ALIAS adicionado na Hostinger apontando para `mlvqeal2.up.railway.app`
- [ ] Aguardado 15-30 minutos para propagação DNS
- [ ] Verificado com `dig` se está apontando para Railway
- [ ] Status no Railway mudou para "Active" (verde)

## 🐛 Se Ainda Não Funcionar Após 1 Hora

1. **Verifique se o registro A foi realmente removido** na Hostinger
2. **Verifique se o CNAME/ALIAS foi adicionado corretamente**
3. **Aguarde mais tempo** (DNS pode levar até 48 horas em alguns casos)
4. **Tente limpar o cache DNS** do seu computador:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   ```

## ✅ Status Esperado

Após corrigir o DNS:
- `www.plenipay.com` → ✅ Verde (já está funcionando)
- `plenipay.com` → ✅ Verde (deve ficar verde após DNS propagar)
