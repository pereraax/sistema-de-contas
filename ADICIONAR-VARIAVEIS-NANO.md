# ➕ ADICIONAR VARIÁVEIS FALTANDO NO NANO

## 📋 VARIÁVEIS QUE FALTAM:

Vejo que você já tem:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ ASAAS_API_KEY
- ✅ ASAAS_API_URL
- ✅ NEXT_PUBLIC_SITE_URL
- ✅ NEXT_PUBLIC_APP_URL
- ✅ NODE_ENV=production
- ✅ ADMIN_JWT_SECRET

**FALTAM estas variáveis:**
- ❌ `APIFACIL_INSTANCE_ID`
- ❌ `APIFACIL_TOKEN`
- ❌ `OPENAI_API_KEY` (opcional - para IA)
- ❌ `GROQ_API_KEY` (opcional - para IA alternativa)

---

## 📝 COMO ADICIONAR NO NANO:

### **Passo 1: Ir até o final do arquivo**

1. No nano, pressione **Ctrl+End** ou use as **setas** para ir até o final
2. Ou pressione **Ctrl+V** várias vezes para ir descendo

---

### **Passo 2: Adicionar as variáveis**

**Adicione estas linhas no final do arquivo:**

```env
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
OPENAI_API_KEY=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
GROQ_API_KEY=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
```

**IMPORTANTE:**
- ✅ **Substitua os valores** pelos seus valores reais (se tiver)
- ✅ **Se não tiver** OPENAI_API_KEY ou GROQ_API_KEY, pode deixar vazio ou remover essas linhas
- ✅ **APIFACIL é obrigatório** se você usa WhatsApp

---

### **Passo 3: Verificar formato**

Cada linha deve ter o formato:
```
NOME_VARIAVEL=valor_sem_espacos
```

**Sem espaços** antes ou depois do `=`

---

### **Passo 4: Salvar arquivo**

1. Pressione **Ctrl+X** (sair)
2. Depois pressione **Y** (confirmar salvar)
3. Depois pressione **Enter** (confirmar nome do arquivo)

---

## 🎯 SEQUÊNCIA PASSO A PASSO:

### **1. No nano, vá até o final:**

- Use **setas** para ir até a última linha
- Ou pressione **Ctrl+V** várias vezes

### **2. Pressione Enter** para criar uma linha nova

### **3. Digite ou cole as variáveis:**

```
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
OPENAI_API_KEY=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
GROQ_API_KEY=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
```

**Substitua pelos seus valores reais!**

### **4. Salvar:**

- **Ctrl+X** → **Y** → **Enter**

---

## ⚠️ IMPORTANTE - SUBSTITUIR VALORES:

**NÃO use os valores de exemplo acima!** Use seus valores reais:

- **APIFACIL_INSTANCE_ID:** Seu ID da instância do apifacil.dev
- **APIFACIL_TOKEN:** Seu token do apifacil.dev
- **OPENAI_API_KEY:** Sua chave da OpenAI (se tiver)
- **GROQ_API_KEY:** Sua chave do Groq (se tiver)

---

## 📋 COMANDOS ÚTEIS DO NANO:

- **Ctrl+X** = Sair
- **Ctrl+O** = Salvar (Write Out)
- **Ctrl+K** = Cortar linha
- **Ctrl+U** = Colar linha
- **Ctrl+W** = Buscar
- **Setas** = Navegar
- **Ctrl+V** = Página para baixo
- **Ctrl+Y** = Página para cima
- **Ctrl+End** = Ir para final do arquivo
- **Ctrl+Home** = Ir para início do arquivo

---

## ✅ DEPOIS DE SALVAR:

Execute no terminal:

```bash
# Verificar se arquivo foi salvo
ls -la .env.production

# Ver conteúdo (primeiras linhas)
head -5 .env.production

# Ver últimas linhas (onde você adicionou)
tail -5 .env.production
```

---

## 🎯 RESUMO RÁPIDO:

1. ✅ **Vá até o final** do arquivo (setas ou Ctrl+V)
2. ✅ **Pressione Enter** para nova linha
3. ✅ **Adicione as variáveis** (substitua pelos seus valores)
4. ✅ **Salve:** Ctrl+X → Y → Enter

---

## 📝 EXEMPLO COMPLETO DO ARQUIVO:

Seu arquivo `.env.production` deve ficar assim (no final):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I5MTFhYjU0YTYxY2U0...
ASAAS_API_URL=https://api.asaas.com/v3
NEXT_PUBLIC_SITE_URL=https://plenipay.com
NEXT_PUBLIC_APP_URL=https://plenipay.com
NODE_ENV=production
ADMIN_JWT_SECRET=K8j3mN9pQ2rT5vX7yZ1aB4cD6eF8gH0iJ2kL4mN6pQ8rT0vW2xY4zA6bC8dE0fG
APIFACIL_INSTANCE_ID=1041
APIFACIL_TOKEN=2254512f97e6c0a74cff8ad1f1e5739a74880f95608ae76cde3aa4ca5c2aabeb
OPENAI_API_KEY=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
GROQ_API_KEY=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
```

---

**Adicione as variáveis no final do arquivo e salve!** 🚀


