# 📦 CRIAR REPOSITÓRIO NO GITHUB - PASSO A PASSO

## 🚀 MÉTODO RÁPIDO (Automático)

Execute o script:
```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"
./CRIAR-REPOSITORIO-GITHUB.sh
```

O script vai:
1. Instalar GitHub CLI (se necessário)
2. Autenticar você
3. Criar o repositório
4. Fazer push do código

---

## 📋 MÉTODO MANUAL (Passo a Passo Visual)

### **PASSO 1: Acessar GitHub**

1. Abra seu navegador
2. Vá em: **https://github.com**
3. Faça **login** na sua conta

---

### **PASSO 2: Criar Novo Repositório**

1. Clique no botão **"+"** no canto superior direito
2. Selecione **"New repository"**

---

### **PASSO 3: Preencher Formulário**

**Repository name:**
```
sistema-de-contas
```

**Description (opcional):**
```
Sistema de Controle Financeiro - PLENIPAY
```

**Visibility:**
- ✅ Marque **"Private"** (recomendado)
- ❌ NÃO marque "Public"

**Initialize this repository with:**
- ❌ **NÃO marque** "Add a README file"
- ❌ **NÃO marque** "Add .gitignore"
- ❌ **NÃO marque** "Choose a license"

**Deixe tudo desmarcado!**

---

### **PASSO 4: Criar Repositório**

1. Clique no botão verde **"Create repository"**

---

### **PASSO 5: Copiar URL**

Após criar, você verá uma página com instruções.

**Copie a URL do repositório:**
```
https://github.com/SEU-USUARIO/sistema-de-contas.git
```

(Substitua `SEU-USUARIO` pelo seu usuário)

---

### **PASSO 6: Conectar e Fazer Push**

Abra o terminal e execute:

```bash
cd "/Users/charllestabordas/Documents/SISTEMA DE CONTAS"

# Adicionar remote (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/sistema-de-contas.git

# Fazer push
git push -u origin main
```

**Se pedir autenticação:**
- Use seu **token de acesso pessoal** (não a senha)
- Ou configure SSH keys

---

## 🔐 CRIAR TOKEN DE ACESSO (Se necessário)

1. Vá em: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Clique em **"Generate new token (classic)"**
3. **Note name:** `sistema-contas`
4. **Expiration:** Escolha um prazo
5. **Scopes:** Marque **"repo"** (todos os sub-itens)
6. Clique em **"Generate token"**
7. **COPIE O TOKEN** (você não verá novamente!)
8. Use esse token como senha quando fizer push

---

## ✅ VERIFICAR SE FUNCIONOU

Após o push, acesse:
```
https://github.com/SEU-USUARIO/sistema-de-contas
```

Você deve ver todos os arquivos do projeto lá!

---

## 🚨 PROBLEMAS COMUNS

### **Erro: "remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/sistema-de-contas.git
```

### **Erro: "Authentication failed"**
- Use token de acesso pessoal (não senha)
- Ou configure SSH keys

### **Erro: "Repository not found"**
- Verifique se o nome do repositório está correto
- Verifique se você tem permissão

---

## 📝 PRÓXIMOS PASSOS

Após criar o repositório:

1. ✅ Repositório criado no GitHub
2. ✅ Código enviado (push)
3. 📤 Fazer upload na Hostinger
4. 🔧 Configurar servidor
5. 🚀 Deploy!

---

**Pronto para criar o repositório!** 🎉


