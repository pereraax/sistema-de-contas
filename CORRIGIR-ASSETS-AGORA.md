# 🚨 CORRIGIR ASSETS AGORA - IP NÃO PRECISA ESPERAR DOMÍNIO

## ❌ PROBLEMA:

**NÃO precisa esperar domínio!** O problema é que o Nginx não está servindo os assets estáticos corretamente.

---

## ✅ SOLUÇÃO IMEDIATA:

### **PASSO 1: Verificar configuração atual do Nginx**

```bash
cat /etc/nginx/sites-available/plenipay
```

**Me envie o resultado!**

---

### **PASSO 2: Corrigir configuração do Nginx**

Execute:

```bash
nano /etc/nginx/sites-available/plenipay
```

**SUBSTITUA TUDO por esta configuração COMPLETA:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    # IMPORTANTE: Servir arquivos estáticos do Next.js PRIMEIRO
    location /_next/static {
        alias /var/www/plenipay/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Arquivos da pasta public (imagens, etc)
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|css|js)$ {
        root /var/www/plenipay/public;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Proxy para aplicação Next.js
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Salvar:** Ctrl+X, Y, Enter

---

### **PASSO 3: Testar e reiniciar Nginx**

```bash
# Testar configuração
nginx -t

# Se der OK, reiniciar
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

### **PASSO 4: Verificar se arquivos estáticos existem**

```bash
# Verificar se pasta existe
ls -la /var/www/plenipay/.next/static

# Verificar se tem chunks
ls -la /var/www/plenipay/.next/static/chunks | head -5

# Verificar se tem CSS
ls -la /var/www/plenipay/.next/static/css | head -5
```

---

### **PASSO 5: Verificar se PM2 está rodando**

```bash
pm2 status
pm2 logs sistema-contas --lines 10
```

**Se não estiver rodando:**
```bash
cd /var/www/plenipay
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

### **PASSO 6: Testar se assets estão acessíveis**

```bash
# Testar se aplicação responde
curl http://localhost:3000 | head -20

# Testar se arquivo estático está acessível
curl -I http://localhost:3000/_next/static/chunks/main-app.js

# Testar via Nginx (pelo IP)
curl -I http://31.97.27.20/_next/static/chunks/main-app.js
```

**Se o último comando retornar 404, o problema é o Nginx não servindo os assets!**

---

### **PASSO 7: Verificar logs do Nginx**

```bash
tail -50 /var/log/nginx/error.log
```

**Procure por erros relacionados a `_next/static`!**

---

## 🔧 SE AINDA NÃO FUNCIONAR:

### **Alternativa: Deixar Next.js servir tudo**

Se o Nginx não conseguir servir os assets, podemos fazer o Next.js servir tudo:

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    # Proxy TUDO para Next.js (incluindo assets)
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Depois:**
```bash
nginx -t
systemctl restart nginx
```

---

## ✅ TESTAR NO NAVEGADOR:

1. **Limpar cache COMPLETAMENTE:**
   - Ctrl+Shift+Delete
   - Ou usar janela anônima/privada

2. **Acessar:** `http://31.97.27.20`

3. **Abrir DevTools (F12):**
   - Aba "Network"
   - Recarregar página
   - Verificar se arquivos `/_next/static/...` carregam com status 200

---

## 🎯 RESUMO:

1. ❌ **NÃO precisa esperar domínio** - problema é Nginx
2. ✅ **Corrigir configuração do Nginx** - adicionar `location /_next/static`
3. ✅ **Verificar se arquivos existem** - `.next/static`
4. ✅ **Reiniciar Nginx** - aplicar mudanças
5. ✅ **Testar no navegador** - com cache limpo

---

**Execute os passos acima AGORA!** 🔧


