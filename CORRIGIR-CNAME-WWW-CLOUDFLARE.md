# 🔧 Corrigir CNAME www no Cloudflare

## ⚠️ Problema

O erro "already exists" significa que **já existe um registro para `www`** na lista.

## ✅ Solução: Encontrar e Editar o CNAME www Existente

### Passo 1: Procurar o CNAME www na Lista

Na lista de registros DNS, procure por um registro que tenha:

- **Type:** `CNAME`
- **Name:** `www`
- **Content/Target:** Pode ser qualquer coisa (Hostinger, Railway, etc.)

**Dica:** Role a lista para baixo - pode estar mais abaixo na lista!

### Passo 2: Editar o CNAME www Existente

**Se encontrar:**

1. **Clique em "Edit"** nesse registro CNAME `www`
2. **Altere:**
   - **Target/Content:** `mlvqeal2.up.railway.app`
   - **Proxy status:** ✅ **Proxied** (deve estar laranja/ativado)
   - **TTL:** `Auto`
3. **Clique em "Save"**

### Passo 3: Se Não Encontrar o CNAME www

Se você não encontrar um CNAME `www` na lista, pode ser que:

1. **Há um registro A para `www`** (não CNAME)
   - Se encontrar registro A com Name `www`:
   - Clique em "Delete"
   - Depois adicione o CNAME `www`

2. **O registro está em outra página**
   - Use a busca: "Search DNS Records" → digite `www`
   - Isso vai mostrar todos os registros com `www`

## 🔍 Como Procurar

1. **Use a busca:**
   - No topo da página, há um campo "Search DNS Records"
   - Digite: `www`
   - Pressione Enter
   - Isso vai mostrar todos os registros relacionados a `www`

2. **Role a lista:**
   - A lista pode ter muitos registros
   - Role para baixo para ver todos
   - Procure por Type `CNAME` com Name `www`

## ✅ O Que Você Deve Ter

Após corrigir, você deve ter:

- ✅ **A `plenipay.com`** → `66.33.22.31` (Proxied ✅) - Já está!
- ✅ **CNAME `www`** → `mlvqeal2.up.railway.app` (Proxied ✅) - Precisa configurar!

## 📋 Checklist

- [x] Registro A `plenipay.com` configurado ✅
- [ ] Procurado CNAME `www` na lista (ou usando busca)
- [ ] Editado CNAME `www` para `mlvqeal2.up.railway.app` (Proxied)
- [ ] OU removido registro A `www` e adicionado CNAME `www`
- [ ] Removidos registros NS (`dns-parking.com`)
- [ ] Clicado "Continue" no Cloudflare

## 🎯 Próximo Passo

**Use a busca "Search DNS Records" e digite `www`** para encontrar o registro existente!
