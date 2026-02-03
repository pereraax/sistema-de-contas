# 🔴 PROBLEMA: Nameservers Apontando para DNS Parking

## ⚠️ Problema Identificado

O domínio `plenipay.com` está usando nameservers da **DNS Parking**, não da Hostinger:

- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

**Isso significa que:**
- Os registros DNS estão sendo gerenciados pela **DNS Parking**, não pela Hostinger
- Mesmo que você tenha apagado os registros na Hostinger, os nameservers ainda estão apontando para DNS Parking
- O registro A que retorna `66.33.22.31` está na **DNS Parking**, não na Hostinger

## ✅ Solução: Mudar Nameservers para Hostinger

### Opção 1: Mudar Nameservers na Hostinger (Recomendado)

1. Vá na **Hostinger → Domínios**
2. Clique em **"Gerenciar"** ou **"Manage"** no domínio `plenipay.com`
3. Procure por **"Nameservers"** ou **"Servidores DNS"**
4. Altere para os nameservers da Hostinger:
   - `ns1.dns-parking.com` → `ns1.dns-parking.com` (verifique os corretos da Hostinger)
   - `ns2.dns-parking.com` → `ns2.dns-parking.com` (verifique os corretos da Hostinger)

**Nota:** Os nameservers da Hostinger geralmente são algo como:
- `ns1.dns-parking.com` (pode ser diferente)
- `ns2.dns-parking.com` (pode ser diferente)

**OU** se a Hostinger usar nameservers próprios:
- `ns1.hostinger.com`
- `ns2.hostinger.com`

**Verifique na interface da Hostinger quais são os nameservers corretos!**

### Opção 2: Configurar DNS na DNS Parking

Se preferir manter os nameservers da DNS Parking:

1. Acesse o painel da **DNS Parking** (se tiver acesso)
2. Configure os registros DNS lá:
   - Remova o registro A que aponta para `66.33.22.31`
   - Adicione um CNAME/ALIAS apontando para `mlvqeal2.up.railway.app`

**Nota:** Você precisa ter acesso ao painel da DNS Parking para fazer isso.

## 🔍 Como Encontrar os Nameservers Corretos da Hostinger

1. Vá na **Hostinger → Domínios**
2. Clique em **"Gerenciar"** no domínio `plenipay.com`
3. Procure por **"Nameservers"** ou **"Servidores DNS"**
4. Você verá os nameservers atuais e poderá alterá-los

**OU** verifique na documentação da Hostinger quais são os nameservers padrão.

## 📋 Passo a Passo Completo

### 1. Acessar Configuração de Nameservers

1. Faça login na **Hostinger**
2. Vá em **Domínios** ou **Domains**
3. Clique em **"Gerenciar"** ou **"Manage"** no `plenipay.com`
4. Procure por **"Nameservers"** ou **"DNS Servers"**

### 2. Alterar Nameservers

1. Clique em **"Alterar Nameservers"** ou **"Change Nameservers"**
2. Altere de:
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`
   
   Para os nameservers da Hostinger (verifique na interface quais são)

3. Clique em **"Salvar"** ou **"Save"**

### 3. Aguardar Propagação

- Pode levar **15 minutos a 48 horas**
- Geralmente leva **1-2 horas**

### 4. Configurar DNS na Hostinger

Após os nameservers propagarem:

1. Vá em **Hostinger → DNS**
2. Adicione o ALIAS:
   - **Tipo:** `ALIAS`
   - **Nome:** `@`
   - **Conteúdo:** `mlvqeal2.up.railway.app`
   - **TTL:** `3600`

### 5. Verificar

Após 1-2 horas, execute:

```bash
dig plenipay.com NS +noall +answer
```

Você deve ver os nameservers da Hostinger, não da DNS Parking.

## ⚠️ IMPORTANTE

- **Aguarde a propagação dos nameservers** antes de configurar os registros DNS
- **Não configure DNS na Hostinger** enquanto os nameservers ainda apontam para DNS Parking
- **A propagação pode levar até 48 horas**, mas geralmente leva 1-2 horas

## 🐛 Se Não Tiver Acesso para Mudar Nameservers

Se você não tiver acesso para mudar os nameservers:

1. **Entre em contato com suporte da Hostinger**
2. **Peça para alterar os nameservers** para os da Hostinger
3. **Ou peça acesso ao painel da DNS Parking** para configurar os registros lá

## ✅ Checklist

- [ ] Identificado que nameservers estão na DNS Parking
- [ ] Acessado configuração de nameservers na Hostinger
- [ ] Alterado nameservers para os da Hostinger
- [ ] Aguardado 1-2 horas para propagação
- [ ] Verificado com `dig plenipay.com NS` se nameservers mudaram
- [ ] Configurado ALIAS na Hostinger após nameservers propagarem
- [ ] Verificado com `dig plenipay.com` se está apontando para Railway
