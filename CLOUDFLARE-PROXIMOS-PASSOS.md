# ✅ Cloudflare - Próximos Passos

## 🎯 O Que Você Precisa Fazer Agora

O Cloudflare escaneou seus DNS e encontrou registros antigos. Precisamos **remover os registros A** e **adicionar CNAME** apontando para o Railway.

## 📋 Passo a Passo

### **PASSO 1: Remover Registros A Antigos**

Na tela que você está vendo:

1. **Encontre o registro A** que mostra:
   - Type: `A`
   - Name: `plenipay.com`
   - Content: `66.33.22.31`
   - Proxy: Proxied (laranja)

2. **Clique em "Delete"** nesse registro A
3. **Confirme a remoção**

4. **Encontre o registro AAAA** (IPv6):
   - Type: `AAAA`
   - Name: `plenipay.com`

5. **Clique em "Delete"** nesse registro AAAA também
6. **Confirme a remoção**

**Deixe apenas os registros CAA** (não mexa neles).

### **PASSO 2: Adicionar CNAME para Domínio Raiz**

1. Clique no botão **"+ Add record"** (canto superior direito)
2. Configure:
   - **Type:** Selecione `CNAME`
   - **Name:** Digite `@` (ou deixe em branco)
   - **Target:** Digite `mlvqeal2.up.railway.app`
   - **Proxy status:** Deixe **Proxied** (deve estar laranja/ativado) ✅
   - **TTL:** Deixe `Auto`
3. Clique em **"Save"**

### **PASSO 3: Adicionar CNAME para www**

1. Clique novamente em **"+ Add record"**
2. Configure:
   - **Type:** Selecione `CNAME`
   - **Name:** Digite `www`
   - **Target:** Digite `mlvqeal2.up.railway.app`
   - **Proxy status:** Deixe **Proxied** (deve estar laranja/ativado) ✅
   - **TTL:** Deixe `Auto`
3. Clique em **"Save"**

### **PASSO 4: Verificar Configuração**

Após adicionar os 2 CNAME, você deve ter:

- ✅ CNAME `@` → `mlvqeal2.up.railway.app` (Proxied)
- ✅ CNAME `www` → `mlvqeal2.up.railway.app` (Proxied)
- ✅ CAA records (deixe como estão)

**NÃO deve ter mais:**
- ❌ Registro A com IP `66.33.22.31`
- ❌ Registro AAAA

### **PASSO 5: Continuar no Cloudflare**

Após configurar os DNS:

1. Role a página até o final
2. Clique em **"Continue"** ou **"Next"**
3. O Cloudflare vai mostrar os **nameservers** que você precisa usar

**Anote esses nameservers!** (algo como `ns1.cloudflare.com` e `ns2.cloudflare.com`)

## ⚠️ IMPORTANTE

- **Proxy status DEVE estar Proxied** (laranja) para SSL funcionar
- **Remova os registros A e AAAA** antes de adicionar CNAME
- **Use CNAME, não A** - Railway usa CNAME, não IP fixo

## 📋 Checklist

- [ ] Removido registro A (`66.33.22.31`)
- [ ] Removido registro AAAA
- [ ] Adicionado CNAME `@` → `mlvqeal2.up.railway.app` (Proxied ✅)
- [ ] Adicionado CNAME `www` → `mlvqeal2.up.railway.app` (Proxied ✅)
- [ ] Clicado em "Continue"
- [ ] Anotado nameservers do Cloudflare

## 🎯 Próximo Passo

Após configurar os DNS e clicar em "Continue", o Cloudflare vai mostrar os nameservers. **Me avise quando chegar nessa tela** e eu te ajudo a configurar na Hostinger!
