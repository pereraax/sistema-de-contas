# 🔍 Verificar API Key do Asaas

## ❌ PROBLEMA ATUAL

A API key está sendo carregada (166 caracteres), mas o Asaas retorna **401 Unauthorized** dizendo que a chave é inválida.

**Erro:** `"A chave de API fornecida é inválida"`

---

## 🔍 POSSÍVEIS CAUSAS

### **1. API Key Incompleta ou Incorreta**
- A API key pode ter sido copiada incompleta
- Pode ter caracteres extras ou faltando

### **2. Ambiente Incompatível**
- API key de **produção** sendo usada com URL de **sandbox** (ou vice-versa)
- Verifique se `ASAAS_API_URL` corresponde ao tipo da API key

### **3. API Key Revogada ou Expirada**
- A API key pode ter sido desabilitada no painel do Asaas
- Pode ter expirado

### **4. API Key de Ambiente Errado**
- Você pode estar usando uma API key de teste/sandbox em produção
- Ou uma API key de produção em desenvolvimento

---

## ✅ VERIFICAÇÕES NECESSÁRIAS

### **1. Verificar API Key no Painel do Asaas**

1. Acesse: https://www.asaas.com
2. Faça login
3. Vá em **Integrações** → **Chaves de API**
4. Verifique se a chave "PLENIPAY" está **Habilitada** (verde)
5. Clique no ícone de **editar** (lápis) para ver a chave completa
6. **Copie a chave COMPLETA** (deve começar com `$aact_`)

### **2. Verificar Ambiente (Sandbox vs Produção)**

No seu `.env.local`, verifique:

**Para PRODUÇÃO:**
```
ASAAS_API_URL=https://www.asaas.com/api/v3
ASAAS_API_KEY=$aact_prod_...  ← Deve ter "prod" no nome
```

**Para SANDBOX:**
```
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=$aact_YTU5YTE0...  ← Não tem "prod"
```

**⚠️ IMPORTANTE:** A URL e a API key DEVEM ser do mesmo ambiente!

### **3. Verificar se a API Key Está Completa**

A API key do Asaas geralmente tem:
- **Produção:** ~200 caracteres
- **Sandbox:** ~50-100 caracteres

Execute:
```bash
grep "^ASAAS_API_KEY=" .env.local | sed 's/^ASAAS_API_KEY=//' | wc -c
```

Deve retornar um número próximo de 200 (para produção) ou 50-100 (para sandbox).

---

## 🔧 SOLUÇÃO

### **Opção 1: Gerar Nova API Key no Asaas**

1. Acesse o painel do Asaas
2. Vá em **Integrações** → **Chaves de API**
3. Clique em **"Gerar chave de API"**
4. Dê um nome (ex: "PLENIPAY-PRODUCAO")
5. **Copie a chave COMPLETA** (é mostrada apenas uma vez!)
6. Cole no `.env.local`:
   ```
   ASAAS_API_KEY=$aact_... (cole a chave completa aqui)
   ```
7. **Reinicie o servidor**

### **Opção 2: Verificar API Key Atual**

1. No painel do Asaas, vá em **Integrações** → **Chaves de API**
2. Clique no ícone de **editar** (lápis) da chave "PLENIPAY"
3. Se não mostrar a chave completa, você precisa gerar uma nova
4. **Copie a chave COMPLETA** e cole no `.env.local`
5. **Reinicie o servidor**

---

## 🧪 TESTAR APÓS CORRIGIR

Após atualizar a API key:

1. **Reinicie o servidor:**
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

2. **Teste:**
   ```bash
   curl http://localhost:3000/api/teste-asaas
   ```

3. **Deve retornar:**
   ```json
   {
     "success": true,
     "message": "API Key do Asaas está funcionando corretamente!",
     ...
   }
   ```

---

## 📋 CHECKLIST

- [ ] API key está **Habilitada** no painel do Asaas
- [ ] API key está **completa** (não truncada)
- [ ] `ASAAS_API_URL` corresponde ao ambiente da API key
- [ ] API key foi **copiada completa** do painel
- [ ] Servidor foi **reiniciado** após atualizar
- [ ] Testou `/api/teste-asaas` e retornou `success: true`

---

**Verifique a API key no painel do Asaas e me avise o que encontrou!** 🔍













