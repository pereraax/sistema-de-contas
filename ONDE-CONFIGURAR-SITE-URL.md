# 📍 ONDE CONFIGURAR - GUIA RÁPIDO

## ⚠️ IMPORTANTE: SÃO 2 LUGARES DIFERENTES!

### **1️⃣ NO RENDER** (Variável de Ambiente)
### **2️⃣ NO SUPABASE** (Site URL nas configurações)

---

## 🎯 1️⃣ CONFIGURAR NO RENDER (Variável de Ambiente)

### **PASSO A PASSO:**

1. **Abra uma NOVA ABA** no navegador
2. Acesse: **https://dashboard.render.com**
3. Faça login (se necessário)
4. Você verá uma lista de **"Services"** (Serviços)
5. **Clique no serviço** do seu projeto (provavelmente `sistema-de-contas-1` ou similar)
6. No menu lateral esquerdo, procure por:
   - **"Environment"** OU
   - **"Environment Variables"** OU
   - **"Config"** OU
   - **"Settings"** → depois procure por "Environment"
7. Procure na lista por `NEXT_PUBLIC_SITE_URL`
   - **Se encontrar:** Clique para editar e altere para `https://plenipay.com.br`
   - **Se NÃO encontrar:** Clique em **"Add Environment Variable"** e adicione:
     - Key: `NEXT_PUBLIC_SITE_URL`
     - Value: `https://plenipay.com.br`
8. **Salve**

---

## 🎯 2️⃣ CONFIGURAR NO SUPABASE (Site URL)

### **PASSO A PASSO (Você já está aqui!):**

1. No menu lateral do Supabase (que você está vendo), clique em:
   - **"Project Settings"** (no final do menu, com ícone de engrenagem)
2. No menu que abrir, clique em:
   - **"Authentication"** (ou procure por "Auth")
3. Depois clique em:
   - **"URL Configuration"** (ou "Site URL")
4. Procure por:
   - **"Site URL"** (URL do Site)
   - **"Redirect URLs"** (URLs de Redirecionamento)
5. Configure:
   - **Site URL:** `https://plenipay.com.br`
   - **Redirect URLs:** Adicione:
     - `https://plenipay.com.br/**`
     - `https://plenipay.com.br/auth/callback`
     - `http://localhost:3000/**` (para desenvolvimento)
6. **Salve** (Save)

---

## 🔍 SE NÃO ENCONTRAR "ENVIRONMENT" NO RENDER

### **Tente estas alternativas:**

1. **Procure por "Settings"** no menu lateral do Render
2. Dentro de Settings, procure por **"Environment Variables"**
3. **OU** procure por **"Config"** ou **"Configuration"**
4. **OU** use a barra de busca no topo do Render e digite: `environment`

---

## 📸 ONDE FICA NO RENDER (Menu Lateral)

Quando você abrir o Render Dashboard e clicar no seu serviço, o menu lateral deve ter algo assim:

```
┌─────────────────────┐
│ Overview            │
│ Logs                │
│ Events              │
│ Environment  ← AQUI!│
│ Settings            │
│ Metrics             │
└─────────────────────┘
```

---

## ✅ RESUMO RÁPIDO

### **RENDER:**
1. https://dashboard.render.com
2. Seu Serviço → **Environment**
3. Adicionar/Editar: `NEXT_PUBLIC_SITE_URL = https://plenipay.com.br`

### **SUPABASE (Você já está aqui!):**
1. **Project Settings** (ícone de engrenagem no final do menu)
2. **Authentication**
3. **URL Configuration**
4. **Site URL:** `https://plenipay.com.br`
5. **Redirect URLs:** `https://plenipay.com.br/**`

---

## 🆘 AINDA NÃO ENCONTROU?

Me diga:
1. Você consegue acessar https://dashboard.render.com?
2. Você vê uma lista de serviços no Render?
3. Qual é o nome do seu serviço no Render?

Ou me envie uma captura de tela do que você está vendo no Render!
