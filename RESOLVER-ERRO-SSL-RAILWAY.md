# 🔴 Resolver Erro "Failed to issue TLS certificate" no Railway

## ⚠️ Problema

O Railway não conseguiu emitir o certificado SSL para `plenipay.com` porque:
- O DNS ainda aponta para `66.33.22.31` (Hostinger)
- Os nameservers ainda são `dns-parking.com` (não propagaram)
- O Railway precisa que o DNS aponte para ele para validar o certificado

## ✅ Solução Completa (Passo a Passo)

### Fase 1: Aguardar Nameservers Propagarem (1-2 horas)

Você já salvou os nameservers da Hostinger. Agora precisa aguardar:

1. **Aguarde 1-2 horas** para os nameservers propagarem
2. **Verifique se propagaram** executando:
   ```bash
   dig plenipay.com NS +noall +answer
   ```
3. Você deve ver nameservers da Hostinger (não mais `dns-parking.com`)

### Fase 2: Configurar DNS na Hostinger (APÓS nameservers propagarem)

**IMPORTANTE:** Só faça isso **DEPOIS** que os nameservers propagarem!

1. Vá em **Hostinger → DNS** (ou **Zona DNS**)
2. **Remova** qualquer registro A que aponta para `66.33.22.31`
3. **Adicione** o ALIAS:
   - **Tipo:** `ALIAS`
   - **Nome:** `@`
   - **Conteúdo:** `mlvqeal2.up.railway.app`
   - **TTL:** `3600`
4. Clique em **"Salvar"**

### Fase 3: Aguardar DNS Propagar (15-30 minutos)

Após configurar o DNS:

1. **Aguarde 15-30 minutos**
2. **Verifique se propagou** executando:
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
   (IP do Railway, não da Hostinger)

### Fase 4: Tentar Novamente no Railway

Após o DNS propagar:

1. Vá em **Railway → Settings → Domains**
2. Clique no botão **"Try Again"** ao lado de `plenipay.com`
3. O Railway vai tentar emitir o certificado SSL novamente
4. Aguarde alguns minutos

## 📋 Checklist Completo

### Agora (Imediato):
- [x] Nameservers salvos na Hostinger
- [ ] Aguardando nameservers propagarem (1-2 horas)

### Após Nameservers Propagarem:
- [ ] Verificado com `dig plenipay.com NS` que nameservers mudaram
- [ ] Configurado ALIAS na Hostinger apontando para Railway
- [ ] Removido registros A antigos

### Após DNS Propagar:
- [ ] Verificado com `dig plenipay.com` que está apontando para Railway
- [ ] Clicado em "Try Again" no Railway
- [ ] Aguardado alguns minutos para SSL ser emitido

## ⏰ Timeline Esperado

1. **Agora:** Nameservers salvos ✅
2. **1-2 horas:** Nameservers propagam
3. **+15 minutos:** Configurar DNS na Hostinger
4. **+15-30 minutos:** DNS propaga
5. **+5 minutos:** Clicar "Try Again" no Railway
6. **+5 minutos:** SSL é emitido ✅

**Total:** ~2-3 horas do início ao fim

## 🔍 Como Verificar Cada Etapa

### Verificar se Nameservers Propagaram:
```bash
dig plenipay.com NS +noall +answer
```
**Deve mostrar:** nameservers da Hostinger (não `dns-parking.com`)

### Verificar se DNS Propagou:
```bash
dig plenipay.com @8.8.8.8
```
**Deve mostrar:** `mlvqeal2.up.railway.app` ou IP do Railway

### Verificar se SSL Foi Emitido:
- No Railway, o status de `plenipay.com` deve mudar de "Failed" para "Active" (verde)

## 🐛 Se Ainda Não Funcionar

1. **Verifique se nameservers realmente propagaram** (pode levar até 48 horas)
2. **Verifique se DNS está apontando para Railway** (não para Hostinger)
3. **Entre em contato com suporte do Railway** se necessário
4. **Verifique se não há registros A conflitantes** na Hostinger

## ⚠️ IMPORTANTE

- **NÃO configure DNS na Hostinger** enquanto nameservers ainda são `dns-parking.com`
- **Aguarde nameservers propagarem primeiro** (1-2 horas)
- **Só depois configure o DNS** na Hostinger
- **Só depois clique em "Try Again"** no Railway

## ✅ Status Atual

- ✅ Nameservers salvos na Hostinger
- ⏳ Aguardando nameservers propagarem (1-2 horas)
- ⏳ Depois: Configurar DNS na Hostinger
- ⏳ Depois: Aguardar DNS propagar
- ⏳ Depois: Clicar "Try Again" no Railway
