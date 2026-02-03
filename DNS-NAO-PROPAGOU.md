# ⚠️ DNS Ainda Não Propagou Completamente

## 🔍 Problema Identificado

O DNS de `plenipay.com` ainda está apontando para `66.33.22.31` (Hostinger) em vez de `mlvqeal2.up.railway.app` (Railway).

**Evidências:**
- `dig plenipay.com` mostra: `66.33.22.31` (IP da Hostinger)
- `curl https://plenipay.com` retorna servidor `LiteSpeed` (Hostinger)
- O ALIAS está configurado na Hostinger, mas o DNS global ainda não atualizou

## ✅ O Que Está Correto

- ✅ ALIAS configurado na Hostinger: `@` → `mlvqeal2.up.railway.app`
- ✅ CNAME configurado para `www`: `www` → `mlvqeal2.up.railway.app`
- ✅ `www.plenipay.com` está funcionando (verde no Railway)

## ⏳ Por Que Ainda Não Funcionou

O DNS pode levar **até 48 horas** para propagar completamente, mas geralmente leva **15-30 minutos**. Alguns fatores podem atrasar:

1. **TTL alto:** Se o TTL antigo era alto (ex: 14400 segundos = 4 horas), pode demorar mais
2. **Cache DNS:** Servidores DNS podem ter cache do registro antigo
3. **Propagação gradual:** DNS propaga gradualmente pelo mundo

## 🔧 Soluções

### Solução 1: Aguardar Mais Tempo (Recomendado)

1. **Aguarde mais 30-60 minutos**
2. **Verifique novamente com:**
   ```bash
   dig plenipay.com @8.8.8.8
   ```
3. Você deve ver algo como:
   ```
   plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
   ```
   OU
   ```
   plenipay.com.    IN    A    66.33.22.134
   ```
   (O IP do Railway, não da Hostinger)

### Solução 2: Verificar se ALIAS Está Correto na Hostinger

1. Vá na **Hostinger → DNS**
2. Verifique se o ALIAS está assim:
   - **Tipo:** `ALIAS`
   - **Nome:** `@`
   - **Conteúdo:** `mlvqeal2.up.railway.app`
   - **TTL:** `14400` (ou menor, como `3600`)

3. Se estiver diferente, **edite** e corrija

### Solução 3: Reduzir TTL (Opcional)

Se quiser acelerar futuras mudanças:

1. Vá na **Hostinger → DNS**
2. Edite o ALIAS
3. Mude o **TTL** de `14400` para `3600` (1 hora)
4. Salve

**Nota:** Isso não acelera a propagação atual, mas ajuda em mudanças futuras.

### Solução 4: Limpar Cache DNS Local

No seu computador:

```bash
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

### Solução 5: Verificar em Múltiplos Servidores DNS

Teste em diferentes servidores DNS:

```bash
# Google DNS
dig plenipay.com @8.8.8.8

# Cloudflare DNS
dig plenipay.com @1.1.1.1

# OpenDNS
dig plenipay.com @208.67.222.222
```

Se algum deles mostrar o Railway, significa que está propagando gradualmente.

## 🔍 Verificar Status no Railway

1. Vá em **Railway → Settings → Domains**
2. Verifique o status de `plenipay.com`:
   - ⏳ **"Pending"** = aguardando DNS propagar
   - ✅ **"Active"** = funcionando (verde)
   - ❌ **"Failed"** = problema de DNS

## 📋 Checklist

- [ ] ALIAS configurado corretamente na Hostinger
- [ ] Aguardado pelo menos 30 minutos após configurar
- [ ] Verificado com `dig` se está apontando para Railway
- [ ] Limpado cache DNS local
- [ ] Verificado status no Railway

## ⏰ Timeline Esperado

- **0-15 minutos:** DNS pode ainda mostrar Hostinger
- **15-30 minutos:** DNS deve começar a mostrar Railway
- **30-60 minutos:** DNS deve estar propagado na maioria dos lugares
- **Até 48 horas:** Propagação completa em todo o mundo

## 🐛 Se Após 2 Horas Ainda Não Funcionar

1. **Verifique se o ALIAS está realmente salvo** na Hostinger
2. **Verifique se não há registros A conflitantes** (deve ter apenas ALIAS)
3. **Entre em contato com suporte da Hostinger** se necessário
4. **Verifique se o domínio está adicionado no Railway**

## ✅ Quando Funcionar

Quando o DNS propagar, você verá:

1. **No `dig`:**
   ```
   plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
   ```

2. **No Railway:**
   - Status muda de "Pending" para "Active" (verde)

3. **No navegador:**
   - `https://plenipay.com` carrega a aplicação (não mais 404)
