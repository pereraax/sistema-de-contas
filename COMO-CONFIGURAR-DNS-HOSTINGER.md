# 🌐 COMO CONFIGURAR DNS NA HOSTINGER

## 📋 INFORMAÇÕES DO RENDER:

**Domínio:** `plenipay.com`

**OPÇÃO 1 (Recomendada):**
- Tipo: `ANAME` ou `ALIAS`
- Valor: `sistema-de-contas-1.onrender.com`

**OPÇÃO 2 (Alternativa):**
- Tipo: `A`
- Valor: `216.24.57.1`

---

## ✅ PASSO A PASSO NA HOSTINGER:

### **1. ACESSAR PAINEL DA HOSTINGER:**

1. Acesse: https://www.hostinger.com.br
2. Faça login na sua conta
3. Vá em **"Domínios"** ou **"Gerenciar Domínios"**
4. Clique no domínio `plenipay.com`

---

### **2. ACESSAR ZONA DNS:**

1. Procure por **"Zona DNS"** ou **"DNS Zone"** ou **"Gerenciar DNS"**
2. Clique para abrir as configurações DNS

---

### **3. ADICIONAR REGISTRO DNS:**

A Hostinger geralmente suporta `ANAME` ou `ALIAS`. Se não suportar, use `A`.

#### **OPÇÃO A: Usar ANAME/ALIAS (Recomendado)**

1. Clique em **"Adicionar Registro"** ou **"Add Record"**
2. Selecione o tipo: **"ANAME"** ou **"ALIAS"**
3. Preencha:
   - **Nome/Host:** `@` (ou deixe em branco para domínio raiz)
   - **Valor/Target:** `sistema-de-contas-1.onrender.com`
   - **TTL:** `3600` (ou padrão)
4. Clique em **"Salvar"** ou **"Add"**

#### **OPÇÃO B: Usar A (Se ANAME não estiver disponível)**

1. Clique em **"Adicionar Registro"** ou **"Add Record"**
2. Selecione o tipo: **"A"**
3. Preencha:
   - **Nome/Host:** `@` (ou deixe em branco para domínio raiz)
   - **Valor/IP:** `216.24.57.1`
   - **TTL:** `3600` (ou padrão)
4. Clique em **"Salvar"** ou **"Add"**

---

### **4. VERIFICAR REGISTROS EXISTENTES:**

⚠️ **IMPORTANTE:** Se já existir um registro `A` ou `CNAME` para `@`, você precisa:

**Opção 1:** Editar o registro existente
- Clique no registro existente
- Altere o valor para `sistema-de-contas-1.onrender.com` (ANAME) ou `216.24.57.1` (A)
- Salve

**Opção 2:** Deletar o registro antigo e criar um novo
- Delete o registro antigo
- Crie um novo conforme instruções acima

---

### **5. AGUARDAR PROPAGAÇÃO:**

- DNS pode levar de **5 minutos a 48 horas**
- Geralmente leva **15-30 minutos**
- Verifique em: https://www.whatsmydns.net/

---

## 🔍 VERIFICAÇÃO:

### **1. Verificar DNS:**

Use ferramentas online:
- https://www.whatsmydns.net/
- https://dnschecker.org/
- Digite `plenipay.com` e verifique se aponta para o Render

### **2. Verificar no Render:**

1. Volte ao Render
2. Clique em **"Verify"** (botão de verificação)
3. Se estiver correto, mostrará "Verified" ou "Active"

---

## 📝 EXEMPLO VISUAL:

### **Na Hostinger, você verá algo assim:**

```
Tipo: ANAME (ou ALIAS)
Nome: @
Valor: sistema-de-contas-1.onrender.com
TTL: 3600
```

**OU**

```
Tipo: A
Nome: @
Valor: 216.24.57.1
TTL: 3600
```

---

## ⚠️ PROBLEMAS COMUNS:

### **1. Não encontro ANAME/ALIAS:**

- A Hostinger pode chamar de forma diferente
- Procure por: "ANAME", "ALIAS", "CNAME Flattening"
- Se não encontrar, use o registro `A` com o IP `216.24.57.1`

### **2. Já existe um registro A:**

- Edite o registro existente
- OU delete e crie um novo
- Não pode ter dois registros `A` para `@`

### **3. DNS não propaga:**

- Aguarde mais tempo (até 48 horas)
- Limpe cache do DNS: https://1.1.1.1/help
- Verifique se configurou corretamente

---

## 🎯 RESUMO RÁPIDO:

1. ✅ Acesse Hostinger → Domínios → `plenipay.com`
2. ✅ Vá em Zona DNS
3. ✅ Adicione registro:
   - Tipo: `ANAME` ou `A`
   - Nome: `@`
   - Valor: `sistema-de-contas-1.onrender.com` (ANAME) ou `216.24.57.1` (A)
4. ✅ Salve
5. ✅ Aguarde 15-30 minutos
6. ✅ Verifique no Render (clique em "Verify")

---

## 📚 RECURSOS:

- **Verificar DNS:** https://www.whatsmydns.net/
- **Suporte Hostinger:** https://www.hostinger.com.br/contato
- **Documentação Render:** https://render.com/docs/custom-domains

---

## ✅ PRONTO!

Após configurar o DNS na Hostinger e aguardar a propagação, volte ao Render e clique em **"Verify"**. Se estiver correto, o domínio será verificado e o SSL será configurado automaticamente!
