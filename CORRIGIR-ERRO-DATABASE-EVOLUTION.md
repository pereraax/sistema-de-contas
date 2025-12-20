# 🔧 Corrigir Erro "Database provider invalid" - Evolution API

## ❌ **PROBLEMA:**

O deploy está falhando com:
```
Error: Database provider invalid
```

A Evolution API precisa de **variáveis de ambiente** para o banco de dados!

---

## ✅ **SOLUÇÃO:**

### **PASSO 1: Adicionar Variáveis de Ambiente no Render**

Na página do serviço `evolution-api` no Render:

1. Vá em **"Environment"** → **"Environment Variables"**
2. Clique em **"Add Environment Variable"**
3. Adicione estas variáveis:

#### **Variável 1: Database Type**
```
Key: DATABASE_ENABLED
Value: false
```

#### **Variável 2: Ou configure um banco (SQLite - Mais Simples)**
```
Key: DATABASE_ENABLED
Value: true

Key: DATABASE_PROVIDER
Value: sqlite

Key: DATABASE_CONNECTION_URI
Value: file:./database.sqlite
```

---

## 🚀 **SOLUÇÃO RÁPIDA (Recomendado - Sem Banco):**

Adicione apenas:

```
Key: DATABASE_ENABLED
Value: false
```

Isso desabilita o banco de dados e a Evolution API funcionará sem ele!

---

## 📋 **VARIÁVEIS COMPLETAS NECESSÁRIAS:**

Adicione todas estas variáveis:

1. **AUTHENTICATION_API_KEY** (já tem!)
   ```
   Key: AUTHENTICATION_API_KEY
   Value: plenipay-api-key-2025
   ```

2. **DATABASE_ENABLED** (IMPORTANTE!)
   ```
   Key: DATABASE_ENABLED
   Value: false
   ```

3. **PORT** (Opcional - padrão é 8080)
   ```
   Key: PORT
   Value: 8080
   ```

---

## 🔄 **DEPOIS DE ADICIONAR:**

1. ✅ Salve as variáveis
2. ✅ O Render vai reiniciar automaticamente
3. ✅ Aguarde o deploy completar (pode levar 2-5 minutos)
4. ✅ Verifique se ficou "Live" (verde)

---

## ✅ **VERIFICAÇÃO:**

Após o deploy:
- Status deve ser **"Live"** (verde)
- URL deve funcionar: `https://evolution-api-vbbp.onrender.com`
- Teste acessando: `https://evolution-api-vbbp.onrender.com/health`

---

## 🆘 **SE AINDA NÃO FUNCIONAR:**

### **Opção 1: Usar SQLite (Mais Simples)**

Se precisar de banco, use SQLite (arquivo local):

```
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_CONNECTION_URI=file:./database.sqlite
```

### **Opção 2: Usar PostgreSQL (Render Gratuito)**

Render oferece PostgreSQL grátis:

1. **Criar PostgreSQL no Render:**
   - New → PostgreSQL
   - Plano: Free
   - Copie a **Connection String**

2. **Adicionar variável:**
   ```
   DATABASE_ENABLED=true
   DATABASE_PROVIDER=postgresql
   DATABASE_CONNECTION_URI=postgresql://usuario:senha@host:5432/dbname
   ```

---

## ✅ **RESUMO:**

**Adicione esta variável primeiro:**
```
DATABASE_ENABLED=false
```

Isso resolve o erro e permite usar a Evolution API sem banco de dados!

---

**Adicione a variável e me avise se funcionou!** 🚀










