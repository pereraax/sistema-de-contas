# ✅ VERIFICAR CONFIGURAÇÃO COMPLETA DO NGINX

## ✅ STATUS ATUAL:

- ✅ Nginx está rodando (`active (running)`)
- ✅ Você está no diretório correto (`/var/www/plenipay`)
- ⚠️ Precisa verificar se configuração está completa

---

## 🔍 VERIFICAR CONFIGURAÇÃO:

Execute este comando para ver a configuração completa:

```bash
cat /etc/nginx/sites-available/plenipay
```

**Verifique se tem:**

1. ✅ `location /_next/static` configurado
2. ✅ `location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|css|js)$` configurado
3. ✅ `location /` com `proxy_pass http://localhost:3000`

---

## 🔧 SE FALTAR ALGO, COLE ESTA CONFIGURAÇÃO COMPLETA:

```bash
nano /etc/nginx/sites-available/plenipay
```

**Cole esta configuração COMPLETA (substitua tudo):**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    # Arquivos estáticos do Next.js
    location /_next/static {
        alias /var/www/plenipay/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Arquivos da pasta public (imagens, etc)
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|css|js)$ {
        root /var/www/plenipay/public;
        expires 30d;
        add_header Cache-Control "public";
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
    }
}
```

**Salvar:** Ctrl+X, Y, Enter

---

## ✅ TESTAR E REINICIAR:

```bash
# 1. Testar configuração
nginx -t

# 2. Se der OK, reiniciar
systemctl restart nginx

# 3. Verificar status
systemctl status nginx
```

---

## 🧪 TESTAR SE ESTÁ FUNCIONANDO:

```bash
# 1. Verificar se PM2 está rodando
pm2 status

# 2. Testar aplicação local
curl http://localhost:3000 | head -20

# 3. Testar se arquivos estáticos estão acessíveis
curl -I http://localhost:3000/_next/static/chunks/main-app.js
```

---

## 🌐 TESTAR NO NAVEGADOR:

1. **Limpar cache:** Ctrl+Shift+Delete ou janela anônima
2. **Acessar:** `http://31.97.27.20`
3. **Verificar:** Deve aparecer com CSS e imagens

---

**Execute `cat /etc/nginx/sites-available/plenipay` e me envie o resultado!** 🔍


