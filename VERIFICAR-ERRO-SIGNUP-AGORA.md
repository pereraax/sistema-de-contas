# 🔍 VERIFICAR ERRO DE SIGNUP - PASSOS IMEDIATOS

## ⚠️ ERRO ATUAL

**"Erro ao criar usuário. Verifique as configurações do Supabase."**

---

## 📋 PASSO A PASSO PARA DIAGNOSTICAR

### **1️⃣ VERIFICAR LOGS DO SERVIDOR (CRÍTICO)**

1. **Acesse:** `/administracaosecr/logs`
2. **Filtre por:** `SIGNUP`
3. **Procure por:**
   - `❌ Erro do signUp:` - mostra o erro específico do Supabase
   - `❌ Status:` - mostra o código HTTP do erro
   - `❌ Erro completo:` - mostra todos os detalhes

**Compartilhe os logs filtrados por SIGNUP!**

---

### **2️⃣ VERIFICAR LOGS DO SUPABASE**

1. **Acesse:** https://app.supabase.com → Seu Projeto
2. **Vá em:** Authentication → Logs
3. **Procure por:**
   - Tentativas de signup recentes
   - Erros específicos
   - Rate limiting
   - Erros de SMTP

---

### **3️⃣ VERIFICAR CONFIGURAÇÕES NO SUPABASE**

#### **A. Enable Email Confirmations**

1. **Authentication → Settings → Email Auth**
2. **VERIFIQUE:** "Enable email confirmations" está **HABILITADO**?
3. **Se não estiver, HABILITE e SALVE!**

#### **B. SMTP Configurado**

1. **Authentication → Settings → SMTP Settings**
2. **VERIFIQUE:**
   - ✅ "Enable Custom SMTP" está marcado?
   - ✅ Todos os campos estão preenchidos?
   - ✅ Teste o SMTP (se houver botão de teste)

#### **C. Rate Limiting**

1. **Verifique se você não está em rate limit**
2. **Se sim, aguarde 5-10 minutos**
3. **Tente novamente**

---

## 🔍 POSSÍVEIS CAUSAS DO ERRO

### **1. Rate Limiting (429)**
**Sintoma:** Muitas tentativas de cadastro
**Solução:** Aguarde alguns minutos

### **2. Signups Desabilitados**
**Sintoma:** Erro contém "signups_disabled"
**Solução:** Habilite signups no Supabase

### **3. SMTP Não Configurado ou Errado**
**Sintoma:** Erro contém "SMTP" ou "email"
**Solução:** Verifique configuração SMTP no Supabase

### **4. Email Confirmations Desabilitado**
**Sintoma:** Erro genérico
**Solução:** Habilite "Enable email confirmations"

---

## 📝 O QUE COMPARTILHAR

Para resolver o problema, compartilhe:

1. **Logs do servidor** (`/administracaosecr/logs` filtrado por SIGNUP)
2. **Erro específico** do Supabase (se aparecer)
3. **Status do erro** (código HTTP)
4. **Configurações verificadas:**
   - [ ] Enable email confirmations habilitado
   - [ ] SMTP configurado
   - [ ] Não está em rate limit

---

## ✅ PRÓXIMOS PASSOS

1. **Acesse `/administracaosecr/logs`**
2. **Filtre por `SIGNUP`**
3. **Compartilhe os logs completos** da última tentativa de cadastro

**Com esses logs, conseguiremos identificar a causa exata do problema!**
