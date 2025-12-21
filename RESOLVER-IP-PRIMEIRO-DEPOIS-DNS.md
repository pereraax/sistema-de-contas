# 🚨 IMPORTANTE: RESOLVER IP PRIMEIRO!

## ⚠️ PROBLEMA CRÍTICO:

**Se o IP mostra só HTML (sem CSS/assets), o domínio TAMBÉM vai mostrar só HTML!**

O domínio apenas aponta para o IP. Se o IP não funciona direito, o domínio também não vai funcionar.

---

## ✅ SEQUÊNCIA CORRETA:

### **1. PRIMEIRO: Resolver problema do IP** ⚠️
### **2. DEPOIS: Esperar DNS propagar** ⏳

---

## 🔧 PASSO 1: VERIFICAR CONFIGURAÇÃO NGINX

Execute no SSH:

```bash
# Ver configuração atual do Nginx
cat /etc/nginx/sites-available/plenipay
```

**Verifique se tem estas linhas:**

```nginx
location /_next/static {
    alias /var/www/plenipay/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

**Se NÃO tiver, adicione:**

```bash
nano /etc/nginx/sites-available/plenipay
```

**Cole esta configuração COMPLETA:**

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

**Testar e reiniciar:**
```bash
nginx -t
systemctl restart nginx
```

---

## 🔧 PASSO 2: VERIFICAR SE ARQUIVOS ESTÁTICOS EXISTEM

```bash
# Verificar se pasta .next existe
ls -la /var/www/plenipay/.next

# Verificar se arquivos estáticos existem
ls -la /var/www/plenipay/.next/static

# Verificar se build foi feito
ls -la /var/www/plenipay/.next/static/chunks
```

**Se não existir, fazer build:**

```bash
cd /var/www/plenipay
npm run build
pm2 restart sistema-contas
```

---

## 🔧 PASSO 3: VERIFICAR CAMINHO CORRETO

**IMPORTANTE:** O caminho pode ser diferente! Verifique:

```bash
# Procurar pasta .next
find /home -name ".next" -type d 2>/dev/null

# Procurar next.config.js
find /home -name "next.config.js" 2>/dev/null
```

**Se encontrar em outro lugar (ex: `/home/u596588143/domains/plenipay.com/.next`), atualize o Nginx:**

```nginx
location /_next/static {
    alias /home/u596588143/domains/plenipay.com/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔧 PASSO 4: TESTAR IP NOVAMENTE

Depois de atualizar Nginx e fazer build:

1. **Limpar cache do navegador:**
   - Ctrl+Shift+Delete (Chrome)
   - Ou abrir em janela anônima

2. **Acessar:** `http://31.97.27.20`

3. **Verificar no DevTools (F12):**
   - Aba "Network"
   - Recarregar página
   - Ver se arquivos `/_next/static/...` carregam com status 200

---

## ⏳ SOBRE DNS PROPAGATION:

### **Por que Vercel foi rápido?**
- Vercel gerencia DNS automaticamente
- Usa CDN global (propagação instantânea)
- Você só adiciona domínio, eles configuram tudo

### **Por que Hostinger demora?**
- Você precisa configurar DNS manualmente
- DNS propagation leva tempo (15min a 48h)
- Depende do seu registrar (onde comprou domínio)

### **Tempo típico:**
- **Mínimo:** 15-30 minutos
- **Médio:** 1-4 horas
- **Máximo:** 24-48 horas

---

## ✅ CHECKLIST ANTES DE ESPERAR DNS:

- [ ] ✅ Nginx configurado com suporte a assets estáticos
- [ ] ✅ Arquivos `.next/static` existem
- [ ] ✅ Build foi feito (`npm run build`)
- [ ] ✅ PM2 está rodando (`pm2 status`)
- [ ] ✅ Nginx reiniciado (`systemctl restart nginx`)
- [ ] ✅ **IP funciona completamente** (CSS, imagens, JS carregam)
- [ ] ✅ DNS A records apontam para `31.97.27.20`
- [ ] ✅ Domínio removido do Vercel

---

## 🎯 RESUMO:

1. **RESOLVA O IP PRIMEIRO** - Se não funcionar no IP, não vai funcionar no domínio
2. **Depois espere DNS** - Pode levar 1-4 horas (normal)
3. **Vercel foi rápido** porque eles gerenciam DNS automaticamente
4. **Hostinger demora** porque você configura DNS manualmente

---

## 🚨 AÇÃO IMEDIATA:

**Execute estes comandos no SSH:**

```bash
# 1. Verificar configuração Nginx
cat /etc/nginx/sites-available/plenipay | grep "_next/static"

# 2. Se não aparecer nada, editar:
nano /etc/nginx/sites-available/plenipay
# (Adicione configuração completa acima)

# 3. Verificar se arquivos existem
ls -la /var/www/plenipay/.next/static 2>/dev/null || find /home -name ".next" -type d 2>/dev/null

# 4. Fazer build se necessário
cd /var/www/plenipay  # ou caminho correto encontrado
npm run build
pm2 restart sistema-contas

# 5. Reiniciar Nginx
nginx -t
systemctl restart nginx
```

**Depois teste `http://31.97.27.20` e me diga se CSS/assets carregam!**

---

**⚠️ NÃO ESPERE DNS ANTES DE RESOLVER O IP! O problema do IP vai afetar o domínio também!**
