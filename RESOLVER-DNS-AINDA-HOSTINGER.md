# 🔴 DNS Ainda Apontando para Hostinger

## ⚠️ Problema Confirmado

O `dig` mostra que `plenipay.com` ainda está apontando para `66.33.22.31` (Hostinger) via registro **A**, não para o Railway.

```
plenipay.com.           60      IN      A       66.33.22.31
```

## 🔍 Possíveis Causas

### 1. Registro A Antigo Ainda Existe (Mais Provável)

Mesmo que você tenha configurado o ALIAS, pode haver um registro **A** antigo que está sobrescrevendo o ALIAS.

**Solução:**
1. Vá na **Hostinger → DNS**
2. Procure por **TODOS** os registros do tipo **A** para `@` (domínio raiz)
3. **DELETE TODOS** os registros A que apontam para `66.33.22.31` ou qualquer IP
4. Deixe **APENAS** o ALIAS apontando para `mlvqeal2.up.railway.app`

### 2. ALIAS Não Está Configurado Corretamente

Verifique se o ALIAS está exatamente assim:

- **Tipo:** `ALIAS` (não CNAME)
- **Nome:** `@` (ou vazio/raiz)
- **Conteúdo:** `mlvqeal2.up.railway.app` (exatamente assim, sem `https://`)
- **TTL:** `14400` ou `3600`

### 3. DNS Ainda Não Propagou

Mesmo após corrigir, pode levar 15-60 minutos para propagar.

## ✅ Passo a Passo para Corrigir

### Passo 1: Verificar e Remover Registros A

1. Vá na **Hostinger → DNS**
2. Procure na lista por registros do tipo **A**
3. Se encontrar algum registro **A** para `@` (domínio raiz):
   - Clique em **"Remover"** ou **"Delete"**
   - Confirme a remoção

### Passo 2: Verificar ALIAS

1. Na mesma página de DNS
2. Procure pelo registro **ALIAS** para `@`
3. Verifique se está assim:
   - **Tipo:** `ALIAS`
   - **Nome:** `@`
   - **Conteúdo:** `mlvqeal2.up.railway.app`
4. Se estiver diferente, **edite** e corrija

### Passo 3: Aguardar Propagação

Após remover o registro A e verificar o ALIAS:

1. **Aguarde 15-30 minutos**
2. Execute novamente:
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

## 🔍 Como Verificar se Há Registro A na Hostinger

Na interface da Hostinger:

1. Vá em **DNS**
2. Procure na lista por registros do tipo **A**
3. Se encontrar algum com:
   - **Nome:** `@` (ou vazio)
   - **Conteúdo:** `66.33.22.31` (ou qualquer IP)
   - **Tipo:** `A`
4. **DELETE esse registro**

## ⚠️ IMPORTANTE

- **NÃO pode ter registro A e ALIAS ao mesmo tempo** para o mesmo domínio
- Se houver registro A, ele **sobrescreve** o ALIAS
- **DELETE o registro A** antes de confiar no ALIAS

## 📋 Checklist

- [ ] Verificado se há registro A antigo na Hostinger
- [ ] Removido todos os registros A para `@`
- [ ] Verificado se ALIAS está configurado corretamente
- [ ] Aguardado 15-30 minutos após remover registro A
- [ ] Verificado novamente com `dig` se está apontando para Railway

## 🐛 Se Após 1 Hora Ainda Não Funcionar

1. **Tire uma captura de tela** de TODOS os registros DNS na Hostinger
2. **Verifique se realmente não há registro A**
3. **Entre em contato com suporte da Hostinger** se necessário
4. **Verifique se o domínio está adicionado no Railway**

## ✅ Quando Funcionar

Quando o DNS propagar corretamente, você verá:

1. **No `dig`:**
   ```
   plenipay.com.    IN    CNAME    mlvqeal2.up.railway.app.
   ```
   OU
   ```
   plenipay.com.    IN    A    66.33.22.134
   ```

2. **No Railway:**
   - Status muda de "Pending" para "Active" (verde)

3. **No navegador:**
   - `https://plenipay.com` carrega a aplicação (não mais 404)
