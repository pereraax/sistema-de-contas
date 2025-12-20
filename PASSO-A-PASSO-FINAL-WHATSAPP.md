# 🚀 Passo a Passo Final: Assistente WhatsApp PLEN - PleniPay

## 🎯 **OBJETIVO:**

Criar assistente WhatsApp completo integrado ao PleniPay, gerenciado pelo painel admin, usando Evolution API própria.

---

## 📋 **PASSO A PASSO COMPLETO:**

---

## **PARTE 1: Configurar Evolution API no Render (30 minutos)**

### **1.1 Criar PostgreSQL no Render**

1. **Acesse:** https://render.com/dashboard
2. **Clique em:** "New +" → "PostgreSQL"
3. **Configure:**
   ```
   Name: evolution-db
   Database: evolution
   User: evolution_user
   Region: Oregon (ou mais próxima)
   Plan: Free
   ```
4. **Clique em:** "Create Database"
5. **Aguarde:** 1-2 minutos

### **1.2 Copiar Connection String**

1. **Na página do PostgreSQL**, procure **"Internal Database URL"**
2. **Copie a URL** completa (algo como):
   ```
   postgresql://evolution_user:senha@dpg-xxxxx-a.oregon-postgres.render.com/evolution
   ```
3. **GUARDE ESSA URL!**

### **1.3 Configurar Evolution API**

No serviço `evolution-api` → **Environment Variables**:

Adicione estas variáveis:

```
AUTHENTICATION_API_KEY = plenipay-api-key-2025
DATABASE_ENABLED = true
DATABASE_PROVIDER = postgresql
DATABASE_CONNECTION_URI = postgresql://evolution_user:senha@dpg-xxxxx-a.oregon-postgres.render.com/evolution
```

*(Cole a URL que você copiou!)*

### **1.4 Aguardar Deploy**

- Render vai reiniciar automaticamente
- Aguarde 2-5 minutos
- Verifique se ficou **"Live"** (verde)
- Teste: `https://evolution-api-vbbp.onrender.com/health`

---

## **PARTE 2: Configurar Banco de Dados do PleniPay (5 minutos)**

### **2.1 Criar Tabela no Supabase**

1. **Acesse:** https://supabase.com/dashboard
2. **Vá em:** SQL Editor
3. **Cole e execute** o SQL do arquivo:
   ```
   CRIAR-TABELA-WHATSAPP-CONFIG.sql
   ```

Isso cria a tabela `whatsapp_config` para armazenar a configuração.

---

## **PARTE 3: Configurar WhatsApp no Painel Admin (10 minutos)**

### **3.1 Acessar Página de Configuração**

1. **Acesse:** `http://localhost:3000/administracaosecr/whatsapp`
2. **Ou em produção:** `https://seuapp.com/administracaosecr/whatsapp`

### **3.2 Configurar Evolution API**

Na página, preencha:

1. **URL da Evolution API:**
   ```
   https://evolution-api-vbbp.onrender.com
   ```
   (Use sua URL do Render)

2. **API Key:**
   ```
   plenipay-api-key-2025
   ```
   (A mesma que você configurou no Render)

3. **Nome da Instância:**
   ```
   plenipay
   ```

4. **Clique em:** "Salvar Configuração"

### **3.3 Conectar WhatsApp**

1. **Digite seu número de telefone:**
   ```
   5511999999999
   ```
   (Apenas números, com código do país)

2. **Clique em:** "Conectar WhatsApp"

3. **Sistema vai:**
   - Criar instância na Evolution API
   - Solicitar pairing code
   - Enviar SMS para seu número

4. **Você receberá um SMS** com código (ex: `123456`)

5. **Digite o código** na página

6. **Clique em:** "Confirmar Pairing"

7. ✅ **WhatsApp conectado!**

---

## **PARTE 4: Configurar Webhook na Evolution API (5 minutos)**

### **4.1 Obter URL do Webhook**

**URL do webhook:**
```
https://seuapp.com/api/whatsapp/webhook
```

*(Em desenvolvimento local, use ngrok: `ngrok http 3000`)*

### **4.2 Configurar no Evolution API**

1. **Acesse sua Evolution API:** `https://evolution-api-vbbp.onrender.com`
2. **Vá em:** Webhooks (ou via API)
3. **Configure:**
   - URL: `https://seuapp.com/api/whatsapp/webhook`
   - Eventos: `messages.upsert`

**OU via API:**

```bash
curl -X POST "https://evolution-api-vbbp.onrender.com/webhook/set/plenipay" \
  -H "apikey: plenipay-api-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seuapp.com/api/whatsapp/webhook",
    "events": ["messages.upsert"]
  }'
```

---

## **PARTE 5: Testar Tudo (5 minutos)**

### **5.1 Testar Conexão**

1. **No painel admin:** `/administracaosecr/whatsapp`
2. **Status deve mostrar:** "Conectado"
3. **Número deve aparecer**

### **5.2 Testar Mensagem**

1. **Envie uma mensagem** do WhatsApp para o número conectado
2. **Exemplo:** "Registre um gasto de R$ 50,00 com almoço"
3. **PLEN deve responder automaticamente!** 🎉

---

## ✅ **CHECKLIST COMPLETO:**

### **Fase 1: Render (Você faz):**
- [ ] Criar PostgreSQL no Render
- [ ] Copiar connection string
- [ ] Configurar variáveis na Evolution API
- [ ] Aguardar deploy terminar
- [ ] Testar health endpoint
- [ ] ✅ Me avisar quando estiver "Live"

### **Fase 2: Banco de Dados (Você faz):**
- [ ] Executar SQL no Supabase (tabela whatsapp_config)
- [ ] Verificar se tabela foi criada

### **Fase 3: Configurar no Admin (Você faz):**
- [ ] Acessar `/administracaosecr/whatsapp`
- [ ] Salvar configuração (URL + API Key)
- [ ] Conectar WhatsApp (número + código SMS)
- [ ] ✅ WhatsApp conectado!

### **Fase 4: Webhook (Você faz):**
- [ ] Configurar webhook na Evolution API
- [ ] URL: `https://seuapp.com/api/whatsapp/webhook`

### **Fase 5: Testar (Você faz):**
- [ ] Enviar mensagem de teste
- [ ] Verificar se PLEN responde
- [ ] ✅ Tudo funcionando!

---

## 🎯 **ARQUIVOS CRIADOS:**

1. ✅ `lib/whatsapp-evolution-admin.ts` - Biblioteca admin
2. ✅ `app/administracaosecr/whatsapp/page.tsx` - Página admin
3. ✅ `app/api/admin/whatsapp/config/route.ts` - Salvar config
4. ✅ `app/api/admin/whatsapp/status/route.ts` - Verificar status
5. ✅ `app/api/admin/whatsapp/create-instance/route.ts` - Criar instância
6. ✅ `app/api/admin/whatsapp/pairing-code/route.ts` - Solicitar código
7. ✅ `app/api/admin/whatsapp/confirm-pairing/route.ts` - Confirmar
8. ✅ `app/api/admin/whatsapp/disconnect/route.ts` - Desconectar
9. ✅ `CRIAR-TABELA-WHATSAPP-CONFIG.sql` - SQL para banco
10. ✅ `components/admin/AdminSidebar.tsx` - Atualizado (menu)

---

## 🚀 **COMECE AGORA:**

**FAÇA A PARTE 1 (PostgreSQL + Evolution API) e me avise quando estiver "Live"!**

Depois você pode:
1. Executar o SQL no Supabase
2. Configurar no painel admin
3. Conectar WhatsApp
4. Testar!

---

**Tudo está pronto! Siga os passos e me avise quando chegar em cada etapa!** 🎉










