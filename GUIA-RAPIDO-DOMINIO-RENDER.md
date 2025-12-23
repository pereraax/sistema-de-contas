# 🚀 GUIA RÁPIDO: CONFIGURAR DOMÍNIO NO RENDER

## ✅ PASSO A PASSO SIMPLIFICADO:

### **1. NO RENDER (2 minutos):**

1. Acesse: https://dashboard.render.com
2. Clique em `sistema-de-contas-1`
3. Vá em **Settings**
4. Role até **"Custom Domains"**
5. Clique em **"Add Custom Domain"**
6. Digite seu domínio (ex: `plenipay.com`)
7. Clique em **"Add"**

---

### **2. NO SEU PROVEDOR DE DOMÍNIO (5 minutos):**

O Render vai mostrar instruções. Geralmente você precisa adicionar:

**Para domínio raiz (`plenipay.com`):**
- Tipo: `CNAME` ou `A`
- Nome: `@` (ou deixe em branco)
- Valor: `sistema-de-contas-1.onrender.com` (ou IP fornecido pelo Render)

**Para subdomínio (`www.plenipay.com`):**
- Tipo: `CNAME`
- Nome: `www`
- Valor: `sistema-de-contas-1.onrender.com`

---

### **3. AGUARDAR (15-30 minutos):**

- DNS precisa propagar
- Verifique em: https://www.whatsmydns.net/
- SSL será configurado automaticamente pelo Render

---

### **4. ATUALIZAR VARIÁVEIS (2 minutos):**

No Render, vá em **Settings → Environment** e atualize:

```
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

Substitua `seu-dominio.com` pelo seu domínio real.

---

### **5. TESTAR:**

Acesse: `https://seu-dominio.com`

Deve funcionar! 🎉

---

## 📝 EXEMPLO:

**Se seu domínio é `plenipay.com`:**

1. Render: Adicione `plenipay.com`
2. DNS: Adicione `CNAME @ → sistema-de-contas-1.onrender.com`
3. Aguarde 15-30 minutos
4. Render: Atualize variáveis para `https://plenipay.com`
5. Teste: `https://plenipay.com`

---

## ⚠️ IMPORTANTE:

- **SSL é automático** - Render configura via Let's Encrypt
- **DNS pode demorar** - Até 48 horas (geralmente 15-30 min)
- **Atualize variáveis** - Após DNS propagar, atualize as URLs

---

## 🆘 PROBLEMAS COMUNS:

**DNS não propagou:**
- Aguarde mais tempo
- Verifique se configurou corretamente no provedor

**SSL não funciona:**
- Aguarde alguns minutos após DNS propagar
- Render configura SSL automaticamente

**Domínio não carrega:**
- Verifique se DNS propagou: https://www.whatsmydns.net/
- Verifique variáveis de ambiente no Render

---

## ✅ PRONTO!

Siga estes passos e seu domínio estará funcionando!
