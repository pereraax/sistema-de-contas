# 🔐 AUTENTICAR NO GITHUB - PASSO A PASSO

## ✅ GitHub CLI Instalado!

Agora você precisa autenticar no GitHub.

---

## 📋 PASSO A PASSO:

### **1. Execute o comando de autenticação:**

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
gh auth login
```

---

### **2. Siga as instruções no terminal:**

O GitHub CLI vai perguntar:

**1. What account do you want to log into?**
- Escolha: **GitHub.com**

**2. What is your preferred protocol for Git operations?**
- Escolha: **HTTPS** (mais fácil)

**3. Authenticate Git credential helper?**
- Escolha: **Yes**

**4. How would you like to authenticate GitHub CLI?**
- Escolha: **Login with a web browser** (mais fácil)

**5. Press Enter to open github.com in your browser...**
- Pressione **Enter**
- Seu navegador vai abrir automaticamente

**6. No navegador:**
- Faça login na sua conta GitHub
- Autorize o GitHub CLI
- Volte ao terminal

**7. No terminal:**
- Digite o código que apareceu no navegador
- Pressione Enter

---

### **3. Verificar se funcionou:**

```bash
gh auth status
```

Deve mostrar: **"✓ Logged in to github.com as SEU-USUARIO"**

---

### **4. Criar repositório:**

Após autenticar, execute:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
./CRIAR-REPOSITORIO-GITHUB.sh
```

Ou manualmente:

```bash
gh repo create sistema-de-contas \
    --private \
    --description "Sistema de Controle Financeiro - PLENIPAY" \
    --source=. \
    --remote=origin \
    --push
```

---

## 🚨 ALTERNATIVA: Criar Manualmente

Se preferir criar manualmente no navegador:

1. Acesse: **https://github.com/new**
2. Nome: `sistema-de-contas`
3. Marque **Private**
4. **NÃO marque** nenhuma opção de inicialização
5. Clique em **"Create repository"**
6. Depois execute:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
git remote add origin https://github.com/SEU-USUARIO/sistema-de-contas.git
git push -u origin main
```

---

**Execute `gh auth login` agora!** 🚀


