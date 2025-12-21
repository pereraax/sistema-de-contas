# 🚨 CORRIGIR: ASSETS TENTANDO CARREGAR DE LOCALHOST:3000

## ❌ PROBLEMA IDENTIFICADO:

Os assets estão tentando carregar de `http://localhost:3000/next/static/...` em vez do IP ou domínio.

**Causa:** Next.js está gerando URLs absolutas baseadas em `localhost:3000` ou variável de ambiente incorreta.

---

## ✅ SOLUÇÃO 1: CORRIGIR VARIÁVEIS DE AMBIENTE NO SERVIDOR

### **No SSH, execute:**

```bash
cd /var/www/plenipay
nano .env.production
```

**Verifique/Adicione estas variáveis:**

```env
# URL base da aplicação (use o IP temporariamente)
NEXT_PUBLIC_SITE_URL=http://31.97.27.20
NEXT_PUBLIC_APP_URL=http://31.97.27.20

# Outras variáveis...
```

**Salvar:** Ctrl+X, Y, Enter

---

## ✅ SOLUÇÃO 2: ADICIONAR assetPrefix NO next.config.js

### **No servidor, edite:**

```bash
cd /var/www/plenipay
nano next.config.js
```

**Adicione esta linha no início do `nextConfig`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adicionar esta linha para corrigir URLs dos assets
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // ... resto da configuração
}
```

**OU melhor ainda, adicione basePath:**

```javascript
const nextConfig = {
  // Forçar URLs relativas em produção
  basePath: '',
  assetPrefix: '',
  
  // ... resto da configuração
}
```

**Salvar:** Ctrl+X, Y, Enter

---

## ✅ SOLUÇÃO 3: FAZER REBUILD E REINICIAR

```bash
cd /var/www/plenipay

# Fazer build novamente
npm run build

# Reiniciar aplicação
pm2 restart sistema-contas

# Verificar logs
pm2 logs sistema-contas --lines 20
```

---

## ✅ SOLUÇÃO 4: VERIFICAR CONFIGURAÇÃO NGINX

Certifique-se que o Nginx está fazendo proxy corretamente:

```bash
cat /etc/nginx/sites-available/plenipay
```

**Deve ter:**

```nginx
server {
    listen 80;
    server_name plenipay.com www.plenipay.com 31.97.27.20;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Se não estiver assim, corrija:**

```bash
nano /etc/nginx/sites-available/plenipay
# (Cole configuração acima)
nginx -t
systemctl restart nginx
```

---

## 🔧 SOLUÇÃO ALTERNATIVA: USAR URLS RELATIVAS

Se nada funcionar, podemos forçar Next.js a usar URLs relativas editando `next.config.js`:

```javascript
const nextConfig = {
  // Forçar URLs relativas
  trailingSlash: false,
  
  // ... resto da configuração
}
```

---

## ✅ TESTAR DEPOIS DAS CORREÇÕES:

1. **Limpar cache:** Ctrl+Shift+Delete ou janela anônima
2. **Acessar:** `http://31.97.27.20`
3. **Abrir DevTools (F12):**
   - Aba "Network"
   - Recarregar página
   - Verificar se assets carregam de `31.97.27.20` (não `localhost:3000`)

---

**Execute as correções acima e teste novamente!** 🔧

