# 📝 ADICIONAR VARIÁVEIS APIFACIL NO .ENV.PRODUCTION

## ✅ VARIÁVEIS QUE FALTAM:

Você precisa adicionar estas duas variáveis:

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

---

## 📋 PASSO A PASSO NO NANO:

### **1. Navegar até o final do arquivo:**

- Use a **seta para baixo** (↓) várias vezes
- Ou pressione **Ctrl+End** (se disponível)
- Ou pressione **Ctrl+W** (buscar) e depois **Ctrl+V** (ir para o final)

---

### **2. Adicionar as variáveis:**

Quando estiver no final do arquivo (depois de `ADMIN_JWT_SECRET=...`), pressione **Enter** para criar uma nova linha e digite:

```env
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

**Substitua:**
- `seu_id_apifacil` = Seu ID da instância APIFACIL
- `seu_token_apifacil` = Seu token da APIFACIL

---

### **3. Salvar o arquivo:**

1. Pressione **Ctrl+X** (para sair)
2. Pressione **Y** (para confirmar que quer salvar)
3. Pressione **Enter** (para confirmar o nome do arquivo)

---

## 🎯 COMANDOS DO NANO:

- **Setas ↑↓←→** = Navegar
- **Ctrl+X** = Sair
- **Ctrl+O** = Salvar (Write Out)
- **Ctrl+W** = Buscar texto
- **Ctrl+V** = Ir para próxima página
- **Ctrl+End** = Ir para final do arquivo (pode não funcionar)
- **Enter** = Nova linha

---

## 📝 EXEMPLO COMPLETO:

Seu arquivo deve ficar assim (no final):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I5MTFhYjU0YTYxY2U0Y2I5MTFhYjU0YTYXY2U0
ASAAS_API_URL=https://api.asaas.com/v3
NEXT_PUBLIC_SITE_URL=https://plenipay.com
NEXT_PUBLIC_APP_URL=https://plenipay.com
NODE_ENV=production
ADMIN_JWT_SECRET=K8j3mN9pQ2rT5vX7yZ1aB4cD6eF8gH0iJ2kL4mN6pQ8rT0vW2xY4zA6bC8dE0fG
APIFACIL_INSTANCE_ID=seu_id_apifacil
APIFACIL_TOKEN=seu_token_apifacil
```

---

## ✅ SEQUÊNCIA COMPLETA:

1. ✅ **Navegue até o final** do arquivo (use seta para baixo várias vezes)
2. ✅ **Pressione Enter** para criar nova linha
3. ✅ **Digite:** `APIFACIL_INSTANCE_ID=seu_id_apifacil`
4. ✅ **Pressione Enter** para nova linha
5. ✅ **Digite:** `APIFACIL_TOKEN=seu_token_apifacil`
6. ✅ **Salve:** Ctrl+X → Y → Enter

---

## 🔍 ONDE ENCONTRAR OS VALORES:

### **APIFACIL_INSTANCE_ID:**
- Acesse o painel da APIFACIL
- Vá em configurações da instância
- Copie o ID da instância

### **APIFACIL_TOKEN:**
- Acesse o painel da APIFACIL
- Vá em configurações/API
- Copie o token de autenticação

---

## ⚠️ IMPORTANTE:

- ✅ **Não deixe espaços** antes ou depois do `=`:
  - ✅ Correto: `APIFACIL_INSTANCE_ID=valor`
  - ❌ Errado: `APIFACIL_INSTANCE_ID = valor`

- ✅ **Não use aspas** (a menos que o valor tenha espaços):
  - ✅ Correto: `APIFACIL_TOKEN=abc123`
  - ❌ Errado: `APIFACIL_TOKEN="abc123"`

- ✅ **Cada variável em uma linha separada**

---

## 📋 DEPOIS DE SALVAR:

Quando salvar o arquivo (Ctrl+X, Y, Enter), execute:

```bash
# Verificar se arquivo foi salvo
ls -la .env.production

# Ver conteúdo (opcional)
cat .env.production | tail -5

# Fazer build
npm run build
```

---

## ✅ CHECKLIST:

- [ ] Naveguei até o final do arquivo
- [ ] Adicionei `APIFACIL_INSTANCE_ID=seu_id_apifacil`
- [ ] Adicionei `APIFACIL_TOKEN=seu_token_apifacil`
- [ ] Salvei o arquivo (Ctrl+X, Y, Enter)
- [ ] Verifiquei se foi salvo (`ls -la .env.production`)
- [ ] Pronto para fazer build

---

**Adicione as variáveis no final do arquivo e salve!** 📝

Depois execute `npm run build`!


