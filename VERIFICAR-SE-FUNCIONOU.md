# ✅ VERIFICAR SE ESTÁ FUNCIONANDO AGORA

## ✅ STATUS:

- ✅ Nginx configurado com sucesso
- ✅ Nginx reiniciado
- ⚠️ Agora precisa verificar se está funcionando

---

## 🔍 VERIFICAÇÕES NECESSÁRIAS:

### **1. Verificar se PM2 está rodando:**

```bash
pm2 status
```

**Deve mostrar `sistema-contas` como `online`.**

**Se não estiver rodando:**
```bash
cd /var/www/plenipay
pm2 restart sistema-contas
# ou
pm2 start npm --name "sistema-contas" -- start
```

---

### **2. Testar se aplicação responde localmente:**

```bash
curl http://localhost:3000 | head -20
```

**Deve retornar HTML da aplicação.**

---

### **3. Testar se arquivos estáticos estão acessíveis:**

```bash
# Testar via aplicação (localhost)
curl -I http://localhost:3000/_next/static/chunks/main-app.js

# Testar via Nginx (pelo IP)
curl -I http://31.97.27.20/_next/static/chunks/main-app.js
```

**Ambos devem retornar status 200 (não 404).**

---

### **4. Verificar logs do Nginx (se houver erros):**

```bash
tail -20 /var/log/nginx/error.log
```

**Não deve ter erros relacionados a `_next/static`.**

---

### **5. Verificar logs da aplicação:**

```bash
pm2 logs sistema-contas --lines 20
```

**Não deve ter erros críticos.**

---

## 🌐 TESTAR NO NAVEGADOR:

### **IMPORTANTE: Limpar cache completamente!**

1. **Abrir janela anônima/privada** (Ctrl+Shift+N no Chrome)
2. **Acessar:** `http://31.97.27.20`
3. **Abrir DevTools (F12):**
   - Aba "Network"
   - Recarregar página (Ctrl+Shift+R)
   - Verificar se arquivos `/_next/static/...` carregam com status 200

---

## 🔧 SE AINDA NÃO FUNCIONAR:

### **Problema 1: Arquivos estáticos retornam 404**

**Solução:** Verificar se arquivos existem:

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

### **Problema 2: Nginx não serve assets mesmo com configuração correta**

**Solução:** Usar configuração simplificada (Next.js serve tudo):

```bash
nano /etc/nginx/sites-available/plenipay
```

**Cole esta configuração:**

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
    }
}
```

**Depois:**
```bash
nginx -t
systemctl restart nginx
```

---

### **Problema 3: Aplicação não está rodando**

**Solução:**
```bash
cd /var/www/plenipay
pm2 restart sistema-contas
pm2 logs sistema-contas --lines 30
```

**Se houver erros, verificar:**
- Variáveis de ambiente (`.env.production`)
- Porta 3000 não está em uso por outro processo
- Build foi feito corretamente

---

## ✅ CHECKLIST FINAL:

- [ ] PM2 está rodando (`pm2 status`)
- [ ] Aplicação responde localmente (`curl http://localhost:3000`)
- [ ] Arquivos estáticos existem (`.next/static`)
- [ ] Nginx está rodando (`systemctl status nginx`)
- [ ] Testou no navegador com cache limpo
- [ ] DevTools mostra assets carregando (status 200)

---

**Execute as verificações acima e me diga o resultado!** 🔍


