# 🔍 ENCONTRAR PASTA CORRETA DO PROJETO

## ❌ CAMINHO ESTÁ ERRADO

O caminho `/home/u596588143/domains/plenipay.com` não existe ou está incorreto.

Vamos encontrar o caminho correto!

---

## 🔍 MÉTODO 1: PROCURAR ARQUIVOS DO PROJETO

Execute estes comandos no terminal SSH para encontrar onde estão os arquivos:

### **1. Procurar por next.config.js:**

```bash
find / -name "next.config.js" 2>/dev/null
```

Isso mostra TODOS os lugares onde está o arquivo `next.config.js`.

---

### **2. Procurar por package.json:**

```bash
find / -name "package.json" 2>/dev/null | grep -v node_modules
```

Isso mostra onde está o `package.json` (sem mostrar node_modules).

---

### **3. Ver estrutura de pastas:**

```bash
# Ver pasta home
ls -la /home

# Ver pasta do usuário (se existir)
ls -la /home/u596588143 2>/dev/null

# Ver pasta domains (se existir)
ls -la /home/*/domains 2>/dev/null

# Ver pasta www
ls -la /var/www 2>/dev/null

# Ver pasta html
ls -la /var/www/html 2>/dev/null
```

---

## 🔍 MÉTODO 2: VER ONDE VOCÊ ESTÁ

Execute:

```bash
# Ver onde está agora
pwd

# Ver arquivos na pasta atual
ls -la

# Ver se tem arquivos do projeto aqui
ls -la | grep -E "package.json|next.config.js|app|components"
```

---

## 🔍 MÉTODO 3: VERIFICAR FILE MANAGER

Se você enviou arquivos via File Manager da Hostinger:

1. **Acesse:** https://hpanel.hostinger.com
2. **Vá em:** "Files" → "File Manager"
3. **Veja o caminho completo** na barra de endereço
4. **Anote o caminho** que aparece lá

---

## 📋 COMANDOS PARA EXECUTAR AGORA:

Execute no terminal SSH (um por vez):

```bash
# 1. Ver onde está
pwd

# 2. Procurar next.config.js
find / -name "next.config.js" 2>/dev/null

# 3. Procurar package.json
find / -name "package.json" 2>/dev/null | grep -v node_modules | head -5

# 4. Ver estrutura home
ls -la /home

# 5. Ver estrutura www
ls -la /var/www 2>/dev/null
```

---

## ✅ DEPOIS DE ENCONTRAR O CAMINHO:

Quando você encontrar o caminho correto (ex: `/var/www/html` ou `/home/outro-usuario/projeto`), execute:

```bash
# Ir para pasta correta
cd CAMINHO_CORRETO_AQUI

# Ver arquivos
ls -la

# Verificar se tem package.json
cat package.json | head -5

# Instalar dependências
npm install
```

---

## 🆘 SE NÃO ENCONTRAR NENHUM ARQUIVO:

Os arquivos podem não ter sido enviados ainda. Nesse caso:

### **Opção 1: Clonar do GitHub**

```bash
# Criar pasta onde quiser
mkdir -p ~/projeto
cd ~/projeto

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# Ver arquivos
ls -la
```

### **Opção 2: Verificar File Manager**

1. Acesse File Manager no painel Hostinger
2. Veja onde você fez upload dos arquivos
3. Anote o caminho completo

---

## 📝 EXEMPLOS DE CAMINHOS COMUNS:

Os arquivos podem estar em:

- `/var/www/html/`
- `/var/www/plenipay.com/`
- `/home/outro-usuario/public_html/`
- `/home/outro-usuario/domains/plenipay.com/`
- `/root/projeto/`
- `~/projeto/`

---

## ✅ CHECKLIST:

- [ ] Executei `find / -name "next.config.js" 2>/dev/null`
- [ ] Encontrei o caminho correto
- [ ] Anotei o caminho
- [ ] Executei `cd CAMINHO_CORRETO`
- [ ] Verifiquei arquivos (`ls -la`)
- [ ] Instalei dependências (`npm install`)

---

**Execute os comandos de busca acima para encontrar o caminho correto!** 🔍

Me diga o que apareceu quando você executou `find / -name "next.config.js" 2>/dev/null` e eu te ajudo a navegar até lá!


