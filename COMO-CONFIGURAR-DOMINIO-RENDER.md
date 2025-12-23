# 🌐 COMO CONFIGURAR DOMÍNIO OFICIAL NO RENDER

## ✅ SITUAÇÃO ATUAL:

- **URL atual:** `https://sistema-de-contas-1.onrender.com`
- **Status:** ✅ Funcionando corretamente
- **Próximo passo:** Configurar domínio personalizado

---

## 📋 PASSO A PASSO:

### **1. ADICIONAR DOMÍNIO NO RENDER:**

1. Acesse: https://dashboard.render.com
2. Clique no serviço `sistema-de-contas-1`
3. Vá em **Settings** (Configurações)
4. Role até a seção **"Custom Domains"** ou **"Domains"**
5. Clique em **"Add Custom Domain"** ou **"Add Domain"**
6. Digite seu domínio (ex: `plenipay.com` ou `www.plenipay.com`)
7. Clique em **"Add"** ou **"Save"**

---

### **2. CONFIGURAR DNS NO SEU PROVEDOR:**

O Render vai mostrar instruções de DNS. Você precisa adicionar registros DNS no seu provedor de domínio (ex: Registro.br, GoDaddy, Namecheap, etc.).

#### **OPÇÃO A: Domínio raiz (ex: `plenipay.com`)**

Adicione estes registros DNS:

**Tipo:** `CNAME`  
**Nome/Host:** `@` ou deixe em branco  
**Valor/Target:** `sistema-de-contas-1.onrender.com`  
**TTL:** `3600` (ou padrão)

**OU**

**Tipo:** `A`  
**Nome/Host:** `@` ou deixe em branco  
**Valor/IP:** (O Render vai fornecer o IP)  
**TTL:** `3600` (ou padrão)

#### **OPÇÃO B: Subdomínio (ex: `www.plenipay.com`)**

Adicione este registro DNS:

**Tipo:** `CNAME`  
**Nome/Host:** `www`  
**Valor/Target:** `sistema-de-contas-1.onrender.com`  
**TTL:** `3600` (ou padrão)

---

### **3. AGUARDAR PROPAGAÇÃO DNS:**

- DNS pode levar de **5 minutos a 48 horas** para propagar
- Geralmente leva **15-30 minutos**
- Você pode verificar em: https://www.whatsmydns.net/

---

### **4. VERIFICAR SSL/TLS:**

- O Render configura SSL automaticamente via Let's Encrypt
- Pode levar alguns minutos após o DNS propagar
- Verifique em **Settings → Custom Domains** se mostra "SSL Certificate: Active"

---

### **5. ATUALIZAR VARIÁVEIS DE AMBIENTE:**

Após o domínio estar funcionando, atualize as variáveis de ambiente no Render:

1. Vá em **Settings → Environment**
2. Atualize:
   - `NEXT_PUBLIC_SITE_URL` → `https://seu-dominio.com`
   - `NEXT_PUBLIC_APP_URL` → `https://seu-dominio.com`
3. Salve
4. O Render vai fazer um novo deploy automaticamente

---

## 🔍 VERIFICAÇÕES:

### **1. Verificar DNS:**

Use ferramentas online:
- https://www.whatsmydns.net/
- https://dnschecker.org/
- Digite seu domínio e verifique se aponta para o Render

### **2. Verificar SSL:**

- Acesse seu domínio: `https://seu-dominio.com`
- Verifique se aparece o cadeado verde no navegador
- Se não aparecer, aguarde alguns minutos (SSL pode levar tempo)

### **3. Verificar Variáveis:**

- Certifique-se de que `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL` estão atualizadas
- Após atualizar, aguarde o deploy completar

---

## 📝 EXEMPLO PRÁTICO:

### **Se seu domínio é `plenipay.com`:**

1. **No Render:**
   - Adicione domínio: `plenipay.com`
   - Render vai mostrar instruções DNS

2. **No seu provedor de domínio (ex: Registro.br):**
   - Adicione registro `CNAME`:
     - Nome: `@`
     - Valor: `sistema-de-contas-1.onrender.com`

3. **Aguarde propagação DNS** (15-30 minutos)

4. **No Render, atualize variáveis:**
   - `NEXT_PUBLIC_SITE_URL=https://plenipay.com`
   - `NEXT_PUBLIC_APP_URL=https://plenipay.com`

5. **Teste:**
   - Acesse: `https://plenipay.com`
   - Deve funcionar!

---

## ⚠️ IMPORTANTE:

### **Domínio raiz vs Subdomínio:**

- **Domínio raiz** (`plenipay.com`): Pode precisar de registro `A` ou `CNAME` (depende do provedor)
- **Subdomínio** (`www.plenipay.com`): Sempre usa `CNAME`

### **Múltiplos domínios:**

Você pode adicionar múltiplos domínios:
- `plenipay.com`
- `www.plenipay.com`
- `app.plenipay.com`

Todos apontam para o mesmo serviço.

---

## 🎯 RESUMO:

1. ✅ Adicione domínio no Render
2. ✅ Configure DNS no provedor de domínio
3. ✅ Aguarde propagação DNS (15-30 min)
4. ✅ Verifique SSL (configurado automaticamente)
5. ✅ Atualize variáveis de ambiente
6. ✅ Teste o domínio

---

## 📚 RECURSOS:

- **Documentação Render:** https://render.com/docs/custom-domains
- **Verificar DNS:** https://www.whatsmydns.net/
- **Suporte Render:** https://render.com/support

---

## 💡 DICA:

Se você quiser redirecionar `www` para o domínio raiz (ou vice-versa), você pode:
1. Adicionar ambos os domínios no Render
2. Configurar redirecionamento no código Next.js (opcional)

---

## ✅ PRONTO!

Após seguir estes passos, seu domínio oficial estará funcionando!
