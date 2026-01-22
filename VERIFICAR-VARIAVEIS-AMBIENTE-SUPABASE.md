# 🔍 VERIFICAR VARIÁVEIS DE AMBIENTE DO SUPABASE

## ⚠️ PROBLEMA

O erro "Erro ao criar usuário" pode ser causado por variáveis de ambiente não configuradas.

---

## ✅ VERIFICAÇÕES NECESSÁRIAS

### **1️⃣ VERIFICAR ARQUIVO .env.local**

No arquivo `.env.local` na raiz do projeto, você deve ter:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

---

### **2️⃣ ONDE ENCONTRAR ESSAS CHAVES**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Settings → API
3. **Você verá:**
   - **Project URL** → Use como `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → Use como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → Use como `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRETO!**

---

### **3️⃣ VERIFICAR SE ESTÃO CONFIGURADAS**

O código agora mostra nos logs se as variáveis estão configuradas:

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP`
3. **Procure por:**
   - `🔍 Verificando variáveis de ambiente...`
   - `✅ Configurado` ou `❌ FALTANDO`

---

### **4️⃣ SE ALGUMA ESTIVER FALTANDO**

#### **A. NEXT_PUBLIC_SUPABASE_URL**
- **Onde:** Settings → API → Project URL
- **Exemplo:** `https://abcdefghijklmnop.supabase.co`

#### **B. NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Onde:** Settings → API → anon public
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### **C. SUPABASE_SERVICE_ROLE_KEY** ⚠️
- **Onde:** Settings → API → service_role
- **⚠️ IMPORTANTE:** Esta chave é **SECRETA** e **NUNCA** deve ser exposta no frontend!
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🔧 COMO CORRIGIR

### **PASSO 1: Abrir .env.local**

No terminal, na raiz do projeto:

```bash
code .env.local
```

Ou abra manualmente o arquivo `.env.local` na raiz.

---

### **PASSO 2: Adicionar/Verificar Variáveis**

Certifique-se de que o arquivo tem:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

---

### **PASSO 3: Reiniciar Servidor**

Após adicionar/atualizar as variáveis:

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Inicie novamente:** `npm run dev`
3. **Tente criar conta novamente**

---

## ⚠️ IMPORTANTE

- ✅ **NEXT_PUBLIC_*** variáveis são públicas (podem ser expostas no frontend)
- ❌ **SUPABASE_SERVICE_ROLE_KEY** é **SECRETA** (nunca exponha!)
- ✅ Sempre reinicie o servidor após alterar `.env.local`

---

## 📝 VERIFICAR NOS LOGS

Após reiniciar e tentar criar conta, verifique os logs:

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP`
3. **Procure por:**
   ```
   🔍 Verificando variáveis de ambiente...
     - NEXT_PUBLIC_SUPABASE_URL: ✅ Configurado
     - NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Configurado
     - SUPABASE_SERVICE_ROLE_KEY: ✅ Configurado
   ```

**Se alguma mostrar `❌ FALTANDO`, adicione no `.env.local` e reinicie!**
