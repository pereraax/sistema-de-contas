# 🔍 COMO VERIFICAR O REDIRECT - PASSO A PASSO

## 📋 O Que Fazer

### **PASSO 1: Abrir DevTools**

1. Abra o email com o link de confirmação
2. **Antes de clicar no link**, abra o DevTools:
   - Pressione **F12** (ou **Cmd+Option+I** no Mac)
   - OU clique com botão direito → **Inspecionar**

### **PASSO 2: Abrir Aba Network**

1. No DevTools, clique na aba **"Network"** (Rede)
2. **IMPORTANTE:** Deixe o DevTools aberto

### **PASSO 3: Limpar Requisições Anteriores**

1. Clique no botão **"Clear"** (Limpar) no topo do Network tab
   - É um círculo com uma linha diagonal (🚫)
   - Isso limpa todas as requisições anteriores

### **PASSO 4: Clicar no Link**

1. **Agora sim**, clique no botão **"Confirmar Email"** ou no link do email
2. **Observe o Network tab** - novas requisições vão aparecer

### **PASSO 5: Procurar Requisições para plenipay.com**

1. No Network tab, procure por requisições que contenham:
   - `plenipay.com`
   - `auth/callback`
   - `0.0.0.0`
   - `10000`

2. **Filtre por nome:**
   - Digite `plenipay` na barra de busca do Network tab
   - OU digite `0.0.0.0`

### **PASSO 6: Ver Detalhes da Requisição**

1. **Clique na requisição** que vai para `plenipay.com/auth/callback`
2. Veja os detalhes:
   - **Headers** → **Response Headers**
   - Procure por um header chamado **"Location"**
   - Se houver `Location: https://0.0.0.0:10000/...`, esse é o problema!

---

## 📊 O Que Procurar

### **Cenário 1: Requisição para plenipay.com/auth/callback**

**Se aparecer:**
```
Name: auth/callback?token_hash=...
Status: 307 (ou 302)
Type: document
```

**Clique nela e veja:**
- **Response Headers** → Procure por `Location`
- Se `Location` contém `0.0.0.0:10000` → **Esse é o problema!**

### **Cenário 2: Requisição para 0.0.0.0:10000**

**Se aparecer:**
```
Name: 0.0.0.0:10000/login?error=...
Status: ERR_CONNECTION_REFUSED (ou similar)
```

**Isso significa:**
- Algo está redirecionando para `0.0.0.0:10000`
- O navegador tenta acessar mas não consegue

### **Cenário 3: Nenhuma Requisição Aparece**

**Se não aparecer nenhuma requisição:**
- O redirect pode estar acontecendo no JavaScript (client-side)
- Veja a aba **Console** para erros JavaScript

---

## 🎯 O Que Me Enviar

Depois de fazer os passos acima, me envie:

1. **Screenshot do Network tab** mostrando as requisições
2. **Detalhes da requisição** para `auth/callback`:
   - Status code
   - Response Headers (especialmente `Location`)
3. **Logs do terminal** quando clicar no link

---

## ✅ Exemplo do Que Esperar

**Se tudo estiver funcionando:**
```
Name: auth/callback?token_hash=...
Status: 200
Response Headers:
  - Location: https://plenipay.com/home?emailConfirmed=true
```

**Se houver problema:**
```
Name: auth/callback?token_hash=...
Status: 307
Response Headers:
  - Location: https://0.0.0.0:10000/login?error=...  ← PROBLEMA AQUI!
```

---

**Siga esses passos e me envie o que encontrar!** 🔍
