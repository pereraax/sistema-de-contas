# 🔴 PROBLEMA REAL: DNS do Domínio Raiz Não Configurado

## ✅ Descoberta

O problema **NÃO são os nameservers** - eles já estão corretos!

O problema real é que **faltam os registros DNS na Hostinger** para o domínio raiz (`plenipay.com`).

## 🔍 Evidências

### ✅ O Que Está Funcionando:
- `www.plenipay.com` → ✅ Funciona (verde no Railway)
- DNS: `www.plenipay.com` → CNAME → `mlvqeal2.up.railway.app` ✅

### ❌ O Que NÃO Está Funcionando:
- `plenipay.com` → ❌ Não funciona (erro SSL no Railway)
- DNS: `plenipay.com` → A → `66.33.22.31` (Hostinger) ❌

## 🎯 Solução: Configurar DNS do Domínio Raiz

### Passo 1: Acessar DNS na Hostinger

1. Vá em **Hostinger → DNS** (ou **Zona DNS**)
2. Procure pela seção **"Gerenciar registros DNS"**

### Passo 2: Remover Registro A Antigo (Se Existir)

1. Procure por um registro do tipo **A** para `@` (domínio raiz)
2. Se encontrar um que aponta para `66.33.22.31` ou qualquer IP:
   - Clique em **"Remover"** ou **"Delete"**
   - Confirme a remoção

### Passo 3: Adicionar ALIAS para Domínio Raiz

1. Clique em **"Adicionar Registro"** ou **"+ Add Record"**
2. Configure:
   - **Tipo:** `ALIAS` (ou `CNAME` se Hostinger não permitir ALIAS)
   - **Nome/Host:** `@` (ou deixe em branco para domínio raiz)
   - **Conteúdo/Valor:** `mlvqeal2.up.railway.app` (mesmo valor do www)
   - **TTL:** `3600` (ou automático)
3. Clique em **"Salvar"**

### Passo 4: Aguardar Propagação (15-30 minutos)

Após salvar:

1. **Aguarde 15-30 minutos**
2. **Verifique se propagou:**
   ```bash
   dig plenipay.com @8.8.8.8
   ```
3. Você deve ver algo como:
   ```
   plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
   ```
   OU
   ```
   plenipay.com.    IN    ALIAS    mlvqeal2.up.railway.app.
   ```

### Passo 5: Tentar Novamente no Railway

Após o DNS propagar:

1. Vá em **Railway → Settings → Domains**
2. Clique no botão **"Try Again"** ao lado de `plenipay.com`
3. Aguarde alguns minutos
4. O SSL deve ser emitido ✅

## 📋 Checklist

- [ ] Acessou Hostinger → DNS
- [ ] Removeu registro A antigo (se existir)
- [ ] Adicionou ALIAS para `@` apontando para `mlvqeal2.up.railway.app`
- [ ] Aguardou 15-30 minutos
- [ ] Verificou com `dig` se DNS propagou
- [ ] Clicou "Try Again" no Railway
- [ ] SSL foi emitido ✅

## ⚠️ IMPORTANTE

- **O problema NÃO são os nameservers** - eles já estão corretos
- **O problema é falta de registro DNS** para o domínio raiz
- **Você precisa adicionar ALIAS/CNAME** na Hostinger para `@` apontando para Railway
- **Mesmo valor do www:** `mlvqeal2.up.railway.app`

## 🔍 Comparação

### www.plenipay.com (Funciona):
```
www.plenipay.com → CNAME → mlvqeal2.up.railway.app ✅
```

### plenipay.com (Não Funciona):
```
plenipay.com → A → 66.33.22.31 ❌
```

### plenipay.com (Deveria Ser):
```
plenipay.com → ALIAS → mlvqeal2.up.railway.app ✅
```

## ✅ Resumo

1. **Nameservers:** Já estão corretos ✅
2. **DNS do www:** Já está configurado ✅
3. **DNS do raiz:** Precisa ser configurado ❌ ← **FAÇA ISSO AGORA!**

Vá na Hostinger → DNS e adicione o ALIAS para `@` apontando para `mlvqeal2.up.railway.app`.
