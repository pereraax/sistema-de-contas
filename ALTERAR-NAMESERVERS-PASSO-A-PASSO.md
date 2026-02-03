# ✅ Alterar Nameservers - Passo a Passo

## 🎯 O Que Você Precisa Fazer

Na tela que você está vendo:

1. **A opção "Usar nameservers da Hostinger (recomendado)" já está selecionada** ✅
2. **Clique no botão "Salvar"** (botão roxo na parte inferior)
3. **Aguarde a propagação** (15 minutos a 2 horas)

## 📋 Passo a Passo Detalhado

### Passo 1: Confirmar Seleção

Na tela que você está vendo:
- ✅ Certifique-se de que **"Usar nameservers da Hostinger (recomendado)"** está selecionada (bolinha roxa preenchida)
- ❌ **NÃO** selecione "Alterar nameservers"

### Passo 2: Salvar

1. Role a página até o final
2. Clique no botão **"Salvar"** (botão roxo com texto branco)
3. Aguarde a confirmação de que foi salvo

### Passo 3: Aguardar Propagação

- Pode levar **15 minutos a 48 horas**
- Geralmente leva **1-2 horas**

### Passo 4: Verificar se Funcionou

Após 1-2 horas, execute no terminal:

```bash
dig plenipay.com NS +noall +answer
```

Você deve ver algo como:

```
plenipay.com.    IN    NS    ns1.dns-parking.com.
plenipay.com.    IN    NS    ns2.dns-parking.com.
```

**OU** (se já propagou):

```
plenipay.com.    IN    NS    ns1.hostinger.com.
plenipay.com.    IN    NS    ns2.hostinger.com.
```

**Nota:** Os nameservers da Hostinger podem ter nomes diferentes. O importante é que **não sejam mais** `dns-parking.com`.

### Passo 5: Configurar DNS na Hostinger

**APENAS APÓS** os nameservers propagarem (1-2 horas depois):

1. Vá em **Hostinger → DNS** (ou **Zona DNS**)
2. Adicione o ALIAS:
   - **Tipo:** `ALIAS`
   - **Nome:** `@`
   - **Conteúdo:** `mlvqeal2.up.railway.app`
   - **TTL:** `3600`
3. Clique em **"Salvar"**

## ⚠️ IMPORTANTE

- **NÃO configure DNS na Hostinger** enquanto os nameservers ainda são `dns-parking.com`
- **Aguarde 1-2 horas** após salvar os nameservers
- **Verifique com `dig`** se os nameservers mudaram antes de configurar DNS

## 📋 Checklist

- [ ] Opção "Usar nameservers da Hostinger" está selecionada
- [ ] Clicou em "Salvar"
- [ ] Aguardou 1-2 horas
- [ ] Verificou com `dig plenipay.com NS` se nameservers mudaram
- [ ] Configurou ALIAS na Hostinger após nameservers propagarem
- [ ] Verificou com `dig plenipay.com` se está apontando para Railway

## 🐛 Se Após 2 Horas Ainda Não Funcionar

1. **Verifique se realmente clicou em "Salvar"**
2. **Verifique se a opção está selecionada corretamente**
3. **Entre em contato com suporte da Hostinger** se necessário
