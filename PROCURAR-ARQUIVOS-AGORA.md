# 🔍 PROCURAR ARQUIVOS DO PROJETO - COMANDOS

## ✅ VOCÊ ESTÁ COMO ROOT

Agora vamos encontrar onde estão os arquivos do projeto.

---

## 📋 EXECUTE ESTES COMANDOS (UM POR VEZ):

### **1. Procurar por next.config.js:**

```bash
find / -name "next.config.js" 2>/dev/null
```

**Isso vai mostrar TODOS os lugares onde está o arquivo.**

---

### **2. Procurar por package.json:**

```bash
find / -name "package.json" 2>/dev/null | grep -v node_modules | head -10
```

**Isso mostra onde está o package.json (sem mostrar node_modules).**

---

### **3. Ver estrutura de pastas:**

```bash
# Ver pasta home
ls -la /home

# Ver pasta www
ls -la /var/www 2>/dev/null

# Ver pasta html
ls -la /var/www/html 2>/dev/null

# Ver pasta root
ls -la /root
```

---

### **4. Ver onde você está:**

```bash
pwd
ls -la
```

---

## 🎯 DEPOIS DE ENCONTRAR:

Quando você encontrar o caminho (ex: `/var/www/html` ou `/root/projeto`), execute:

```bash
# Ir para pasta correta
cd CAMINHO_QUE_APARECEU

# Ver arquivos
ls -la

# Verificar se tem package.json
cat package.json | head -5
```

---

## 🚀 SE NÃO ENCONTRAR ARQUIVOS:

Se não encontrar, clone do GitHub:

```bash
# Criar pasta
mkdir -p /root/projeto
cd /root/projeto

# Clonar repositório
git clone https://github.com/pereraax/sistema-de-contas.git .

# Ver arquivos
ls -la

# Instalar dependências
npm install
```

---

## 📝 COMANDOS PARA EXECUTAR AGORA:

**Execute no terminal SSH (copie e cole):**

```bash
find / -name "next.config.js" 2>/dev/null
```

**Me diga o que apareceu e eu te ajudo a navegar até lá!**

---

## ✅ CHECKLIST:

- [ ] Executei `find / -name "next.config.js" 2>/dev/null`
- [ ] Vi o caminho que apareceu
- [ ] Anotei o caminho
- [ ] Executei `cd CAMINHO_CORRETO`
- [ ] Verifiquei arquivos (`ls -la`)

---

**Execute o comando `find` acima e me diga o resultado!** 🔍


