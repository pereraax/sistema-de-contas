# 🔍 ONDE ENCONTRAR CREDENCIAIS APIFACIL

## ⚠️ EU NÃO TENHO ACESSO A SUAS CREDENCIAIS

As credenciais da APIFACIL são **privadas** e você precisa obtê-las no painel da APIFACIL.

---

## 📋 ONDE ENCONTRAR:

### **1. Acessar Painel APIFACIL:**

1. Acesse: **https://apifacil.com.br** (ou o site da APIFACIL)
2. Faça **login** na sua conta

---

### **2. Encontrar INSTANCE_ID:**

**Opção A: Na página inicial/dashboard:**
- Após fazer login, você verá sua instância
- O **ID da instância** geralmente aparece:
  - No nome da instância
  - Em "Configurações" → "Instância"
  - No URL quando você acessa a instância

**Opção B: Em Configurações:**
1. Vá em **"Configurações"** ou **"Settings"**
2. Procure por **"ID da Instância"** ou **"Instance ID"**
3. Copie o ID

**Opção C: No código/arquivo local:**
Se você já configurou antes, pode estar em:
- Arquivo `.env.local` no seu computador
- Arquivo de configuração do projeto
- Documentação que você salvou

---

### **3. Encontrar TOKEN:**

**Opção A: Em Configurações/API:**
1. No painel APIFACIL, vá em **"Configurações"** ou **"API"**
2. Procure por **"Token"**, **"API Token"** ou **"Chave de API"**
3. Se não tiver, pode precisar **gerar um novo token**
4. Copie o token

**Opção B: Gerar Novo Token:**
1. Vá em **"Configurações"** → **"API"** ou **"Tokens"**
2. Clique em **"Gerar Novo Token"** ou **"Create Token"**
3. Copie o token imediatamente (ele pode não aparecer novamente!)

**Opção C: No código/arquivo local:**
- Verifique arquivos `.env` no seu projeto local
- Verifique documentação que você salvou

---

## 🔍 ONDE PROCURAR NO PAINEL APIFACIL:

### **Seções comuns onde encontrar:**

1. **Dashboard/Início:**
   - Informações da instância
   - ID pode estar visível

2. **Configurações/Settings:**
   - Informações da conta
   - Configurações da instância
   - Tokens e chaves

3. **API/Integração:**
   - Tokens de API
   - Chaves de acesso
   - Credenciais

4. **Perfil/Conta:**
   - Informações da conta
   - Configurações de segurança

---

## 📝 EXEMPLO DE ONDE PODE ESTAR:

### **INSTANCE_ID pode aparecer como:**
- `instance_id`
- `ID da Instância`
- `Instance ID`
- `Instância: ABC123`
- No URL: `https://apifacil.com.br/instances/ABC123`

### **TOKEN pode aparecer como:**
- `token`
- `api_token`
- `chave_api`
- `API Key`
- `Token de Acesso`

---

## 🆘 SE NÃO ENCONTRAR:

### **Opção 1: Contatar Suporte APIFACIL**
- Entre em contato com suporte
- Peça as credenciais da sua instância
- Eles podem ajudar a localizar ou gerar novas

### **Opção 2: Verificar Documentação**
- Verifique emails da APIFACIL
- Verifique documentação que você salvou
- Verifique arquivos de configuração antigos

### **Opção 3: Gerar Novas Credenciais**
- Se possível, gere um novo token
- Anote imediatamente
- Use as novas credenciais

---

## ✅ DEPOIS DE ENCONTRAR:

Quando você tiver os valores:

1. **INSTANCE_ID:** Copie o ID (ex: `ABC123` ou `instance-123`)
2. **TOKEN:** Copie o token completo

3. **Adicione no arquivo .env.production:**

```env
APIFACIL_INSTANCE_ID=ABC123
APIFACIL_TOKEN=seu_token_completo_aqui
```

**Substitua pelos valores reais que você encontrou!**

---

## 📋 CHECKLIST:

- [ ] Acessei o painel da APIFACIL
- [ ] Encontrei o INSTANCE_ID
- [ ] Encontrei ou gerei o TOKEN
- [ ] Anotei ambos os valores
- [ ] Adicionei no arquivo .env.production
- [ ] Salvei o arquivo

---

## 🎯 RESUMO:

1. ✅ **Acesse:** https://apifacil.com.br (ou site da APIFACIL)
2. ✅ **Faça login** na sua conta
3. ✅ **Procure em:** Configurações → Instância/API
4. ✅ **Copie:** INSTANCE_ID e TOKEN
5. ✅ **Adicione no .env.production**

---

**Acesse o painel da APIFACIL para encontrar suas credenciais!** 🔐

Se você já tem essas credenciais em algum lugar (arquivo local, email, etc.), me diga onde estão e eu te ajudo a encontrá-las!


