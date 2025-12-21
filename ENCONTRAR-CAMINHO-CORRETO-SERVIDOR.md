# 🔍 ENCONTRAR CAMINHO CORRETO DO PROJETO

## ❌ PROBLEMA:

O caminho `/home/u596588143/domains/plenipay.com` não existe no servidor.

---

## ✅ SOLUÇÃO: ENCONTRAR ONDE ESTÁ O PROJETO

Execute estes comandos **um por vez** no SSH:

### **1. Procurar arquivo `next.config.js`:**

```bash
find /home -name "next.config.js" 2>/dev/null
```

**Anote o caminho completo que aparecer!**

---

### **2. Se não encontrar, procurar pasta `.next`:**

```bash
find /home -name ".next" -type d 2>/dev/null
```

---

### **3. Se ainda não encontrar, procurar `package.json`:**

```bash
find /home -name "package.json" 2>/dev/null | grep -v node_modules
```

---

### **4. Verificar onde o PM2 está rodando:**

```bash
pm2 list
pm2 info sistema-contas
```

**O comando `pm2 info` vai mostrar o caminho do projeto!**

---

### **5. Verificar processos Node.js:**

```bash
ps aux | grep node
```

**Procure pelo caminho na saída!**

---

## 🎯 DEPOIS DE ENCONTRAR O CAMINHO:

Quando encontrar o caminho correto (ex: `/var/www/plenipay` ou outro), execute:

```bash
# Ir para o caminho encontrado
cd CAMINHO_ENCONTRADO

# Verificar se arquivos existem
ls -la
ls -la .next/static
```

---

## 📋 EXEMPLOS DE CAMINHOS COMUNS:

- `/var/www/plenipay`
- `/var/www/html`
- `/home/u596588143/public_html`
- `/home/u596588143/domains/plenipay.com/public_html`
- `/opt/plenipay`

---

**Execute o comando `find` ou `pm2 info` para encontrar o caminho correto!** 🔍


