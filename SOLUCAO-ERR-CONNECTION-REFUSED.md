# 🚨 SOLUÇÃO: ERR_CONNECTION_REFUSED - ASSETS NÃO CARREGAM

## ❌ PROBLEMA IDENTIFICADO:

Os erros `ERR_CONNECTION_REFUSED` no console mostram que:
- ❌ CSS não carrega: `/next/static/css/...`
- ❌ JavaScript não carrega: `/next/static/chunks/...`
- ❌ Imagens não carregam: `logo.png`, `favicon.ico`

**Causa:** Nginx não está servindo os assets estáticos corretamente.

---

## ✅ SOLUÇÃO: FAZER NEXT.JS SERVIR TUDO

A solução mais simples é fazer o Next.js servir todos os assets diretamente, sem o Nginx tentar servir os arquivos estáticos.

### **PASSO 1: Atualizar configuração do Nginx**

```bash
nano /etc/nginx/sites-available/plenipay
```

**SUBSTITUA TUDO por esta configuração SIMPLIFICADA:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    # Proxy TUDO para Next.js (Next.js serve os assets)
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

### **PASSO 2: Testar e reiniciar Nginx**

```bash
nginx -t
systemctl restart nginx
```

---

### **PASSO 3: Verificar se PM2 está rodando**

```bash
pm2 status
```

**Se não estiver rodando:**
```bash
cd /var/www/plenipay
pm2 restart sistema-contas
# ou
pm2 start npm --name "sistema-contas" -- start
pm2 save
```

---

### **PASSO 4: Verificar se aplicação responde**

```bash
curl http://localhost:3000 | head -20
```

**Deve retornar HTML da aplicação.**

---

### **PASSO 5: Verificar se arquivos estáticos existem**

```bash
ls -la /var/www/plenipay/.next/static/chunks | head -5
ls -la /var/www/plenipay/.next/static/css | head -5
```

**Se não existir, fazer build:**
```bash
cd /var/www/plenipay
npm run build
pm2 restart sistema-contas
```

---

### **PASSO 6: Testar no navegador**

1. **Limpar cache COMPLETAMENTE:**
   - Ctrl+Shift+Delete
   - Ou usar janela anônima/privada

2. **Acessar:** `http://31.97.27.20`

3. **Abrir DevTools (F12):**
   - Aba "Network"
   - Recarregar página (Ctrl+Shift+R)
   - Verificar se arquivos `/_next/static/...` carregam com status 200

---

## 🔍 DIAGNÓSTICO ADICIONAL (SE AINDA NÃO FUNCIONAR):

### **Verificar se porta 3000 está aberta:**

```bash
netstat -tlnp | grep 3000
```

**Deve mostrar que está escutando na porta 3000.**

---

### **Verificar logs do PM2:**

```bash
pm2 logs sistema-contas --lines 50
```

**Procure por erros!**

---

### **Verificar logs do Nginx:**

```bash
tail -50 /var/log/nginx/error.log
```

**Procure por erros!**

---

### **Testar acesso direto aos assets:**

```bash
# Testar via aplicação (localhost)
curl -I http://localhost:3000/_next/static/chunks/main-app.js

# Testar via Nginx (pelo IP)
curl -I http://31.97.27.20/_next/static/chunks/main-app.js
```

**Ambos devem retornar status 200.**

---

## ✅ CHECKLIST:

- [ ] Nginx configurado (configuração simplificada)
- [ ] Nginx reiniciado (`systemctl restart nginx`)
- [ ] PM2 está rodando (`pm2 status`)
- [ ] Aplicação responde (`curl http://localhost:3000`)
- [ ] Arquivos estáticos existem (`.next/static`)
- [ ] Build foi feito (`npm run build`)
- [ ] Testou no navegador com cache limpo

---

**Execute os passos acima e teste novamente!** 🔧


