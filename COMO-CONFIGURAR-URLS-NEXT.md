# 🔗 COMO CONFIGURAR AS URLs DO NEXT.JS

## 📋 VARIÁVEIS:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`

---

## 🎯 O QUE COLOCAR:

### **OPÇÃO 1: URL do Railway (Após Deploy)**

Após fazer deploy no Railway, você receberá uma URL tipo:

```
https://seu-projeto-production.up.railway.app
```

**Use essa URL nas duas variáveis:**

```
NEXT_PUBLIC_SITE_URL=https://seu-projeto-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://seu-projeto-production.up.railway.app
```

**Substitua `seu-projeto-production.up.railway.app` pela URL real que o Railway gerar!**

---

### **OPÇÃO 2: Domínio Personalizado (Se tiver)**

Se você configurou um domínio personalizado (ex: `plenipay.com`):

```
NEXT_PUBLIC_SITE_URL=https://plenipay.com
NEXT_PUBLIC_APP_URL=https://plenipay.com
```

---

## 📝 PASSO A PASSO:

### **1. Fazer Deploy no Railway Primeiro**

1. Acesse https://railway.app
2. Crie projeto e conecte repositório
3. Aguarde o deploy completar
4. Railway vai gerar uma URL automaticamente

### **2. Encontrar a URL Gerada**

1. No projeto Railway, você verá uma seção "Domains" ou "Settings"
2. A URL será algo como:
   - `https://sistema-de-contas-production.up.railway.app`
   - `https://sistema-de-contas-production-xxxx.up.railway.app`

### **3. Copiar a URL**

1. Copie a URL completa (com `https://`)
2. Use essa URL nas duas variáveis

### **4. Adicionar no Railway**

1. No Railway, vá em "Variables"
2. Edite ou adicione:
   - `NEXT_PUBLIC_SITE_URL` = `https://sua-url-real.up.railway.app`
   - `NEXT_PUBLIC_APP_URL` = `https://sua-url-real.up.railway.app`
3. Salve
4. Railway reinicia automaticamente

---

## ❓ ELAS DEVEM SER IGUAIS?

### **SIM, geralmente são iguais!**

Para a maioria dos casos:
- ✅ `NEXT_PUBLIC_SITE_URL` = URL principal do site
- ✅ `NEXT_PUBLIC_APP_URL` = URL principal do app

**Ambas apontam para a mesma URL:**
```
NEXT_PUBLIC_SITE_URL=https://seu-projeto.up.railway.app
NEXT_PUBLIC_APP_URL=https://seu-projeto.up.railway.app
```

### **Quando seriam diferentes?**

Apenas se você tiver:
- Site em um domínio
- App em outro domínio
- Subdomínios diferentes

**Mas para seu caso, use a MESMA URL nas duas!**

---

## 🔍 EXEMPLO PRÁTICO:

### **Cenário 1: Railway gerou esta URL:**
```
https://sistema-de-contas-production-abc123.up.railway.app
```

**Configure assim:**
```
NEXT_PUBLIC_SITE_URL=https://sistema-de-contas-production-abc123.up.railway.app
NEXT_PUBLIC_APP_URL=https://sistema-de-contas-production-abc123.up.railway.app
```

---

### **Cenário 2: Você tem domínio `plenipay.com`:**

**Configure assim:**
```
NEXT_PUBLIC_SITE_URL=https://plenipay.com
NEXT_PUBLIC_APP_URL=https://plenipay.com
```

---

## ⚠️ IMPORTANTE:

1. **Sempre use `https://`** (não `http://`)
2. **Não adicione barra no final** (`/`)
3. **Use a URL completa** (com `https://`)
4. **Ajuste APÓS o deploy** (não antes)

---

## 📋 CHECKLIST:

- [ ] Fazer deploy no Railway primeiro
- [ ] Encontrar a URL gerada pelo Railway
- [ ] Copiar a URL completa
- [ ] Adicionar nas variáveis `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`
- [ ] Usar a MESMA URL nas duas
- [ ] Salvar no Railway
- [ ] Aguardar reinício automático

---

## 🎯 RESUMO:

**O que colocar:**
- A URL que o Railway gerar após o deploy
- Ou seu domínio personalizado (se tiver)

**Formato:**
```
https://sua-url-real.up.railway.app
```

**Ambas as variáveis:**
- Devem ter a MESMA URL
- Devem começar com `https://`
- Não devem ter barra no final

---

**Resumo: Use a URL que o Railway gerar após o deploy!** 🚀
