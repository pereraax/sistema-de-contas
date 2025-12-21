# 🔧 ASSETS NÃO CARREGAM PELO IP - SOLUÇÃO

## 🔍 PROBLEMA:

Quando acessa pelo IP (`http://31.97.27.20`), o HTML carrega mas:
- ❌ CSS não carrega
- ❌ Imagens não carregam
- ❌ JavaScript não carrega

**Causa:** Next.js está gerando URLs absolutas baseadas em `NEXT_PUBLIC_SITE_URL` (que está como `https://plenipay.com`), então quando acessa pelo IP, os assets tentam carregar do domínio.

---

## ✅ SOLUÇÃO 1: CONFIGURAR NGINX PARA SERVIR ASSETS ESTÁTICOS

O Nginx precisa servir os arquivos estáticos do Next.js diretamente.

### **Atualizar Configuração do Nginx:**

No terminal SSH, execute:

```bash
nano /etc/nginx/sites-available/plenipay
```

**Substitua a configuração por esta (com suporte a assets estáticos):**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    # Servir arquivos estáticos do Next.js diretamente
    location /_next/static {
        alias /var/www/plenipay/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Servir arquivos da pasta public
    location / {
        # Primeiro tenta servir arquivos estáticos
        try_files $uri $uri/ @nextjs;
    }

    # Proxy para aplicação Next.js
    location @nextjs {
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

    # Proxy direto para aplicação (fallback)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Salvar:** Ctrl+X, Y, Enter

**Testar e reiniciar:**
```bash
nginx -t
systemctl restart nginx
```

---

## ✅ SOLUÇÃO 2: VERIFICAR SE ARQUIVOS ESTÁTICOS EXISTEM

```bash
# Verificar se pasta .next existe
ls -la /var/www/plenipay/.next

# Verificar se arquivos estáticos existem
ls -la /var/www/plenipay/.next/static

# Verificar permissões
ls -la /var/www/plenipay/.next/static | head -10
```

**Se não existir, fazer build:**
```bash
cd /var/www/plenipay
npm run build
```

---

## ✅ SOLUÇÃO 3: AJUSTAR VARIÁVEIS DE AMBIENTE (TEMPORÁRIO)

Para testar pelo IP, pode ajustar temporariamente:

```bash
cd /var/www/plenipay
nano .env.production
```

**Adicione ou altere:**

```env
NEXT_PUBLIC_SITE_URL=http://31.97.27.20
NEXT_PUBLIC_APP_URL=http://31.97.27.20
```

**Depois:**
```bash
# Fazer build novamente
npm run build

# Reiniciar servidor
pm2 restart sistema-contas
```

**⚠️ IMPORTANTE:** Depois que DNS propagar, volte para `https://plenipay.com`

---

## ✅ SOLUÇÃO 4: CONFIGURAÇÃO NGINX COMPLETA (RECOMENDADA)

Esta configuração serve assets estáticos corretamente:

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

---

## 📋 SEQUÊNCIA COMPLETA:

```bash
# 1. Editar configuração Nginx
nano /etc/nginx/sites-available/plenipay
# (Cole configuração completa acima e salve)

# 2. Testar configuração
nginx -t

# 3. Reiniciar Nginx
systemctl restart nginx

# 4. Verificar se arquivos estáticos existem
ls -la /var/www/plenipay/.next/static

# 5. Se não existir, fazer build
cd /var/www/plenipay
npm run build

# 6. Reiniciar aplicação
pm2 restart sistema-contas

# 7. Testar no navegador
# http://31.97.27.20
```

---

## 🔍 VERIFICAR LOGS:

```bash
# Logs do Nginx
tail -f /var/log/nginx/error.log

# Logs da aplicação
pm2 logs sistema-contas
```

---

## ✅ CHECKLIST:

- [ ] Atualizei configuração do Nginx (com suporte a assets)
- [ ] Testei configuração (`nginx -t`)
- [ ] Reiniciei Nginx (`systemctl restart nginx`)
- [ ] Verifiquei se arquivos estáticos existem (`.next/static`)
- [ ] Fiz build se necessário (`npm run build`)
- [ ] Reiniciei aplicação (`pm2 restart sistema-contas`)
- [ ] Testei no navegador: `http://31.97.27.20`

---

## 🎯 RESUMO:

1. ✅ **Atualizar Nginx:** Adicionar suporte a arquivos estáticos
2. ✅ **Verificar build:** Garantir que `.next/static` existe
3. ✅ **Reiniciar serviços:** Nginx e PM2
4. ✅ **Testar:** `http://31.97.27.20`

---

**Atualize a configuração do Nginx para servir os arquivos estáticos!** 🔧

Execute os comandos acima e teste novamente!


