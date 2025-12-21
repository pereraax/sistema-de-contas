# 🔐 COMO PEGAR O CÓDIGO DO GITHUB

## 📋 ONDE ESTÁ O CÓDIGO?

O código de 6 dígitos aparece **NO TERMINAL** onde você executou `gh auth login`.

---

## 🔍 PASSO A PASSO:

### **1. Olhe no Terminal:**

Quando você executou `gh auth login`, o GitHub CLI mostrou algo assim:

```
! First copy your one-time code: XXXX-XXXX
Press Enter to open github.com in your browser...
```

**Esse código `XXXX-XXXX` é o que você precisa!**

---

### **2. Se o Terminal Fechou ou Não Vê o Código:**

**Opção A: Execute novamente:**
```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
gh auth login
```

Quando aparecer o código, **COPIE ELE ANTES** de pressionar Enter!

---

**Opção B: Verificar se já está autenticado:**
```bash
gh auth status
```

Se mostrar "✓ Logged in", você já está autenticado e não precisa do código!

---

## ✅ COMO USAR O CÓDIGO:

1. **No terminal:** Você vê algo como: `XXXX-XXXX` (8 caracteres com hífen)
2. **No navegador:** Digite os 6 dígitos (sem o hífen)
   - Exemplo: Se o código é `A1B2-C3D4`, digite: `A1B2C3`
3. **Clique em "Continue"**

---

## 🚨 SE NÃO CONSEGUIR O CÓDIGO:

### **Método Alternativo: Token de Acesso**

1. **Criar Token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em **"Generate new token (classic)"**
   - **Note:** `sistema-contas`
   - **Expiration:** Escolha um prazo
   - **Scopes:** Marque **"repo"** (todos)
   - Clique em **"Generate token"**
   - **COPIE O TOKEN** (você não verá novamente!)

2. **Usar Token:**
   ```bash
   gh auth login --with-token
   ```
   Cole o token quando pedir.

---

## 📝 RESUMO RÁPIDO:

1. ✅ Olhe no **TERMINAL** onde executou `gh auth login`
2. ✅ O código aparece como: `XXXX-XXXX`
3. ✅ Digite os **6 primeiros caracteres** (sem hífen) no navegador
4. ✅ Clique em **"Continue"**

---

**O código está no terminal! Volte lá e procure!** 🔍


