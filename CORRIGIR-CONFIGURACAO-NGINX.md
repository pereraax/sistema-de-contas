# 🔧 CORRIGIR CONFIGURAÇÃO NGINX

## ❌ ERRO IDENTIFICADO:

O arquivo tem um bloco `server` dentro de `location`, o que está **ERRADO**.

---

## ✅ CONFIGURAÇÃO CORRETA:

### **Apague tudo e cole esta configuração:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📋 PASSO A PASSO NO NANO:

### **1. Apagar tudo:**

1. Pressione **Ctrl+A** (selecionar tudo)
2. Pressione **Ctrl+K** (cortar/apagar)
3. Ou delete manualmente tudo

### **2. Cole a configuração correta:**

Cole exatamente esta configuração:

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **3. Salvar:**

1. Pressione **Ctrl+X**
2. Pressione **Y**
3. Pressione **Enter**

---

## ✅ DEPOIS DE SALVAR:

### **1. Testar configuração:**

```bash
nginx -t
```

**Deve mostrar:** `syntax is ok` e `test is successful`

### **2. Se der OK, reiniciar Nginx:**

```bash
systemctl restart nginx
```

### **3. Verificar status:**

```bash
systemctl status nginx
```

**Deve mostrar:** `active (running)`

---

## 🎯 COMANDOS DO NANO:

- **Ctrl+A** = Selecionar tudo
- **Ctrl+K** = Cortar/apagar linha
- **Ctrl+U** = Colar
- **Ctrl+X** = Sair
- **Ctrl+O** = Salvar

---

## 📝 SEQUÊNCIA COMPLETA:

1. ✅ **No nano:** Apague tudo (Ctrl+A, depois delete)
2. ✅ **Cole a configuração correta** (acima)
3. ✅ **Salve:** Ctrl+X, Y, Enter
4. ✅ **Teste:** `nginx -t`
5. ✅ **Reinicie:** `systemctl restart nginx`
6. ✅ **Verifique:** `systemctl status nginx`

---

## ⚠️ IMPORTANTE:

- ❌ **NÃO pode ter** `server {` dentro de `location /`
- ✅ **Deve ter** apenas `location / {` dentro de `server {`
- ✅ **Estrutura correta:** `server { location / { ... } }`

---

**Apague tudo e cole a configuração correta acima!** 🔧

Depois salve e teste com `nginx -t`!


